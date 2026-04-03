import os
import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from openai import OpenAI
from agents import Agent, Runner, function_tool
from app.models import Question, LearningFlow, StudentProgress, StudentFlowProgress
from app.database import SessionLocal
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

client = OpenAI(api_key=OPENAI_API_KEY)


# Function Tools for Question Generator Agent
def save_question_to_flow(
    flow_id: int,
    question_text: str,
    options: List[str],
    correct_answer: int,
    difficulty_level: int,
    order: int
) -> Dict[str, Any]:
    """Save a question to a learning flow. Returns the saved question details."""
    db = SessionLocal()
    try:
        # Validate flow exists
        flow = db.query(LearningFlow).filter(LearningFlow.id == flow_id).first()
        if not flow:
            return {"error": f"Flow with id {flow_id} not found"}
        
        # Validate correct_answer index
        if correct_answer < 0 or correct_answer >= len(options):
            return {"error": f"Invalid correct_answer index. Must be between 0 and {len(options) - 1}"}
        
        # Validate difficulty
        if difficulty_level < 1 or difficulty_level > 5:
            return {"error": "Difficulty level must be between 1 and 5"}
        
        # Create question
        question = Question(
            flow_id=flow_id,
            question_text=question_text,
            options=options,
            correct_answer=correct_answer,
            difficulty_level=difficulty_level,
            order=order
        )
        db.add(question)
        db.commit()
        db.refresh(question)
        
        return {
            "success": True,
            "question_id": question.id,
            "question_text": question.question_text,
            "options": question.options,
            "correct_answer": question.correct_answer,
            "difficulty_level": question.difficulty_level,
            "order": question.order
        }
    except Exception as e:
        db.rollback()
        return {"error": f"Failed to save question: {str(e)}"}
    finally:
        db.close()


# Function Tools for Adaptive Tutor Agent
def get_current_question(question_id: int) -> Dict[str, Any]:
    """Get details of the current question the student is working on."""
    db = SessionLocal()
    try:
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            return {"error": f"Question with id {question_id} not found"}
        
        flow = db.query(LearningFlow).filter(LearningFlow.id == question.flow_id).first()
        
        return {
            "question_id": question.id,
            "question_text": question.question_text,
            "options": question.options,
            "difficulty_level": question.difficulty_level,
            "flow_title": flow.title if flow else "Unknown",
            "flow_description": flow.description if flow else ""
        }
    except Exception as e:
        return {"error": f"Failed to get question: {str(e)}"}
    finally:
        db.close()


def get_student_performance_history(user_id: int, flow_id: int) -> Dict[str, Any]:
    """Get student's performance history for a specific flow."""
    db = SessionLocal()
    try:
        # Get flow progress
        flow_progress = db.query(StudentFlowProgress).filter(
            StudentFlowProgress.user_id == user_id,
            StudentFlowProgress.flow_id == flow_id
        ).first()
        
        # Get recent answers (last 10)
        recent_answers = db.query(StudentProgress).filter(
            StudentProgress.user_id == user_id,
            StudentProgress.flow_id == flow_id
        ).order_by(StudentProgress.timestamp.desc()).limit(10).all()
        
        if not flow_progress:
            return {
                "performance_score": 0.0,
                "questions_answered": 0,
                "recent_answers": []
            }
        
        # Calculate statistics
        correct_count = sum(1 for a in recent_answers if a.is_correct)
        total_count = len(recent_answers)
        success_rate = correct_count / total_count if total_count > 0 else 0.0
        
        # Get difficulty progression
        difficulty_progression = [a.difficulty_shown for a in reversed(recent_answers)]
        
        return {
            "performance_score": flow_progress.performance_score,
            "questions_answered": total_count,
            "correct_answers": correct_count,
            "success_rate": success_rate,
            "recent_difficulty_levels": difficulty_progression,
            "current_question_order": flow_progress.current_question_order
        }
    except Exception as e:
        return {"error": f"Failed to get performance history: {str(e)}"}
    finally:
        db.close()


