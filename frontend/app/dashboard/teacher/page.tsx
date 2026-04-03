'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { teacherApi, authApi } from '@/lib/api';
import type { User } from '@/lib/auth';
import MaterialIcon from '@/components/MaterialIcon';

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
  correct_answer: number;
  difficulty_level: number;
  order: number;
}

interface FlowDetail extends Flow {
  questions: Question[];
}

interface StudentProgress {
  student_id: number;
  student_name: string;
  student_email: string;
  questions_answered: number;
  correct_answers: number;
  performance_score: number;
  started_at: string;
  last_updated: string;
}

// Inline SVG components for reliability
const Icons = {
  Add: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Students: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Reports: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  Library: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Sparkles: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.912 4.912L18.824 9.824 13.912 11.736 12 16.648l-1.912-4.912L5.176 9.824l4.912-1.912L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>,
  Zap: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Logo: () => <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path></svg>,
  ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>,
  CheckCircle: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 17 8.5 12 1 17"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Filter: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Tree: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"></path><path d="M12 13v5"></path><path d="M10 15h4"></path></svg>,
  Brain: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z"></path></svg>,
  Split: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15V9"></path><path d="M9 9h9"></path><path d="M12 12V9"></path><path d="M3 15h6"></path><path d="M6 12v3"></path><path d="M18 15a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3"></path></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Trophy: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>,
  Beaker: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15"></path><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"></path><path d="M6 14h12"></path></svg>,
  Book: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
};

