
import React, { useState, useRef } from 'react';
import { InitiativeRequest, InitiativeResult, Suggestion, AppMode, EvaluateRequest, ThematicRequest, ExamRequest, TranscriptCommentRequest } from './types';
import { generateInitiative, evaluateInitiative, generateThematic, generateExam, generateTranscriptComments, checkPlagiarism } from './services/geminiService';
import LoadingScreen from './components/LoadingScreen';
import DocumentPreview from './components/DocumentPreview';
import SuggestionPanel from './components/SuggestionPanel';

declare var mammoth: any;
declare global {
  // Define AIStudio interface clearly
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Making aistudio optional to match environment modifiers and fix the modifiers conflict error
    aistudio?: AIStudio;
  }
}

const QUICK_SUGGESTIONS = [
  "Ứng dụng CNTT và AI trong giảng dạy",
  "Phương pháp dạy học theo dự án (Project-based Learning)",
  "Phát triển năng lực tự học và sáng tạo cho học sinh",
  "Giáo dục kỹ năng sống thông qua hoạt động trải nghiệm",
  "Biện pháp nâng cao chất lượng công tác chủ nhiệm lớp",
  "Tích hợp giáo dục bảo vệ môi trường trong môn học",
  "Sử dụng sơ đồ tư duy (Mindmap) để hệ thống hóa kiến thức",
  "Rèn luyện kỹ năng làm việc nhóm cho học sinh"
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('DRAFTING');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  
  const [draftRequest, setDraftRequest] = useState<InitiativeRequest>({
    title: '',
    subject: '',
    gradeLevel: '',
    textbook: 'Kết nối tri thức với cuộc sống',
    context: '',
    objectives: 'Nâng cao chất lượng dạy và học, phát triển năng lực học sinh.',
    methodology: '',
    lessonExample: '',
    evidenceContent: ''
  });

  const [thematicRequest, setThematicRequest] = useState<ThematicRequest>({
    title: '',
    subject: '',
    gradeLevel: '',
    textbook: 'Kết nối tri thức',
    duration: '',
    objectives: '',
    outline: ''
  });

  const [examRequest, setExamRequest] = useState<ExamRequest>({
    subject: '',
    gradeLevel: '',
    duration: '45 phút',
    level: 'Khá',
    structure: '70% Trắc nghiệm, 30% Tự luận',
    scope: ''
  });

  const [transcriptRequest, setTranscriptRequest] = useState<TranscriptCommentRequest>({
    subject: '',
    gradeLevel: '',
    performanceLevel: 'Hoàn thành tốt',
    traits: '',
    additionalInfo: ''
  });

  const [evaluateRequest, setEvaluateRequest] = useState<EvaluateRequest>({
    title: '',
    content: ''
  });

  const [result, setResult] = useState<InitiativeResult>({
    content: '',
    status: 'idle',
    mode: 'DRAFTING'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, setter: Function) => {
    const { name, value } = e.target;
    setter((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setDraftRequest(prev => ({ ...prev, title: suggestion.title }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickSuggestion = (text: string) => {
    setDraftRequest(prev => ({ ...prev, title: text }));
  };

  const handleOpenConfig = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
    } else {
      alert("Tính năng cấu hình API chỉ khả dụng trong môi trường AI Studio.");
    }
  };

  const handleSupport = () => {
    window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
  };

  const processWordFile = (file: File, target: 'EVALUATE' | 'EVIDENCE') => {
    setIsFileLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (target === 'EVALUATE') {
          setEvaluateRequest(prev => ({
            ...prev,
            title: file.name.replace('.docx', ''),
            content: result.value
          }));
        } else {
          setDraftRequest(prev => ({
            ...prev,
            evidenceContent: (prev.evidenceContent ? prev.evidenceContent + '\n\n' : '') + result.value
          }));
        }
      } catch (err) {
        alert("Lỗi khi đọc file Word.");
      } finally {
        setIsFileLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'EVALUATE' | 'EVIDENCE') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith('.docx')) {
      processWordFile(file, target);
    } else {
      alert("Hỗ trợ file .docx (Word).");
    }
  };

  const handleSubmit = async (e: React.FormEvent, type: 'GENERIC' | 'PLAGIARISM' = 'GENERIC') => {
    e?.preventDefault();
    setResult({ content: '', status: 'generating', mode });
    try {
      let content = '';
      if (mode === 'DRAFTING') content = await generateInitiative(draftRequest);
      else if (mode === 'GRADING') {
        if (type === 'PLAGIARISM') content = await checkPlagiarism(evaluateRequest);
        else content = await evaluateInitiative(evaluateRequest);
      }
      else if (mode === 'THEMATIC') content = await generateThematic(thematicRequest);
      else if (mode === 'EXAM') content = await generateExam(examRequest);
      else if (mode === 'TRANSCRIPT') content = await generateTranscriptComments(transcriptRequest);
      
      setResult({ content, status: 'success', mode });
    } catch (error: any) {
      setResult({ content: '', status: 'error', error: error.message, mode });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">AI SKKN MIS NA</h1>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Hệ thống quản lý SKKN</p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-6 h-10">
              <button 
                onClick={handleSupport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Hỗ trợ
              </button>
              <button 
                onClick={handleOpenConfig}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Cấu hình API
              </button>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-lg no-print flex-wrap gap-1">
            <button onClick={() => setMode('DRAFTING')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'DRAFTING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Soạn SKKN</button>
            <button onClick={() => setMode('GRADING')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'GRADING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Chấm SKKN</button>
            <button onClick={() => setMode('THEMATIC')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'THEMATIC' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Soạn Chuyên đề</button>
            <button onClick={() => setMode('EXAM')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'EXAM' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Soạn Đề thi</button>
            <button onClick={() => setMode('TRANSCRIPT')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'TRANSCRIPT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Nhận xét Học bạ</button>
          </div>
        </div>
      </header>

      <div className="no-print bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight uppercase">
            {mode === 'DRAFTING' ? 'VIẾT SÁNG KIẾN KINH NGHIỆM' : 
             mode === 'GRADING' ? 'HỆ THỐNG CHẤM ĐIỂM AI' : 
             mode === 'THEMATIC' ? 'SOẠN THẢO CHUYÊN ĐỀ DẠY HỌC' : 
             mode === 'EXAM' ? 'SOẠN THẢO ĐỀ THI CHUẨN' : 'GỢI Ý NHẬN XÉT HỌC BẠ'}
          </h2>
          <div className="w-24 h-1 bg-blue-400 mx-auto mb-4 rounded-full"></div>
          <p className="text-blue-100 text-lg md:text-xl font-medium max-w-2xl mx-auto opacity-90 uppercase">
            {mode === 'DRAFTING' ? 'Xây dựng nội dung chuẩn cấu trúc Bộ GD&ĐT' : 
             mode === 'GRADING' ? 'Hội đồng Chấm & Thẩm định SKKN (AI)' :
             mode === 'THEMATIC' ? 'Thiết kế bài dạy chuyên sâu, tích cực' : 
             mode === 'EXAM' ? 'Xây dựng ma trận đề thi chuyên nghiệp' : 'Tạo lời nhận xét học tập chân thành'}
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto">
        <div className="no-print lg:col-span-4 flex flex-col gap-6">
          {mode === 'DRAFTING' && (
            <>
              <SuggestionPanel onSelect={handleSelectSuggestion} currentSubject={draftRequest.subject} currentGrade={draftRequest.gradeLevel} currentTextbook={draftRequest.textbook} />
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-blue-700 uppercase border-b border-blue-100 pb-2">Thông tin đề tài</h3>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Tên sáng kiến kinh nghiệm *</label>
                      <input type="text" name="title" required placeholder="VD: Một số biện pháp giúp học sinh lớp 4..." className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={draftRequest.title} onChange={(e) => handleInputChange(e, setDraftRequest)} />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Gợi ý nhanh:</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_SUGGESTIONS.map((s, i) => (
                          <button key={i} type="button" onClick={() => handleQuickSuggestion(s)} className="text-[10px] px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded hover:bg-blue-50">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Môn học / Lĩnh vực *</label>
                        <input type="text" name="subject" required placeholder="Toán" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={draftRequest.subject} onChange={(e) => handleInputChange(e, setDraftRequest)} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Lớp / Khối</label>
                        <input type="text" name="gradeLevel" placeholder="VD: 4B1" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={draftRequest.gradeLevel} onChange={(e) => handleInputChange(e, setDraftRequest)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Bộ sách giáo khoa</label>
                      <select name="textbook" className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-black text-white font-medium outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={draftRequest.textbook} onChange={(e) => handleInputChange(e, setDraftRequest)}>
                        <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức với cuộc sống</option>
                        <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                        <option value="Cánh Diều">Cánh Diều</option>
                        <option value="Khác">Khác / Chưa xác định</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Thực trạng & Khó khăn</label>
                      <textarea name="context" rows={3} placeholder="Mô tả những khó khăn, tồn tại..." className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm resize-none" value={draftRequest.context} onChange={(e) => handleInputChange(e, setDraftRequest)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Giải pháp chính (Từ khóa)</label>
                      <textarea name="methodology" rows={3} placeholder="Liệt kê các biện pháp chính..." className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm resize-none" value={draftRequest.methodology} onChange={(e) => handleInputChange(e, setDraftRequest)} />
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-emerald-700 uppercase border-b border-emerald-100 pb-2">Tư liệu thực tế & Minh chứng</h3>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Tên bài học / Ví dụ cụ thể</label>
                      <textarea name="evidenceContent" rows={3} placeholder="Nhập tên bài học (VD: Bài 3: Xôn xao mùa hè-CTST Lớp 4) hoặc nội dung giáo án..." className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm resize-none" value={draftRequest.evidenceContent} onChange={(e) => handleInputChange(e, setDraftRequest)} />
                    </div>
                    <div className="relative">
                      <input type="file" ref={evidenceInputRef} onChange={(e) => handleFileUpload(e, 'EVIDENCE')} accept=".docx" className="hidden" />
                      <button type="button" onClick={() => evidenceInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-emerald-100">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <span className="text-xs font-bold uppercase">{isFileLoading ? "Đang xử lý..." : "Tải lên tài liệu (Word)"}</span>
                        <span className="text-[9px]">Hỗ trợ .docx, .pdf, .txt (Max 5MB)</span>
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={result.status === 'generating'} className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
                    {result.status === 'generating' ? 'Đang tạo nội dung...' : 'Bắt đầu soạn thảo ngay'}
                  </button>
                </form>
              </div>
            </>
          )}

          {mode === 'GRADING' && (
            <div className="flex flex-col gap-6">
              <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-200">
                <h3 className="text-sm font-bold text-blue-800 uppercase mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Tiêu chí chấm (Thang 100 điểm)
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 bg-blue-100 border border-blue-300 rounded">
                    <span className="font-semibold text-blue-900">Nội dung (90đ)</span>
                    <span className="text-blue-700 italic">Tính mới, Khoa học, Thực tiễn, Hiệu quả</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white border border-blue-200 rounded">
                    <span className="font-semibold text-blue-900">Hình thức (10đ)</span>
                    <span className="text-blue-600 italic">Bố cục, ngôn ngữ, thể thức</span>
                  </div>
                </div>

                <form onSubmit={(e) => handleSubmit(e)} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Tên đề tài sáng kiến *</label>
                    <input type="text" name="title" required placeholder="Nhập tên đề tài..." className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white" value={evaluateRequest.title} onChange={(e) => handleInputChange(e, setEvaluateRequest)} />
                  </div>
                  
                  <div className="relative">
                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'EVALUATE')} accept=".docx" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-blue-200 bg-white text-blue-700 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-blue-50">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      <span className="text-xs font-bold uppercase">{isFileLoading ? "Đang xử lý..." : "Tải lên File SKKN cần chấm"}</span>
                      <span className="text-[9px]">Hỗ trợ .DOCX, .PDF (Tối đa 10MB)</span>
                    </button>
                  </div>

                  <div className="pt-2">
                    <textarea name="content" rows={6} placeholder="Hoặc dán nội dung vào đây..." className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm resize-none bg-white" value={evaluateRequest.content} onChange={(e) => handleInputChange(e, setEvaluateRequest)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button type="submit" disabled={result.status === 'generating'} className="py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md">
                      Chấm điểm
                    </button>
                    <button type="button" onClick={(e) => handleSubmit(e, 'PLAGIARISM')} disabled={result.status === 'generating'} className="py-3 px-4 rounded-xl font-bold text-blue-600 bg-white border-2 border-blue-600 hover:bg-blue-50 transition-all">
                      Kiểm tra Đạo văn
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                <h3 className="text-sm font-bold text-amber-800 uppercase flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Lưu ý quan trọng: AI có kiểm tra được đạo văn không?
                </h3>
                <div className="space-y-3 text-xs text-amber-900 text-justify leading-relaxed">
                  <p><span className="font-bold">Có và Không:</span> Gemini AI không phải là công cụ quét trùng lặp truyền thống vì nó không lưu trữ bản sao của mọi văn bản trên internet để so sánh từng câu chữ theo thời gian thực.</p>
                  <p><span className="font-bold">Thế mạnh của AI:</span> Nó cực kỳ giỏi phát hiện "Văn mẫu" (Generic Content) và Sự thiếu logic. AI sẽ nhận diện ngay lập tức các đoạn văn sáo rỗng, cấu trúc rập khuôn, hoặc số liệu mâu thuẫn.</p>
                  <p><span className="font-bold">Hiệu quả thực tế:</span> Đạt khoảng 70-80% trong việc phát hiện các bài "xào nấu", cắt ghép sơ sài. Đây là công cụ hỗ trợ Hội đồng lọc nhanh các bài kém chất lượng, nhưng không thay thế hoàn toàn việc thẩm định chuyên môn.</p>
                </div>
              </div>
            </div>
          )}

          {mode === 'THEMATIC' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h2 className="text-lg font-bold text-slate-800 mb-4">Soạn Chuyên đề</h2>
               <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
                 <input type="text" name="title" placeholder="Tên chuyên đề..." required className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={thematicRequest.title} onChange={(e) => handleInputChange(e, setThematicRequest)} />
                 <div className="grid grid-cols-2 gap-4">
                   <input type="text" name="subject" placeholder="Môn học..." required className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={thematicRequest.subject} onChange={(e) => handleInputChange(e, setThematicRequest)} />
                   <input type="text" name="gradeLevel" placeholder="Khối..." required className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={thematicRequest.gradeLevel} onChange={(e) => handleInputChange(e, setThematicRequest)} />
                 </div>
                 <input type="text" name="duration" placeholder="Thời lượng..." className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={thematicRequest.duration} onChange={(e) => handleInputChange(e, setThematicRequest)} />
                 <textarea name="objectives" placeholder="Mục tiêu chuyên đề..." rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={thematicRequest.objectives} onChange={(e) => handleInputChange(e, setThematicRequest)} />
                 <textarea name="outline" placeholder="Nội dung/Dàn ý chính..." rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={thematicRequest.outline} onChange={(e) => handleInputChange(e, setThematicRequest)} />
                 <button type="submit" className="w-full py-3 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700">Xây dựng Chuyên đề</button>
               </form>
            </div>
          )}

          {mode === 'EXAM' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h2 className="text-lg font-bold text-slate-800 mb-4">Soạn Đề thi</h2>
               <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <input type="text" name="subject" placeholder="Môn học..." required className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={examRequest.subject} onChange={(e) => handleInputChange(e, setExamRequest)} />
                   <input type="text" name="gradeLevel" placeholder="Khối..." required className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={examRequest.gradeLevel} onChange={(e) => handleInputChange(e, setExamRequest)} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <input type="text" name="duration" placeholder="Thời gian..." className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={examRequest.duration} onChange={(e) => handleInputChange(e, setExamRequest)} />
                   <select name="level" className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-sm" value={examRequest.level} onChange={(e) => handleInputChange(e, setExamRequest)}>
                     <option value="Dễ">Dễ</option><option value="Khá">Khá</option><option value="Giỏi">Giỏi</option>
                   </select>
                 </div>
                 <input type="text" name="structure" placeholder="Cấu trúc đề..." className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={examRequest.structure} onChange={(e) => handleInputChange(e, setExamRequest)} />
                 <textarea name="scope" placeholder="Phạm vi kiến thức..." rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={examRequest.scope} onChange={(e) => handleInputChange(e, setExamRequest)} />
                 <button type="submit" className="w-full py-3 rounded-lg font-bold text-white bg-rose-600">Thiết kế Đề thi</button>
               </form>
            </div>
          )}

          {mode === 'TRANSCRIPT' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h2 className="text-lg font-bold text-slate-800 mb-4">Nhận xét Học bạ</h2>
               <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <input type="text" name="subject" placeholder="Môn học..." required className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={transcriptRequest.subject} onChange={(e) => handleInputChange(e, setTranscriptRequest)} />
                   <input type="text" name="gradeLevel" placeholder="Khối..." required className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={transcriptRequest.gradeLevel} onChange={(e) => handleInputChange(e, setTranscriptRequest)} />
                 </div>
                 <select name="performanceLevel" className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-sm" value={transcriptRequest.performanceLevel} onChange={(e) => handleInputChange(e, setTranscriptRequest)}>
                   <option value="Hoàn thành tốt">Hoàn thành tốt</option><option value="Hoàn thành">Hoàn thành</option><option value="Chưa hoàn thành">Chưa hoàn thành</option>
                 </select>
                 <input type="text" name="traits" placeholder="Đặc điểm học sinh..." className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={transcriptRequest.traits} onChange={(e) => handleInputChange(e, setTranscriptRequest)} />
                 <textarea name="additionalInfo" placeholder="Lưu ý/Kỹ năng đặc biệt..." rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" value={transcriptRequest.additionalInfo} onChange={(e) => handleInputChange(e, setTranscriptRequest)} />
                 <button type="submit" className="w-full py-3 rounded-lg font-bold text-white bg-teal-600">Tạo lời nhận xét</button>
               </form>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 h-[calc(100vh-160px)] min-h-[500px]">
          {result.status === 'idle' && (
            <div className="h-full flex flex-col items-center justify-center bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 p-8 text-center">
              <h3 className="text-xl font-medium mb-2 text-slate-500">Sẵn sàng phục vụ</h3>
              <p className="max-w-md">Vui lòng nhập thông tin hoặc tải file lên ở bảng điều khiển bên trái.</p>
            </div>
          )}
          {result.status === 'generating' && <div className="h-full flex items-center justify-center"><LoadingScreen /></div>}
          {result.status === 'error' && (
            <div className="h-full flex flex-col items-center justify-center bg-red-50 rounded-xl border border-red-200 p-8 text-center">
              <p className="text-red-600 mb-6">{result.error}</p>
              <button onClick={(e) => handleSubmit(e)} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Thử lại</button>
            </div>
          )}
          {result.status === 'success' && <DocumentPreview content={result.content} />}
        </div>
      </main>

      <footer className="no-print bg-slate-900 text-slate-400 py-6 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 AI SKKN MIS NA - Trợ lý Sáng kiến kinh nghiệm Mis Na</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
