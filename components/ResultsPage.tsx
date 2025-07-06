import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { Quiz, UserAnswer, Question, QuestionType } from '../types';
import { evaluateShortAnswer } from '../services/geminiService';
import { saveLeaderboardEntry } from '../services/dataService';
import { GRADIENT_TEXT, ICONS, SCORE_MESSAGES } from '../constants';
import { useToast } from '../App';

interface EvaluationResult {
    questionId: string;
    isCorrect: boolean;
}

const AnswerReview: React.FC<{ question: Question; userAnswer: UserAnswer | undefined; isCorrect: boolean | null }> = ({ question, userAnswer, isCorrect }) => {
    let userAnswerText = 'Not Answered';
    if(userAnswer !== undefined){
        if (question.type === QuestionType.MCQ && typeof userAnswer.answer === 'number') {
            userAnswerText = question.options?.[userAnswer.answer] || 'Invalid Option';
        } else if (typeof userAnswer.answer === 'string') {
            userAnswerText = userAnswer.answer;
        }
    }

    const correctAnswerText = question.type === QuestionType.MCQ ? question.options?.[question.correctAnswerIndex!] : question.correctAnswer;

    return (
        <div className={`p-4 rounded-lg ${isCorrect === null ? 'bg-white/30 dark:bg-slate-800/30' : isCorrect ? 'bg-green-400/10 dark:bg-green-500/20' : 'bg-red-400/10 dark:bg-red-500/20'} border ${isCorrect ? 'border-green-400/20' : isCorrect === false ? 'border-red-400/20' : 'border-slate-300/50'} dark:border-transparent backdrop-blur-lg`}>
            <p className="font-semibold text-slate-900 dark:text-white">{question.text}</p>
            <div className="mt-2 text-sm space-y-1">
                <div className="flex items-center">
                    <span className={`w-24 shrink-0 sm:w-28 font-medium ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>Your Answer:</span>
                    <span className="text-slate-800 dark:text-slate-300">{userAnswerText}</span>
                    <span className="ml-4">{isCorrect ? ICONS.check : isCorrect === false ? ICONS.x : null}</span>
                </div>
                {!isCorrect && (
                     <div className="flex items-center">
                        <span className="w-24 shrink-0 sm:w-28 font-medium text-slate-600 dark:text-slate-400">Correct Answer:</span>
                        <span className="text-slate-800 dark:text-slate-300">{correctAnswerText}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const ResultsPage: React.FC = () => {
    const location = useLocation();
    const { showToast } = useToast();
    const { quiz, userAnswers, participantName, sessionQuestions } = (location.state || {}) as { quiz: Quiz, userAnswers: UserAnswer[], participantName: string, sessionQuestions: Question[] };

    const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const questionsInSession = sessionQuestions || quiz?.questions;

    useEffect(() => {
        if (!quiz || !questionsInSession) return;

        const evaluateAnswers = async () => {
            setIsLoading(true);
            const results: EvaluationResult[] = [];
            for (const question of questionsInSession) {
                const userAnswer = userAnswers.find(ua => ua.questionId === question.id);
                if (!userAnswer || userAnswer.answer === '') {
                    results.push({ questionId: question.id, isCorrect: false });
                    continue;
                }

                let isCorrect = false;
                if (question.type === QuestionType.MCQ) {
                    isCorrect = userAnswer.answer === question.correctAnswerIndex;
                } else if (question.type === QuestionType.SHORT_ANSWER && question.correctAnswer) {
                    isCorrect = await evaluateShortAnswer(userAnswer.answer as string, question.correctAnswer, showToast);
                }
                results.push({ questionId: question.id, isCorrect });
            }
            setEvaluationResults(results);
            setIsLoading(false);
        };

        evaluateAnswers();
    }, [quiz, userAnswers, showToast, questionsInSession]);

    const { score, accuracy } = useMemo(() => {
        if (isLoading || !questionsInSession) return { score: 0, accuracy: 0 };
        const correctCount = evaluationResults.filter(r => r.isCorrect).length;
        return {
            score: correctCount,
            accuracy: Math.round((correctCount / questionsInSession.length) * 100)
        };
    }, [isLoading, evaluationResults, questionsInSession]);
    
    useEffect(() => {
        if (!isLoading && quiz && participantName && questionsInSession) {
            saveLeaderboardEntry({
                id: `le_${Date.now()}`,
                participantName,
                quizId: quiz.id,
                quizTitle: quiz.subject,
                score,
                totalQuestions: questionsInSession.length,
                accuracy
            });
        }
    }, [isLoading, quiz, participantName, score, accuracy, questionsInSession]);
    
    const complimentaryMessage = useMemo(() => {
        if (isLoading) return "";
        const scoreKeys = Object.keys(SCORE_MESSAGES).map(Number).sort((a,b) => b-a);
        for(const key of scoreKeys) {
            if(accuracy >= key) return SCORE_MESSAGES[key];
        }
        return "";
    }, [isLoading, accuracy]);

    if (!quiz || !userAnswers || !participantName || !questionsInSession) {
        return <Navigate to="/" />;
    }

    if (isLoading) {
        return <div className="text-center py-20">
            <h2 className="text-2xl font-bold animate-pulse text-slate-900 dark:text-white">Evaluating your results...</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Hang tight, the AI is thinking!</p>
        </div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Well done, {participantName}!</h1>
                <p className={`text-xl font-semibold mt-2 ${GRADIENT_TEXT}`}>{complimentaryMessage}</p>
            </div>

            <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-lg p-8 rounded-xl shadow-lg border border-slate-300/50 dark:border-slate-700/50 mb-8 flex flex-col md:flex-row justify-around items-center text-center">
                <div className="mb-4 md:mb-0">
                    <p className="text-slate-600 dark:text-slate-400">Your Score</p>
                    <p className="text-5xl font-bold text-slate-900 dark:text-white">{score}<span className="text-3xl text-slate-500 dark:text-slate-500">/{questionsInSession.length}</span></p>
                </div>
                <div className="w-px h-16 bg-slate-300 dark:bg-slate-700 hidden md:block"></div>
                <div>
                    <p className="text-slate-600 dark:text-slate-400">Accuracy</p>
                    <p className="text-5xl font-bold text-slate-900 dark:text-white">{accuracy}<span className="text-3xl text-slate-500 dark:text-slate-500">%</span></p>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">Answer Review</h2>
                {questionsInSession.map(q => (
                    <AnswerReview
                        key={q.id}
                        question={q}
                        userAnswer={userAnswers.find(ua => ua.questionId === q.id)}
                        isCorrect={evaluationResults.find(er => er.questionId === q.id)?.isCorrect ?? null}
                    />
                ))}
            </div>
            
            <div className="mt-8 text-center">
                 <Link to="/" className="inline-block px-8 py-3 font-semibold text-slate-700 dark:text-slate-200 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default ResultsPage;