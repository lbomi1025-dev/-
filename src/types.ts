export interface ExamQuestionSubItem {
  id: string; // unique item id
  year: number; // e.g. 2024
  examType: '전공 A' | '전공 B'; // 전공 A or 전공 B
  questionNum: number; // e.g. 9
  score: number; // e.g. 4
  questionType: '객관식' | '단답형' | '서술형' | '풀이 실습'; // e.g. 객관식, 단답형, 서술형, 풀이 실습
  subject: string; // e.g. 분류학, 목록학, 정보봉사론, 독서지도론, etc.
  evaluationArea: string; // e.g. 분류이론 및 역사, 기술목록과 표목 등
  evaluationElement: string; // e.g. KDC, KORMARC 등의 실제 이해 등
  passageContext: string; // related text/context for this specific item
}

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  pageCount?: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress?: number;
  base64Data?: string; // 로컬DB 또는 IndexedDB/스토리지 연동용
}

export interface SubjectStandard {
  subject: string;
  areas: {
    area: string;
    elements: string[];
  }[];
}

export interface AnalysisLog {
  id: string;
  timestamp: string;
  fileName: string;
  pageRange: string;
  status: 'success' | 'failed';
  itemCount: number;
  message?: string;
}

export interface KeyConcept {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  description: string;
  corePoints: string[];
}

