
import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBar from '../components/HeaderBar';

const SettingsMenuPage: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'タスク名称管理',
      desc: '標準的なタスク名の登録・編集',
      path: '/settings/tasks',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      title: '部位管理',
      desc: '作業部位と難易度倍率の設定',
      path: '/settings/parts',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      title: '工法管理',
      desc: 'プロジェクト全体の工法タグ',
      path: '/settings/methods',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    {
      title: 'その他共通設定',
      desc: '稼働時間、例外、データ管理',
      path: '/settings/general',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      )
    },
  ];

  return (
    <div className="pb-24 text-gray-800">
      <HeaderBar />
      <main className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">設定</h2>
          <p className="text-gray-400 text-sm mt-1 font-medium">アプリケーションの動作環境をカスタマイズします</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-5 p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group active:scale-[0.98]"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 shadow-inner">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-gray-800 text-lg leading-tight">{item.title}</h3>
                <p className="text-gray-400 text-xs mt-1 font-medium">{item.desc}</p>
              </div>
              <div className="text-gray-300 group-hover:text-blue-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SettingsMenuPage;
