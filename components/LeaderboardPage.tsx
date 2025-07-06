import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/dataService';
import { LeaderboardEntry } from '../types';
import { GRADIENT_TEXT } from '../constants';
import { useTheme } from '../App';

const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    const sortedLeaderboard = getLeaderboard().sort((a, b) => b.accuracy - a.accuracy || b.score - a.score);
    setLeaderboard(sortedLeaderboard);
  }, []);

  const rankColor = (rank: number) => {
    if (rank === 1) return theme === 'light' ? 'text-yellow-500' : 'text-yellow-400'; // Gold
    if (rank === 2) return theme === 'light' ? 'text-slate-500' : 'text-slate-300'; // Silver
    if (rank === 3) return theme === 'light' ? 'text-amber-600' : 'text-yellow-700'; // Bronze
    return theme === 'light' ? 'text-slate-700' : 'text-slate-400';
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className={`text-4xl font-bold text-center mb-8 ${GRADIENT_TEXT}`}>Leaderboard</h1>
      
      <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-lg rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-800 dark:text-slate-300">
                <thead className="text-xs text-slate-800 dark:text-slate-400 uppercase bg-white/20 dark:bg-slate-700/30 backdrop-blur-sm">
                    <tr>
                        <th scope="col" className="px-6 py-3">Rank</th>
                        <th scope="col" className="px-6 py-3">Name</th>
                        <th scope="col" className="px-6 py-3">Quiz</th>
                        <th scope="col" className="px-6 py-3 text-center">Score</th>
                        <th scope="col" className="px-6 py-3 text-center">Accuracy</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((entry, index) => (
                        <tr key={entry.id} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-500/10 dark:hover:bg-slate-500/20">
                            <td className={`px-6 py-4 font-bold text-lg ${rankColor(index + 1)}`}>
                                {index + 1}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                {entry.participantName}
                            </td>
                            <td className="px-6 py-4">
                                {entry.quizTitle}
                            </td>
                            <td className="px-6 py-4 text-center">
                                {entry.score} / {entry.totalQuestions}
                            </td>
                            <td className="px-6 py-4 font-semibold text-center text-cyan-600 dark:text-cyan-400">
                                {entry.accuracy}%
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {leaderboard.length === 0 && (
            <div className="text-center py-16">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">The Leaderboard is Empty</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Take a quiz to get your name on the board!</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;