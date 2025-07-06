import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { saveQuiz, getQuizById, getGuestId, createGuestId } from '../services/dataService';
import { generateQuizFromContent } from '../services/geminiService';
import { Quiz, Question, QuestionType } from '../types';
import { GRADIENT_BG, ICONS } from '../constants';
import { useToast } from '../App';


const QuestionEditor: React.FC<{
    question: Question;
    index: number;
    updateQuestion: (index: number, question: Question) => void;
    removeQuestion: (index: number) => void;
}> = ({ question, index, updateQuestion, removeQuestion }) => {
    
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as QuestionType;
        const newQuestion = { ...question, type: newType };
        if (newType === QuestionType.MCQ) {
            delete newQuestion.correctAnswer;
            if(!newQuestion.options) newQuestion.options = ['', '', '', ''];
            if(newQuestion.correctAnswerIndex === undefined) newQuestion.correctAnswerIndex = 0;
        } else {
            delete newQuestion.options;
            delete newQuestion.correctAnswerIndex;
            if(!newQuestion.correctAnswer) newQuestion.correctAnswer = '';
        }
        updateQuestion(index, newQuestion);
    };

    const handleOptionChange = (optIndex: number, value: string) => {
        const newOptions = [...(question.options || [])];
        newOptions[optIndex] = value;
        updateQuestion(index, { ...question, options: newOptions });
    };

    return (
        <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-lg p-4 rounded-lg border border-slate-300/50 dark:border-slate-700/50 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 dark:text-white">Question {index + 1}</h3>
                <button onClick={() => removeQuestion(index)} className="text-red-500 hover:text-red-400">
                    {ICONS.trash}
                </button>
            </div>
            <textarea
                value={question.text}
                onChange={(e) => updateQuestion(index, { ...question, text: e.target.value })}
                placeholder="Enter question text (supports বাংলা)"
                className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900 dark:text-white"
                rows={2}
            />
            <select value={question.type} onChange={handleTypeChange} className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900 dark:text-white">
                <option value={QuestionType.MCQ}>Multiple Choice Question</option>
                <option value={QuestionType.SHORT_ANSWER}>Short Answer</option>
            </select>

            {question.type === QuestionType.MCQ && (
                <div className="space-y-2">
                    {question.options?.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                            <input type="radio" name={`correct_answer_${index}`} checked={question.correctAnswerIndex === optIndex} onChange={() => updateQuestion(index, { ...question, correctAnswerIndex: optIndex })} className="form-radio h-5 w-5 text-cyan-600 bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-cyan-500"/>
                            <input type="text" value={opt} onChange={(e) => handleOptionChange(optIndex, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + optIndex)}`} className="flex-grow bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900 dark:text-white"/>
                        </div>
                    ))}
                </div>
            )}
            {question.type === QuestionType.SHORT_ANSWER && (
                <textarea
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(index, { ...question, correctAnswer: e.target.value })}
                    placeholder="Enter the exact correct answer"
                    className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900 dark:text-white"
                    rows={1}
                />
            )}
        </div>
    );
};


const CreateQuizPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const [subject, setSubject] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [error, setError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiFile, setAiFile] = useState<File | null>(null);
    const [aiTextContent, setAiTextContent] = useState('');
    const [numAiQuestions, setNumAiQuestions] = useState(5);
    const { showToast } = useToast();

    useEffect(() => {
        if (isEditing && id) {
            const quiz = getQuizById(id);
            const guestId = getGuestId();
            if (quiz && quiz.creatorId === guestId) {
                setSubject(quiz.subject);
                setQuestions(quiz.questions);
            } else {
                navigate('/');
            }
        }
    }, [id, isEditing, navigate]);

    const addQuestion = () => {
        if (questions.length >= 50) return;
        const newQuestion: Question = {
            id: `q_${new Date().getTime()}`,
            type: QuestionType.MCQ,
            text: '',
            options: ['', '', '', ''],
            correctAnswerIndex: 0
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (index: number, updatedQuestion: Question) => {
        const newQuestions = [...questions];
        newQuestions[index] = updatedQuestion;
        setQuestions(newQuestions);
    };
    
    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleAiGenerate = async () => {
        if (!aiFile && !aiTextContent.trim()) {
            showToast("Please select a file or paste some text first.");
            return;
        }
        setIsGenerating(true);
        setError('');

        const source = aiFile ? { file: aiFile } : { text: aiTextContent };
        const generatedQuestions = await generateQuizFromContent(source, numAiQuestions, showToast);
        
        if (generatedQuestions) {
            setQuestions(prev => [...prev, ...generatedQuestions].slice(0, 50));
            showToast(`${generatedQuestions.length} questions generated successfully!`);
            setAiFile(null);
            setAiTextContent('');
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
        setIsGenerating(false);
    };

    const handleSave = () => {
        if (!subject.trim()) {
            setError('Subject is required.');
            return;
        }
        if (questions.length < 5) {
            setError('A minimum of 5 questions is required.');
            return;
        }
        if (questions.some(q => !q.text.trim())) {
            setError('All questions must have text.');
            return;
        }
        setError('');

        let guestId = getGuestId();
        if (!guestId) {
            guestId = createGuestId();
        }

        const newQuiz: Quiz = {
            id: id || `quiz_${new Date().getTime()}`,
            creatorId: guestId,
            subject,
            questions,
            participationCount: isEditing ? getQuizById(id!)?.participationCount || 0 : 0,
            createdAt: isEditing ? getQuizById(id!)?.createdAt || Date.now() : Date.now(),
        };

        saveQuiz(newQuiz);
        navigate('/');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{isEditing ? 'Edit Your Quiz' : 'Create a New Quiz'}</h1>

            <div className="space-y-6">
                <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-lg p-6 rounded-lg border border-slate-300/50 dark:border-slate-700/50 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quiz Subject</h2>
                     <div>
                        <label htmlFor="subject" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Subject</label>
                        <input id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Photosynthesis, সাধারণ জ্ঞান" className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900 dark:text-white"/>
                    </div>
                </div>

                <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-lg p-6 rounded-lg border border-slate-300/50 dark:border-slate-700/50 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Generate with AI ✨</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Upload a document, paste text, and let AI create questions for you.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                             <label htmlFor="file-upload" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Upload File</label>
                             <input id="file-upload" type="file" onChange={(e) => { setAiFile(e.target.files?.[0] || null); setAiTextContent('') }} accept=".txt,.pdf,.png,.jpg,.jpeg" className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 dark:file:bg-cyan-900/40 dark:file:text-cyan-300 dark:hover:file:bg-cyan-900/60"/>
                        </div>
                         <div>
                            <label htmlFor="num-questions" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"># of Questions</label>
                            <input id="num-questions" type="number" min="1" max="20" value={numAiQuestions} onChange={(e) => setNumAiQuestions(Number(e.target.value))} className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900 dark:text-white" />
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                        <span className="flex-shrink mx-4 text-slate-600 dark:text-slate-400 text-sm">OR</span>
                        <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                    </div>
                    <div>
                        <label htmlFor="text-paste" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Paste Text</label>
                        <textarea
                            id="text-paste"
                            rows={6}
                            value={aiTextContent}
                            onChange={(e) => { setAiTextContent(e.target.value); setAiFile(null); const fileInput = document.getElementById('file-upload') as HTMLInputElement; if (fileInput) fileInput.value = ''; }}
                            placeholder="Paste content from an article, your notes, or any document..."
                            className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900 dark:text-white"
                        />
                    </div>
                     <button onClick={handleAiGenerate} disabled={isGenerating || (!aiFile && !aiTextContent.trim())} className={`w-full flex items-center justify-center space-x-2 px-4 py-2 text-base font-semibold text-white rounded-lg ${GRADIENT_BG} hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}>
                        {isGenerating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : ICONS.upload}
                        <span>{isGenerating ? 'Generating...' : 'Generate Questions'}</span>
                    </button>
                </div>


                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Questions ({questions.length})</h2>
                        <button onClick={addQuestion} disabled={questions.length >= 50} className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white rounded-lg ${GRADIENT_BG} hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}>
                            {ICONS.plus}
                            <span>Add Question</span>
                        </button>
                    </div>
                    {questions.map((q, i) => (
                        <QuestionEditor key={q.id || i} question={q} index={i} updateQuestion={updateQuestion} removeQuestion={removeQuestion} />
                    ))}
                </div>
                {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
                <div className="flex justify-end">
                    <button onClick={handleSave} className={`px-8 py-3 font-semibold text-white rounded-lg ${GRADIENT_BG} hover:opacity-90 transition-opacity`}>
                        {isEditing ? 'Update Quiz' : 'Save Quiz'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateQuizPage;