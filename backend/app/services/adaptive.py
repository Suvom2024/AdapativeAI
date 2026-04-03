from sqlalchemy.orm import Session
from app.models import StudentProgress, Question, StudentFlowProgress
from sqlalchemy import func, select
import logging

logger = logging.getLogger(__name__)

def calculate_performance_score(user_id: int, flow_id: int, db: Session) -> float:
    """Calculate student's performance score (success rate) for a flow"""
    # Get last 5 answers or all answers if less than 5
    recent_answers = db.query(StudentProgress).filter(
        StudentProgress.user_id == user_id,
        StudentProgress.flow_id == flow_id
    ).order_by(StudentProgress.timestamp.desc()).limit(5).all()
    
    if not recent_answers:
        logger.info(f"User {user_id} - Flow {flow_id}: No answers yet, defaulting to 0.5 performance")
        return 0.5  # Default to medium performance if no answers yet
    
    correct_count = sum(1 for answer in recent_answers if answer.is_correct)
    performance = correct_count / len(recent_answers)
    logger.info(f"User {user_id} - Flow {flow_id}: Performance = {correct_count}/{len(recent_answers)} = {performance:.2%}")
    return performance

def get_adaptive_difficulty(user_id: int, flow_id: int, db: Session) -> int:
    """Determine next question difficulty based on performance"""
    performance_score = calculate_performance_score(user_id, flow_id, db)
    
    # Get last question difficulty shown
    last_answer = db.query(StudentProgress).filter(
        StudentProgress.user_id == user_id,
        StudentProgress.flow_id == flow_id
    ).order_by(StudentProgress.timestamp.desc()).first()
    
    if not last_answer:
        # First question - start with difficulty 2
        logger.info(f"User {user_id} - Flow {flow_id}: First question, starting with difficulty 2")
        return 2
    
    current_difficulty = last_answer.difficulty_shown
    
    # Adjust difficulty based on performance
    if performance_score > 0.8:
        # High performance - increase difficulty
        new_difficulty = min(current_difficulty + 1, 5)
        logger.info(f"User {user_id} - Flow {flow_id}: High performance ({performance_score:.2%}) - Increasing difficulty {current_difficulty} → {new_difficulty}")
        return new_difficulty
    elif performance_score < 0.5:
        # Low performance - decrease difficulty
        new_difficulty = max(current_difficulty - 1, 1)
        logger.info(f"User {user_id} - Flow {flow_id}: Low performance ({performance_score:.2%}) - Decreasing difficulty {current_difficulty} → {new_difficulty}")
        return new_difficulty
    else:
        # Medium performance - maintain difficulty
        logger.info(f"User {user_id} - Flow {flow_id}: Medium performance ({performance_score:.2%}) - Maintaining difficulty {current_difficulty}")
        return current_difficulty

