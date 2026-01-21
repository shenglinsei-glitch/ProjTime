
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import HeaderBar from '../../components/HeaderBar';
import TimePickerDialog from '../../components/TimePickerDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatMinutes } from '../../utils/time';
import { CalendarOverrideType } from '../../types';

const GeneralSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    settings, overrides, saveSettings, addOverride, deleteOverride, 
    exportAllData, importAllData, refreshHolidays 
  } = useApp();
  
  const [showStandardPicker, setShowStandardPicker] = useState(false);
  const [isRefreshingHolidays, setIsRefreshingHolidays] = useState(false);
  const [confirmImportData, setConfirmImportData] = useState<any>(null);

  // Override Form State
  const [ovDate, setOvDate] = useState(new Date().toISOString().split('T')[0]);
  const [ovMin, setOvMin] = useState(0);
  const [ovType, setOvType] = useState<CalendarOverrideType>(CalendarOverrideType.HOLIDAY);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRefreshHolidays = async () => {
    setIsRefreshingHolidays(true);
    await refreshHolidays(true);
    setIsRefreshingHolidays(false);
  };

  const handleAddOverride = async () => {
    await addOverride({ id: crypto.randomUUID(), date: ovDate, availableMin: ovMin, type: ovType });
    setOvMin(0); 
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `time-predictor-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="pb-24 text-gray-800">
      <HeaderBar />
      <main className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate('/settings')} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">その他共通設定</h2>
        </div>
        
        {/* 基本ルール */}
        <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-8">
          <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">基本ルール</h3>
          <div className="flex items-center justify-between py-4 border-b border-gray-50">
            <div>
              <div className="text-sm font-black text-gray-800">1日の標準稼働時間</div>
              <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase">工期予測の換算基準</div>
            </div>
            <button onClick={() => setShowStandardPicker(true)} className="text-blue-500 font-black bg-blue-50 px-5 py-3 rounded-2xl shadow-sm active:scale-95 transition">{formatMinutes(settings.standardDailyMin, settings.standardDailyMin).split(' (')[0]}</button>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-sm font-black text-gray-800">日本の祝日を自動反映</div>
              <div className="text-[9px] text-gray-300 font-black uppercase mt-1">
                最終更新: {settings.holidayCache?.lastUpdated ? new Date(settings.holidayCache.lastUpdated).toLocaleDateString() : '未取得'}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleRefreshHolidays} disabled={isRefreshingHolidays} className="text-[10px] font-black text-blue-400 hover:underline disabled:opacity-50 uppercase tracking-widest">
                {isRefreshingHolidays ? '更新中' : '今すぐ同期'}
              </button>
              <input type="checkbox" checked={settings.useJapanHolidays} onChange={e => saveSettings({ ...settings, useJapanHolidays: e.target.checked })} className="w-6 h-6 rounded-lg border-gray-200 text-blue-500 focus:ring-blue-500" />
            </div>
          </div>
        </section>

        {/* カレンダー例外設定 */}
        <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-6">カレンダー例外設定</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-gray-50 p-6 rounded-3xl">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">日付</label>
              <input type="date" value={ovDate} onChange={e => setOvDate(e.target.value)} className="w-full border-2 border-transparent rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-400 transition bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">種別</label>
              <select value={ovType} onChange={e => setOvType(e.target.value as CalendarOverrideType)} className="w-full border-2 border-transparent rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-400 bg-white">
                <option value={CalendarOverrideType.HOLIDAY}>休日 (0分)</option>
                <option value={CalendarOverrideType.HALF_DAY}>半休 (標準の半分)</option>
                <option value={CalendarOverrideType.OVERTIME}>残業 (標準+α)</option>
                <option value={CalendarOverrideType.WORKDAY_ADJUST}>出勤日調整</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">稼働可能時間 (分)</label>
              <input type="number" value={ovMin} onChange={e => setOvMin(parseInt(e.target.value) || 0)} className="w-full border-2 border-transparent rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-400 bg-white" />
            </div>
            <div className="flex items-end">
              <button onClick={handleAddOverride} className="w-full bg-blue-400 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition">追加する</button>
            </div>
          </div>
          
          <div className="space-y-2">
            {overrides.sort((a,b) => b.date.localeCompare(a.date)).map(ov => (
              <div key={ov.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group border border-transparent hover:border-blue-100 hover:bg-white transition-all">
                <div className="flex items-center gap-6">
                  <span className="text-sm font-black text-gray-700">{ov.date}</span>
                  <span className="px-3 py-1 bg-white border border-gray-100 text-blue-500 text-[9px] font-black rounded-full uppercase tracking-widest">{ov.type}</span>
                  <span className="text-[10px] font-bold text-gray-400">{ov.availableMin}分 稼働可能</span>
                </div>
                <button onClick={() => deleteOverride(ov.id)} className="text-red-400 p-2 opacity-0 group-hover:opacity-100 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            {overrides.length === 0 && <p className="text-center py-10 text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] italic">例外設定はありません</p>}
          </div>
        </section>

        {/* データ管理 */}
        <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-8">データ管理</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={handleExport} className="flex-1 flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-700 border-2 border-gray-50 py-6 rounded-3xl font-black transition hover:border-blue-100 hover:bg-white hover:text-blue-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="text-[10px] uppercase tracking-widest">エクスポート</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center gap-2 bg-blue-50 text-blue-600 border-2 border-blue-50 py-6 rounded-3xl font-black transition hover:border-blue-200 hover:bg-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="text-[10px] uppercase tracking-widest">インポート</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={e => {
              const file = e.target.files?.[0]; if (!file) return;
              const r = new FileReader(); r.onload = (ev) => { try { setConfirmImportData(JSON.parse(ev.target?.result as string)); } catch (err) { console.error(err); } }; r.readAsText(file);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }} accept=".json,application/json" className="hidden" />
          </div>
        </section>
      </main>

      <TimePickerDialog isOpen={showStandardPicker} initialMinutes={settings.standardDailyMin} onClose={() => setShowStandardPicker(false)} onSave={mins => saveSettings({ ...settings, standardDailyMin: mins })} />
      <ConfirmDialog isOpen={!!confirmImportData} title="データのインポート" message="現在のすべてのデータが上書きされます。よろしいですか？" confirmText="上書きインポート" onConfirm={() => importAllData(confirmImportData)} onCancel={() => setConfirmImportData(null)} isDestructive />
    </div>
  );
};

export default GeneralSettingsPage;
