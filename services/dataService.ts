
import { Quiz, LeaderboardEntry } from '../types';

const QUIZZES_KEY = 'quizflare_quizzes';
const LEADERBOARD_KEY = 'quizflare_leaderboard';
const GUEST_ID_KEY = 'quizflare_guestId';

// Guest ID Management
export const getGuestId = (): string | null => {
  return localStorage.getItem(GUEST_ID_KEY);
};

export const createGuestId = (): string => {
  const newId = `guest_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;
  localStorage.setItem(GUEST_ID_KEY, newId);
  return newId;
};

// Quiz Management
export const getQuizzes = (): Quiz[] => {
  const quizzesJson = localStorage.getItem(QUIZZES_KEY);
  return quizzesJson ? JSON.parse(quizzesJson) : [];
};

export const getQuizById = (id: string): Quiz | undefined => {
  return getQuizzes().find(quiz => quiz.id === id);
};

export const saveQuiz = (quiz: Quiz): void => {
  const quizzes = getQuizzes();
  const existingIndex = quizzes.findIndex(q => q.id === quiz.id);
  if (existingIndex > -1) {
    quizzes[existingIndex] = quiz;
  } else {
    quizzes.push(quiz);
  }
  localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
};

export const deleteQuiz = (id: string): void => {
  let quizzes = getQuizzes();
  quizzes = quizzes.filter(quiz => quiz.id !== id);
  localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
};

export const incrementParticipationCount = (id: string): void => {
    const quiz = getQuizById(id);
    if(quiz) {
        quiz.participationCount += 1;
        saveQuiz(quiz);
    }
}


// Leaderboard Management
export const getLeaderboard = (): LeaderboardEntry[] => {
  const leaderboardJson = localStorage.getItem(LEADERBOARD_KEY);
  return leaderboardJson ? JSON.parse(leaderboardJson) : [];
};

export const saveLeaderboardEntry = (entry: LeaderboardEntry): void => {
  const leaderboard = getLeaderboard();
  leaderboard.push(entry);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
};
