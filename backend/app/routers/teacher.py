from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, LearningFlow, Question, StudentProgress, StudentFlowProgress
from app.routers.auth import get_current_user
from app.services.agents import generate_questions
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class FlowCreate(BaseModel):
    title: str
    description: Optional[str] = None

class FlowResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True

class QuestionCreate(BaseModel):
    question_text: str
    options: List[str]
    correct_answer: int  # Index of correct option
    difficulty_level: int  # 1-5
    order: int

class QuestionResponse(BaseModel):
    id: int
    question_text: str
    options: List[str]
    correct_answer: int
    difficulty_level: int
    order: int
    
    class Config:
        from_attributes = True

class FlowDetailResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    created_at: str
    questions: List[QuestionResponse]

class StudentProgressResponse(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    questions_answered: int
    correct_answers: int
    performance_score: float
    started_at: str
    last_updated: str

@router.post("/api/teacher/flows", response_model=FlowResponse)
async def create_flow(flow: FlowCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new learning flow"""
    if not user or user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create flows")
    
    db_flow = LearningFlow(
        title=flow.title,
        description=flow.description,
        created_by=user.id
    )
    db.add(db_flow)
    db.commit()
    db.refresh(db_flow)
    
    return FlowResponse(
        id=db_flow.id,
        title=db_flow.title,
        description=db_flow.description,
        created_at=db_flow.created_at.isoformat()
    )

@router.get("/api/teacher/flows", response_model=List[FlowResponse])
async def list_flows(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all flows created by teacher"""
    if not user or user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view their flows")
    
    flows = db.query(LearningFlow).filter(LearningFlow.created_by == user.id).all()
    return [FlowResponse(
        id=flow.id,
        title=flow.title,
        description=flow.description,
        created_at=flow.created_at.isoformat()
    ) for flow in flows]

@router.get("/api/teacher/flows/{flow_id}", response_model=FlowDetailResponse)
async def get_flow_details(flow_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get flow details with questions"""
    if not user or user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view flow details")
    
    flow = db.query(LearningFlow).filter(
        LearningFlow.id == flow_id,
        LearningFlow.created_by == user.id
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    questions = db.query(Question).filter(Question.flow_id == flow_id).order_by(Question.order).all()
    
    return FlowDetailResponse(
        id=flow.id,
        title=flow.title,
        description=flow.description,
        created_at=flow.created_at.isoformat(),
        questions=[QuestionResponse(
            id=q.id,
            question_text=q.question_text,
            options=q.options,
            correct_answer=q.correct_answer,
            difficulty_level=q.difficulty_level,
            order=q.order
        ) for q in questions]
    )

@router.post("/api/teacher/flows/{flow_id}/questions", response_model=QuestionResponse)
async def add_question(
    flow_id: int,
    question: QuestionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a question to a flow"""
    if not user or user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can add questions")
    
    # Verify flow belongs to teacher
    flow = db.query(LearningFlow).filter(
        LearningFlow.id == flow_id,
        LearningFlow.created_by == user.id
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Validate correct_answer index
    if question.correct_answer < 0 or question.correct_answer >= len(question.options):
        raise HTTPException(status_code=400, detail="Invalid correct_answer index")
    
    db_question = Question(
        flow_id=flow_id,
        question_text=question.question_text,
        options=question.options,
        correct_answer=question.correct_answer,
        difficulty_level=question.difficulty_level,
        order=question.order
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    return QuestionResponse(
        id=db_question.id,
        question_text=db_question.question_text,
        options=db_question.options,
        correct_answer=db_question.correct_answer,
        difficulty_level=db_question.difficulty_level,
        order=db_question.order
    )

@router.get("/api/teacher/flows/{flow_id}/progress", response_model=List[StudentProgressResponse])
async def get_flow_progress(flow_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """View all student progress for a flow"""
    if not user or user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view progress")
    
    # Verify flow belongs to teacher
    flow = db.query(LearningFlow).filter(
        LearningFlow.id == flow_id,
        LearningFlow.created_by == user.id
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Get all students who have progress on this flow
    flow_progresses = db.query(StudentFlowProgress).filter(
        StudentFlowProgress.flow_id == flow_id
    ).all()
    
    results = []
    for fp in flow_progresses:
        student = db.query(User).filter(User.id == fp.user_id).first()
        if not student:
            continue
        
        # Count answers
        answers = db.query(StudentProgress).filter(
            StudentProgress.user_id == fp.user_id,
            StudentProgress.flow_id == flow_id
        ).all()
        
        correct_count = sum(1 for a in answers if a.is_correct)
        
        results.append(StudentProgressResponse(
            student_id=student.id,
            student_name=student.name,
            student_email=student.email,
            questions_answered=len(answers),
            correct_answers=correct_count,
            performance_score=fp.performance_score,
            started_at=fp.started_at.isoformat(),
            last_updated=fp.last_updated.isoformat()
        ))
    
    return results

class GenerateQuestionsRequest(BaseModel):
    topic: str
    count: int = 5

class GeneratedQuestionsResponse(BaseModel):
    success: bool
    message: str
    questions: List[QuestionResponse] = []
    agent_response: Optional[str] = None

@router.post("/api/teacher/flows/{flow_id}/generate-questions", response_model=GeneratedQuestionsResponse)
async def generate_questions_endpoint(
    flow_id: int,
    request: GenerateQuestionsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate questions using AI for a learning flow"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in again.")
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail=f"Only teachers can generate questions. Your role is: {user.role}")
    
    # Verify flow belongs to teacher
    flow = db.query(LearningFlow).filter(
        LearningFlow.id == flow_id,
        LearningFlow.created_by == user.id
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Validate count
    if request.count < 1 or request.count > 10:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 10")
    
    # Get current question count before generation
    existing_question_count = db.query(Question).filter(Question.flow_id == flow_id).count()
    max_existing_id = db.query(Question.id).filter(Question.flow_id == flow_id).order_by(Question.id.desc()).first()
    max_existing_id = max_existing_id[0] if max_existing_id else 0
    
    # Generate questions using AI agent
    result = generate_questions(
        flow_id=flow_id,
        topic=request.topic,
        count=request.count,
        flow_description=flow.description
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to generate questions"))
    
    # Get the newly generated questions (those with ID > max_existing_id)
    questions = db.query(Question).filter(
        Question.flow_id == flow_id,
        Question.id > max_existing_id
    ).order_by(Question.id.asc()).all()
    
    return GeneratedQuestionsResponse(
        success=True,
        message=result.get("message", "Questions generated successfully"),
        questions=[QuestionResponse(
            id=q.id,
            question_text=q.question_text,
            options=q.options,
            correct_answer=q.correct_answer,
            difficulty_level=q.difficulty_level,
            order=q.order
        ) for q in questions],
        agent_response=result.get("agent_response")
    )

