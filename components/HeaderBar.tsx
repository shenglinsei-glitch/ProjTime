import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderBarProps {
  onRefresh?: () => void;
  hasFab?: boolean;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ onRefresh, hasFab = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { 
      label: 'プロジェクト', 
      path: '/', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      )
    },
    { 
      label: 'カレンダー', 
      path: '/calendar', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      label: '統計', 
      path: '/stats', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      label: '設定', 
      path: '/settings', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 shrink-0">
          <h1 
            className="text-xl font-black text-blue-600 cursor-pointer flex items-center tracking-tighter" 
            onClick={() => navigate('/')}
          >
            <span>TimePredictor</span>
          </h1>
        </div>
        <div className="flex items-center shrink-0">
          {onRefresh && (
            <button 
              onClick={onRefresh} 
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all" 
              title="再予測"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </header>

      <nav 
        style={{ WebkitBackdropFilter: 'blur(20px)' }}
        className={`fixed bottom-6 z-50 bg-white/50 backdrop-blur-[20px] border border-white/60 flex justify-around items-center px-1 shadow-[0_8px_32px_rgba(0,0,0,0.06)] h-14 rounded-2xl sm:h-16 transition-all duration-300 ${
          hasFab 
            ? 'left-4 right-24 max-w-[calc(100%-7rem)]' 
            : 'left-4 right-4 max-w-lg mx-auto'
        }`}
      >
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 rounded-xl mx-0.5 ${
                isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label={item.label}
              title={item.label}
            >
              <div className={`flex items-center justify-center transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>
                {item.icon}
              </div>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default HeaderBar;