def get_next_question(user_id: int, flow_id: int, db: Session) -> Question:
    """Get next adaptive question for student"""
    # Determine target difficulty based on performance
    target_difficulty = get_adaptive_difficulty(user_id, flow_id, db)
    
    # Get questions already answered
    answered_question_ids_subquery = select(StudentProgress.question_id).filter(
        StudentProgress.user_id == user_id,
        StudentProgress.flow_id == flow_id
    ).scalar_subquery()
    
    # Strategy 1: Find unanswered question matching target difficulty
    question = db.query(Question).filter(
        Question.flow_id == flow_id,
        Question.difficulty_level == target_difficulty,
        ~Question.id.in_(answered_question_ids_subquery)
    ).order_by(Question.order).first()
    
    if question:
        logger.info(f"User {user_id} - Flow {flow_id}: Strategy 1 - Found unanswered question ID {question.id} at difficulty {target_difficulty}")
    
    # Strategy 2: If no exact match, find closest difficulty (unanswered)
    if not question:
        question = db.query(Question).filter(
            Question.flow_id == flow_id,
            ~Question.id.in_(answered_question_ids_subquery)
        ).order_by(
            func.abs(Question.difficulty_level - target_difficulty),
            Question.order
        ).first()
        
        if question:
            logger.info(f"User {user_id} - Flow {flow_id}: Strategy 2 - Found closest unanswered question ID {question.id} (difficulty {question.difficulty_level}, target was {target_difficulty})")
    
    # Strategy 3: If all questions answered, allow retaking with adjusted difficulty
    # This enables true adaptive learning - retry easier questions when struggling
    if not question:
        # Get performance to decide if we should retry
        performance_score = calculate_performance_score(user_id, flow_id, db)
        
        if performance_score < 0.5:  # Low performance - allow retaking easier questions
            logger.info(f"User {user_id} - Flow {flow_id}: Strategy 3a - Low performance, allowing retry of easier questions")
            # Find easiest questions that were answered incorrectly
            incorrect_question_ids_subquery = select(StudentProgress.question_id).filter(
                StudentProgress.user_id == user_id,
                StudentProgress.flow_id == flow_id,
                StudentProgress.is_correct == False
            ).scalar_subquery()
            
            # Get easiest incorrectly answered questions
            question = db.query(Question).filter(
                Question.flow_id == flow_id,
                Question.id.in_(incorrect_question_ids_subquery),
                Question.difficulty_level <= target_difficulty
            ).order_by(Question.difficulty_level, Question.order).first()
            
            if question:
                logger.info(f"User {user_id} - Flow {flow_id}: Strategy 3a - Retrying incorrectly answered question ID {question.id} at difficulty {question.difficulty_level}")
            
            # If still none, get any easier question for retry
            if not question:
                question = db.query(Question).filter(
                    Question.flow_id == flow_id,
                    Question.difficulty_level <= target_difficulty
                ).order_by(Question.difficulty_level, Question.order).first()
                
                if question:
                    logger.info(f"User {user_id} - Flow {flow_id}: Strategy 3a - Retrying any easier question ID {question.id} at difficulty {question.difficulty_level}")
        else:
            # High performance - can retry harder questions or any unanswered
            logger.info(f"User {user_id} - Flow {flow_id}: Strategy 3b - High performance, allowing retry of any question")
            question = db.query(Question).filter(
                Question.flow_id == flow_id
            ).order_by(Question.order).first()
            
            if question:
                logger.info(f"User {user_id} - Flow {flow_id}: Strategy 3b - Retrying question ID {question.id} at difficulty {question.difficulty_level}")
    
    if not question:
        logger.warning(f"User {user_id} - Flow {flow_id}: No question found with target difficulty {target_difficulty}")
    
    return question

def update_progress_after_answer(user_id: int, flow_id: int, question_id: int, is_correct: bool, db: Session):
    """Update student progress after answering a question"""
    # Get question details
    from app.models import Question
    question = db.query(Question).filter(Question.id == question_id).first()
    
    logger.info(f"User {user_id} - Flow {flow_id}: Answer submitted for Question ID {question_id} - {'CORRECT' if is_correct else 'INCORRECT'} (Difficulty: {question.difficulty_level if question else 'unknown'})")
    
    # Update flow progress
    flow_progress = db.query(StudentFlowProgress).filter(
        StudentFlowProgress.user_id == user_id,
        StudentFlowProgress.flow_id == flow_id
    ).first()
    
    if not flow_progress:
        flow_progress = StudentFlowProgress(
            user_id=user_id,
            flow_id=flow_id,
            current_question_order=0,
            performance_score=0.0
        )
        db.add(flow_progress)
        logger.info(f"User {user_id} - Flow {flow_id}: Created new flow progress record")
    
    # Get question order
    if question:
        flow_progress.current_question_order = question.order
    
    # Update performance score
    old_performance = flow_progress.performance_score
    flow_progress.performance_score = calculate_performance_score(user_id, flow_id, db)
    logger.info(f"User {user_id} - Flow {flow_id}: Performance updated {old_performance:.2%} → {flow_progress.performance_score:.2%}")
    db.commit()

