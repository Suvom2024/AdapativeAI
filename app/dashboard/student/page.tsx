'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { studentApi, authApi } from '@/lib/api';
import type { User } from '@/lib/auth';
import MaterialIcon from '@/components/MaterialIcon';
import AIInsightsSidebar from '@/components/quiz/AIInsightsSidebar';

interface Flow {
  id: number;
  title: string;
  description?: string;
  created_at: string;
}

interface Question {
  id: number;
  question_text: string;
  options: string[];
  difficulty_level: number;
  order: number;
  correct_answer?: number;
  performance_score?: number;
  adaptive_message?: string;
  ai_insights?: {
    mastered: string[];
    struggling: string[];
    current_strategy: string;
    reasoning: string;
    mastery_level?: number;
    recommended_reading?: Array<{
      title: string;
      section: string;
    }>;
  };
}

interface CompletedStory {
  id: number;
  title: string;
  story_data: Array<{
    text: string;
    image_url?: string;
  }>;
  verification_feedback: {
    score?: number;
    is_correct?: boolean;
  };
  timestamp: string;
}

interface Progress {
  flow_id: number;
  flow_title: string;
  questions_answered: number;
  correct_answers: number;
  performance_score: number;
  started_at: string;
  completed_stories?: CompletedStory[];
}

interface Remediation {
  explanation: string;
  dynamic_question?: {
    question_text: string;
    options: string[];
    correct_answer: number;
  };
  story?: {
    title: string;
    panels: Array<{
      text: string;
      visual_prompt: string;
      image_url?: string;
      section_badge?: string;
      section_color?: 'indigo' | 'teal' | 'green' | 'purple';
      title?: string;
      paragraphs?: string[];
      highlighted_terms?: Array<{
        term: string;
        description: string;
      }>;
      callout?: {
        type?: 'distinction' | 'tip' | 'ready';
        icon?: string;
        title?: string;
        content?: string;
      };
    }>;
    verification_questions: Array<{
      question_text: string;
      options: string[];
      correct_answer: number;
    }>;
  };
}

// Inline SVG Icons for 100% reliability
type IconProps = React.SVGProps<SVGSVGElement>;

