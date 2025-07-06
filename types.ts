export enum QuestionType {
  MCQ = 'MCQ',
  SHORT_ANSWER = 'Short Answer',
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswerIndex?: number;
  correctAnswer?: string;
}

export interface Quiz {
  id: string;
  creatorId: string;
  subject: string;
  questions: Question[];
  participationCount: number;
  createdAt: number;
}

export interface LeaderboardEntry {
  id: string;
  participantName: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
}

export enum FilterType {
    ALL = 'All',
    MCQ = 'MCQ',
    SHORT_ANSWER = 'Short Questions',
    MIXED = 'Mixed',
}

export enum SortType {
    NEWEST = 'Newest First',
    OLDEST = 'Oldest First',
    POPULAR = 'Most Popular',
}

export interface UserAnswer {
  questionId: string;
  answer: string | number; // string for short answer, number for MCQ index
}