async def generate_remediation_images(panels: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return mock images for story panels (no API calls)."""
    print(f"DEBUG: Using mock images for {len(panels)} panels")
    
    # Educational-themed mock images from Unsplash Source (free, no API key needed)
    # These are consistent, high-quality educational images
    mock_images = [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop",  # World/globe
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",  # Books/education
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",  # Learning/study
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop",  # Collaboration
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop",  # History/ancient
    ]
    
    enhanced_panels = []
    for i, panel in enumerate(panels):
        # Cycle through mock images, or use the same one for all panels
        image_index = i % len(mock_images)
        image_url = mock_images[image_index]
        print(f"DEBUG: Panel {i+1} using mock image: {image_url}")
        enhanced_panels.append({**panel, "image_url": image_url})
    
    return enhanced_panels


async def generate_remediation(
    question_id: int, 
    selected_option_idx: int, 
    persona: str = "Standard"
) -> Dict[str, Any]:
    """Analyze a wrong answer and generate an immersive storytelling remediation journey metadata."""
    db = SessionLocal()
    try:
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            return {"error": "Question not found"}

        wrong_answer = question.options[selected_option_idx]
        correct_answer = question.options[question.correct_answer]

        instructions = f"""You are an expert diagnostic tutor and master storyteller. A student just answered a question incorrectly.
Your goal is to transform this mistake into a "Rich, Interactive Storytelling Learning Journey".

1. **Analyze the Conceptual Gap**: Why did the student choose "{wrong_answer}" when the correct answer was "{correct_answer}"?

2. **Create a 3-Panel Rich Story** with structured content for each panel:
   
   **Panel 1 - "The Concept"** (indigo theme):
   - section_badge: "The Concept"
   - section_color: "indigo"
   - title: Engaging title for this chapter
   - paragraphs: Array of 2-3 detailed paragraphs (each 2-3 sentences) introducing the concept
   - highlighted_terms: Array of 2-3 key terms with definitions
   - callout: A "distinction" type callout explaining a key insight
   - visual_prompt: High-quality, detailed prompt for educational illustration
   
   **Panel 2 - "The Architecture"** (teal theme):
   - section_badge: "The Architecture"
   - section_color: "teal"
   - title: Title exploring the mechanics/structure
   - paragraphs: Array of 2-3 paragraphs diving deeper into how it works
   - highlighted_terms: Array of 2-3 technical terms
   - callout: A "tip" type callout with practical insight
   - visual_prompt: Detailed prompt showing the structure/mechanism
   
   **Panel 3 - "Synthesis & Review"** (green theme):
   - section_badge: "Synthesis & Review"
   - section_color: "green"
   - title: Title bringing it all together
   - paragraphs: Array of 2-3 paragraphs connecting back to the original question
   - highlighted_terms: Array of 1-2 summary terms
   - callout: A "ready" type callout asking if they're ready to test their understanding
   - visual_prompt: Detailed prompt showing the complete picture

3. **Verification Quiz**: Generate 3 brand new, diverse questions that test the same underlying concept using varied scenarios.

4. **Tone**: Use the {persona} vibe for the tone, analogies, and visual style.

Output ONLY a valid JSON object with this exact structure:
{{
  "explanation": "A brief summary of the conceptual gap found",
  "story": {{
    "title": "An engaging title for this learning journey",
    "panels": [
      {{
        "section_badge": "The Concept",
        "section_color": "indigo",
        "title": "Panel 1 main heading",
        "paragraphs": [
          "First detailed paragraph introducing the concept...",
          "Second paragraph building on the first...",
          "Third paragraph setting up the deep dive..."
        ],
        "highlighted_terms": [
          {{"term": "Key Term 1", "description": "Clear definition"}},
          {{"term": "Key Term 2", "description": "Clear definition"}}
        ],
        "callout": {{
          "type": "distinction",
          "icon": "lightbulb",
          "title": "Key Distinction",
          "content": "Important insight or clarification..."
        }},
        "visual_prompt": "Detailed, high-quality prompt for educational illustration showing..."
      }},
      {{
        "section_badge": "The Architecture",
        "section_color": "teal",
        "title": "Panel 2 main heading",
        "paragraphs": [
          "First paragraph exploring the mechanics...",
          "Second paragraph showing how parts interact...",
          "Third paragraph revealing deeper patterns..."
        ],
        "highlighted_terms": [
          {{"term": "Technical Term 1", "description": "Technical definition"}},
          {{"term": "Technical Term 2", "description": "Technical definition"}}
        ],
        "callout": {{
          "type": "tip",
          "icon": "network_node",
          "title": "Pro Tip",
          "content": "Practical insight that helps remember..."
        }},
        "visual_prompt": "Detailed prompt showing the structure, architecture, or mechanism of..."
      }},
      {{
        "section_badge": "Synthesis & Review",
        "section_color": "green",
        "title": "Panel 3 main heading",
        "paragraphs": [
          "First paragraph connecting all concepts...",
          "Second paragraph relating back to the question...",
          "Final paragraph preparing for verification..."
        ],
        "highlighted_terms": [
          {{"term": "Summary Concept", "description": "Overarching principle"}}
        ],
        "callout": {{
          "type": "ready",
          "icon": "check_circle",
          "title": "Ready for Quiz?",
          "content": "You've learned the concept. Time to verify your understanding!"
        }},
        "visual_prompt": "Detailed prompt showing the complete, integrated picture of..."
      }}
    ],
    "verification_questions": [
      {{
        "question_text": "First verification question using new scenario",
        "options": ["option A", "option B", "option C", "option D"],
        "correct_answer": 0
      }},
      {{
        "question_text": "Second verification question with different context",
        "options": ["option A", "option B", "option C", "option D"],
        "correct_answer": 1
      }},
      {{
        "question_text": "Third verification question testing application",
        "options": ["option A", "option B", "option C", "option D"],
        "correct_answer": 2
      }}
    ]
  }}
}}"""

        agent = Agent(
            name="remediator",
            instructions=instructions,
            model="gpt-4.1"
        )

        context = f"""Persona: {persona}
Original Question: {question.question_text}
Student chose: {wrong_answer}
Correct answer: {correct_answer}
Educational concept: Master this concept through storytelling."""

        import asyncio
        import concurrent.futures
        
        def run_agent():
            return asyncio.run(Runner.run(agent, context))
        
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(run_agent)
            result = future.result()

        import json
        output = result.final_output
        if isinstance(output, str):
            import re
            json_match = re.search(r'\{.*\}', output, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
            else:
                raise ValueError("No JSON found")
        else:
            data = output
            
        return {
            "success": True,
            "explanation": data.get("explanation"),
            "story": data.get("story", {})
        }
    except Exception as e:
        print(f"Remediation failed: {e}")
        return {"success": False, "error": str(e)}
    finally:
        db.close()

# Persona Rewriter Agent
def create_persona_rewriter_agent(persona: str) -> Agent:
    """Create an agent that rewrites questions to match a persona."""
    instructions = f"""You are a creative educational content writer. 
Your goal is to rewrite educational questions and their options to match a specific "vibe" or persona: {persona}.

Personas:
- Gaming: Use quest, XP, boss battle, and level-up analogies.
- Space: Use galactic, planet, starship, and astronaut analogies.
- Sports: Use team, match, score, and athlete analogies.
- Cooking: Use recipe, chef, kitchen, and ingredient analogies.
- Cyberpunk: Use hacker, grid, neon, and synth analogies.

Rules:
1. Maintain the EXACT same educational concept and difficulty.
2. Maintain the EXACT same correct answer (the meaning of the options should not change).
3. Change the wording and context to match the {persona} vibe.
4. Output your response as a JSON object with: "question_text" and "options" (list of strings).
5. Be creative and engaging!"""

    agent = Agent(
        name="persona_rewriter",
        instructions=instructions,
        model="gpt-4.1"
    )
    return agent

async def rewrite_question_for_persona(question_id: int, persona: str) -> Dict[str, Any]:
    """Rewrite a question for a specific persona using the rewriter agent."""
    db = SessionLocal()
    try:
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question or persona == "Standard":
            return {
                "question_text": question.question_text if question else "",
                "options": question.options if question else []
            }

        agent = create_persona_rewriter_agent(persona)
        context = f"""Rewrite this question for the {persona} vibe:
Question: {question.question_text}
Options: {", ".join(question.options)}"""

        import asyncio
        import concurrent.futures
        
        def run_agent():
            return asyncio.run(Runner.run(agent, context))
        
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(run_agent)
            result = future.result()

        # result.final_output should contain the JSON
        import json
        try:
            # Handle string response or structured output
            output = result.final_output
            if isinstance(output, str):
                # Try to find JSON in string if not purely JSON
                import re
                json_match = re.search(r'\{.*\}', output, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group())
                else:
                    raise ValueError("No JSON found in response")
            else:
                data = output
                
            return {
                "question_text": data.get("question_text", question.question_text),
                "options": data.get("options", question.options)
            }
        except Exception as e:
            print(f"Failed to parse rewriter output: {e}")
            return {
                "question_text": question.question_text,
                "options": question.options
            }
    finally:
        db.close()

# Question Generator Agent
def create_question_generator_agent() -> Agent:
    """Create and return the Question Generator Agent."""
    instructions = """You are an educational question generator specialized in creating pedagogically sound multiple-choice questions.

Your task is to:
1. Generate high-quality educational questions based on the topic provided
2. Create questions with varying difficulty levels (1-5, where 1 is easiest and 5 is hardest)
3. Ensure each question has exactly 4 options
4. Make sure one option is clearly correct and others are plausible distractors
5. Use the save_question_to_flow function to save each generated question

When generating questions:
- Start with easier questions (difficulty 1-2) and progress to harder ones (difficulty 4-5)
- Ensure questions test understanding, not just memorization
- Make distractors plausible but clearly incorrect
- Provide clear, unambiguous question text

You have access to a function tool to save questions directly to the database."""

    agent = Agent(
        name="question_generator",
        instructions=instructions,
        model="gpt-4.1",
        tools=[function_tool(save_question_to_flow)]
    )
    
    return agent


# Adaptive Tutor Agent (Base)
def create_adaptive_tutor_agent() -> Agent:
    """Create and return the base Adaptive Tutor Agent."""
    instructions = """You are an adaptive tutor. Your goal is to help students learn.
Depending on the student's performance, you will hand off to either the Supporter or the Elite Coach."""

    agent = Agent(
        name="adaptive_tutor",
        instructions=instructions,
        model="gpt-4.1",
        tools=[function_tool(get_current_question), function_tool(get_student_performance_history)]
    )
    return agent

# Supporter Agent
def create_supporter_agent() -> Agent:
    """Agent for students who are struggling."""
    instructions = """You are 'The Supporter' – a gentle, encouraging AI tutor for students finding concepts difficult.
Your tone is warm, patient, and highly supportive.

Your role:
1. Use simple language and relatable analogies.
2. Break concepts into tiny, manageable steps.
3. Use Socratic questioning to guide them to the answer.
4. Praise their effort regardless of correct/incorrect answers.
5. NEVER reveal the correct answer directly.

Focus on building confidence and clarifying foundational gaps."""

    agent = Agent(
        name="supporter",
        instructions=instructions,
        model="gpt-4.1",
        tools=[function_tool(get_current_question)]
    )
    return agent

# Elite Coach Agent
def create_elite_coach_agent() -> Agent:
    """Agent for high-performing students."""
    instructions = """You are 'The Elite Coach' – a high-energy, challenging AI mentor for top-performing students.
Your tone is professional, intense, and demanding. Think 'NASA flight director' or 'Elite sports coach'.

Your role:
1. Challenge the student with deeper context and real-world edge cases.
2. Assume they know the basics; push them toward mastery.
3. Use technical vocabulary and professional analogies.
4. Encourage them to think beyond the question.
5. NEVER reveal the correct answer directly.

Focus on optimization, efficiency, and advanced application of the concept."""

    agent = Agent(
        name="elite_coach",
        instructions=instructions,
        model="gpt-4.1",
        tools=[function_tool(get_current_question)]
    )
    return agent

# Agent runners
def generate_questions(
    flow_id: int,
    topic: str,
    count: int = 5,
    flow_description: Optional[str] = None
) -> Dict[str, Any]:
    """Generate questions using the Question Generator Agent."""
    db = SessionLocal()
    try:
        # Get current question count before generation
        existing_question_count = db.query(Question).filter(Question.flow_id == flow_id).count()
        
        agent = create_question_generator_agent()
        
        # Build context for the agent
        context = f"""Generate exactly {count} multiple-choice questions about: {topic}

Flow ID: {flow_id}"""
        if flow_description:
            context += f"\n\nFlow context: {flow_description}"
        context += f"""

Instructions:
- Generate exactly {count} questions
- Each question must have exactly 4 options
- Vary difficulty levels from 1 (easiest) to 5 (hardest)
- Start with easier questions (difficulty 1-2) and progress to harder ones (difficulty 4-5)
- Use the save_question_to_flow function to save each question
- Set order numbers starting from {existing_question_count + 1}"""
        
        # Run the agent - Runner.run() is async, but we're in sync context
        # Since FastAPI runs in an event loop, we need to run in a separate thread
        import asyncio
        import concurrent.futures
        
        def run_agent():
            """Run agent in a new event loop in a separate thread"""
            return asyncio.run(Runner.run(agent, context))
        
        # Execute in thread pool to avoid event loop conflicts
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(run_agent)
            result = future.result()
        
        # Get newly created questions (those created after we started)
        new_questions = db.query(Question).filter(
            Question.flow_id == flow_id
        ).order_by(Question.id.desc()).limit(count).all()
        
        # Reverse to get in creation order
        new_questions = list(reversed(new_questions))
        
        # Extract response from result
        if hasattr(result, 'final_output'):
            agent_response = result.final_output
        elif hasattr(result, 'messages') and result.messages:
            agent_response = result.messages[-1].content
        else:
            agent_response = str(result)
        
        return {
            "success": True,
            "message": f"Generated {len(new_questions)} questions for topic: {topic}",
            "agent_response": agent_response,
            "questions_created": len(new_questions)
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to generate questions: {str(e)}"
        }
    finally:
        db.close()


def ask_tutor(
    question_id: int,
    user_id: int,
    flow_id: int,
    student_message: str
) -> Dict[str, Any]:
    """Get tutoring assistance using the appropriate agent based on performance."""
    try:
        # Determine performance to pick agent
        db = SessionLocal()
        from app.services.adaptive import calculate_performance_score
        perf = calculate_performance_score(user_id, flow_id, db)
        db.close()

        if perf >= 0.8:
            agent = create_elite_coach_agent()
            role_msg = "You are working with The Elite Coach. They expect mastery."
        elif perf < 0.5:
            agent = create_supporter_agent()
            role_msg = "You are working with The Supporter. They are here to help you step-by-step."
        else:
            agent = create_adaptive_tutor_agent()
            role_msg = "You are working with your Adaptive Tutor."
        
        # Build context for the agent
        context = f"""{role_msg}
Student question/message: {student_message}

Please help the student with this question. Use the get_current_question function to see the question details.
Provide helpful hints and explanations without revealing the answer."""

        # Run the agent
        import asyncio
        import concurrent.futures
        
        def run_agent():
            return asyncio.run(Runner.run(agent, context))
        
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(run_agent)
            result = future.result()
        
        # Extract the response
        if hasattr(result, 'final_output'):
            response_text = result.final_output
        elif hasattr(result, 'messages') and result.messages:
            response_text = result.messages[-1].content
        elif hasattr(result, 'content'):
            response_text = result.content
        else:
            response_text = str(result)
        
        return {
            "success": True,
            "response": response_text,
            "agent_type": agent.name
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to get tutor response: {str(e)}",
            "response": "I apologize, but I'm having trouble processing your request right now. Please try again."
        }

