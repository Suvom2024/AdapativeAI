/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#4f46e5", // Indigo 600
        "primary-hover": "#4338ca", // Indigo 700
        "primary-light": "#e0e7ff", // Indigo 100
        "primary-subtle": "#eff6ff", 
        "surface": "#ffffff",
        "background": "#f8fafc", // Slate 50
        "text-main": "#0f172a", // Slate 900
        "text-muted": "#64748b", // Slate 500
        "border-subtle": "#f1f5f9", // Slate 100
        "border-strong": "#e2e8f0", // Slate 200
        "accent-purple": "#8b5cf6",
        "accent-blue": "#3b82f6",
        "accent-green": "#10b981",
        // Subject Colors
        "subject-math": "#3b82f6",     // Blue
        "subject-science": "#10b981",  // Emerald
        "subject-history": "#f97316",  // Orange
        "subject-lit": "#8b5cf6",      // Violet
        "subject-bio": "#06b6d4",      // Cyan
        // Status Colors
        "success": "#10b981",
        "success-light": "#ecfdf5",
        "error": "#ef4444",
        "error-light": "#fef2f2",
        "warning": "#f59e0b",
      },
      fontFamily: {
        "display": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Inter", "sans-serif"]
      },
      boxShadow: {
        "soft": "0 2px 15px rgba(0, 0, 0, 0.04)",
        "glow": "0 0 25px rgba(79, 70, 229, 0.15)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.2)",
        "glow-green": "0 0 20px rgba(16, 185, 129, 0.2)",
        "card": "0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)",
        "card-hover": "0 0 0 1px rgba(79,70,229,0.1), 0 12px 32px -8px rgba(79,70,229,0.15)",
        "premium": "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0,0,0,0.02)",
        "float": "0 10px 40px -10px rgba(0,0,0,0.08)",
        "elevation-low": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "elevation-high": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "elevated": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "elevation": "0 10px 40px -10px rgba(0,0,0,0.08)",
        "inner-glow": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        "elite": "0 0 40px rgba(139, 92, 246, 0.3)",
        "success-glow": "0 0 30px rgba(16, 185, 129, 0.25)",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}

