import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getQuizzes, deleteQuiz, getGuestId, incrementParticipationCount } from '../services/dataService';
import { Quiz, QuestionType, FilterType, SortType } from '../types';
import { GRADIENT_BG, GRADIENT_TEXT, ICONS } from '../constants';

// --- Reusable Components defined outside HomePage ---

interface QuizCardProps {
  quiz: Quiz;
  onDelete: (id: string) => void;
  isCreator: boolean;
  onTakeQuiz: (id: string) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onDelete, isCreator, onTakeQuiz }) => {
  const getQuizType = (): FilterType => {
    const hasMCQ = quiz.questions.some(q => q.type === QuestionType.MCQ);
    const hasShort = quiz.questions.some(q => q.type === QuestionType.SHORT_ANSWER);
    if (hasMCQ && hasShort) return FilterType.MIXED;
    if (hasMCQ) return FilterType.MCQ;
    return FilterType.SHORT_ANSWER;
  };

  return (
    <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-fuchsia-500/20 hover:scale-105 flex flex-col border border-slate-200/50 dark:border-slate-700/50">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{getQuizType()}</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{quiz.subject}</h3>
            </div>
            <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full">{quiz.questions.length} Qs</span>
        </div>
        <div className="mt-4 flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>{quiz.participationCount} plays</span>
        </div>
      </div>
      <div className="p-4 bg-slate-50/30 dark:bg-slate-900/30 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50">
        {isCreator ? (
            <div className="flex items-center space-x-2">
                <Link to={`/edit/${quiz.id}`} className="flex items-center text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300 transition-colors p-2 rounded-md bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-700">
                    {ICONS.edit} <span className="ml-1">Edit</span>
                </Link>
                <button onClick={() => onDelete(quiz.id)} className="flex items-center text-xs text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 transition-colors p-2 rounded-md bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-700">
                    {ICONS.trash} <span className="ml-1">Delete</span>
                </button>
            </div>
        ) : <div />}
        <button onClick={() => onTakeQuiz(quiz.id)} className={`flex items-center text-white font-semibold px-4 py-2 rounded-lg ${GRADIENT_BG} hover:opacity-90 transition-opacity`}>
          Take Quiz
        </button>
      </div>
    </div>
  );
};


const Dropdown: React.FC<{ options: string[], selected: string, onSelect: (value: string) => void, label: string }> = ({ options, selected, onSelect, label }) => (
    <div className="relative">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
        <select value={selected} onChange={e => onSelect(e.target.value)} className="w-full appearance-none bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm mt-1">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-2 text-slate-500 dark:text-slate-400">
            {ICONS.chevronDown}
        </div>
    </div>
);

// --- HomePage Component ---

const HomePage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [filterType, setFilterType] = useState<FilterType>(FilterType.ALL);
  const [sortType, setSortType] = useState<SortType>(SortType.NEWEST);
  const [guestId, setGuestId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setQuizzes(getQuizzes());
    setGuestId(getGuestId());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      deleteQuiz(id);
      setQuizzes(getQuizzes());
    }
  };
  
  const handleTakeQuiz = (id: string) => {
    incrementParticipationCount(id);
    navigate(`/quiz/${id}`);
  };

  const subjects = useMemo(() => ['All', ...Array.from(new Set(quizzes.map(q => q.subject)))], [quizzes]);

  const filteredAndSortedQuizzes = useMemo(() => {
    let result = quizzes;

    if (filterSubject !== 'All') {
      result = result.filter(q => q.subject === filterSubject);
    }

    if (filterType !== FilterType.ALL) {
        result = result.filter(q => {
            const hasMCQ = q.questions.some(ques => ques.type === QuestionType.MCQ);
            const hasShort = q.questions.some(ques => ques.type === QuestionType.SHORT_ANSWER);
            if(filterType === FilterType.MCQ) return hasMCQ && !hasShort;
            if(filterType === FilterType.SHORT_ANSWER) return !hasMCQ && hasShort;
            if(filterType === FilterType.MIXED) return hasMCQ && hasShort;
            return false;
        });
    }

    switch (sortType) {
      case SortType.OLDEST:
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case SortType.POPULAR:
        result.sort((a, b) => b.participationCount - a.participationCount);
        break;
      case SortType.NEWEST:
      default:
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    return result;
  }, [quizzes, filterSubject, filterType, sortType]);

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className={`text-4xl md:text-5xl font-bold ${GRADIENT_TEXT}`}>Discover & Challenge</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Browse through user-created quizzes, or create your own masterpiece.</p>
      </div>

      <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-lg p-4 rounded-xl mb-8 border border-slate-300/50 dark:border-slate-700/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <Dropdown label="Filter by Subject" options={subjects} selected={filterSubject} onSelect={setFilterSubject} />
        
        <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Filter by Type</label>
            <div className="flex bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg p-1 text-sm mt-1">
                {Object.values(FilterType).map(type => (
                    <button key={type} onClick={() => setFilterType(type)} className={`flex-1 py-1.5 px-1 rounded-md transition-colors ${filterType === type ? `${GRADIENT_BG} text-white font-semibold` : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/50'}`}>
                        {type}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <Dropdown label="Sort by" options={Object.values(SortType)} selected={sortType} onSelect={(val) => setSortType(val as SortType)} />
        </div>
        
        <Link to="/create" className={`col-span-1 sm:col-span-2 md:col-span-1 flex items-center justify-center h-10 px-4 py-2 text-sm sm:text-base font-semibold text-white ${GRADIENT_BG} rounded-lg shadow-lg hover:opacity-90 transition-opacity`}>
            {ICONS.plus} Create New Quiz
        </Link>
      </div>

      {filteredAndSortedQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedQuizzes.map(quiz => (
            <QuizCard key={quiz.id} quiz={quiz} onDelete={handleDelete} isCreator={guestId === quiz.creatorId} onTakeQuiz={handleTakeQuiz} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/30 dark:bg-slate-800/40 backdrop-blur-lg rounded-lg border border-slate-300/50 dark:border-slate-700/50">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">No Quizzes Found</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Why not be the first to create one?</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;