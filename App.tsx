import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import CreateQuizPage from './components/CreateQuizPage';
import TakeQuizPage from './components/TakeQuizPage';
import ResultsPage from './components/ResultsPage';
import LeaderboardPage from './components/LeaderboardPage';
import { GRADIENT_BG, GRADIENT_TEXT, ICONS } from './constants';

// --- Theme Context ---
type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};
const ThemeContext = createContext<ThemeContextType | null>(null);
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

// --- Toast Context ---
type ToastContextType = {
  showToast: (message: string) => void;
};
const ToastContext = createContext<ToastContextType | null>(null);
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

// --- Navbar Component ---
const Navbar: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="sticky top-0 z-50 bg-white/30 dark:bg-slate-900/50 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className={`text-2xl font-bold ${GRADIENT_TEXT}`}>
                        QuizFlare
                    </Link>
                     <div className="flex items-center space-x-1 sm:space-x-4">
                        <Link to="/leaderboard" className="flex items-center p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 sm:bg-transparent sm:dark:bg-transparent sm:p-0 sm:hover:bg-transparent sm:dark:hover:bg-transparent transition-colors">
                            <ICONS.leaderboard className="text-xl sm:mr-2" />
                            <span className="hidden sm:inline font-medium text-sm sm:text-base">Leaderboard</span>
                        </Link>
                        <Link to="/create" className={`flex items-center justify-center font-semibold text-white rounded-lg shadow-lg ${GRADIENT_BG} hover:opacity-90 transition-opacity p-2.5 sm:px-4 sm:py-2`}>
                            <span className="sm:hidden">{ICONS.plus}</span>
                            <span className="hidden sm:inline text-sm sm:text-base">Make a New Quiz</span>
                        </Link>
                        <button onClick={toggleTheme} className="p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            {theme === 'light' ? ICONS.moon : ICONS.sun}
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
};

// --- Main App Component ---
const App: React.FC = () => {
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('quizflare_theme') as Theme) || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.background = '#0f172a'; // slate-900
    } else {
      root.classList.remove('dark');
      root.style.background = 'linear-gradient(90deg, #e3ffe7 0%, #d9e7ff 100%)';
    }
    localStorage.setItem('quizflare_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  const showToast = useCallback((message: string) => {
    setToast({ message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <HashRouter>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <ToastContext.Provider value={{ showToast }}>
          <div className="min-h-screen text-slate-900 dark:text-slate-100">
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create" element={<CreateQuizPage />} />
                <Route path="/edit/:id" element={<CreateQuizPage />} />
                <Route path="/quiz/:id" element={<TakeQuizPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
              </Routes>
            </main>
          </div>
          {toast && (
            <div className="fixed bottom-5 right-5 bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 py-2 px-4 rounded-lg shadow-xl animate-bounce-short">
              {toast.message}
            </div>
          )}
        </ToastContext.Provider>
      </ThemeContext.Provider>
    </HashRouter>
  );
};

export default App;