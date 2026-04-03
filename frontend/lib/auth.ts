import { authApi } from './api';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'teacher' | 'student';
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await authApi.getMe();
    return response.data;
  } catch (error) {
    return null;
  }
}

export function redirectToDashboard(role: string) {
  window.location.href = `/dashboard/${role}`;
}

