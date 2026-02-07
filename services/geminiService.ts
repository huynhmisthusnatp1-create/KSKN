
import { GoogleGenAI, Type } from "@google/genai";
import { InitiativeRequest, Suggestion, EvaluateRequest, ThematicRequest, ExamRequest, TranscriptCommentRequest } from "../types";

// Always create a new instance to ensure the latest API key is used
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateInitiative = async (data: InitiativeRequest) => {
  const ai = getAI();
  
  const prompt = `
    Bạn là một chuyên gia tư vấn giáo dục cao cấp tại Việt Nam. 
    Hãy viết một bản "Sáng kiến kinh nghiệm" hoàn chỉnh và chuyên nghiệp dựa trên các thông tin sau:
    - Tên sáng kiến: ${data.title}
    - Môn học: ${data.subject}
    - Khối lớp: ${data.gradeLevel}
    - Bộ sách giáo khoa: ${data.textbook}
    - Thực trạng & Khó khăn: ${data.context}
    - Giải pháp chính: ${data.methodology}
    - Tư liệu/Ví dụ cụ thể: ${data.evidenceContent}

    Yêu cầu cấu trúc bản thảo phải bao gồm các phần sau:
    1. TRANG BÌA (Tên sở, trường, tên sáng kiến, tác giả, năm học 2025-2026)
    2. MỤC LỤC
    3. PHẦN I: ĐẶT VẤN ĐỀ (Lý do chọn đề tài, Mục đích nghiên cứu, Đối tượng, Phạm vi)
    4. PHẦN II: GIẢI QUYẾT VẤN ĐỀ (Cơ sở lý luận dựa trên chương trình GDPT 2018, Thực trạng, Các giải pháp thực hiện chi tiết bám sát giải pháp chính và minh chứng)
    5. PHẦN III: KẾT QUẢ VÀ BÀI HỌC KINH NGHIỆM (Hiệu quả đạt được, Đề xuất kiến nghị)
    6. TÀI LIỆU THAM KHẢO

    Hãy viết bằng văn phong sư phạm, chuẩn mực, giàu tính thực tiễn. Bám sát bộ sách ${data.textbook} và cập nhật xu hướng giáo dục 2026.
    Sử dụng định dạng Markdown rõ ràng.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 15000 },
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Không thể tạo nội dung. Vui lòng thử lại sau.");
  }
};

export const checkPlagiarism = async (data: EvaluateRequest) => {
  const ai = getAI();
  const prompt = `
    Bạn là chuyên gia thẩm định chất lượng văn bản giáo dục. Hãy phân tích mức độ "Đạo văn", "Văn mẫu" và "Sự thiếu logic" của bản sáng kiến sau:
    Tên đề tài: ${data.title}
    Nội dung: ${data.content}

    Yêu cầu phân tích các khía cạnh:
    1. Nhận diện các đoạn văn mang tính "Văn mẫu" (Generic Content), sáo rỗng, cấu trúc rập khuôn thường thấy trên mạng.
    2. Phát hiện các lỗi thiếu logic hoặc mâu thuẫn thông tin (VD: Đối tượng lớp 4 nhưng số liệu lớp 5, môn học không khớp...).
    3. Đánh giá tỷ lệ sáng tạo so với các bài viết phổ biến.
    4. Đưa ra cảnh báo cụ thể về các phần có nguy cơ bị đánh giá là copy/paste.

    Trả về kết quả dưới dạng Markdown với các tiêu đề rõ ràng.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.4 }
    });
    return response.text;
  } catch (error) { throw new Error("Lỗi khi kiểm tra đạo văn."); }
};

export const generateThematic = async (data: ThematicRequest) => {
  const ai = getAI();
  const prompt = `
    Bạn là chuyên gia xây dựng chương trình đào tạo. Hãy soạn thảo một "Chuyên đề dạy học" chuyên sâu:
    - Tên chuyên đề: ${data.title}
    - Môn học: ${data.subject}
    - Khối lớp: ${data.gradeLevel}
    - Sách giáo khoa: ${data.textbook}
    - Thời lượng: ${data.duration}
    - Mục tiêu: ${data.objectives}
    - Nội dung cốt lõi: ${data.outline}

    Viết chi tiết, chuyên nghiệp, bám sát chương trình GDPT 2018.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 10000 }, temperature: 0.7 }
    });
    return response.text;
  } catch (error) { throw new Error("Lỗi khi soạn chuyên đề."); }
};

export const generateExam = async (data: ExamRequest) => {
  const ai = getAI();
  const prompt = `
    Bạn là chuyên gia khảo thí. Hãy soạn một "Đề kiểm tra" chuẩn mực:
    - Môn: ${data.subject} - Khối: ${data.gradeLevel}
    - Thời gian: ${data.duration}
    - Mức độ: ${data.level}
    - Cấu trúc: ${data.structure}
    - Phạm vi: ${data.scope}

    Yêu cầu: Đề thi, Ma trận, Đáp án và Thang điểm chi tiết.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 10000 }, temperature: 0.5 }
    });
    return response.text;
  } catch (error) { throw new Error("Lỗi khi soạn đề thi."); }
};

export const generateTranscriptComments = async (data: TranscriptCommentRequest) => {
  const ai = getAI();
  const prompt = `
    Hãy soạn thảo các "Lời nhận xét học bạ" chuyên nghiệp:
    - Môn học: ${data.subject}
    - Khối lớp: ${data.gradeLevel}
    - Mức độ hoàn thành: ${data.performanceLevel}
    - Đặc điểm: ${data.traits}
    - Thông tin bổ sung: ${data.additionalInfo}

    Tạo 5 phương án nhận xét từ ngắn đến dài, khích lệ, bám sát năng lực.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 5000 }, temperature: 0.8 }
    });
    return response.text;
  } catch (error) { throw new Error("Lỗi khi tạo lời nhận xét."); }
};

export const evaluateInitiative = async (data: EvaluateRequest) => {
  const ai = getAI();
  const prompt = `
    Bạn là Hội đồng Chấm & Thẩm định Sáng kiến kinh nghiệm (SKKN).
    Hãy thẩm định bản sáng kiến: ${data.title}
    Nội dung: ${data.content}

    YÊU CẦU ĐÁNH GIÁ THEO THANG 100 ĐIỂM:
    1. NỘI DUNG (90đ): Tính mới (20), Khoa học (25), Thực tiễn (20), Hiệu quả (25).
    2. HÌNH THỨC (10đ): Bố cục, ngôn ngữ, trình bày.

    Trả về: Bảng điểm, Xếp loại, Ưu điểm, Các lỗi cần khắc phục, Hướng dẫn sửa chi tiết.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 15000 }, temperature: 0.5 },
    });
    return response.text;
  } catch (error) { throw new Error("Không thể chấm điểm. Vui lòng thử lại."); }
};

export const getInitiativeSuggestions = async (subject: string, grade: string, textbook: string): Promise<Suggestion[]> => {
  const ai = getAI();
  const prompt = `Hãy gợi ý 6 tên đề tài sáng kiến kinh nghiệm cho môn ${subject} lớp ${grade}, bộ sách ${textbook}. Trả về JSON mảng đối tượng {title, description}.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ['title', 'description']
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) { return []; }
};
