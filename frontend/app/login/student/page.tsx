'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function StudentLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = () => {
    authApi.googleLogin('student');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mock email login - in production, implement proper authentication
    router.push('/dashboard/student');
  };

  return (
    <main className="flex h-screen overflow-hidden">
      {/* Left side with bluish background */}
      <div className="hidden lg:flex flex-1 relative bg-[#E8F0FE] items-center justify-center p-8 overflow-hidden">
        {/* Relocated Logo */}
        <div className="absolute top-10 left-10 flex items-center gap-3 z-20">
          <div className="size-9 text-primary bg-white rounded-lg p-1.5 flex items-center justify-center shadow-sm">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight font-display text-slate-900">AdaptiveAI</span>
        </div>

        <div className="absolute inset-0 pattern-dots opacity-40"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative w-full max-w-xl z-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-blue-100 shadow-sm text-primary text-xs font-bold uppercase tracking-wider mb-4">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
              </svg>
              Trusted by 5,000+ Schools
            </div>
            <h1 className="text-3xl xl:text-4xl font-display font-bold text-slate-900 leading-tight mb-3 min-h-[3.5rem]">
              Empower every student&apos;s <span className="text-primary relative inline-block">
                potential
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-200 -z-10" preserveAspectRatio="none" viewBox="0 0 100 10"><path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="8"></path></svg>
              </span>
            </h1>
            <p className="text-base text-slate-600 max-w-md leading-relaxed min-h-[3rem]">
              Experience the future of education with AI-driven insights that adapt to individual learning styles in real-time.
            </p>
          </div>
          <div className="relative mt-6">
            <div className="relative rounded-2xl overflow-hidden shadow-card border-2 border-white bg-white aspect-[16/9] group max-h-[280px]">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAvZAeyJ2Hb1tnfiXN9PYVhNKY7JXgJdgHVwi77txqqPFLgBpvABuWV9HqBo1HzxhpmUyvvWgbD3XPIBY5jPUIbBHTgu9AgYLEh-QhCmBVudRk54fhuuFAWmWuBRgQwxUWvuPv4pDzmvTHbiO6qE9FaLLfFdMlRE2RXUkk8TLtqwx64Ql4lZhIsmVGrv7d-dFYo2w2KJtiwmLWTrOlS-qU9QTT00CAP65ZGP7NGahe8ZhEIPXGtlDHbqKdpcsFxCz5fivgNQ_zeKGF0")'}}>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">Math • Algebra II</span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    <span className="w-2 h-2 rounded-full bg-white/30"></span>
                    <span className="w-2 h-2 rounded-full bg-white/30"></span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 w-3/4 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 top-8 glass-panel p-4 rounded-2xl w-40 animate-float">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-semibold uppercase">Avg. Growth</span>
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                </svg>
              </div>
              <div className="text-3xl font-bold text-slate-800 tracking-tight">+42%</div>
              <p className="text-[10px] text-slate-400 mt-1">Student performance</p>
            </div>
            <div className="absolute -left-6 -bottom-6 glass-panel p-3 pr-5 rounded-2xl flex items-center gap-3 animate-float-delayed">
              <div className="relative">
                <img alt="Educator" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-6bygUiTdbaZI4G6NzuYVLL6VLZn9WBpQ8QLL0BPOFOmmgTiceMuMFixokPH-rTq4OvkBzxahp6B1o1UhKJ1IhfbBacA7N29uBE4qE9bDB23BViL-bDFYoJPeUvhtJXkwan7POnNflwZ5GKaDDIkbX5SLfj_FS8wPd8i0bAWyAmCfacNjYqB9PDo0FRBQyfTlFcsQX1OzS0bBN-mP9fAaU2kOxz9XnVC6Wm9mF4fAOGtbCSzKMJOYBlw1CZyR9RigNx6BColyrBBt"/>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Ms. Sarah J.</p>
                <p className="text-[10px] text-slate-500 font-medium">Science Dept.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-10 bg-white relative overflow-y-auto">
        <div className="w-full max-w-[360px] py-4">
          <div className="w-full bg-slate-100 p-1 rounded-lg flex items-center mb-4 relative">
            <button
              onClick={() => router.push('/login/teacher')}
              className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors focus:outline-none relative z-10"
            >
              Teacher
            </button>
            <button className="flex-1 py-2 rounded-lg text-xs font-bold text-slate-900 bg-white shadow-sm border border-slate-200 transition-all focus:outline-none relative z-10 pointer-events-none">
              Student
            </button>
          </div>
          <div className="mb-4 text-center lg:text-left min-h-[3.5rem]">
            <h2 className="text-lg font-display font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-xs text-slate-500">Please enter your details to sign in.</p>
          </div>
          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full h-10 flex items-center justify-center gap-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg font-medium transition-all duration-200 group relative overflow-hidden shadow-sm hover:shadow text-xs"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="relative z-10">Sign in with Google</span>
            </button>
            <button disabled className="w-full h-10 flex items-center justify-center gap-2.5 bg-white text-slate-400 border border-slate-200 rounded-lg font-medium transition-all duration-200 group relative overflow-hidden shadow-sm cursor-not-allowed opacity-60 text-xs">
              <svg className="w-4 h-4" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1h10v10H1z" fill="#f35325"></path>
                <path d="M12 1h10v10H12z" fill="#81bc06"></path>
                <path d="M1 12h10v10H1z" fill="#05a6f0"></path>
                <path d="M12 12h10v10H12z" fill="#ffba08"></path>
              </svg>
              <span className="relative z-10">Sign in with Microsoft</span>
            </button>
            <button disabled className="w-full h-10 flex items-center justify-center gap-2.5 bg-white text-slate-400 border border-slate-200 rounded-lg font-medium transition-all duration-200 group relative overflow-hidden shadow-sm cursor-not-allowed opacity-60 text-xs">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
              </svg>
              <span className="relative z-10">Sign in with GitHub</span>
            </button>
          </div>
          <div className="relative flex items-center gap-3 mb-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Or</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700" htmlFor="email">Email</label>
              <input
                className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400 transition-all outline-none text-xs"
                id="email"
                placeholder="name@school.edu"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="password">Password</label>
              </div>
              <div className="relative group">
                <input
                  className="w-full h-9 px-3 pr-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400 transition-all outline-none text-xs"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input
                  className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/25 cursor-pointer"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
              </label>
            </div>
            <button
              type="submit"
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-lg shadow-slate-900/20 hover:shadow-xl transition-all duration-200 text-xs"
            >
              Log in
            </button>
          </form>
          <div className="mt-6 flex justify-center gap-5 text-[10px] text-slate-400 font-medium">
            <a className="hover:text-slate-600" href="#">Privacy Policy</a>
            <a className="hover:text-slate-600" href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </main>
  );
}