const Icons = {
  Logo: (props: IconProps) => <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path></svg>,
  Zap: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Notifications: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 17 8.5 12 1 17"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  Fire: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  History: () => <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  Science: () => <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15"></path><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"></path><path d="M6 14h12"></path></svg>,
  Math: () => <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>,
  Literature: () => <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  BarChart: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  ArrowBack: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  Check: (props: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  SmartToy: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>,
  Lightbulb: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path></svg>,
  MilitaryTech: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"></path><circle cx="12" cy="9" r="7"></circle></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Star: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  Tree: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path><path d="M5 19l7-7 7 7"></path></svg>,
  Celebration: () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"></path><circle cx="5" cy="19" r="1.5" fill="currentColor"></circle><circle cx="19" cy="19" r="1.5" fill="currentColor"></circle><circle cx="12" cy="20" r="1" fill="currentColor"></circle></svg>,
  Sentiment: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path></svg>,
  PriorityHigh: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>,
  MenuBook: (props: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  Tune: (props: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path></svg>,
  Flag: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>,
  Article: (props: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  Analytics: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>,
  Trophy: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>,
  Psychology: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 19.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"></path></svg>,
  Warning: (props: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  School: (props: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 22v-4a2 2 0 1 0-4 0v4"></path><path d="M18 10H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2Z"></path><path d="M18 10V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4"></path><path d="m4 10 8-6 8 6"></path></svg>,
  Timer: (props: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="10" y1="2" x2="14" y2="2"></line><line x1="12" y1="14" x2="15" y2="11"></line><circle cx="12" cy="14" r="8"></circle></svg>,
  Bookmark: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>,
  Forum: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  AutoGraph: (props: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
};

export default function StudentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [currentFlow, setCurrentFlow] = useState<Flow | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [remediation, setRemediation] = useState<Remediation | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [view, setView] = useState<'browse' | 'quiz' | 'progress'>('browse');
  const [viewMode, setViewMode] = useState<'quiz' | 'story' | 'story-quiz' | 'story-feedback'>('quiz');
  const [currentStoryPanel, setCurrentStoryPanel] = useState(0);
  const [storyQuizStep, setStoryQuizStep] = useState(0);
  const [storyQuizAnswers, setStoryQuizAnswers] = useState<Array<{ questionIndex: number; selectedAnswer: number; isCorrect: boolean }>>([]);
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [tutorMessage, setTutorMessage] = useState('');
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [previousDifficulty, setPreviousDifficulty] = useState<number | null>(null);
  const [difficultyChange, setDifficultyChange] = useState<'increased' | 'decreased' | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadFlows();
    loadProgress();
  }, []);

  const checkAuth = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
      router.push('/login/student');
      return;
    }
    setUser(currentUser);
  };

  const loadFlows = async () => {
    try {
      const response = await studentApi.browseFlows();
      setFlows(response.data);
    } catch (error) {
      console.error('Failed to load flows:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await studentApi.getProgress();
      console.log('DEBUG: Loaded progress data', response.data);
      setProgress(response.data);
    } catch (error) {
      console.error('ERROR: Failed to load progress:', error);
    }
  };

  const startFlow = async (flowId: number) => {
    try {
      await studentApi.startFlow(flowId, 'Standard');
      const flowResponse = await studentApi.getFlow(flowId);
      setCurrentFlow(flowResponse.data);
      await loadNextQuestion(flowId);
      setView('quiz');
    } catch (error) {
      console.error('Failed to start flow:', error);
      alert('Failed to start flow');
    }
  };

  const loadNextQuestion = async (flowId: number) => {
    try {
      const response = await studentApi.getNextQuestion(flowId);
      const newQuestion = response.data;
      
      if (previousDifficulty !== null && newQuestion.difficulty_level !== previousDifficulty) {
        setDifficultyChange(newQuestion.difficulty_level > previousDifficulty ? 'increased' : 'decreased');
        setTimeout(() => setDifficultyChange(null), 3000);
      }
      
      setPreviousDifficulty(newQuestion.difficulty_level);
      setCurrentQuestion(newQuestion);
      setSelectedAnswer(null);
      setShowResult(false);
      setTutorMessages([]);
      setRemediation(null);
      setViewMode('quiz');
      setCurrentStoryPanel(0);
    } catch (error: any) {
      if (error.response?.status === 404) {
        alert('Flow completed!');
        setView('browse');
        loadProgress();
      } else {
        console.error('Failed to load question:', error);
      }
    }
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null || !currentQuestion || !currentFlow) return;

    try {
      // Step 1: Submit answer and get immediate feedback (is_correct)
      const response = await studentApi.submitAnswer(currentQuestion.id, selectedAnswer);
      setIsCorrect(response.data.is_correct);
      
      // Update currentQuestion with the correct_answer from backend response
      setCurrentQuestion({...currentQuestion, correct_answer: response.data.correct_answer});
      setShowResult(true);

      // Step 2: If wrong, fetch remediation in the background
      if (!response.data.is_correct) {
        setRemediation(null); // Clear previous remediation while loading
        try {
          const remResponse = await studentApi.getRemediation(currentQuestion.id, selectedAnswer);
          if (remResponse.data.success) {
            setRemediation(remResponse.data);
          }
        } catch (error) {
          console.error('Failed to load remediation:', error);
        }
      }
      
      if (response.data.flow_completed && response.data.is_correct) {
        setTimeout(() => {
          alert('Congratulations! You completed this flow!');
          setView('browse');
          loadProgress();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to submit answer');
    }
  };

  const startDynamicQuestion = () => {
    if (!remediation || !remediation.dynamic_question) return;
    
    const dynamicQ = remediation.dynamic_question;
    setCurrentQuestion({
      id: -1,
      question_text: dynamicQ.question_text,
      options: dynamicQ.options,
      correct_answer: dynamicQ.correct_answer,
      difficulty_level: currentQuestion?.difficulty_level || 1,
      order: (currentQuestion?.order || 0) + 1,
      adaptive_message: "This is a dynamic practice question generated just for you!"
    });
    setSelectedAnswer(null);
    setShowResult(false);
    setRemediation(null);
    setViewMode('quiz');
  };

  const startStoryQuiz = () => {
    if (!remediation || !remediation.story?.verification_questions) return;
    setStoryQuizStep(0);
    setStoryQuizAnswers([]);
    setViewMode('story-quiz');
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleStoryQuizSubmit = () => {
    if (selectedAnswer === null || !remediation?.story) return;
    
    const currentQ = remediation.story.verification_questions[storyQuizStep];
    const isCorrect = selectedAnswer === currentQ.correct_answer;
    
    const newAnswers = [
      ...storyQuizAnswers,
      {
        questionIndex: storyQuizStep,
        selectedAnswer: selectedAnswer,
        isCorrect: isCorrect
      }
    ];
    
    setStoryQuizAnswers(newAnswers);
    
    if (storyQuizStep < remediation.story.verification_questions.length - 1) {
      setStoryQuizStep(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setViewMode('story-feedback');
      // Calculate overall success (e.g., at least 66% correct)
      const correctCount = newAnswers.filter(a => a.isCorrect).length;
      const score = correctCount / newAnswers.length;
      completeStoryJourney(score >= 0.6, newAnswers);
    }
  };

  const enterStoryMode = async () => {
    if (!remediation?.story) return;
    console.log('DEBUG: enterStoryMode triggered', remediation.story.title);
    setIsGeneratingVisuals(true);
    setViewMode('story');
    setCurrentStoryPanel(0);
    
    try {
      console.log('DEBUG: Sending request to studentApi.generateStoryVisuals...');
      const response = await studentApi.generateStoryVisuals(remediation.story.panels);
      
      console.log('DEBUG: Received response from studentApi.generateStoryVisuals', response.data);
      if (response.data.success) {
        setRemediation({
          ...remediation,
          story: {
            ...remediation.story,
            panels: response.data.panels
          }
        });
      } else {
        console.warn('DEBUG: Visuals generation reported failure', response.data);
      }
    } catch (error: any) {
      console.error('ERROR: studentApi.generateStoryVisuals failed', error);
      console.error('ERROR Details:', error.response?.data || error.message);
    } finally {
      setIsGeneratingVisuals(false);
    }
  };

  const completeStoryJourney = async (isCorrectOverall: boolean, finalAnswers: any[]) => {
    if (!remediation?.story || !currentFlow || !currentQuestion) return;
    
    console.log('DEBUG: completeStoryJourney triggered', remediation.story.title);
    try {
      console.log('DEBUG: Sending request to studentApi.completeStory...');
      const response = await studentApi.completeStory({
        flow_id: currentFlow.id,
        question_id: currentQuestion.id,
        title: remediation.story.title,
        story_data: remediation.story.panels,
        verification_feedback: {
          is_correct: isCorrectOverall,
          quiz_results: finalAnswers,
          score: finalAnswers.filter(a => a.isCorrect).length / finalAnswers.length
        }
      });
      
      console.log('DEBUG: Received response from studentApi.completeStory', response.data);
      loadProgress();
    } catch (error: any) {
      console.error('ERROR: studentApi.completeStory failed', error);
      console.error('ERROR Details:', error.response?.data || error.message);
    }
  };

  const submitDynamicAnswer = async () => {
    if (selectedAnswer === null || !currentQuestion || !currentFlow) return;
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setIsCorrect(isCorrect);
    setShowResult(true);
    
    if (isCorrect) {
      setTimeout(async () => {
        await loadNextQuestion(currentFlow.id);
      }, 2000);
    } else {
      setTimeout(() => {
        setShowResult(false);
        setSelectedAnswer(null);
      }, 2000);
    }
  };

  const sendTutorMessage = async () => {
    if (!tutorMessage.trim() || !currentQuestion || isTutorLoading) return;
    const userMessage = tutorMessage;
    setTutorMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setTutorMessage('');
    setIsTutorLoading(true);

    try {
      const response = await studentApi.askTutor(currentQuestion.id, userMessage);
      setTutorMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      setTutorMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    } finally {
      setIsTutorLoading(false);
    }
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="bg-background font-body min-h-screen flex flex-col antialiased selection:bg-primary/20 selection:text-primary relative">
      <div className="fixed inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-60 pointer-events-none -z-10"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      <header className="w-full fixed top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300">
        <div className="w-full px-4 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => setView('browse')}>
            <div className="relative size-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Icons.Logo />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight font-display text-slate-900 leading-none">AdaptiveAI</span>
              <span className="text-[9px] font-semibold text-primary tracking-widest uppercase mt-0.5">Student</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center p-1 rounded-2xl bg-slate-100/50 border border-slate-200/60 backdrop-blur-sm">
            <button 
              onClick={() => setView('browse')}
              className={`px-6 py-1.5 rounded-xl text-xs font-bold transition-all ${view === 'browse' ? 'bg-white text-slate-900 shadow-sm border border-slate-100/50' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Browse Flows
            </button>
            <button 
              onClick={() => { setView('progress'); loadProgress(); }}
              className={`px-6 py-1.5 rounded-xl text-xs font-bold transition-all ${view === 'progress' ? 'bg-white text-slate-900 shadow-sm border border-slate-100/50' : 'text-slate-500 hover:text-slate-900'}`}
            >
              My Progress
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[10px] font-semibold text-slate-500">Welcome back,</span>
              <span className="text-xs font-bold text-slate-900">{user.name}</span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>
            <button className="relative size-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-primary transition-all shadow-sm">
              <Icons.Notifications />
              <span className="absolute top-2 right-2 size-1.5 bg-red-500 border border-white rounded-full"></span>
            </button>
            <button 
              onClick={async () => { await authApi.logout(); router.push('/login/student'); }}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
            >
              <Icons.Logout />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col pt-20 pb-12 px-4 sm:px-8 w-full z-10">
        {view === 'browse' && (
          <>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16 relative">
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-sm shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  New Modules Available
                </div>
                <h1 className="text-5xl md:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                  What will you master <br/>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-pink-500">today, {user.name.split(' ')[0]}?</span>
                </h1>
                <p className="text-slate-500 mt-6 text-lg font-normal leading-relaxed max-w-xl">
                  Your personalized learning path adapts as you grow. Choose a flow below to start building your streak.
                </p>
              </div>
              <div className="w-full lg:w-auto min-w-[320px]">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card relative overflow-hidden group hover:shadow-premium transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -mr-8 -mt-8"></div>
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <span className="text-sm font-bold text-slate-900 font-display">Weekly Goal</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      <Icons.TrendingUp />
                      Top 5%
                    </span>
                  </div>
                  <div className="flex items-end gap-2 mb-2 relative z-10">
                    <span className="text-3xl font-bold text-slate-900 font-display">4</span>
                    <span className="text-sm font-medium text-slate-400 mb-1.5">/ 5 Flows Completed</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-100 relative z-10">
                    <div className="h-full bg-gradient-to-r from-primary to-purple-500 w-[80%] rounded-full shadow-[0_0_12px_rgba(79,70,229,0.4)]"></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                    <div className="text-orange-500 scale-75"><Icons.Fire /></div>
                    <span>You&apos;re on a 3-day streak! Keep it up.</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-10">
              <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-premium p-2 flex flex-col md:flex-row gap-4 justify-between items-center transition-all">
                <div className="relative w-full md:w-96 group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors flex items-center">
                    <Icons.Search />
                  </div>
                  <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-slate-400" placeholder="Search flows, topics, or skills..." type="text"/>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide px-1">
                  <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold shadow-md whitespace-nowrap">All</button>
                  <button className="px-4 py-2 rounded-lg bg-white text-slate-600 border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-all whitespace-nowrap shadow-sm">Science</button>
                  <button className="px-4 py-2 rounded-lg bg-white text-slate-600 border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-all whitespace-nowrap shadow-sm">History</button>
                  <button className="px-4 py-2 rounded-lg bg-white text-slate-600 border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-all whitespace-nowrap shadow-sm">Math</button>
                  <button className="px-4 py-2 rounded-lg bg-white text-slate-600 border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-all whitespace-nowrap shadow-sm">Literature</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
              {flows.map((flow) => (
                <article key={flow.id} className="group relative bg-white border border-slate-200 rounded-[2rem] p-2 shadow-card hover:shadow-card-hover hover:border-indigo-200/60 transition-all duration-300 h-full flex flex-col">
                  <div className="relative h-56 rounded-[1.5rem] bg-gradient-to-br from-indigo-50 to-violet-100 overflow-hidden group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
                    <div className="absolute -right-6 -bottom-6 opacity-10 transform rotate-12 transition-transform duration-700 group-hover:rotate-6 group-hover:scale-110">
                      <div className="text-indigo-900"><Icons.History /></div>
                    </div>
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 flex items-center gap-1.5 border border-white/50 shadow-sm">
                        <span className="size-2 rounded-full bg-indigo-500 animate-pulse"></span> {flow.title.includes('History') ? 'History' : flow.title.includes('Math') ? 'Math' : 'Science'}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-5 flex flex-col flex-1">
                    <div className="mb-3">
                      <h3 className="text-xl font-bold font-display text-slate-900 leading-tight mb-2 group-hover:text-primary transition-colors">{flow.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{flow.description || 'No description available for this learning flow.'}</p>
                    </div>
                    <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4 mt-auto">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <Icons.Clock />
                        2h 15m
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <Icons.BarChart />
                        Intermediate
                      </div>
                    </div>
                    <button 
                      onClick={() => startFlow(flow.id)}
                      className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-primary hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group/btn"
                    >
                      Start Learning
                      <div className="transition-transform group-hover/btn:translate-x-1"><Icons.ArrowRight /></div>
                    </button>
                  </div>
                </article>
              ))}

              {/* Mocked Cards */}
              <article className="group relative bg-white border border-slate-200 rounded-[2rem] p-2 shadow-card hover:shadow-card-hover transition-all duration-300 h-full flex flex-col opacity-90">
                <div className="relative h-56 rounded-[1.5rem] bg-gradient-to-br from-emerald-50 to-teal-100 overflow-hidden">
                  <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
                  <div className="absolute -right-6 -bottom-6 opacity-10 transform -rotate-6 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110">
                    <div className="text-emerald-900"><Icons.Science /></div>
                  </div>
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 flex items-center gap-1.5 border border-white/50 shadow-sm">
                      <span className="size-2 rounded-full bg-emerald-500"></span> Science
                    </span>
                  </div>
                </div>
                <div className="px-4 py-5 flex flex-col flex-1">
                  <div className="mb-3">
                    <h3 className="text-xl font-bold font-display text-slate-900 leading-tight mb-2">Photosynthesis & Respiration</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">Dive deep into biological processes. From sunlight to energy in living cells.</p>
                  </div>
                  <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Icons.Clock /> 45m
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Icons.BarChart /> Beginner
                    </div>
                  </div>
                  <button className="w-full py-3.5 rounded-xl bg-white border-2 border-slate-100 text-slate-700 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2">
                    Start Learning <Icons.ArrowRight />
                  </button>
                </div>
              </article>

              <article className="group relative bg-white border border-slate-200 rounded-[2rem] p-2 shadow-card hover:shadow-card-hover transition-all duration-300 h-full flex flex-col opacity-90">
                <div className="relative h-56 rounded-[1.5rem] bg-gradient-to-br from-blue-50 to-sky-100 overflow-hidden">
                  <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
                  <div className="absolute -right-6 -bottom-6 opacity-10 transform rotate-6 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
                    <div className="text-blue-900"><Icons.Math /></div>
                  </div>
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 flex items-center gap-1.5 border border-white/50 shadow-sm">
                      <span className="size-2 rounded-full bg-blue-500"></span> Mathematics
                    </span>
                  </div>
                </div>
                <div className="px-4 py-5 flex flex-col flex-1">
                  <div className="mb-3">
                    <h3 className="text-xl font-bold font-display text-slate-900 leading-tight mb-2">Advanced Quadratic Equations</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">Master the quadratic formula, factoring, and complex number theory.</p>
                  </div>
                  <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Icons.Clock /> 1h 15m
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Icons.BarChart /> Advanced
                    </div>
                  </div>
                  <button className="w-full py-3.5 rounded-xl bg-white border-2 border-slate-100 text-slate-700 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2">
                    Start Learning <Icons.ArrowRight />
                  </button>
                </div>
              </article>

              <article className="group relative bg-white border border-slate-200 rounded-[2rem] p-2 shadow-card hover:shadow-card-hover transition-all duration-300 h-full flex flex-col opacity-90">
                <div className="relative h-56 rounded-[1.5rem] bg-gradient-to-br from-rose-50 to-pink-100 overflow-hidden">
                  <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(#e11d48 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
                  <div className="absolute -right-6 -bottom-6 opacity-10 transform -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110">
                    <div className="text-rose-900"><Icons.Literature /></div>
                  </div>
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 flex items-center gap-1.5 border border-white/50 shadow-sm">
                      <span className="size-2 rounded-full bg-rose-500"></span> Literature
                    </span>
                  </div>
                </div>
                <div className="px-4 py-5 flex flex-col flex-1">
                  <div className="mb-3">
                    <h3 className="text-xl font-bold font-display text-slate-900 leading-tight mb-2">Shakespearean Tragedies</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">Explore ambition in Macbeth, revenge in Hamlet, and jealousy in Othello.</p>
                  </div>
                  <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Icons.Clock /> 3h 00m
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Icons.BarChart /> Expert
                    </div>
                  </div>
                  <button className="w-full py-3.5 rounded-xl bg-white border-2 border-slate-100 text-slate-700 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2">
                    Start Learning <Icons.ArrowRight />
                  </button>
                </div>
              </article>
              
              <article className="group relative bg-slate-900 text-white rounded-[2rem] p-8 shadow-glow hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 h-full flex flex-col overflow-hidden isolate">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/40 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-primary/60 transition-colors duration-500"></div>
                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-600/30 rounded-full blur-[60px] -ml-10 -mb-10 group-hover:bg-purple-600/50 transition-colors duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="size-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20 shadow-lg shadow-white/5 group-hover:scale-110 transition-transform duration-300">
                    <div className="text-white scale-[1.5]"><Icons.Zap /></div>
                  </div>
                  <h3 className="text-2xl font-bold font-display mb-3 leading-tight tracking-tight">Create Custom <br/> Learning Flow</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-8 border-l-2 border-primary/50 pl-4">
                    Can&apos;t find what you need? Let our AI generate a personalized curriculum just for you based on your interests.
                  </p>
                  <button className="mt-auto w-full py-4 bg-white hover:bg-slate-50 text-slate-900 rounded-xl text-sm font-bold shadow-xl shadow-black/20 transition-all flex items-center justify-center gap-3 group/btn">
                    <span>Generate with AI</span>
                    <div className="text-primary group-hover/btn:rotate-180 transition-transform duration-500"><Icons.Zap /></div>
                  </button>
                </div>
              </article>
            </div>
          </>
        )}

        {view === 'progress' && (
          <div className="w-full px-4 sm:px-8">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200/60 rounded-full text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 shadow-sm">
                    <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span> 
                    On Track
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-sm font-medium text-slate-500">Last updated: Just now</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight mb-4">My Progress</h1>
                <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
                  You&apos;ve mastered <span className="font-bold text-slate-800">12 concepts</span> this week. Your consistency in Mathematics is paying off!
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-center size-8 rounded-full bg-orange-50 text-orange-600">
                    <Icons.Fire />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Streak</p>
                    <p className="text-sm font-bold text-slate-900">12 Days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-center size-8 rounded-full bg-blue-50 text-blue-600">
                    <div className="scale-90"><Icons.Zap /></div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">XP Points</p>
                    <p className="text-sm font-bold text-slate-900">2,450 XP</p>
                  </div>
                </div>
                <button className="bg-slate-900 hover:bg-slate-800 text-white pl-5 pr-6 py-3 rounded-2xl font-semibold shadow-lg shadow-slate-900/20 transition-all hover:scale-105 flex items-center gap-2">
                  <Icons.Download />
                  <span>Report</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 shadow-glow text-white relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl -ml-6 -mb-6 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Overall Mastery</p>
                      <h3 className="text-3xl font-display font-bold text-white tracking-tight">Expert</h3>
                    </div>
                    <div className="size-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                      <Icons.MilitaryTech />
                    </div>
                  </div>
                  <div className="mt-8">
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-5xl font-bold font-display">94</span>
                      <span className="text-xl font-medium text-indigo-200 mb-1.5">%</span>
                    </div>
                    <p className="text-sm text-indigo-100/80 font-medium">Top 5% of your grade level</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between group-hover:pl-2 transition-all">
                    <span className="text-xs font-bold tracking-wide">View Analytics</span>
                    <Icons.ArrowRight />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-card hover:shadow-float transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <div className="scale-110"><Icons.History /></div>
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Icons.TrendingUp /> +12%
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Flows Completed</p>
                  <h3 className="text-3xl font-display font-bold text-slate-900">24</h3>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full w-[75%] group-hover:w-[80%] transition-all duration-700"></div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-card hover:shadow-float transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <Icons.BarChart />
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Icons.TrendingUp /> +5%
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Questions Answered</p>
                  <h3 className="text-3xl font-display font-bold text-slate-900">842</h3>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                    <div className="bg-purple-500 h-1.5 rounded-full w-[60%] group-hover:w-[65%] transition-all duration-700"></div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-card hover:shadow-float transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                    <Icons.Check />
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg flex items-center gap-1">
                    <span className="text-lg">−</span> 0%
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Avg. Accuracy</p>
                  <h3 className="text-3xl font-display font-bold text-slate-900">88%</h3>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                    <div className="bg-teal-500 h-1.5 rounded-full w-[88%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
              {progress.map((p) => {
                const isHistory = p.flow_title.includes('History') || p.flow_title.includes('World War');
                const isMath = p.flow_title.includes('Math') || p.flow_title.includes('Quadratic');
                const isScience = p.flow_title.includes('Science') || p.flow_title.includes('Photo') || p.flow_title.includes('Cell');
                
                let borderColor = 'border-t-indigo-500';
                let tagColor = 'bg-indigo-50 text-indigo-700';
                let hoverColor = 'group-hover:text-indigo-600';
                let hoverBg = 'group-hover:bg-indigo-50/30';
                let btnHover = 'hover:bg-indigo-600';
                let tagName = 'General';

                if (isHistory) {
                  borderColor = 'border-t-subject-history';
                  tagColor = 'bg-orange-50 text-orange-700';
                  hoverColor = 'group-hover:text-subject-history';
                  hoverBg = 'group-hover:bg-orange-50/30';
                  btnHover = 'hover:bg-subject-history';
                  tagName = 'History';
                } else if (isMath) {
                  borderColor = 'border-t-subject-math';
                  tagColor = 'bg-blue-50 text-blue-700';
                  hoverColor = 'group-hover:text-subject-math';
                  hoverBg = 'group-hover:bg-blue-50/30';
                  btnHover = 'hover:bg-subject-math';
                  tagName = 'Math';
                } else if (isScience) {
                  borderColor = 'border-t-subject-science';
                  tagColor = 'bg-green-50 text-green-700';
                  hoverColor = 'group-hover:text-subject-science';
                  hoverBg = 'group-hover:bg-green-50/30';
                  btnHover = 'hover:bg-subject-science';
                  tagName = 'Science';
                }

                return (
                  <div key={p.flow_id} className="space-y-6">
                    <div className={`bg-white border border-slate-100 rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 group border-t-[6px] ${borderColor}`}>
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex flex-col">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider mb-2 w-fit ${tagColor}`}>
                            {tagName}
                          </span>
                          <h3 className={`text-xl font-bold text-slate-900 transition-colors ${hoverColor}`}>{p.flow_title}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                            <Icons.Clock /> {new Date(p.started_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="relative size-16 flex items-center justify-center shrink-0">
                          <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5"></path>
                            <path className={`${isHistory ? 'text-subject-history' : isMath ? 'text-subject-math' : isScience ? 'text-subject-science' : 'text-primary'} drop-shadow-md`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${Math.round(p.performance_score * 100)}, 100`} strokeLinecap="round" strokeWidth="2.5"></path>
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-lg font-bold text-slate-900">{Math.round(p.performance_score * 100)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className={`bg-slate-50 rounded-2xl p-3 border border-slate-100 transition-colors ${hoverBg}`}>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Questions</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-700">{p.questions_answered} Done</span>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 group-hover:bg-green-50/30 transition-colors">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Correct</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-700">{p.correct_answers} Correct</span>
                          </div>
                        </div>
                      </div>
                      <button className={`w-full py-3 mt-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:text-white hover:border-transparent transition-all flex items-center justify-center gap-2 ${btnHover}`}>
                        <span>Review</span>
                        <Icons.ArrowRight />
                      </button>
                    </div>

                    {/* Completed Stories / Conceptual Bridges */}
                    {p.completed_stories && p.completed_stories.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Conceptual Bridges</h4>
                        {p.completed_stories.map((cs: CompletedStory) => (
                          <div key={cs.id} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <div className="flex items-center gap-4">
                              <div className="size-20 rounded-2xl overflow-hidden shrink-0 bg-slate-950">
                                {cs.story_data[0]?.image_url ? (
                                  <img src={cs.story_data[0].image_url} alt="Story cover" className="size-full object-cover transition-transform group-hover:scale-110" />
                                ) : (
                                  <div className="size-full flex items-center justify-center text-white/20"><Icons.MenuBook /></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-bold text-slate-900 truncate mb-1">{cs.title}</h5>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cs.verification_feedback.score !== undefined && cs.verification_feedback.score > 0.7 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                    {cs.verification_feedback.score !== undefined ? `${Math.round(cs.verification_feedback.score * 100)}% Mastered` : cs.verification_feedback.is_correct ? 'Gap Bridged' : 'Attempted'}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-medium">{new Date(cs.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-1 italic">"{cs.story_data[0]?.text || ''}"</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mocked Progress Cards */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 group border-t-[6px] border-t-emerald-500 opacity-90">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex flex-col">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-green-50 text-green-700 uppercase tracking-wider mb-2 w-fit">Science</span>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Photosynthesis</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                      <Icons.Clock /> Oct 20
                    </p>
                  </div>
                  <div className="relative size-16 flex items-center justify-center shrink-0">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5"></path>
                      <path className="text-emerald-500 drop-shadow-md" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="78, 100" stroke-linecap="round" strokeWidth="2.5"></path>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-lg font-bold text-slate-900">78</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Questions</p>
                    <span className="text-sm font-bold text-slate-700">12/12 Done</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Correct</p>
                    <span className="text-sm font-bold text-slate-700">9 Correct</span>
                  </div>
                </div>
                <button className="w-full py-3 mt-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2">
                  <span>Retake Quiz</span>
                  <div className="rotate-180 scale-90"><Icons.ArrowBack /></div>
                </button>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 group border-t-[6px] border-t-blue-500 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/5 opacity-90">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex flex-col">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 uppercase tracking-wider mb-2 w-fit">Math</span>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Quadratic Eq.</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                      <Icons.Clock /> Due Tonight
                    </p>
                  </div>
                  <div className="relative size-16 flex items-center justify-center shrink-0">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5"></path>
                      <path className="text-blue-500 drop-shadow-md" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="45, 100" stroke-linecap="round" strokeWidth="2.5"></path>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-lg font-bold text-slate-900">45</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Status</p>
                    <span className="text-sm font-bold text-blue-500 animate-pulse">Ongoing</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Time Left</p>
                    <span className="text-sm font-bold text-slate-700">45m</span>
                  </div>
                </div>
                <button className="w-full py-3 mt-2 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg hover:bg-primary transition-all flex items-center justify-center gap-2">
                  <span>Continue</span>
                  <Icons.ArrowRight />
                </button>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 group border-t-[6px] border-t-red-500 opacity-90">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex flex-col">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-red-50 text-red-700 uppercase tracking-wider mb-2 w-fit">History</span>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-red-500 transition-colors">Ancient Rome</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                      <Icons.Clock /> Oct 08
                    </p>
                  </div>
                  <div className="relative size-16 flex items-center justify-center shrink-0">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5"></path>
                      <path className="text-red-500 drop-shadow-md" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="60, 100" stroke-linecap="round" strokeWidth="2.5"></path>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-lg font-bold text-slate-900">60</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Questions</p>
                    <span className="text-sm font-bold text-slate-700">10/10 Done</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 group-hover:bg-red-50/30 transition-colors">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Correct</p>
                    <span className="text-sm font-bold text-red-500">6 Correct</span>
                  </div>
                </div>
                <button className="w-full py-3 mt-2 rounded-xl bg-white border-2 border-red-100 text-red-600 font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
                  <span>Retry Failed</span>
                  <div className="scale-90"><Icons.Zap /></div>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'quiz' && currentFlow && currentQuestion && (
          <div className="flex-1 flex overflow-hidden relative">
            <main className={`flex-1 relative p-4 lg:p-6 flex flex-col items-center scroll-smooth ${viewMode === 'story-feedback' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
              <div className="w-full flex flex-col gap-6 pb-8">
              {/* Enhanced Header with Course Info and Timer */}
              <div className="flex items-center justify-between px-1">
                <button 
                  onClick={() => { setView('browse'); setCurrentFlow(null); setCurrentQuestion(null); }}
                  className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <div className="size-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-slate-300">
                    <Icons.ArrowBack />
                  </div>
                  <span className="text-xs font-semibold">Back to Flows</span>
                </button>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Icons.School className="text-primary" />
                      {currentFlow.title.includes('Math') ? 'Math II' : currentFlow.title.includes('Science') ? 'Biology' : 'History'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <Icons.Timer className="text-slate-400" />
                      <span>Time Remaining: 12:45</span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-[11px] font-bold text-slate-900">Question {currentQuestion.order} <span className="text-slate-400 font-normal">/ 12</span></div>
                    <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wide">Adaptive Mode</div>
                  </div>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                    <div className="h-full bg-gradient-to-r from-primary to-purple-500 w-[40%] rounded-full"></div>
                  </div>
                </div>
              </div>


              {viewMode === 'quiz' ? (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative p-1">
                  <div className="bg-white rounded-[1.4rem] border border-slate-50 p-8 md:p-10 relative z-10">
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase tracking-wider border border-indigo-100">
                        {currentFlow.title.includes('Math') ? 'Math II' : 'Science'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 text-[9px] font-bold uppercase tracking-wider border border-orange-100">
                        Difficulty: {currentQuestion.difficulty_level}/5
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-display leading-snug mb-8 tracking-tight">
                      {currentQuestion.question_text}
                    </h2>

                    {/* Enhanced Options with Better Styling */}
                    <div className="grid grid-cols-1 gap-3.5 mb-8">
                      {currentQuestion.options.map((option, idx) => {
                        const isSelected = selectedAnswer === idx;
                        const isCorrectOption = idx === currentQuestion.correct_answer;
                        const isCorrectSelected = showResult && isSelected && isCorrectOption;
                        const isWrongSelected = showResult && isSelected && !isCorrectOption;
                        
                        return (
                          <label
                            key={idx}
                            className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                              showResult
                                ? isCorrectSelected
                                  ? 'correct-answer-glow border-emerald-500 bg-emerald-50'
                                  : isCorrectOption
                                  ? 'correct-answer-glow border-emerald-500 bg-emerald-50'
                                  : isWrongSelected
                                  ? 'border-red-500 bg-red-50 shadow-glow-red scale-[1.02]'
                                  : 'border-slate-100 bg-white opacity-60'
                                : isSelected
                                ? 'border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-500/10 scale-[1.02]'
                                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm'
                            }`}
                          >
                            <input
                              type="radio"
                              name="answer"
                              checked={isSelected}
                              onChange={() => !showResult && setSelectedAnswer(idx)}
                              disabled={showResult}
                              className="sr-only"
                            />
                            <div className={`size-8 rounded-lg border-2 flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                              showResult
                                ? isCorrectSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : isCorrectOption
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : isWrongSelected
                                  ? 'bg-red-600 text-white border-red-600'
                                  : 'bg-slate-50 text-slate-400 border-slate-100'
                                : isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <span className={`text-base flex-1 ${
                              showResult
                                ? isCorrectSelected
                                  ? 'font-semibold text-emerald-900'
                                  : isCorrectOption
                                  ? 'font-semibold text-emerald-900'
                                  : isWrongSelected
                                  ? 'font-semibold text-red-900'
                                  : 'font-medium text-slate-500'
                                : isSelected
                                ? 'font-semibold text-indigo-900'
                                : 'font-medium text-slate-700'
                            }`}>{option}</span>
                            {showResult && isCorrectSelected && (
                              <div className="ml-auto text-emerald-600 bg-white border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                <Icons.Check /> Correct
                              </div>
                            )}
                            {showResult && isCorrectOption && !isSelected && (
                              <div className="ml-auto text-emerald-600 bg-white border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                <Icons.Check /> Correct Answer
                              </div>
                            )}
                            {showResult && isWrongSelected && (
                              <div className="ml-auto text-red-600 bg-white border border-red-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                <Icons.Close /> Your Answer
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    {/* Enhanced Feedback Views */}
                    {showResult ? (
                      isCorrect ? (
                        /* Enhanced Correct Answer View */
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-5">
                          {/* Celebration Gradient Banner */}
                          <div className="feedback-gradient rounded-3xl p-[1px] shadow-2xl shadow-emerald-500/20 transform transition-all hover:scale-[1.01] duration-500">
                            <div className="bg-white/10 backdrop-blur-md rounded-[23px] p-8 text-white flex flex-col sm:flex-row items-start gap-6 border border-white/20 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%]"></div>
                              <div className="size-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ring-1 ring-white/30">
                                <Icons.Celebration />
                              </div>
                              <div className="flex-1 relative z-10">
                                <h3 className="font-display font-bold text-2xl mb-3 flex items-center gap-2 text-white">
                                  Correct! Great job!
                                </h3>
                                <p className="text-emerald-50 text-base leading-relaxed opacity-95 font-medium max-w-2xl mb-4">
                                  {remediation?.explanation || "You have a solid grasp of this concept. You're demonstrating excellent understanding of the material!"}
                                </p>
                                <div className="flex gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2 py-1 rounded text-emerald-100">+150 XP</span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2 py-1 rounded text-emerald-100">Streak +1</span>
                                </div>
                              </div>
                              <div className="hidden sm:block">
                                <div className="size-20 rounded-full border-4 border-white/20 flex items-center justify-center relative">
                                  <span className="text-xl font-bold text-white">100%</span>
                                  <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-white" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeWidth="3"></path>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Next Question Button */}
                          <div className="flex justify-end">
                            <button 
                              onClick={() => loadNextQuestion(currentFlow.id)}
                              className="bg-slate-900 hover:bg-primary text-white text-lg font-bold py-4 px-10 rounded-2xl shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 group ring-4 ring-slate-100 ring-offset-2"
                            >
                              <span>Next Question</span>
                              <div className="group-hover:translate-x-1 transition-transform">
                                <Icons.ArrowRight />
                              </div>
                            </button>
                          </div>

                          {/* Mastered Concepts Section */}
                          {currentQuestion.ai_insights?.mastered && currentQuestion.ai_insights.mastered.length > 0 && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Icons.Check className="text-emerald-600" />
                                <h4 className="font-bold text-emerald-900 text-sm">Mastered Concepts</h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {currentQuestion.ai_insights.mastered.map((concept, idx) => (
                                  <span key={idx} className="px-3 py-1.5 rounded-lg bg-white text-emerald-700 text-xs font-bold border border-emerald-200">
                                    {concept}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Enhanced Wrong Answer View - Side by Side Layout */
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Incorrect Answer Panel */}
                            <div className="flex-1">
                              <div className="p-5 rounded-2xl bg-white border border-red-100 shadow-[0_4px_20px_-4px_rgba(239,68,68,0.1)] relative overflow-hidden group hover:shadow-[0_8px_30px_-4px_rgba(239,68,68,0.15)] transition-all">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                                <div className="flex gap-4">
                                  <div className="size-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 text-red-500 border border-red-100">
                                    <Icons.Sentiment />
                                  </div>
                                  <div>
                                    <h4 className="text-red-700 font-bold text-lg mb-2">
                                      ✗ Incorrect. Keep learning!
                                    </h4>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                      Don't worry, mistakes are part of the learning process. Review the explanation below.
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <button className="w-full mt-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                                <Icons.Flag /> Report Issue
                              </button>
                            </div>

                            {/* Lightbulb Moment Panel - Show preparing state or actual remediation */}
                            {!remediation ? (
                              /* Preparing Study Materials Box */
                              <div className="flex-1">
                                <div className="h-full p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-gradient-to-br from-yellow-200 to-amber-200 rounded-full blur-xl opacity-40"></div>
                                  <div className="flex gap-4 relative z-10">
                                    <div className="size-10 rounded-full bg-white text-amber-500 shadow-sm flex items-center justify-center shrink-0 ring-4 ring-amber-500/10">
                                      <Icons.Lightbulb />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-slate-900 font-bold font-display">Preparing Study Materials</h4>
                                        <span className="text-[10px] font-bold text-amber-700 bg-white border border-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wide shadow-sm">Loading</span>
                                      </div>
                                      <p className="text-slate-600 text-sm leading-relaxed">
                                        We're preparing personalized study materials for you...
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Actual Lightbulb Moment Panel */
                              <div className="flex-1">
                                <div className="h-full p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 shadow-sm relative overflow-hidden hover:border-amber-200 transition-colors">
                                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-gradient-to-br from-yellow-200 to-amber-200 rounded-full blur-xl opacity-40"></div>
                                  <div className="flex gap-4 relative z-10">
                                    <div className="size-10 rounded-full bg-white text-amber-500 shadow-sm flex items-center justify-center shrink-0 ring-4 ring-amber-500/10">
                                      <Icons.Lightbulb />
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-slate-900 font-bold font-display">Lightbulb Moment</h4>
                                        <span className="text-[10px] font-bold text-amber-700 bg-white border border-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wide shadow-sm">Concept Key</span>
                                      </div>
                                      <p className="text-slate-600 text-sm leading-relaxed">
                                        {remediation.explanation}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                              <span className="text-xs">Need more help? Check the explanation above</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {remediation?.story && (
                                <button 
                                  onClick={() => currentFlow && loadNextQuestion(currentFlow.id)}
                                  className="px-6 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                >
                                  Next Question
                                </button>
                              )}
                              {!remediation ? (
                                /* Loading State - Preparing materials */
                                <button 
                                  disabled
                                  className="bg-indigo-400 text-white pl-8 pr-6 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-indigo-400/20 flex items-center gap-3 cursor-not-allowed opacity-75"
                                >
                                  <span>Preparing...</span>
                                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                </button>
                              ) : remediation?.story ? (
                                <button 
                                  onClick={enterStoryMode}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white pl-8 pr-6 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 group"
                                >
                                  <span>Enter Storytelling Mode</span>
                                  <div className="bg-white/10 rounded-full p-1 group-hover:bg-white/20 transition-colors">
                                    <Icons.ArrowRight />
                                  </div>
                                </button>
                              ) : remediation?.dynamic_question && (
                                <button 
                                  onClick={startDynamicQuestion}
                                  className="bg-slate-900 hover:bg-primary text-white pl-8 pr-6 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-slate-900/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 group"
                                >
                                  <span>Try Practice Question</span>
                                  <div className="bg-white/10 rounded-full p-1 group-hover:bg-white/20 transition-colors">
                                    <Icons.ArrowRight />
                                  </div>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      /* Live Answering Experience */
                      <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-100 mt-2">
                        <button 
                          onClick={() => setShowTutor(!showTutor)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-indigo-50 hover:text-primary transition-all shadow-sm group"
                        >
                          <div className="text-slate-400 group-hover:text-primary scale-90"><Icons.SmartToy /></div>
                          Ask AI Tutor
                        </button>
                        <div className="flex items-center gap-3">
                          <button 
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
                          >
                            Skip for now
                          </button>
                          <button 
                            onClick={currentQuestion.id === -1 ? submitDynamicAnswer : submitAnswer}
                            disabled={selectedAnswer === null}
                            className="inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-primary transition-all shadow-lg disabled:bg-slate-200 disabled:shadow-none"
                          >
                            Check Answer
                            <Icons.ArrowRight />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : viewMode === 'story-quiz' && remediation?.story ? (
                /* Story Quiz Assessment Screen - NEW DESIGN */
                <div className="w-full flex flex-col gap-4 animate-in fade-in duration-500" key="story-quiz">
                  {/* Progress Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setViewMode('story')}
                        className="size-10 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors group"
                      >
                        <MaterialIcon name="arrow_back" className="text-[20px]" />
                      </button>
                      <div>
                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest block mb-1">
                          Re-assessment Phase
                        </span>
                        <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                          {remediation.story.title}
                        </h2>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Question {storyQuizStep + 1} of {remediation.story.verification_questions.length}
                      </span>
                      <div className="flex gap-1.5">
                        {remediation.story.verification_questions.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              idx === storyQuizStep
                                ? 'w-8 bg-amber-500'
                                : idx < storyQuizStep
                                ? 'w-8 bg-amber-500'
                                : 'w-8 bg-slate-200'
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Question Card */}
                  <div className="bg-white rounded-3xl shadow-elevation border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-8 lg:p-12 flex-1">
                      <div className="w-full">
                        <span className="inline-flex items-center gap-2 py-1 px-3 rounded bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-6 border border-indigo-100">
                          <MaterialIcon name="auto_stories" className="text-[14px]" />
                          Recall Check
                        </span>

                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 font-display mb-8 leading-snug">
                          {remediation.story.verification_questions[storyQuizStep].question_text}
                        </h1>

                        <div className="space-y-4">
                          {remediation.story.verification_questions[storyQuizStep].options.map((option, idx) => {
                            const isSelected = selectedAnswer === idx;
                            return (
                              <label key={idx} className="group cursor-pointer block relative">
                                <input
                                  className="peer sr-only quiz-radio"
                                  name="quiz_option"
                                  type="radio"
                                  checked={isSelected}
                                  onChange={() => setSelectedAnswer(idx)}
                                />
                                <div className={`flex items-center gap-4 p-5 rounded-xl border transition-all duration-200 ${
                                  isSelected
                                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                                }`}>
                                  <div className={`size-6 rounded-full border-2 relative flex items-center justify-center shrink-0 radio-circle bg-white transition-colors ${
                                    isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                                  }`}>
                                    <div className={`size-2.5 bg-white rounded-full transition-transform duration-200 z-10 ${
                                      isSelected ? 'scale-100' : 'scale-0'
                                    }`}></div>
                                  </div>
                                  <div className="flex-1">
                                    <span className={`font-medium text-lg transition-colors ${
                                      isSelected ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'
                                    }`}>
                                      {option}
                                    </span>
                                  </div>
                                  <span className={`text-slate-400 font-display font-bold transition-opacity ${
                                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                                  }`}>
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => setShowTutor(!showTutor)}
                        className="px-5 py-2.5 rounded-xl text-indigo-600 font-bold text-sm bg-white border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <MaterialIcon name="psychology_alt" className="text-[18px]" />
                        Ask AI Tutor
                      </button>
                      <button
                        onClick={handleStoryQuizSubmit}
                        disabled={selectedAnswer === null}
                        className="pl-8 pr-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 group disabled:bg-slate-300 disabled:shadow-none disabled:hover:translate-y-0"
                      >
                        <span>Submit Answer</span>
                        <MaterialIcon name="arrow_forward" className="text-[20px] group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : viewMode === 'story-feedback' && remediation?.story ? (
                /* Story Feedback Screen - REDESIGNED TWO-COLUMN LAYOUT */
                <div className="w-full h-full flex overflow-hidden -mx-4 sm:-mx-8">
                  <main className="flex-1 bg-slate-50 relative flex flex-col overflow-hidden min-h-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-100/30 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-50/40 rounded-full blur-3xl -z-10 -translate-x-1/4 translate-y-1/4 pointer-events-none"></div>
                    
                    <div className="w-full p-4 lg:p-8 flex flex-col gap-4 lg:gap-6 overflow-y-auto flex-1 min-h-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setViewMode('quiz')}
                            className="size-10 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors group"
                          >
                            <MaterialIcon name="arrow_back" className="text-[20px]" />
                          </button>
                          <div>
                            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">Post-Quiz Analysis</span>
                            <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                              {remediation.story.title}: Results
                            </h2>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chapter 1 Review</span>
                          <div className="flex gap-1.5 items-center">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-emerald-600">Mastery Updated</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 bg-white rounded-3xl shadow-elevation border border-slate-200 overflow-hidden flex flex-col lg:flex-row relative z-10 min-h-[500px] flex-shrink-0">
                        {/* Left Column: Overall Performance */}
                        <div className="lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/50 p-6 lg:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                          <div className="relative z-10 w-full flex flex-col items-center">
                            <h3 className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mb-8">Overall Performance</h3>
                            <div className="relative size-56 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-200 mb-8" style={{
                              background: `conic-gradient(#4f46e5 ${(storyQuizAnswers.filter(a => a.isCorrect).length / storyQuizAnswers.length) * 100}%, #e2e8f0 0)`
                            }}>
                              <div className="absolute inset-[14px] bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                                <span className="text-6xl font-bold font-display text-slate-900 tracking-tight">
                                  {Math.round((storyQuizAnswers.filter(a => a.isCorrect).length / storyQuizAnswers.length) * 100)}
                                  <span className="text-3xl text-slate-400 font-medium">%</span>
                                </span>
                                <div className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 border border-emerald-100">
                                  <MaterialIcon name="trending_up" className="text-[14px] text-emerald-600" />
                                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">+15% Improvement</span>
                                </div>
                              </div>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 font-display mb-3">Excellent Work, {user?.name?.split(' ')[0] || 'Student'}!</h2>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-[280px] mx-auto mb-8">
                              You've demonstrated a solid understanding of mitochondrial functions. You are ready to advance.
                            </p>
                            <div className="grid grid-cols-2 gap-4 w-full">
                              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center group hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="size-2 rounded-full bg-emerald-500"></span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Correct</span>
                                </div>
                                <span className="text-xl font-bold text-slate-800">{storyQuizAnswers.filter(a => a.isCorrect).length}/{storyQuizAnswers.length}</span>
                              </div>
                              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center group hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="size-2 rounded-full bg-indigo-500"></span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Time</span>
                                </div>
                                <span className="text-xl font-bold text-slate-800">4m 12s</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Breakdown and Next Steps */}
                        <div className="lg:w-2/3 p-6 lg:p-10 flex flex-col relative bg-white overflow-hidden">
                          <div className="flex-1 overflow-y-auto pr-2 lg:pr-4">
                            <div className="flex items-center justify-between mb-8">
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 font-display">Concept Mastery Breakdown</h3>
                                <p className="text-xs text-slate-500 mt-1">Detailed analysis by sub-topic</p>
                              </div>
                              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                                Full Report <MaterialIcon name="arrow_outward" className="text-[16px]" />
                              </button>
                            </div>

                            <div className="space-y-6 mb-10">
                              <div className="group">
                                <div className="flex justify-between items-end mb-2">
                                  <div className="flex items-center gap-2">
                                    <MaterialIcon name="biotech" className="text-slate-400 text-[18px]" />
                                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">Mitochondrial Structure</span>
                                  </div>
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Mastered</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 w-[100%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                                </div>
                              </div>

                              <div className="group">
                                <div className="flex justify-between items-end mb-2">
                                  <div className="flex items-center gap-2">
                                    <MaterialIcon name="bolt" className="text-slate-400 text-[18px]" />
                                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">ATP Synthesis Process</span>
                                  </div>
                                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Proficient</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 w-[80%] rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div>
                                </div>
                              </div>

                              <div className="group">
                                <div className="flex justify-between items-end mb-2">
                                  <div className="flex items-center gap-2">
                                    <MaterialIcon name="battery_alert" className="text-slate-400 text-[18px]" />
                                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">Energy Conversion vs Storage</span>
                                  </div>
                                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Review Needed</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-400 w-[60%] rounded-full shadow-[0_0_10px_rgba(251,191,36,0.4)]"></div>
                                </div>
                                <p className="text-[11px] text-amber-600/80 mt-1.5 font-medium pl-1 flex items-center gap-1">
                                  <MaterialIcon name="info" className="text-[14px]" />
                                  You confused chemical storage with kinetic release in Q9.
                                </p>
                              </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden mb-6">
                              <div className="absolute top-0 right-0 p-4 opacity-10">
                                <MaterialIcon name="psychology" className="text-6xl text-indigo-900" />
                              </div>
                              <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4 relative z-10">Recommended Next Steps</h4>
                              <div className="grid md:grid-cols-2 gap-4 relative z-10">
                                <button className="text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group flex gap-3 items-start">
                                  <div className="size-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm shrink-0 border border-amber-100 group-hover:scale-110 transition-transform">
                                    <MaterialIcon name="lightbulb" className="text-[18px]" />
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">Micro-Review: Energy</h5>
                                    <p className="text-[11px] text-slate-500 leading-snug">2 min rapid review to clarify the gap in energy conversion.</p>
                                  </div>
                                </button>
                                <button 
                                  onClick={() => {
                                    setViewMode('quiz');
                                    loadNextQuestion(currentFlow?.id || 0);
                                  }}
                                  className="text-left p-4 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 border border-indigo-600 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all group flex gap-3 items-start"
                                >
                                  <div className="size-8 rounded-full bg-white/20 text-white flex items-center justify-center shadow-inner shrink-0 backdrop-blur-sm border border-white/20">
                                    <MaterialIcon name="play_arrow" className="text-[18px]" />
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-bold text-white mb-1">Continue to Chapter 2</h5>
                                    <p className="text-[11px] text-indigo-100 leading-snug">Move forward to "Cell Membrane Dynamics".</p>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                            <button className="text-slate-400 font-semibold hover:text-slate-600 text-sm flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded-lg transition-colors">
                              <MaterialIcon name="history" className="text-[18px]" />
                              <span>View Quiz History</span>
                            </button>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-slate-400">Next: Cell Membranes</span>
                              <button 
                                onClick={() => {
                                  setViewMode('quiz');
                                  loadNextQuestion(currentFlow?.id || 0);
                                }}
                                className="pl-6 pr-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-indigo-600 shadow-xl shadow-slate-900/10 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 group"
                              >
                                <span>Continue Learning</span>
                                <MaterialIcon name="arrow_forward" className="text-[18px] group-hover:translate-x-1 transition-transform" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </main>

                  {/* AI Performance Analysis Sidebar */}
                  <aside className="w-[340px] bg-white border-l border-slate-200 hidden xl:flex flex-col z-20 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm flex-shrink-0 z-10">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            <MaterialIcon name="auto_graph" className="text-[20px]" />
                          </div>
                          <h2 className="text-sm font-bold font-display text-slate-900">AI Performance Analysis</h2>
                        </div>
                        <div className="flex gap-1">
                          <span className="block size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                      </div>
                      <p className="text-xs text-emerald-600 font-medium pl-9">Results analyzed successfully.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-8 min-h-0">
                      <div className="relative group">
                        <div className="absolute left-[15px] top-8 bottom-[-32px] w-0.5 bg-slate-100 group-last:hidden"></div>
                        <div className="relative flex gap-4">
                          <div className="size-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 z-10 shadow-sm mt-0.5">
                            <MaterialIcon name="check" className="text-[16px] text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Knowledge Gap Closed</h3>
                            <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm relative overflow-hidden transition-colors">
                              <p className="text-xs text-slate-600 leading-relaxed mb-2">
                                The remediation session on <strong>{remediation.story.title}</strong> was effective.
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Efficiency: High</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="relative group">
                        <div className="absolute left-[15px] top-8 bottom-[-32px] w-0.5 bg-slate-100 group-last:hidden"></div>
                        <div className="relative flex gap-4">
                          <div className="size-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 z-10 shadow-sm mt-0.5">
                            <MaterialIcon name="flag" className="text-[16px] text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Retention Strategy</h3>
                            <div className="p-3 bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-xl">
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-amber-900">Spaced Repetition</span>
                              </div>
                              <p className="text-[10px] text-amber-800/80 mt-1 leading-relaxed">
                                "{remediation.story.title}" will reappear in your daily quiz in <strong>3 days</strong> to ensure long-term retention.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="relative group">
                        <div className="absolute left-[15px] top-8 bottom-[-32px] w-0.5 bg-slate-100 group-last:hidden"></div>
                        <div className="relative flex gap-4">
                          <div className="size-8 rounded-full bg-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0 z-10 shadow-lg shadow-indigo-200 mt-0.5 ring-4 ring-indigo-50">
                            <MaterialIcon name="route" className="text-[16px] text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2">Path Updated</h3>
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl shadow-inner relative overflow-hidden">
                              <p className="text-xs text-indigo-900 leading-relaxed">
                                Unlocked next module: <strong>Cell Membrane Dynamics</strong>. Difficulty calibrated to 'Adaptive'.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                      <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-600/30 hover:shadow-sm transition-all flex items-center justify-center gap-2">
                        <MaterialIcon name="analytics" className="text-[16px]" />
                        View Full Analytics
                      </button>
                    </div>
                  </aside>
                </div>
              ) : viewMode === 'story' && remediation?.story ? (
                /* Storytelling Mode UI */
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative min-h-[650px] flex flex-col transition-all duration-500">
                  {remediation?.story && (
                    <div className="flex-1 flex flex-col md:flex-row h-full">
                      {/* Left Side: Rich Visuals */}
                      <div className="w-full md:w-1/2 bg-slate-950 relative overflow-hidden flex items-center justify-center min-h-[350px] md:min-h-full transition-all duration-700">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 z-10"></div>
                        
                        {isGeneratingVisuals ? (
                          <div className="flex flex-col items-center gap-6 text-white/60 z-20">
                            <div className="relative size-16">
                              <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-400">Loading Story</span>
                              <span className="text-xs font-medium text-white/40">Preparing your visual journey...</span>
                            </div>
                          </div>
                        ) : remediation.story.panels[currentStoryPanel].image_url ? (
                          <div className="relative w-full h-full animate-in fade-in zoom-in-105 duration-1000">
                            <img 
                              src={remediation.story.panels[currentStoryPanel].image_url} 
                              alt={`Story panel ${currentStoryPanel + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => console.error('ERROR: Image failed to load', remediation.story?.panels[currentStoryPanel]?.image_url)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                            
                            {/* Panel Caption Overlay */}
                            <div className="absolute bottom-8 left-8 right-8 z-20">
                              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-all duration-500 hover:bg-black/60">
                                <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mb-1">Visual Concept</p>
                                <p className="text-[11px] text-white/80 leading-relaxed italic line-clamp-2">
                                  {remediation.story.panels[currentStoryPanel].visual_prompt}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-4 text-white/30">
                            <Icons.Warning className="size-8 opacity-20" />
                            <span className="text-xs font-bold uppercase tracking-widest">Visual Unavailable</span>
                          </div>
                        )}
                      </div>

                      {/* Right Side: Rich Narrative Content */}
                      <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between bg-white relative transition-all duration-500 overflow-y-auto max-h-[700px]">
                        <div className="dots-pattern absolute inset-0 opacity-[0.04] pointer-events-none"></div>
                        
                        <div className="relative z-10 flex-1">
                          {/* Progress Indicator */}
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                                Chapter {currentStoryPanel + 1} <span className="opacity-40 mx-1">/</span> {remediation.story.panels.length}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {remediation.story.panels.map((_, idx) => (
                                <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentStoryPanel ? 'w-8 bg-indigo-600' : 'w-1.5 bg-slate-200'}`}></div>
                              ))}
                            </div>
                          </div>
                          
                          <div key={currentStoryPanel} className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-6">
                            {/* Section Badge */}
                            {remediation.story.panels[currentStoryPanel].section_badge && (
                              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-wide shadow-lg ${
                                remediation.story.panels[currentStoryPanel].section_color === 'indigo' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500' :
                                remediation.story.panels[currentStoryPanel].section_color === 'teal' ? 'bg-gradient-to-r from-teal-600 to-teal-500' :
                                remediation.story.panels[currentStoryPanel].section_color === 'green' ? 'bg-gradient-to-r from-green-600 to-green-500' :
                                'bg-gradient-to-r from-indigo-600 to-purple-600'
                              }`}>
                                <MaterialIcon name="auto_stories" className="text-base" />
                                {remediation.story.panels[currentStoryPanel].section_badge}
                              </div>
                            )}
                            
                            {/* Title */}
                            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 leading-tight">
                              {remediation.story.panels[currentStoryPanel].title || `Chapter ${currentStoryPanel + 1}`}
                            </h2>
                            
                            {/* Paragraphs */}
                            <div className="space-y-4">
                              {remediation.story.panels[currentStoryPanel].paragraphs && remediation.story.panels[currentStoryPanel].paragraphs.length > 0 ? (
                                remediation.story.panels[currentStoryPanel].paragraphs.map((para: string, idx: number) => (
                                  <p key={idx} className="text-base text-slate-700 leading-relaxed font-medium">
                                    {para}
                                  </p>
                                ))
                              ) : (
                                <p className="text-base text-slate-700 leading-relaxed font-medium">
                                  {remediation.story.panels[currentStoryPanel].text}
                                </p>
                              )}
                            </div>
                            
                            {/* Highlighted Terms */}
                            {remediation.story.panels[currentStoryPanel].highlighted_terms && remediation.story.panels[currentStoryPanel].highlighted_terms.length > 0 && (
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                                  <MaterialIcon name="school" className="text-sm" />
                                  Key Terms
                                </h4>
                                <div className="space-y-2.5">
                                  {remediation.story.panels[currentStoryPanel].highlighted_terms.map((term: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-3">
                                      <div className="size-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                                      <div>
                                        <span className="font-bold text-slate-900 text-sm">{term.term}:</span>
                                        <span className="text-slate-600 text-sm ml-1">{term.description}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Callout Box */}
                            {remediation.story.panels[currentStoryPanel].callout && (
                              <div className={`rounded-2xl p-6 border-2 ${
                                remediation.story.panels[currentStoryPanel].callout.type === 'distinction' ? 'bg-indigo-50 border-indigo-200' :
                                remediation.story.panels[currentStoryPanel].callout.type === 'tip' ? 'bg-amber-50 border-amber-200' :
                                remediation.story.panels[currentStoryPanel].callout.type === 'ready' ? 'bg-green-50 border-green-200' :
                                'bg-slate-50 border-slate-200'
                              }`}>
                                <div className="flex items-start gap-4">
                                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    remediation.story.panels[currentStoryPanel].callout.type === 'distinction' ? 'bg-indigo-100 text-indigo-600' :
                                    remediation.story.panels[currentStoryPanel].callout.type === 'tip' ? 'bg-amber-100 text-amber-600' :
                                    remediation.story.panels[currentStoryPanel].callout.type === 'ready' ? 'bg-green-100 text-green-600' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    <MaterialIcon name={remediation.story.panels[currentStoryPanel].callout.icon || 'info'} className="text-xl" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-bold text-slate-900 text-sm mb-2">
                                      {remediation.story.panels[currentStoryPanel].callout.title}
                                    </h5>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                      {remediation.story.panels[currentStoryPanel].callout.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="relative z-10 pt-10 border-t border-slate-100 flex items-center justify-between gap-6">
                          <button 
                            onClick={() => setCurrentStoryPanel(Math.max(0, currentStoryPanel - 1))}
                            disabled={currentStoryPanel === 0 || isGeneratingVisuals}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${currentStoryPanel === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}
                          >
                            <Icons.ArrowBack /> Back
                          </button>
                          
                          {currentStoryPanel < remediation.story.panels.length - 1 ? (
                            <button 
                              onClick={() => setCurrentStoryPanel(currentStoryPanel + 1)}
                              disabled={isGeneratingVisuals}
                              className="flex-1 max-w-[220px] flex items-center justify-center gap-3 px-8 py-4 bg-slate-950 text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all group active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                            >
                              <span>Next Chapter</span>
                              <div className="group-hover:translate-x-1.5 transition-transform duration-300"><Icons.ArrowRight /></div>
                            </button>
                          ) : (
                            <button 
                              onClick={startStoryQuiz}
                              disabled={isGeneratingVisuals}
                              className="flex-1 max-w-[260px] flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-2xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 transition-all group active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none overflow-hidden relative"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                              <span className="relative z-10">Start Story Quiz</span>
                              <div className="group-hover:scale-110 transition-transform duration-300 relative z-10"><Icons.Check /></div>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            </main>

            {/* Enhanced AI Insights Sidebar - Show during quiz, story, and story-quiz, but NOT during story-feedback */}
            {(viewMode === 'quiz' || viewMode === 'story' || viewMode === 'story-quiz') && (
              <aside className="hidden lg:block w-80 shrink-0 sticky top-24 space-y-4 h-fit max-h-[calc(100vh-7rem)] overflow-y-auto sidebar-scroll">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-purple-500"></div>
                <div className="flex items-center gap-2.5 mb-5 border-b border-slate-50 pb-3">
                  <div className="size-8 rounded-xl bg-indigo-50 text-primary flex items-center justify-center scale-90">
                    <Icons.Psychology />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm leading-tight">AI Insights</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="size-1 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Live Analysis</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Timeline-style Layout with Connecting Lines */}
                  {showResult && !isCorrect ? (
                    <>
                      {/* Concept Gap Detected */}
                      <div className="relative pl-6 border-l-2 border-red-200">
                        <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-red-500 border-2 border-white"></div>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icons.Warning className="text-red-600" />
                            <h4 className="font-bold text-red-900 text-xs">Concept Gap Detected</h4>
                          </div>
                          <div className="mb-3">
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="font-medium text-red-700">Mastery Level</span>
                              <span className="font-bold text-red-900">{currentQuestion.ai_insights?.mastery_level || 42}%</span>
                            </div>
                            <div className="w-full bg-red-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-red-500 h-full rounded-full transition-all duration-1000" style={{ width: `${currentQuestion.ai_insights?.mastery_level || 42}%` }}></div>
                            </div>
                          </div>
                          <p className="text-[11px] text-red-700 leading-relaxed">
                            {currentQuestion.ai_insights?.reasoning || 'Focus on understanding the core principles before moving forward.'}
                          </p>
                        </div>
                      </div>

                      {/* Recommended Reading */}
                      <div className="relative pl-6 border-l-2 border-indigo-200">
                        <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-indigo-500 border-2 border-white"></div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-2">
                            <Icons.MenuBook className="text-indigo-600" />
                            Recommended Reading
                          </h4>
                          <div className="space-y-2">
                            {(currentQuestion.ai_insights?.recommended_reading || [
                              {title: "Fundamentals", section: "Introduction"},
                              {title: "Advanced Concepts", section: "Section 3"}
                            ]).map((reading: any, idx: number) => (
                              <div key={idx} className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 hover:bg-indigo-100 transition-colors cursor-pointer group/reading">
                                <div className="flex items-start gap-2">
                                  <Icons.Article className="text-indigo-600 shrink-0 mt-0.5 group-hover/reading:scale-110 transition-transform" />
                                  <div>
                                    <p className="text-[11px] font-bold text-indigo-900 mb-1">{reading.title}</p>
                                    <p className="text-[10px] text-indigo-700">{reading.section}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Algorithm Adjustment */}
                      <div className="relative pl-6 border-l-2 border-orange-200">
                        <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-orange-500 border-2 border-white"></div>
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icons.Tune className="text-orange-600" />
                            <h4 className="font-bold text-orange-900 text-xs">Algorithm Adjustment</h4>
                          </div>
                          <p className="text-[11px] text-orange-700 leading-relaxed">
                            Difficulty reduced by 1 level. Adding more foundational practice questions.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : showResult && isCorrect ? (
                    <>
                      {/* On Fire Status */}
                      <div className="relative z-10 mb-10 text-center">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2 rounded-full shadow-lg shadow-orange-500/25 border border-orange-400/20 mb-5 transform hover:scale-105 transition-transform cursor-help ring-4 ring-orange-50">
                          <Icons.Fire />
                          <span className="text-xs font-bold uppercase tracking-widest text-white">Elite Mode Active</span>
                        </div>
                        <h3 className="text-4xl font-display font-bold text-slate-900 mb-2 tracking-tight">On Fire! 🔥</h3>
                        <p className="text-slate-500 text-sm font-medium">5 consecutive correct answers</p>
                      </div>

                      {/* Mastered Concept Card */}
                      <div className="relative z-10 space-y-4 mb-8">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Mastered Concept</h4>
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group cursor-pointer relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="flex items-start gap-4 relative z-10">
                            <div className="mt-1 size-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm shrink-0">
                              <Icons.Check />
                            </div>
                            <div>
                              <p className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">Understanding the Concept</p>
                              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">You've demonstrated <span className="text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">mastery</span> of the core principles.</p>
                            </div>
                          </div>
                        </div>

                        {/* Adaptive Logic Card */}
                        <div className="bg-gradient-to-br from-indigo-50/80 to-slate-50 rounded-2xl p-5 border border-indigo-100 relative">
                          <div className="flex items-center gap-2 mb-3">
                            <Icons.Psychology />
                            <span className="text-xs font-bold text-primary uppercase tracking-wide">Adaptive Logic</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            Performance exceeds expectations. Increasing complexity to <span className="text-primary-dark font-bold bg-white px-1.5 py-0.5 rounded shadow-sm border border-indigo-100 text-[11px]">Elite Hard</span> to challenge critical reasoning.
                          </p>
                        </div>
                      </div>

                      {/* Class Standing */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft relative overflow-hidden group hover:shadow-lg transition-shadow">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Icons.Trophy />
                        </div>
                        <div className="flex items-center justify-between mb-5 relative z-10">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Class Standing</h4>
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide shadow-sm">+12% vs Avg</span>
                        </div>
                        <div className="flex items-center gap-5 relative z-10">
                          <div className="relative size-14">
                            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                              <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                              <path className="text-primary drop-shadow-md" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="95, 100" strokeLinecap="round" strokeWidth="3"></path>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Top</span>
                              <span className="text-sm font-bold text-slate-900 leading-none">5%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-900">Leaderboard</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">You are ranked <span className="text-primary font-bold">#2</span> today</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Concept Graph Visualization */}
                      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200 rounded-xl p-4">
                        <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-2">
                          <Icons.AutoGraph className="text-indigo-600" />
                          Concept Graph
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] text-slate-600">Mastered</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-indigo-500"></div>
                            <span className="text-[10px] text-slate-600">Current</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-slate-300"></div>
                            <span className="text-[10px] text-slate-600">Upcoming</span>
                          </div>
                        </div>
                      </div>

                      {currentQuestion.ai_insights ? (
                        <>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current Strategy</div>
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                {currentQuestion.ai_insights.current_strategy}
                              </p>
                            </div>
                          </div>
                          
                          {currentQuestion.ai_insights.mastered.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recently Mastered</div>
                              <div className="flex flex-wrap gap-1.5">
                                {currentQuestion.ai_insights.mastered.map(m => (
                                  <span key={m} className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">{m}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-8 text-center">
                          <div className="inline-block animate-pulse text-slate-300 mb-2">
                            <Icons.SmartToy />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium italic">Analyzing solving patterns...</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Class Performance Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Class Performance</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="font-medium text-slate-500">Response Rate</span>
                      <span className="font-bold text-slate-900">42%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                  <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-100 flex gap-2 items-start">
                    <Icons.Warning className="text-orange-500 scale-75 pt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-600 leading-tight">
                      <strong className="text-orange-700 block mb-0.5">Common Pitfall</strong>
                      Watch out for simple calculation errors in quadratic factoring.
                    </p>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-all flex items-center justify-center gap-2">
                  <Icons.Analytics /> View Full Analytics
                </button>
              </div>
            </aside>
            )}
          </div>
        )}
      </main>

      {/* Tutor Modal - Simplified for fitting look */}
      {showTutor && view === 'quiz' && (
        <div className="fixed bottom-6 right-6 z-[100] w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[400px]">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.SmartToy />
                <span className="text-xs font-bold">AI Tutor</span>
              </div>
              <button onClick={() => setShowTutor(false)} className="text-slate-400 hover:text-white transition-colors">
                <Icons.Close />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {tutorMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="text-slate-300 mb-3"><Icons.SmartToy /></div>
                  <p className="text-[11px] text-slate-500">Ask for a hint, an explanation, or a breakdown of the question!</p>
                </div>
              )}
              {tutorMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-slate-800 border border-slate-100'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTutorLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 px-3 py-2 rounded-xl shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 bg-white">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={tutorMessage}
                  onChange={(e) => setTutorMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendTutorMessage()}
                  placeholder="Ask me anything..." 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-primary outline-none"
                />
                <button 
                  onClick={sendTutorMessage}
                  disabled={!tutorMessage.trim() || isTutorLoading}
                  className="size-9 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-primary transition-all disabled:opacity-50"
                >
                  <div className="scale-75"><Icons.ArrowRight /></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
