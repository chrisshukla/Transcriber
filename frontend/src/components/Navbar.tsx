import React, { useEffect, useState } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-border/60 transition-colors duration-250">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Brand Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 glow-primary">
            <Sparkles className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight gradient-heading m-0 p-0 leading-none">
              Transcriber AI
            </h1>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              Whisper Large-v3 Powered
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 select-none">
          {/* Light/Dark mode switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center p-2.5 rounded-2xl border border-border/80 bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Toggle Theme Mode"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};

