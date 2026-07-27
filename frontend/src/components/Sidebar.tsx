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
    <aside className="w-64 border-r border-border bg-card/40 flex-shrink-0 hidden md:flex flex-col justify-between py-6 px-4 select-none">
      <div className="flex flex-col gap-6">
        {/* Navigation Section */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Main Menu
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer Info inside Sidebar */}
      <div className="px-3">
        <div className="p-3 bg-muted/30 border border-border/50 rounded-xl">
          <p className="text-[11px] text-muted-foreground leading-normal">
            Status: <span className="font-semibold text-emerald-500">Online</span>
          </p>
          <p className="text-[10px] text-muted-foreground/60 leading-normal mt-0.5">
            API v1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
};
