from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, LearningFlow, Question, StudentProgress, StudentFlowProgress, CompletedStory
from app.routers.auth import get_current_user
from app.services.adaptive import get_next_question, update_progress_after_answer
from app.services.agents import ask_tutor, generate_remediation_images
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter()

class FlowResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True

class QuestionResponse(BaseModel):
    id: int
    question_text: str
    options: List[str]
    difficulty_level: int
    order: int
    performance_score: Optional[float] = None
    adaptive_message: Optional[str] = None
    ai_insights: Optional[Dict[str, Any]] = None

class AnswerSubmit(BaseModel):
    answer: int  # Selected option index

class AnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: int
    next_question: Optional[QuestionResponse] = None
    flow_completed: bool = False
    remediation: Optional[Dict[str, Any]] = None

class ProgressResponse(BaseModel):
    flow_id: int
    flow_title: str
    questions_answered: int
    correct_answers: int
    performance_score: float
    started_at: str
    completed_stories: Optional[List[Dict[str, Any]]] = None

class VisualsRequest(BaseModel):
    panels: List[Dict[str, Any]]

class StoryCompleteRequest(BaseModel):
    flow_id: int
    question_id: int
    title: str
    story_data: List[Dict[str, Any]]
    verification_feedback: Dict[str, Any]  # Should contain results for all quiz questions

