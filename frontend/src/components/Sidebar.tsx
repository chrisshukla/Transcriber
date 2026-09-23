import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Database } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/upload',
      label: 'Upload File',
      icon: UploadCloud,
    },
    {
      to: '/jobs',
      label: 'Transcription Jobs',
      icon: Database,
    },
  ];

  return (
    <aside className="w-64 border-r border-border/60 glass flex-shrink-0 hidden md:flex flex-col justify-between py-6 px-4 select-none">
      <div className="flex flex-col gap-6">
        {/* Navigation Section */}
        <div className="flex flex-col gap-1.5">
          <span className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
            Main Menu
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer Info inside Sidebar */}
      <div className="px-3">
        <div className="p-3.5 bg-card/60 border border-border/60 rounded-2xl shadow-sm">
          <p className="text-[11px] font-extrabold text-muted-foreground leading-normal flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            Engine: <span className="text-emerald-400">Sequential</span>
          </p>
          <p className="text-[10px] font-bold text-muted-foreground/70 leading-normal mt-1 uppercase tracking-wider">
            Whisper Large-v3 (1.55B)
          </p>
        </div>
      </div>
    </aside>
  );
};

