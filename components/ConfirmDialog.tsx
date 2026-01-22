import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, 
  confirmText = '実行', cancelText = 'キャンセル',
  isDestructive = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}></div>
      
      {/* 对话框主体 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 overflow-hidden">
        <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-600 mb-8 text-sm leading-relaxed">{message}</p>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 px-4 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onCancel(); }} 
            className={`flex-1 px-4 py-3 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${
              isDestructive ? 'bg-[#F7893F] shadow-[#F7893F]/20' : 'bg-[#53BEE8] shadow-blue-100'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;