@router.get("/api/student/flows", response_model=List[FlowResponse])
async def browse_flows(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Browse all available learning flows"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    flows = db.query(LearningFlow).all()
    return [FlowResponse(
        id=flow.id,
        title=flow.title,
        description=flow.description,
        created_at=flow.created_at.isoformat()
    ) for flow in flows]

@router.get("/api/student/flows/{flow_id}", response_model=FlowResponse)
async def get_flow(flow_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get flow details"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    flow = db.query(LearningFlow).filter(LearningFlow.id == flow_id).first()
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    return FlowResponse(
        id=flow.id,
        title=flow.title,
        description=flow.description,
        created_at=flow.created_at.isoformat()
    )

class FlowStartRequest(BaseModel):
    persona: str = "Standard"

@router.post("/api/student/flows/{flow_id}/start")
async def start_flow(
    flow_id: int, 
    request: FlowStartRequest,
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Start a learning flow"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    flow = db.query(LearningFlow).filter(LearningFlow.id == flow_id).first()
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Check if already started
    flow_progress = db.query(StudentFlowProgress).filter(
        StudentFlowProgress.user_id == user.id,
        StudentFlowProgress.flow_id == flow_id
    ).first()
    
    if not flow_progress:
        flow_progress = StudentFlowProgress(
            user_id=user.id,
            flow_id=flow_id,
            current_question_order=0,
            performance_score=0.0,
            selected_persona=request.persona
        )
        db.add(flow_progress)
    else:
        # Update persona if restarting
        flow_progress.selected_persona = request.persona
        
    db.commit()
    
    return {"message": "Flow started", "flow_id": flow_id, "persona": request.persona}

@router.get("/api/student/flows/{flow_id}/next-question", response_model=QuestionResponse)
async def get_next_adaptive_question(
    flow_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get next adaptive question"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    flow = db.query(LearningFlow).filter(LearningFlow.id == flow_id).first()
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Get performance score for display
    from app.services.adaptive import calculate_performance_score, get_adaptive_difficulty
    from app.services.agents import rewrite_question_for_persona
    
    # Get flow progress to check persona
    flow_progress = db.query(StudentFlowProgress).filter(
        StudentFlowProgress.user_id == user.id,
        StudentFlowProgress.flow_id == flow_id
    ).first()
    persona = flow_progress.selected_persona if flow_progress else "Standard"
    
    performance_score = calculate_performance_score(user.id, flow_id, db)
    target_difficulty = get_adaptive_difficulty(user.id, flow_id, db)
    
    question = get_next_question(user.id, flow_id, db)
    
    if not question:
        raise HTTPException(status_code=404, detail="No more questions available")
    
    # Rewrite question for persona if needed
    final_question_text = question.question_text
    final_options = question.options
    
    if persona != "Standard":
        rewritten = await rewrite_question_for_persona(question.id, persona)
        final_question_text = rewritten.get("question_text", question.question_text)
        final_options = rewritten.get("options", question.options)
    
    # Generate adaptive message
    adaptive_message = None
    if performance_score >= 0.8:
        adaptive_message = "Great job! You're doing well, so we're increasing the difficulty."
    elif performance_score < 0.5:
        adaptive_message = "You're finding this challenging. We're showing you easier questions to help you learn."
    else:
        adaptive_message = "You're making steady progress. Keep it up!"
    
    # Check if difficulty changed
    last_answer = db.query(StudentProgress).filter(
        StudentProgress.user_id == user.id,
        StudentProgress.flow_id == flow_id
    ).order_by(StudentProgress.timestamp.desc()).first()
    
    if last_answer and question.difficulty_level != last_answer.difficulty_shown:
        if question.difficulty_level < last_answer.difficulty_shown:
            adaptive_message = f"Difficulty decreased from {last_answer.difficulty_shown} to {question.difficulty_level} because you're struggling. Let's practice with easier questions!"
        elif question.difficulty_level > last_answer.difficulty_shown:
            adaptive_message = f"Difficulty increased from {last_answer.difficulty_shown} to {question.difficulty_level} because you're doing great! Keep up the good work!"
    
    # Generate real-time insights using the tutor agent logic
    ai_insights = {
        "mastered": [],
        "struggling": [],
        "current_strategy": "Supporter Mode" if performance_score < 0.5 else "Elite Mode" if performance_score >= 0.8 else "Balanced Mode",
        "reasoning": adaptive_message,
        "recommended_reading": [
            {"title": f"{flow.title} Fundamentals", "section": "Chapter 1, Introduction"},
            {"title": "Deep Dive: Advanced Concepts", "section": "Chapter 2, Section 3"}
        ],
        "mastery_level": int(performance_score * 100)
    }
    
    # Context-aware recommended reading
    if "World War" in flow.title or "History" in flow.title:
        ai_insights["recommended_reading"] = [
            {"title": "The Road to 1914", "section": "Chapter 1: The Alliance System"},
            {"title": "The Balkan Crisis", "section": "Chapter 2: Regional Tensions"}
        ]
    elif "Math" in flow.title or "Quadratic" in flow.title:
        ai_insights["recommended_reading"] = [
            {"title": "Quadratic Equations Basics", "section": "Chapter 3, Section 2"},
            {"title": "Factoring Techniques", "section": "Chapter 4, Section 1"}
        ]
    elif "Science" in flow.title or "Photo" in flow.title:
        ai_insights["recommended_reading"] = [
            {"title": "Cellular Processes", "section": "Chapter 5: Metabolism"},
            {"title": "Energy Transfer", "section": "Chapter 6: Solar Input"}
        ]
    
    # Mock some mastered/struggling for the POC demo effect
    if performance_score >= 0.8:
        ai_insights["mastered"] = ["Core Concepts", "Standard Application"]
    elif performance_score < 0.5:
        ai_insights["struggling"] = ["Advanced Logic", "Edge Cases"]
    
    return QuestionResponse(
        id=question.id,
        question_text=final_question_text,
        options=final_options,
        difficulty_level=question.difficulty_level,
        order=question.order,
        performance_score=performance_score,
        adaptive_message=adaptive_message,
        ai_insights=ai_insights
    )

@router.post("/api/student/questions/{question_id}/answer", response_model=AnswerResponse)
async def submit_answer(
    question_id: int,
    answer: AnswerSubmit,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit answer to a question"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Handle dynamic questions (ID -1) - these are generated on-the-fly
    if question_id == -1:
        # For dynamic questions, we don't save to DB, just return the result
        # The remediation will have the correct answer index
        return AnswerResponse(
            is_correct=False,  # We'll determine this from the remediation data
            correct_answer=0,
            flow_completed=False,
            remediation=None  # No remediation for dynamic questions
        )
    
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Allow retrying questions (adaptive system may show same question again for remediation)
    # We'll create a new progress entry each time, allowing the student to retry
    
    is_correct = answer.answer == question.correct_answer
    
    # Save answer
    progress = StudentProgress(
        user_id=user.id,
        flow_id=question.flow_id,
        question_id=question_id,
        answer=answer.answer,
        is_correct=is_correct,
        difficulty_shown=question.difficulty_level
    )
    db.add(progress)
    
    # Update flow progress
    from app.services.adaptive import update_progress_after_answer, get_next_question
    update_progress_after_answer(user.id, question.flow_id, question_id, is_correct, db)
    
    # Check if flow is completed - count unique questions answered, not total attempts
    total_questions = db.query(Question).filter(Question.flow_id == question.flow_id).count()
    answered_questions = db.query(
        func.count(func.distinct(StudentProgress.question_id))
    ).filter(
        StudentProgress.user_id == user.id,
        StudentProgress.flow_id == question.flow_id
    ).scalar() or 0
    
    flow_completed = answered_questions >= total_questions
    
    # Get next question if not completed
    next_question = None
    if not flow_completed:
        next_q = get_next_question(user.id, question.flow_id, db)
        if next_q:
            # We don't rewrite here, it happens in get_next_adaptive_question
            next_question = QuestionResponse(
                id=next_q.id,
                question_text=next_q.question_text,
                options=next_q.options,
                difficulty_level=next_q.difficulty_level,
                order=next_q.order
            )
    
    # Return immediately, remediation will be fetched separately if needed
    return AnswerResponse(
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        next_question=next_question,
        flow_completed=flow_completed,
        remediation=None
    )

@router.get("/api/student/questions/{question_id}/remediation")
async def get_question_remediation(
    question_id: int,
    selected_answer: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get remediation for a specific question and answer"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    # Get student persona for personalized remediation
    flow_progress = db.query(StudentFlowProgress).filter(
        StudentFlowProgress.user_id == user.id,
        StudentFlowProgress.flow_id == question.flow_id
    ).first()
    persona = flow_progress.selected_persona if flow_progress else "Standard"
    
    from app.services.agents import generate_remediation
    remediation_result = await generate_remediation(question_id, selected_answer, persona)
    
    return remediation_result

@router.get("/api/student/progress", response_model=List[ProgressResponse])
async def get_student_progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get student's progress across all flows"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    flow_progresses = db.query(StudentFlowProgress).filter(
        StudentFlowProgress.user_id == user.id
    ).all()
    
    results = []
    for fp in flow_progresses:
        flow = db.query(LearningFlow).filter(LearningFlow.id == fp.flow_id).first()
        if not flow:
            continue
        
        # Count answers
        answers = db.query(StudentProgress).filter(
            StudentProgress.user_id == user.id,
            StudentProgress.flow_id == fp.flow_id
        ).all()
        
        correct_count = sum(1 for a in answers if a.is_correct)
        
        # Get completed stories for this flow
        completed_stories = db.query(CompletedStory).filter(
            CompletedStory.user_id == user.id,
            CompletedStory.flow_id == fp.flow_id
        ).all()
        
        results.append(ProgressResponse(
            flow_id=flow.id,
            flow_title=flow.title,
            questions_answered=len(answers),
            correct_answers=correct_count,
            performance_score=fp.performance_score,
            started_at=fp.started_at.isoformat(),
            completed_stories=[{
                "id": cs.id,
                "title": cs.title,
                "story_data": cs.story_data,
                "verification_feedback": cs.verification_feedback,
                "timestamp": cs.timestamp.isoformat()
            } for cs in completed_stories]
        ))
    
    return results

class TutorAskRequest(BaseModel):
    question_id: int
    message: str

class TutorResponse(BaseModel):
    success: bool
    response: str

@router.post("/api/student/tutor/ask", response_model=TutorResponse)
async def ask_tutor_endpoint(
    request: TutorAskRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ask the AI tutor for help with a question"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Verify question exists and get flow_id
    question = db.query(Question).filter(Question.id == request.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    flow_id = question.flow_id
    
    # Get tutoring assistance from AI agent
    result = ask_tutor(
        question_id=request.question_id,
        user_id=user.id,
        flow_id=flow_id,
        student_message=request.message
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Failed to get tutor response")
        )
    
    return TutorResponse(
        success=True,
        response=result.get("response", "I'm here to help!")
    )

@router.post("/api/student/story/generate-visuals")
async def generate_story_visuals_endpoint(
    request: VisualsRequest,
    user: User = Depends(get_current_user)
):
    """Generate visuals for story panels"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    print(f"DEBUG: Story visuals requested by user {user.id} for {len(request.panels)} panels")
    try:
        enhanced_panels = await generate_remediation_images(request.panels)
        print(f"DEBUG: Returning {len(enhanced_panels)} enhanced panels")
        return {"success": True, "panels": enhanced_panels}
    except Exception as e:
        print(f"ERROR: generate_story_visuals_endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/student/story/complete")
async def complete_story_endpoint(
    request: StoryCompleteRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a completed storytelling journey"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    print(f"DEBUG: Saving story completion for user {user.id}, flow {request.flow_id}, title: {request.title}")
    try:
        completed_story = CompletedStory(
            user_id=user.id,
            flow_id=request.flow_id,
            question_id=request.question_id,
            title=request.title,
            story_data=request.story_data,
            verification_feedback=request.verification_feedback
        )
        db.add(completed_story)
        db.commit()
        print(f"DEBUG: Story completion saved successfully with ID: {completed_story.id}")
        return {"success": True, "message": "Story progress saved"}
    except Exception as e:
        print(f"ERROR: complete_story_endpoint failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

