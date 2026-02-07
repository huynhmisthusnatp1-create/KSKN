
import React, { useState, useEffect } from 'react';

const messages = [
  "Đang nghiên cứu cơ sở lý luận...",
  "Đang phân tích thực trạng giáo dục...",
  "Đang xây dựng các giải pháp sư phạm...",
  "Đang tổng hợp kết quả thực nghiệm...",
  "Đang định dạng văn bản chuẩn quy định...",
  "Đang hoàn thiện các ví dụ minh họa..."
];

const LoadingScreen: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 border-t-4 border-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">Đang soạn thảo sáng kiến</h3>
      <p className="text-slate-500 italic animate-fade-in">{messages[msgIndex]}</p>
    </div>
  );
};

export default LoadingScreen;
