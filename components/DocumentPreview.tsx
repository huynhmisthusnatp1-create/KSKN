
import React from 'react';

interface Props {
  content: string;
}

const DocumentPreview: React.FC<Props> = ({ content }) => {
  // Simple markdown-ish to HTML converter for better preview
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold text-slate-900 mb-6 mt-8 uppercase text-center border-b pb-4">{line.replace('# ', '')}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-slate-800 mb-4 mt-6 uppercase">{line.replace('## ', '')}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold text-slate-700 mb-3 mt-4">{line.replace('### ', '')}</h3>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-6 list-disc mb-1">{line.substring(2)}</li>;
        if (line.match(/^\d+\./)) return <li key={i} className="ml-6 list-decimal mb-1">{line.replace(/^\d+\.\s+/, '')}</li>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="mb-3 text-justify leading-relaxed">{line}</p>;
      });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert("Đã sao chép nội dung vào bộ nhớ tạm!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="no-print bg-slate-50 border-b p-4 flex justify-between items-center">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Bản thảo sáng kiến
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={handleCopy}
            className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md hover:bg-slate-100 flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Sao chép
          </button>
          <button 
            onClick={handlePrint}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            In / Xuất PDF
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 md:p-12" id="printable-content">
        <div className="max-w-3xl mx-auto text-slate-800">
          {formatContent(content)}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
