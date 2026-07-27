import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

export const AppLayout: React.FC = () => {
  React.useEffect(() => {
    const el = document.querySelector('.app-body-grid');
    if (el) {
      console.log('GRID_EL_STYLES: ' + JSON.stringify({
        display: window.getComputedStyle(el).display,
        gridTemplateColumns: window.getComputedStyle(el).gridTemplateColumns,
        width: window.getComputedStyle(el).width,
      }));
      const aside = el.querySelector('aside');
      if (aside) {
        console.log('ASIDE_STYLES: ' + JSON.stringify({
          display: window.getComputedStyle(aside).display,
          position: window.getComputedStyle(aside).position,
          width: window.getComputedStyle(aside).width,
        }));
      }
      const main = el.querySelector('main');
      if (main) {
        console.log('MAIN_STYLES: ' + JSON.stringify({
          display: window.getComputedStyle(main).display,
          position: window.getComputedStyle(main).position,
          width: window.getComputedStyle(main).width,
        }));
      }
    } else {
      console.log('GRID_EL_NOT_FOUND');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-250">
      {/* Header Navbar */}
      <Navbar />

      {/* Main Body Wrapper using robust CSS Grid to guarantee no overlaps */}
      <div className="flex-1 app-body-grid overflow-hidden w-full">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Nested Content Area with breathing space */}
        <main className="min-w-0 overflow-y-auto px-8 py-10 md:px-12 md:py-12 w-full">
          <div className="w-full max-w-6xl mx-auto space-y-10 animate-in fade-in duration-250">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