export default function TeacherDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<FlowDetail | null>(null);
  const [flowProgress, setFlowProgress] = useState<StudentProgress[]>([]);
  const [view, setView] = useState<'home' | 'create' | 'flow-overview' | 'details'>('home');
  const [createMode, setCreateMode] = useState<'ai' | 'manual'>('ai');
  
  // Create Flow State
  const [newFlowTitle, setNewFlowTitle] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');
  const [generateTopic, setGenerateTopic] = useState('');
  const [generateCount, setGenerateCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Add Question State
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    difficulty_level: 2,
    order: 1,
  });

  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadFlows();
  }, []);

  const checkAuth = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') {
      router.push('/login/teacher');
      return;
    }
    setUser(currentUser);
  };

  const loadFlows = async () => {
    try {
      const response = await teacherApi.listFlows();
      setFlows(response.data);
    } catch (error) {
      console.error('Failed to load flows:', error);
    }
  };

  const handleSelectFlow = async (flowId: number) => {
    try {
      const detailResponse = await teacherApi.getFlowDetails(flowId);
      setSelectedFlow(detailResponse.data);
      
      const progressResponse = await teacherApi.getFlowProgress(flowId);
      setFlowProgress(progressResponse.data);
      
      setView('flow-overview');
    } catch (error) {
      console.error('Failed to load flow details:', error);
    }
  };

  const handleCreateFlow = async () => {
    try {
      const response = await teacherApi.createFlow({
        title: newFlowTitle || (createMode === 'ai' ? generateTopic : 'New Flow'),
        description: newFlowDescription,
      });
      const newFlow = response.data;
      
      // We no longer automatically generate questions here.
      // Instead, we just navigate to the flow details where the teacher can generate.
      
      setNewFlowTitle('');
      setNewFlowDescription('');
      // Keep generateTopic if in AI mode so it's ready in the details view
      if (createMode !== 'ai') setGenerateTopic('');
      
      loadFlows();
      handleSelectFlow(newFlow.id);
    } catch (error) {
      console.error('Failed to create flow:', error);
      alert('Failed to create flow');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlow) return;

    try {
      await teacherApi.addQuestion(selectedFlow.id, {
        ...newQuestion,
        options: newQuestion.options.filter(opt => opt.trim() !== ''),
      });
      setNewQuestion({
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        difficulty_level: 2,
        order: selectedFlow.questions.length + 2,
      });
      setShowAddQuestion(false);
      handleSelectFlow(selectedFlow.id);
    } catch (error) {
      console.error('Failed to add question:', error);
      alert('Failed to add question');
    }
  };

  const handleGenerateMore = async () => {
    if (!selectedFlow || !generateTopic) return;
    setIsGenerating(true);
    try {
      await teacherApi.generateQuestions(selectedFlow.id, {
        topic: generateTopic,
        count: generateCount,
      });
      setShowGenerateModal(false);
      setGenerateTopic('');
      handleSelectFlow(selectedFlow.id);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      alert('Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) return null;

  const Sidebar = () => (
    <aside className="w-[240px] bg-white border-r border-border-strong flex flex-col z-30 h-full flex-shrink-0">
      <div className="p-3 space-y-5 flex-1 flex flex-col overflow-hidden">
        <button 
          onClick={() => setView('create')}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex-shrink-0"
        >
          <Icons.Add />
          <span className="font-semibold text-xs">New Learning Flow</span>
        </button>
        <div className="space-y-1 flex-shrink-0">
          <button 
            onClick={() => setView('home')}
            className={`w-full nav-item ${view === 'home' ? 'active' : ''} text-xs py-1.5`}
          >
            <Icons.Dashboard />
            Dashboard
          </button>
          <button className="w-full nav-item text-xs py-1.5">
            <Icons.Students />
            Students
          </button>
          <button className="w-full nav-item text-xs py-1.5">
            <Icons.Reports />
            Reports
          </button>
          <button className="w-full nav-item text-xs py-1.5">
            <Icons.Library />
            Library
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">My Flows</h2>
            <button className="p-1 text-slate-400 hover:text-primary rounded hover:bg-primary-subtle transition-colors">
              <Icons.Filter />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5">
            {flows.map(flow => (
              <button
                key={flow.id}
                onClick={() => handleSelectFlow(flow.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                  selectedFlow?.id === flow.id && view === 'details'
                    ? 'border-primary bg-indigo-50/50 shadow-sm'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <h4 className={`text-[11px] font-bold truncate ${selectedFlow?.id === flow.id && view === 'details' ? 'text-primary' : 'text-slate-700'}`}>
                  {flow.title}
                </h4>
                <p className="text-[9px] text-slate-400 truncate mt-0.5">{flow.description || 'No description'}</p>
              </button>
            ))}
            {flows.length === 0 && (
              <div className="rounded-xl bg-slate-50/50 border border-dashed border-slate-200 p-4 flex flex-col items-center justify-center text-center">
                <Icons.Tree />
                <p className="text-[9px] text-slate-400 leading-relaxed mt-1">No flows yet</p>
              </div>
            )}
          </div>
        </div>
        <div className="pt-3 border-t border-slate-100 space-y-1 flex-shrink-0">
          <button className="w-full nav-item text-xs py-1.5">
            <Icons.Settings />
            Settings
          </button>
        </div>
      </div>
      <div className="p-3 border-t border-slate-100 bg-gradient-to-b from-indigo-50/30 to-white flex-shrink-0">
        <div className="flex items-start gap-2.5">
          <div className="size-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Icons.Sparkles />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 mb-0.5">Pro Tip</p>
            <p className="text-[10px] text-slate-500 leading-tight mb-1.5">Use AI to generate quizzes automatically.</p>
            <button className="text-[10px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1">
              Try it out <Icons.ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  const Header = () => (
    <header className="h-14 flex-none bg-white z-50 border-b border-border-strong px-4 sm:px-6 sticky top-0">
      <div className="h-full flex items-center justify-between max-w-[1920px] mx-auto">
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setView('home')}>
          <div className="relative size-9 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Icons.Logo />
            </div>
          </div>
          <span className="text-base font-bold tracking-tight font-display text-slate-900 leading-none">Adaptive<span className="text-primary">AI</span></span>
        </div>
        <div className="flex items-center gap-5">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/50 border border-indigo-100 rounded-full text-[10px] font-semibold text-indigo-600">
            <Icons.Zap />
            AI Engine Active
          </div>
          <div className="h-4 w-px bg-slate-200 hidden lg:block"></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">Teacher Dashboard</p>
            </div>
            <div className="size-7 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white shadow-sm">
              <img alt="Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/a/default-user=s96-c" />
            </div>
            <button 
              onClick={async () => {
                await authApi.logout();
                router.push('/login/teacher');
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 ml-1"
            >
              <Icons.Logout />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="bg-background text-text-main font-body h-screen flex flex-col antialiased overflow-hidden selection:bg-primary/20 selection:text-primary">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative overflow-y-auto bg-slate-50/50 mesh-bg">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-indigo-100/30 to-transparent opacity-50 blur-3xl pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto px-6 py-8 relative z-10 min-h-full flex flex-col">
            
            {view === 'home' && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900 tracking-tight mb-1.5">
                    Welcome back, {user.name.split(' ')[0]}
                  </h1>
                  <p className="text-slate-500 text-base font-light max-w-xl">
                    Your classroom is ready. Let's create something engaging today.
                  </p>
                </div>

                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden relative flex flex-col lg:flex-row min-h-[450px]">
                  <div className="flex-1 p-10 lg:p-12 flex flex-col justify-center items-start relative z-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-wide mb-6">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {flows.length === 0 ? 'Empty Dashboard' : 'Ready to scale'}
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 font-display mb-5 tracking-tight leading-[1.1]">
                      Build your first <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-purple">Adaptive Learning</span> Flow.
                    </h2>
                    <p className="text-slate-500 text-base mb-8 max-w-md leading-relaxed">
                      {flows.length === 0 
                        ? "Start from scratch or use our AI assistant to instantly generate personalized lesson plans tailored to your students' needs."
                        : `You have ${flows.length} active learning flows. Ready to create another one?`}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => setView('create')}
                        className="group relative flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden"
                      >
                        <Icons.Add />
                        Create New Flow
                      </button>
                      <button className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:border-slate-300 hover:shadow-sm">
                        <Icons.Play />
                        Quick Tutorial
                      </button>
                    </div>
                    <div className="mt-10 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Icons.CheckCircle />
                        AI-Powered
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="flex items-center gap-1">
                        <Icons.CheckCircle />
                        Real-time Analytics
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="flex items-center gap-1">
                        <Icons.CheckCircle />
                        Student-paced
                      </span>
                    </div>
                  </div>
                  <div className="lg:w-[360px] bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-100 p-6 flex flex-col relative overflow-hidden">
                    <div className="flex items-center justify-between mb-5 z-20">
                      <h3 className="font-bold text-slate-900 text-sm">Start with a template</h3>
                      <button className="text-[10px] font-semibold text-primary hover:text-primary-hover">View all</button>
                    </div>
                    <div className="space-y-3 relative z-20">
                      {[
                        { title: 'Algebra Foundations', desc: 'Step-by-step AI hints.', icon: <Icons.Dashboard />, color: 'orange', tags: ['Math', 'Gr 8-9'] },
                        { title: 'Photosynthesis Deep Dive', desc: 'Virtual lab simulation.', icon: <Icons.Beaker />, color: 'emerald', tags: ['Science', 'Gr 10'] },
                        { title: 'Shakespearean Analysis', desc: 'Character mapping.', icon: <Icons.Book />, color: 'blue', tags: ['English', 'Gr 11'] },
                      ].map((tmpl, i) => (
                        <div key={i} className="group bg-white p-3.5 rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <div className={`size-8 rounded-lg bg-${tmpl.color}-50 text-${tmpl.color}-600 flex items-center justify-center group-hover:bg-${tmpl.color}-100 transition-colors`}>
                              {tmpl.icon}
                            </div>
                            <div className="text-slate-300 group-hover:text-primary transition-colors">
                              <Icons.ChevronRight />
                            </div>
                          </div>
                          <h4 className="font-bold text-slate-900 text-[13px] mb-0.5">{tmpl.title}</h4>
                          <p className="text-[11px] text-slate-500 mb-2">{tmpl.desc}</p>
                          <div className="flex items-center gap-1.5">
                            {tmpl.tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase">{tag}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tl from-indigo-200 to-purple-200 blur-3xl opacity-20 pointer-events-none"></div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-500 group">
                    <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <Icons.Users />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900 font-display">
                        {flows.length > 0 ? '27' : '--'}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Active Students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-500 group">
                    <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                      <Icons.TrendingUp />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900 font-display">
                        {flows.length > 0 ? '84%' : '--%'}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Avg. Mastery</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-500 group">
                    <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                      <Icons.Clock />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900 font-display">
                        {flows.length > 0 ? '12h' : '--h'}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Time Spent</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {view === 'create' && (
              <div className="max-w-5xl mx-auto flex flex-col xl:flex-row gap-6">
                <div className="flex-1 flex flex-col gap-5 min-w-0">
                  <div className="mb-1">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Create Learning Flow</h2>
                    <p className="text-slate-500 text-sm max-w-xl">Combine the power of AdaptiveAI with your expertise to create personalized, engaging lessons.</p>
                  </div>
                  <div className="bg-slate-100 p-1 rounded-lg inline-flex w-fit border border-slate-200">
                    <button 
                      onClick={() => setCreateMode('ai')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                        createMode === 'ai' 
                          ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <div className="text-primary"><Icons.Sparkles /></div>
                      <span className="font-semibold text-xs">AI Assistant</span>
                    </button>
                    <button 
                      onClick={() => setCreateMode('manual')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                        createMode === 'manual' 
                          ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <div className="text-slate-400"><Icons.Edit /></div>
                      <span className="font-medium text-xs">Manual Build</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 relative overflow-hidden group transition-all hover:shadow-md">
                    <div className="flex flex-col gap-5 relative z-10">
                      {createMode === 'ai' ? (
                        <div>
                          <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                            What topic are you teaching?
                          </label>
                          <div className="relative">
                            <textarea 
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none text-xs leading-relaxed shadow-sm transition-shadow" 
                              placeholder="e.g. Explain the water cycle to 5th graders with a focus on evaporation and condensation. Include a short quiz at the end." 
                              rows={3}
                              value={generateTopic}
                              onChange={(e) => setGenerateTopic(e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-slate-900 mb-1.5">Flow Title</label>
                          <input 
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" 
                            placeholder="e.g. The Great Water Cycle Adventure"
                            value={newFlowTitle}
                            onChange={(e) => setNewFlowTitle(e.target.value)}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Target Audience</label>
                          <select className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none text-slate-700 cursor-pointer appearance-none">
                            <option>Grade 5</option>
                            <option>Grade 6</option>
                            <option>Grade 7</option>
                            <option>Grade 8</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Instructional Style</label>
                          <select className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none text-slate-700 cursor-pointer appearance-none">
                            <option>Interactive & Gamified</option>
                            <option>Socratic Method</option>
                            <option>Direct Instruction</option>
                            <option>Project Based</option>
                          </select>
                        </div>
                      </div>

                      {createMode === 'ai' && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] font-medium text-slate-400 mr-1">Suggestions:</span>
                          <button onClick={() => setGenerateTopic('Visual learning about the water cycle')} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200 hover:bg-white hover:border-primary hover:text-primary transition-all shadow-sm">+ Visual Learning</button>
                          <button onClick={() => setGenerateTopic('Short quiz about historical events')} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200 hover:bg-white hover:border-primary hover:text-primary transition-all shadow-sm">+ Short Quiz</button>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                        <button 
                          onClick={() => setView('home')}
                          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-semibold text-xs hover:bg-slate-200 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleCreateFlow}
                          disabled={isGenerating}
                          className="group relative flex items-center justify-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          {isGenerating ? (
                            <>
                              <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Icons.Zap />
                          <span>{createMode === 'ai' ? 'Next' : 'Next'}</span>
                        </>
                      )}
                    </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                      <div className="text-slate-400"><Icons.Zap /></div>
                      Metadata
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">Flow Title</label>
                        <input 
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow placeholder-slate-400" 
                          placeholder="e.g. The Great Water Cycle Adventure"
                          value={newFlowTitle}
                          onChange={(e) => setNewFlowTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">Short Description</label>
                        <input 
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow placeholder-slate-400" 
                          placeholder="A brief overview for your students..."
                          value={newFlowDescription}
                          onChange={(e) => setNewFlowDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full xl:w-[340px] flex-shrink-0 flex flex-col gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-lg h-full min-h-[400px] flex flex-col">
                    <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 rounded-t-xl backdrop-blur-sm">
                      <h3 className="font-semibold text-slate-700 text-[10px] uppercase tracking-wide flex items-center gap-1.5">
                        <Icons.Tree />
                        Structure Preview
                      </h3>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100">DRAFT</span>
                    </div>
                    <div className="flex-1 p-5 relative overflow-hidden bg-slate-50/30">
                      <div className="absolute inset-0 z-0 opacity-[0.3] pattern-dots"></div>
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="space-y-0 pt-1">
                          <div className="relative pl-8 pb-8 border-l border-slate-200 ml-3">
                            <div className="absolute -left-[13px] top-0 size-6 rounded-full bg-primary flex items-center justify-center z-10 shadow-sm ring-2 ring-white">
                              <div className="text-white scale-75"><Icons.Zap /></div>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-subtle flex items-start gap-2 w-full hover:border-primary transition-all cursor-pointer group">
                              <div className="size-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100">
                                <div className="text-primary scale-75"><Icons.Play /></div>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-primary uppercase tracking-wide">Intro</p>
                                <p className="text-[11px] font-semibold text-slate-800">Why does it rain?</p>
                              </div>
                            </div>
                          </div>
                          <div className="relative pl-8 pb-8 border-l border-slate-200 ml-3">
                            <div className="absolute -left-[13px] top-0 size-6 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 ring-2 ring-white shadow-sm">
                              <span className="text-[10px] font-bold text-slate-500">2</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-subtle flex items-start gap-2 w-full hover:border-primary transition-all cursor-pointer group">
                              <div className="size-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 text-purple-600">
                                <Icons.Brain />
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-purple-600 uppercase tracking-wide">Check</p>
                                <p className="text-[11px] font-semibold text-slate-800">Interactive Diagram</p>
                              </div>
                            </div>
                          </div>
                          <div className="relative pl-8 ml-3">
                            <div className="absolute -left-[13px] top-0 size-6 rounded-full bg-emerald-500 flex items-center justify-center z-10 shadow-sm ring-2 ring-white">
                              <div className="text-white scale-75"><Icons.Check /></div>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-subtle flex items-start gap-2 w-full hover:border-emerald-500 transition-all cursor-pointer">
                              <div className="size-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600">
                                <Icons.Trophy />
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Done</p>
                                <p className="text-[11px] font-semibold text-slate-800">Summary & Badge</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                      <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                        <div className="flex items-center gap-1">
                          <Icons.Clock />
                          <span>~15 mins</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icons.Tree />
                          <span>3 Nodes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                          <Icons.Sparkles />
                        </div>
                        <h4 className="font-bold text-base tracking-tight">Need Inspiration?</h4>
                      </div>
                      <p className="text-indigo-100 text-xs mb-5 leading-relaxed font-medium">See what other science teachers are creating with AdaptiveAI.</p>
                      <button className="w-full py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 mt-auto">
                        Browse Library
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'flow-overview' && selectedFlow && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
                {/* Breadcrumb */}
                <nav className="flex items-center text-sm font-medium text-slate-500 gap-2">
                  <button onClick={() => setView('home')} className="hover:text-primary transition-colors">Dashboard</button>
                  <span>→</span>
                  <span className="text-slate-900 font-semibold">{selectedFlow.title}</span>
                </nav>

                {/* Header Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>
                  
                  <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
                    {/* Left: Flow Info */}
                    <div className="flex-1 space-y-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                          <MaterialIcon name="science" className="text-sm" /> Science
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200">
                          Grade 10
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200">
                          30-45 min
                        </span>
                      </div>
                      
                      <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight mb-3">
                          {selectedFlow.title}
                        </h1>
                        <p className="text-slate-600 text-base leading-relaxed">
                          {selectedFlow.description || 'Explore fundamental concepts through adaptive learning and AI-powered insights.'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(3, flowProgress.length))].map((_, i) => (
                              <div key={i} className="size-9 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-600">
                                {String.fromCharCode(65 + i)}
                              </div>
                            ))}
                            {flowProgress.length > 3 && (
                              <div className="size-9 rounded-full bg-slate-800 text-white border-2 border-white flex items-center justify-center text-xs font-bold">
                                +{flowProgress.length - 3}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{flowProgress.length} students</p>
                            <p className="text-xs text-slate-500">enrolled</p>
                          </div>
                        </div>
                        <div className="h-10 w-px bg-slate-200"></div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {new Date(selectedFlow.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-500">Last updated</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Action Card */}
                    <div className="lg:w-72 space-y-4">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 space-y-3">
                        <button 
                          onClick={() => setShowGenerateModal(true)}
                          disabled={isGenerating}
                          className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center justify-center gap-2">
                            {isGenerating ? (
                              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <MaterialIcon name="auto_awesome" className="text-lg" />
                            )}
                            <span>{isGenerating ? 'Generating...' : 'Generate with AI'}</span>
                          </div>
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => setShowAddQuestion(true)}
                            className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold shadow-sm transition-all"
                          >
                            <MaterialIcon name="add" className="text-base" />
                            Add Q
                          </button>
                          <button className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold shadow-sm transition-all">
                            <MaterialIcon name="settings" className="text-base" />
                            Settings
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <div className="flex gap-3">
                          <MaterialIcon name="lightbulb" className="text-amber-600 text-xl" />
                          <div>
                            <p className="text-xs font-bold text-amber-900 mb-1">Pro Tip</p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                              Use AI generation to create adaptive questions that adjust to each student's level.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questions Section Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-display font-bold text-slate-900">Questions</h2>
                    <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-600 border border-slate-200 shadow-sm">
                      {selectedFlow.questions.length}
                    </span>
                  </div>
                  {selectedFlow.questions.length > 0 && (
                    <select className="text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:border-slate-300 transition-colors disabled:opacity-50" disabled={selectedFlow.questions.length === 0}>
                      <option>Sort by order</option>
                      <option>Sort by difficulty</option>
                      <option>Sort by type</option>
                    </select>
                  )}
                </div>

                {/* Empty State or Questions List */}
                {selectedFlow.questions.length === 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Empty State Message */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-10 flex flex-col items-center justify-center text-center">
                      <div className="size-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-5 text-slate-400">
                        <MaterialIcon name="quiz" className="text-3xl" />
                      </div>
                      <h3 className="text-lg font-display font-bold text-slate-900 mb-2">No questions yet</h3>
                      <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
                        Start building your flow by generating questions with AI or creating them manually.
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MaterialIcon name="check_circle" className="text-emerald-500 text-sm" />
                          <span>Adaptive difficulty</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MaterialIcon name="check_circle" className="text-emerald-500 text-sm" />
                          <span>Real-time feedback</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Action Cards */}
                    <div className="space-y-4">
                      <div 
                        onClick={() => setShowGenerateModal(true)}
                        className="group bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-3xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-2xl opacity-40"></div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wide mb-3">
                          <MaterialIcon name="auto_awesome" className="text-xs" /> Recommended
                        </span>
                        <h4 className="text-lg font-display font-bold text-slate-900 mb-2">Generate with AI</h4>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          Let our AI create adaptive questions tailored to your topic and student level.
                        </p>
                        <div className="flex items-center text-indigo-600 font-semibold text-sm group-hover:gap-2 transition-all">
                          <span>Get started</span>
                          <MaterialIcon name="arrow_forward" className="text-base group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                      
                      <div 
                        onClick={() => setShowAddQuestion(true)}
                        className="group bg-white border-2 border-slate-200 rounded-3xl p-6 cursor-pointer hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                      >
                        <h4 className="text-lg font-display font-bold text-slate-900 mb-2">Create Manually</h4>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          Craft your own questions with full control over content and difficulty.
                        </p>
                        <div className="flex items-center text-slate-600 font-semibold text-sm group-hover:gap-2 transition-all">
                          <span>Start creating</span>
                          <MaterialIcon name="arrow_forward" className="text-base group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                      
                      <div className="group bg-white border-2 border-slate-200 rounded-3xl p-6 cursor-pointer hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <h4 className="text-lg font-display font-bold text-slate-900 mb-2">Import Questions</h4>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          Upload questions from a CSV file or copy from another flow.
                        </p>
                        <div className="flex items-center text-slate-600 font-semibold text-sm group-hover:gap-2 transition-all">
                          <span>Import now</span>
                          <MaterialIcon name="arrow_forward" className="text-base group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Questions List with proper cards as per plan Part 4.2 */
                  <div className="space-y-4">
                    {selectedFlow.questions.map((q, idx) => {
                      const difficultyColors = {
                        1: { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
                        2: { border: 'border-l-green-500', bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
                        3: { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
                        4: { border: 'border-l-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
                        5: { border: 'border-l-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' }
                      };
                      const colors = difficultyColors[q.difficulty_level as keyof typeof difficultyColors] || difficultyColors[3];
                      
                      return (
                        <div key={q.id} className={`group relative bg-white border-2 border-l-4 ${colors.border} border-slate-100 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
                          {/* Question Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                                Q{idx + 1}
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${colors.badge}`}>
                                Difficulty {q.difficulty_level}
                              </span>
                              <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                                Multiple Choice
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors" title="Edit">
                                <MaterialIcon name="edit" className="text-slate-400 hover:text-primary text-sm" />
                              </button>
                              <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors" title="Duplicate">
                                <MaterialIcon name="content_copy" className="text-slate-400 hover:text-primary text-sm" />
                              </button>
                              <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors" title="Delete">
                                <MaterialIcon name="delete" className="text-slate-400 hover:text-red-500 text-sm" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Question Text */}
                          <h3 className="text-base font-bold text-slate-900 mb-4 leading-relaxed">
                            {q.question_text}
                          </h3>
                          
                          {/* Options Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt, optIdx) => (
                              <div 
                                key={optIdx}
                                className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                                  q.correct_answer === optIdx
                                    ? `${colors.border.replace('border-l-', 'border-')} ${colors.bg}`
                                    : 'border-slate-100 bg-slate-50'
                                }`}
                              >
                                <div className={`size-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                  q.correct_answer === optIdx ? colors.text : 'text-slate-400'
                                }`}>
                                  {q.correct_answer === optIdx ? (
                                    <MaterialIcon name="check_circle" className="text-base" />
                                  ) : (
                                    String.fromCharCode(65 + optIdx)
                                  )}
                                </div>
                                <span className={`text-sm flex-1 ${
                                  q.correct_answer === optIdx ? 'font-semibold text-slate-900' : 'text-slate-600'
                                }`}>
                                  {opt}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {view === 'details' && selectedFlow && (
              <div className="space-y-5">
                <nav className="flex items-center text-[10px] font-medium text-slate-500 mb-2">
                  <button onClick={() => setView('home')} className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                    <Icons.Dashboard />
                    Dashboard
                  </button>
                  <Icons.ChevronRight />
                  <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded-md shadow-sm border border-slate-100">{selectedFlow.title}</span>
                </nav>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-indigo-50/40 to-transparent opacity-50 pointer-events-none -mr-16 -mt-16"></div>
                  <div className="relative z-10 flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                    <div className="space-y-4 max-w-2xl flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 text-[9px] font-semibold border border-slate-200">
                          <Icons.Edit />
                          Course Flow
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 text-[9px] font-semibold border border-slate-200">
                          <Icons.Beaker />
                          Multi-Level
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 text-[9px] font-semibold border border-slate-200">
                          <Icons.Clock />
                          Self-Paced
                        </div>
                      </div>
                      <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 font-display tracking-tight mb-2">
                          {selectedFlow.title}
                        </h1>
                        <p className="text-slate-500 text-sm leading-relaxed font-normal">
                          {selectedFlow.description || 'No description provided for this learning flow.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-5 pt-1 border-t border-slate-100 mt-4">
                        <div className="flex items-center gap-2.5 py-2">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            <div className="size-7 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600">JD</div>
                            <div className="size-7 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">SK</div>
                            <div className="size-7 rounded-full bg-slate-800 text-white ring-2 ring-white flex items-center justify-center text-[9px] font-bold">+{flowProgress.length > 2 ? flowProgress.length - 2 : 0}</div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900">{flowProgress.length} Students</span>
                            <span className="text-[9px] text-slate-500">Enrolled</span>
                          </div>
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="flex flex-col py-2">
                          <span className="text-xs font-bold text-slate-900">
                            {new Date(selectedFlow.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-[9px] text-slate-500">Last updated</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[220px]">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                        <button 
                          onClick={() => setShowGenerateModal(true)}
                          className="w-full group relative overflow-hidden rounded-xl bg-slate-900 text-white shadow-md transition-all transform hover:-translate-y-0.5"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-100 group-hover:opacity-90"></div>
                          <div className="relative px-4 py-2.5 flex items-center justify-center gap-1.5">
                            {isGenerating ? (
                              <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <div className="scale-90"><Icons.Sparkles /></div>
                            )}
                            <span className="text-xs font-bold tracking-wide">{isGenerating ? 'Generating...' : 'Generate with AI'}</span>
                          </div>
                        </button>
                        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                          <button 
                            onClick={() => setShowAddQuestion(true)}
                            className="flex items-center justify-center gap-1 px-2 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition-all"
                          >
                            <Icons.Add />
                            Add Q
                          </button>
                          <button className="flex items-center justify-center gap-1 px-2 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition-all">
                            <Icons.Settings />
                            Settings
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 font-display">Questions</h2>
                      <span className="bg-white text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm border border-slate-200">{selectedFlow.questions.length} Items</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-slate-400 mr-0.5">Sort:</span>
                      <select className="h-7 pl-2 pr-6 bg-white rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600 shadow-sm focus:outline-none appearance-none cursor-pointer">
                        <option>Default</option>
                        <option>Difficulty</option>
                      </select>
                    </div>
                  </div>

                  {selectedFlow.questions.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/60 min-h-[350px] flex flex-col relative overflow-hidden group shadow-sm">
                      <div className="absolute inset-0 pattern-grid opacity-40"></div>
                      <div className="relative z-10 p-8 flex-1 flex items-center justify-center">
                        <div className="max-w-3xl w-full grid lg:grid-cols-2 gap-10 items-center">
                          <div className="text-left space-y-4">
                            <div className="inline-flex items-center justify-center size-12 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-600">
                              <Icons.Library />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900 font-display tracking-tight">No questions yet.</h3>
                              <p className="text-base text-slate-500 mt-0.5 font-medium">Add your first question to get started.</p>
                            </div>
                            <div className="flex flex-col gap-2 pt-1">
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <div className="text-emerald-500"><Icons.CheckCircle /></div>
                                AI-Powered Adaptive Learning
                              </div>
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <div className="text-indigo-500"><Icons.Sparkles /></div>
                                AI Generation Available
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-3">
                            <button 
                              onClick={() => setShowGenerateModal(true)}
                              className="group/card flex items-center p-4 rounded-2xl border border-indigo-100 bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 text-left relative overflow-hidden w-full ring-1 ring-indigo-50/50"
                            >
                              <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">RECOMMENDED</div>
                              <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md mr-3 shrink-0">
                                <Icons.Sparkles />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-slate-900 block text-sm group-hover/card:text-indigo-700 transition-colors">Generate with AI</span>
                                <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Create from topic or text.</span>
                              </div>
                              <div className="text-indigo-300 group-hover/card:text-indigo-600 transition-colors">
                                <Icons.ChevronRight />
                              </div>
                            </button>
                            <button 
                              onClick={() => setShowAddQuestion(true)}
                              className="group/card flex items-center p-3 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-300 text-left relative w-full"
                            >
                              <div className="size-9 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center mr-3 shrink-0 group-hover/card:bg-white group-hover/card:text-indigo-600">
                                <Icons.Edit />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-slate-900 block text-xs">Create Manually</span>
                                <span className="text-[10px] text-slate-500 mt-0.5 block">Write from scratch.</span>
                              </div>
                              <div className="text-slate-300 group-hover/card:text-indigo-400 transition-colors">
                                <Icons.ChevronRight />
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedFlow.questions.map((q, idx) => (
                        <div key={q.id} className="bg-white rounded-2xl shadow-card hover:shadow-card-hover border border-slate-200 transition-all duration-300 group overflow-hidden">
                          <div className={`border-l-4 p-5 sm:p-6 ${
                            q.difficulty_level <= 2 ? 'border-emerald-500' :
                            q.difficulty_level <= 4 ? 'border-amber-500' : 'border-rose-500'
                          }`}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="size-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 font-extrabold text-xs flex items-center justify-center">
                                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                                </div>
                                <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wide ${
                                  q.difficulty_level <= 2 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  q.difficulty_level <= 4 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                  {q.difficulty_level <= 2 ? 'Easy' : q.difficulty_level <= 4 ? 'Medium' : 'Hard'}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                  <Icons.CheckCircle /> MCQs
                                </span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <button className="p-1 text-slate-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"><Icons.Edit /></button>
                                <button className="p-1 text-slate-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"><Icons.Copy /></button>
                                <button className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Icons.Trash /></button>
                              </div>
                            </div>
                            <h3 className="text-base font-bold text-slate-800 mb-4 leading-snug pl-10">{q.question_text}</h3>
                            <div className="pl-10 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {q.options.map((opt, optIdx) => (
                                <div 
                                  key={optIdx}
                                  className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border ${
                                    optIdx === q.correct_answer 
                                      ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/10' 
                                      : 'border-slate-200 bg-white text-slate-600'
                                  }`}
                                >
                                  {optIdx === q.correct_answer ? (
                                    <div className="size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                      <Icons.Check />
                                    </div>
                                  ) : (
                                    <div className="size-4 rounded-full border-2 border-slate-200 bg-slate-50 shrink-0"></div>
                                  )}
                                  <span className={`text-xs ${optIdx === q.correct_answer ? 'font-semibold text-slate-800' : 'font-medium'}`}>{opt}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {(showAddQuestion || showGenerateModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-xl shadow-elevated border border-slate-200 my-auto">
            {showAddQuestion ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-900">Add New Question</h2>
                  <button onClick={() => setShowAddQuestion(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <Icons.Close />
                  </button>
                </div>
                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Question Text</label>
                    <textarea 
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-1 focus:ring-primary outline-none text-xs transition-all resize-none" 
                      rows={2} 
                      required 
                      value={newQuestion.question_text}
                      onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Options</label>
                    <div className="grid gap-2">
                      {newQuestion.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="correct" 
                            checked={newQuestion.correct_answer === i}
                            onChange={() => setNewQuestion({...newQuestion, correct_answer: i})}
                            className="size-3.5 text-primary focus:ring-primary cursor-pointer"
                          />
                          <input 
                            className="flex-1 h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-1 focus:ring-primary outline-none transition-all" 
                            placeholder={`Option ${i+1}`}
                            value={opt}
                            onChange={(e) => {
                              const opts = [...newQuestion.options];
                              opts[i] = e.target.value;
                              setNewQuestion({...newQuestion, options: opts});
                            }}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Difficulty (1-5)</label>
                      <input 
                        type="number" min="1" max="5" 
                        className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-1 focus:ring-primary outline-none transition-all" 
                        value={newQuestion.difficulty_level}
                        onChange={(e) => setNewQuestion({...newQuestion, difficulty_level: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Order</label>
                      <input 
                        type="number" 
                        className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-1 focus:ring-primary outline-none transition-all" 
                        value={newQuestion.order}
                        onChange={(e) => setNewQuestion({...newQuestion, order: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all">Add Question</button>
                    <button type="button" onClick={() => setShowAddQuestion(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">Cancel</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="size-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Icons.Sparkles />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Generate with AI</h2>
                  </div>
                  <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <Icons.Close />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">What should the questions be about?</label>
                    <textarea 
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-1 focus:ring-primary outline-none text-xs transition-all resize-none" 
                      rows={2} 
                      placeholder="e.g. Key dates and figures of the American Revolution..."
                      value={generateTopic}
                      onChange={(e) => setGenerateTopic(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">How many questions?</label>
                    <div className="flex gap-1.5">
                      {[3, 5, 8, 10].map(n => (
                        <button 
                          key={n}
                          onClick={() => setGenerateCount(n)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            generateCount === n ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={handleGenerateMore}
                    disabled={isGenerating || !generateTopic}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-hover transition-all shadow-md flex items-center justify-center gap-1.5 disabled:bg-slate-300"
                  >
                    {isGenerating ? (
                      <>
                        <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <div className="scale-90"><Icons.Zap /></div>
                        <span>Generate Now</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
