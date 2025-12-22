import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth endpoints
export const authApi = {
  googleLogin: (role?: 'teacher' | 'student') => {
    const roleParam = role ? `?role=${role}` : '';
    window.location.href = `${API_URL}/auth/google${roleParam}`;
  },
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Teacher endpoints
export const teacherApi = {
  createFlow: (data: { title: string; description?: string }) =>
    api.post('/api/teacher/flows', data),
  listFlows: () => api.get('/api/teacher/flows'),
  getFlowDetails: (flowId: number) => api.get(`/api/teacher/flows/${flowId}`),
  addQuestion: (flowId: number, data: {
    question_text: string;
    options: string[];
    correct_answer: number;
    difficulty_level: number;
    order: number;
  }) => api.post(`/api/teacher/flows/${flowId}/questions`, data),
  getFlowProgress: (flowId: number) => api.get(`/api/teacher/flows/${flowId}/progress`),
  generateQuestions: (flowId: number, data: { topic: string; count: number }) =>
    api.post(`/api/teacher/flows/${flowId}/generate-questions`, data),
};

// Student endpoints
export const studentApi = {
  browseFlows: () => api.get('/api/student/flows'),
  getFlow: (flowId: number) => api.get(`/api/student/flows/${flowId}`),
  startFlow: (flowId: number, persona: string = 'Standard') => 
    api.post(`/api/student/flows/${flowId}/start`, { persona }),
  getNextQuestion: (flowId: number) => api.get(`/api/student/flows/${flowId}/next-question`),
  submitAnswer: (questionId: number, answer: number) =>
    api.post(`/api/student/questions/${questionId}/answer`, { answer }),
  getRemediation: (questionId: number, answer: number) =>
    api.get(`/api/student/questions/${questionId}/remediation`, { params: { selected_answer: answer } }),
  getProgress: () => api.get('/api/student/progress'),
  askTutor: (questionId: number, message: string) =>
    api.post('/api/student/tutor/ask', { question_id: questionId, message }),
  generateStoryVisuals: (panels: any[]) =>
    api.post('/api/student/story/generate-visuals', { panels }),
  completeStory: (data: {
    flow_id: number;
    question_id: number;
    title: string;
    story_data: any[];
    verification_feedback: any;
  }) => api.post('/api/student/story/complete', data),
};

export default api;

