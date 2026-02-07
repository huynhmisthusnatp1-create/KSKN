
import React, { useState } from 'react';
import { Suggestion } from '../types';
import { getInitiativeSuggestions } from '../services/geminiService';

interface Props {
  onSelect: (suggestion: Suggestion) => void;
  currentSubject: string;
  currentGrade: string;
  currentTextbook: string;
}

const SuggestionPanel: React.FC<Props> = ({ onSelect, currentSubject, currentGrade, currentTextbook }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchSuggestions = async () => {
    if (!currentSubject) {
      alert("Vui lòng nhập môn học để lấy gợi ý phù hợp!");
      return;
    }
    setLoading(true);
    setIsOpen(true);
    try {
      const data = await getInitiativeSuggestions(currentSubject, currentGrade, currentTextbook);
      setSuggestions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
      <div className="p-4 border-b border-blue-50 bg-blue-50/50 flex justify-between items-center">
        <h3 className="font-semibold text-blue-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Gợi ý đề tài thông minh
        </h3>
        <button 
          onClick={fetchSuggestions}
          disabled={loading}
          className="text-xs font-bold bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-sm"
        >
          {loading ? 'Đang tìm...' : 'Lấy gợi ý'}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSelect(s)}
                className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="font-medium text-slate-800 group-hover:text-blue-700 text-sm mb-1 leading-snug">{s.title}</div>
                <div className="text-xs text-slate-500 line-clamp-2 italic">{s.description}</div>
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">Nhấn nút "Lấy gợi ý" để xem các đề tài tiêu biểu cho môn {currentSubject || '...'}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SuggestionPanel;
