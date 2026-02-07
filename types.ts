
export interface InitiativeRequest {
  title: string;
  subject: string;
  gradeLevel: string;
  textbook: string;
  context: string;
  objectives: string;
  methodology: string;
  lessonExample?: string;
  evidenceContent?: string;
}

export interface ThematicRequest {
  title: string;
  subject: string;
  gradeLevel: string;
  textbook: string;
  duration: string;
  objectives: string;
  outline: string;
}

export interface ExamRequest {
  subject: string;
  gradeLevel: string;
  duration: string;
  level: string;
  structure: string;
  scope: string;
}

export interface TranscriptCommentRequest {
  subject: string;
  gradeLevel: string;
  performanceLevel: string;
  traits: string;
  additionalInfo: string;
}

export interface EvaluateRequest {
  title: string;
  content: string;
}

export type AppMode = 'DRAFTING' | 'GRADING' | 'THEMATIC' | 'EXAM' | 'TRANSCRIPT';

export interface InitiativeResult {
  content: string;
  status: 'idle' | 'generating' | 'success' | 'error';
  error?: string;
  mode?: AppMode;
}

export interface Suggestion {
  title: string;
  description: string;
}
