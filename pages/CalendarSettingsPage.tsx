
import React, { useState, useRef } from 'react';
import { useApp } from '../store/AppContext';
import HeaderBar from '../components/HeaderBar';
import TimePickerDialog from '../components/TimePickerDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatMinutes } from '../utils/time';
import { CalendarOverrideType } from '../types';

const CalendarSettingsPage: React.FC = () => {
  const { 
    settings, overrides, methodTags, saveSettings, 
    addOverride, deleteOverride, addMethodTag, 
    updateMethodTag, deleteMethodTag, projects,
    exportAllData, importAllData, refreshHolidays 
  } = useApp();
  
  const [showStandardPicker, setShowStandardPicker] = useState(false);
  const [isRefreshingHolidays, setIsRefreshingHolidays] = useState(false);
  
  // 确认弹窗状态
  const [confirmImportData, setConfirmImportData] = useState<any>(null);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const [ovDate, setOvDate] = useState(new Date().toISOString().split('T')[0]);
  const [ovMin, setOvMin] = useState(0);
  const [ovType, setOvType] = useState<CalendarOverrideType>(CalendarOverrideType.HOLIDAY);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRefreshHolidays = async () => {
    setIsRefreshingHolidays(true);
    await refreshHolidays(true);
    setIsRefreshingHolidays(false);
  };

  const handleAddOverride = async () => {
    await addOverride({
      id: crypto.randomUUID(),
      date: ovDate,
      availableMin: ovMin,
      type: ovType
    });
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    await addMethodTag({ id: crypto.randomUUID(), name: newTagName.trim() });
    setNewTagName('');
  };

  const handleUpdateTag = async () => {
    if (!editingTagId || !editingTagName.trim()) return;
    await updateMethodTag({ id: editingTagId, name: editingTagName.trim() });
    setEditingTagId(null);
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `time-predictor-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) return;
        const json = JSON.parse(content);
        setConfirmImportData(json);
      } catch (err) {
        console.error(err);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const holidayLastUpdated = settings.holidayCache?.lastUpdated 
    ? new Date(settings.holidayCache.lastUpdated).toLocaleString('ja-JP') 
    : '未取得';
    
  const holidayYearsRange = settings.holidayCache?.years && settings.holidayCache.years.length > 0
    ? `${Math.min(...settings.holidayCache.years)}年 〜 ${Math.max(...settings.holidayCache.years)}年`
    : 'なし';

  return (
    <div className="pb-24 text-gray-800">
      <HeaderBar />
      <main className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold">設定</h2>
        
        {/* 基本规则 */}
        <section className="bg-white rounded-xl border p-6 space-y-6 shadow-sm">
          <h3 className="font-bold text-gray-800 border-b pb-2">基本ルール</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">1日の標準稼働時間</div>
              <div className="text-xs text-gray-500">工期予測の換算基準となります</div>
            </div>
            <button onClick={() => setShowStandardPicker(true)} className="text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-lg">{formatMinutes(settings.standardDailyMin, settings.standardDailyMin)}</button>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">日本の祝日を自動反映</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                  更新: {holidayLastUpdated} | 範囲: {holidayYearsRange}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRefreshHolidays} disabled={isRefreshingHolidays} className="text-xs font-bold text-[#53BEE8] hover:underline disabled:opacity-50">
                  {isRefreshingHolidays ? '更新中...' : '今すぐ更新'}
                </button>
                <input type="checkbox" checked={settings.useJapanHolidays} onChange={e => saveSettings({ ...settings, useJapanHolidays: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-[#53BEE8] focus:ring-[#53BEE8]" />
              </div>
            </div>
          </div>
        </section>

        {/* 数据管理 */}
        <section className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 border-b pb-4 mb-4">データ管理</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 py-3 rounded-xl font-bold transition hover:bg-gray-100">エクスポート</button>
            <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 py-3 rounded-xl font-bold transition hover:bg-blue-100">インポート</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,application/json" style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} />
          </div>
        </section>

        {/* 工法库管理 */}
        <section className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 border-b pb-4 mb-4">工法ライブラリ</h3>
          <div className="flex gap-2 mb-6">
            <input className="flex-1 border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#53BEE8]/20" value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="新しい工法タグを入力" onKeyPress={e => e.key === 'Enter' && handleAddTag()} />
            <button onClick={handleAddTag} className="bg-[#53BEE8] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition hover:opacity-90">追加</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {methodTags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between p-2.5 border rounded-xl hover:bg-gray-50 transition group">
                {editingTagId === tag.id ? (
                  <div className="flex flex-1 gap-2">
                    <input className="flex-1 border rounded-lg px-2 py-1 text-sm outline-none" value={editingTagName} onChange={e => setEditingTagName(e.target.value)} autoFocus onKeyPress={e => e.key === 'Enter' && handleUpdateTag()} />
                    <button onClick={handleUpdateTag} className="text-[#53BEE8] font-bold px-2">保存</button>
                    <button onClick={() => setEditingTagId(null)} className="text-gray-500 px-2">×</button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-medium">{tag.name}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => { setEditingTagId(tag.id); setEditingTagName(tag.name); }} className="text-gray-400 text-xs hover:text-blue-600">編集</button>
                      <button onClick={() => setTagToDelete(tag.id)} className="text-red-400 text-xs hover:text-red-600">削除</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 例外设定 */}
        <section className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 border-b pb-4 mb-4">カレンダー例外設定</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">日付</label>
              <input type="date" value={ovDate} onChange={e => setOvDate(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">稼働時間(分)</label>
              <input type="number" value={ovMin} onChange={e => setOvMin(parseInt(e.target.value) || 0)} className="w-full border rounded-lg p-2 text-sm outline-none bg-white" />
            </div>
            <div className="md:col-span-2">
              <button onClick={handleAddOverride} className="w-full bg-[#53BEE8] text-white py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 hover:opacity-90 transition">例外ルールを追加</button>
            </div>
          </div>
          <div className="divide-y max-h-[300px] overflow-y-auto">
            {overrides.sort((a,b) => b.date.localeCompare(a.date)).map(ov => (
              <div key={ov.id} className="py-3 flex justify-between items-center px-2 hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-700">{ov.date}</span>
                  <span className="text-xs text-gray-500">稼働: {formatMinutes(ov.availableMin, settings.standardDailyMin)}</span>
                </div>
                <button onClick={() => deleteOverride(ov.id)} className="text-red-400 text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition">削除</button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 弹窗 */}
      <TimePickerDialog isOpen={showStandardPicker} initialMinutes={settings.standardDailyMin} onClose={() => setShowStandardPicker(false)} onSave={mins => saveSettings({ ...settings, standardDailyMin: mins })} />
      
      <ConfirmDialog 
        isOpen={!!confirmImportData}
        title="データのインポート"
        message="現在のすべてのデータが上書きされます。よろしいですか？"
        confirmText="上書きインポート"
        onConfirm={() => importAllData(confirmImportData)}
        onCancel={() => setConfirmImportData(null)}
        isDestructive
      />

      <ConfirmDialog 
        isOpen={!!tagToDelete}
        title="タグの削除"
        message="この工法タグをライブラリから削除しますか？"
        confirmText="削除"
        onConfirm={() => tagToDelete && deleteMethodTag(tagToDelete)}
        onCancel={() => setTagToDelete(null)}
        isDestructive
      />
    </div>
  );
};

export default CalendarSettingsPage;
