from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "teacher" or "student"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    created_flows = relationship("LearningFlow", back_populates="creator", foreign_keys="LearningFlow.created_by")
    student_progress = relationship("StudentProgress", back_populates="student")
    flow_progress = relationship("StudentFlowProgress", back_populates="student")

class LearningFlow(Base):
    __tablename__ = "learning_flows"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="created_flows", foreign_keys=[created_by])
    questions = relationship("Question", back_populates="flow", order_by="Question.order")
    student_progress = relationship("StudentFlowProgress", back_populates="flow")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    flow_id = Column(Integer, ForeignKey("learning_flows.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # List of options
    correct_answer = Column(Integer, nullable=False)  # Index of correct option
    difficulty_level = Column(Integer, nullable=False)  # 1-5
    order = Column(Integer, nullable=False)  # Order within flow
    
    # Relationships
    flow = relationship("LearningFlow", back_populates="questions")
    student_answers = relationship("StudentProgress", back_populates="question")

class StudentProgress(Base):
    __tablename__ = "student_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    flow_id = Column(Integer, ForeignKey("learning_flows.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer = Column(Integer, nullable=False)  # Selected option index
    is_correct = Column(Boolean, nullable=False)
    difficulty_shown = Column(Integer, nullable=False)  # Difficulty of question shown
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    student = relationship("User", back_populates="student_progress")
    question = relationship("Question", back_populates="student_answers")

class StudentFlowProgress(Base):
    __tablename__ = "student_flow_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    flow_id = Column(Integer, ForeignKey("learning_flows.id"), nullable=False)
    current_question_order = Column(Integer, default=0)  # Last question order completed
    performance_score = Column(Float, default=0.0)  # Average success rate
    selected_persona = Column(String, default="Standard")
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    student = relationship("User", back_populates="flow_progress")
    flow = relationship("LearningFlow", back_populates="student_progress")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationship
    user = relationship("User")

class CompletedStory(Base):
    __tablename__ = "completed_stories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    flow_id = Column(Integer, ForeignKey("learning_flows.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    title = Column(String, nullable=False)
    story_data = Column(JSON, nullable=False)  # Contains panels (text + image URLs)
    verification_feedback = Column(JSON, nullable=False)  # Verification quiz results
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    flow = relationship("LearningFlow")
    question = relationship("Question")

