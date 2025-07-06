import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizById } from '../services/dataService';
import { Quiz, Question, QuestionType, UserAnswer } from '../types';
import { GRADIENT_BG, GRADIENT_TEXT } from '../constants';

// --- Modal Component ---
const NameModal: React.FC<{ onSubmit: (name: string) => void }> = ({ onSubmit }) => {
    const [name, setName] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim());
        }
    };
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-lg p-8 rounded-xl shadow-2xl border border-slate-300/50 dark:border-slate-700/50 w-full max-w-sm">
                <form onSubmit={handleSubmit}>
                    <h2 className={`text-2xl font-bold text-center ${GRADIENT_TEXT}`}>Enter Your Name</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-center mt-2 mb-6">Your name will be displayed on the leaderboard.</p>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-md p-3 text-center focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900 dark:text-white"
                        placeholder="e.g., Alex"
                        required
                        autoFocus
                    />
                    <button type="submit" className={`w-full mt-4 py-3 font-semibold text-white rounded-lg ${GRADIENT_BG} hover:opacity-90 transition-opacity`}>
                        Start Quiz
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Timer Component ---
const Timer: React.FC<{ timeLeft: number }> = ({ timeLeft }) => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isLowTime = timeLeft <= 30;

    return (
        <div className={`text-2xl font-bold ${isLowTime ? 'text-red-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
    );
};

const TakeQuizPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
    const [participantName, setParticipantName] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    
    const handleSubmit = useCallback(() => {
        if(quiz && participantName) {
            navigate('/results', { state: { quiz, userAnswers, participantName, sessionQuestions } });
        }
    }, [quiz, userAnswers, participantName, navigate, sessionQuestions]);

    useEffect(() => {
        if (!id) {
            navigate('/');
            return;
        }
        const foundQuiz = getQuizById(id);
        if (foundQuiz) {
            setQuiz(foundQuiz);
            const shuffled = [...foundQuiz.questions].sort(() => 0.5 - Math.random());
            const questionsForSession = shuffled.slice(0, 20);
            setSessionQuestions(questionsForSession);

            const mcqCount = questionsForSession.filter(q => q.type === QuestionType.MCQ).length;
            const shortCount = questionsForSession.filter(q => q.type === QuestionType.SHORT_ANSWER).length;
            setTimeLeft(mcqCount * 10 + shortCount * 60);
        } else {
            navigate('/');
        }
    }, [id, navigate]);
    
    useEffect(() => {
        if (participantName === null || timeLeft <= 0) return;
        
        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        if (timeLeft === 0) {
            clearInterval(timerId);
            handleSubmit();
        }

        return () => clearInterval(timerId);
    }, [timeLeft, participantName, handleSubmit]);


    const handleAnswer = (answer: string | number) => {
        const currentQuestion = sessionQuestions[currentQuestionIndex];
        const newAnswers = [...userAnswers.filter(a => a.questionId !== currentQuestion.id), { questionId: currentQuestion.id, answer }];
        setUserAnswers(newAnswers);

        if (currentQuestionIndex < sessionQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            handleSubmit();
        }
    };
    
    if (!quiz) return <div className="text-center">Loading Quiz...</div>;
    if (!participantName) return <NameModal onSubmit={setParticipantName} />;
    
    const currentQuestion = sessionQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / sessionQuestions.length) * 100;
    
    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-slate-300/50 dark:border-slate-700/50">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{quiz.subject}</h1>
                    <Timer timeLeft={timeLeft} />
                </div>
                
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-6">
                    <div className={`${GRADIENT_BG} h-2.5 rounded-full`} style={{ width: `${progress}%` }}></div>
                </div>

                <div className="text-center">
                    <p className="text-slate-600 dark:text-slate-400 mb-2">Question {currentQuestionIndex + 1} of {sessionQuestions.length}</p>
                    <h2 className="text-2xl md:text-3xl font-semibold min-h-[100px] text-slate-900 dark:text-white">{currentQuestion.text}</h2>
                </div>

                <div className="mt-8">
                    {currentQuestion.type === QuestionType.MCQ && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentQuestion.options?.map((option, index) => (
                                <button key={index} onClick={() => handleAnswer(index)} className="w-full text-left p-4 bg-slate-100/50 dark:bg-slate-700/50 rounded-lg border-2 border-slate-200/50 dark:border-slate-600/50 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all duration-200 text-slate-700 dark:text-slate-200">
                                    <span className={`font-semibold mr-2 ${GRADIENT_TEXT}`}>{String.fromCharCode(65 + index)}</span>
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}
                    {currentQuestion.type === QuestionType.SHORT_ANSWER && (
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const answer = (e.currentTarget.elements.namedItem('answer') as HTMLInputElement).value;
                            handleAnswer(answer);
                            (e.currentTarget.elements.namedItem('answer') as HTMLInputElement).value = '';
                        }}>
                           <input
                                name="answer"
                                type="text"
                                className="w-full bg-slate-100/50 dark:bg-slate-900/50 border-2 border-slate-300 dark:border-slate-700 rounded-md p-4 text-center focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900 dark:text-white"
                                placeholder="Type your answer here..."
                                autoFocus
                            />
                            <button type="submit" className={`w-full mt-4 py-3 font-semibold text-white rounded-lg ${GRADIENT_BG} hover:opacity-90 transition-opacity`}>
                                {currentQuestionIndex < sessionQuestions.length - 1 ? 'Next Question' : 'Submit Quiz'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TakeQuizPage;