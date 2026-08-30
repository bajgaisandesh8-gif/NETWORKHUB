import React, { useState } from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  RotateCcw, 
  Award, 
  AlertCircle, 
  ArrowRight, 
  Brain, 
  Sparkles, 
  ChevronRight 
} from 'lucide-react';
import { QUIZZES_DATA } from '../data/quizzesData';
import { QuizQuestion } from '../types';
import { databaseService } from '../services/databaseService';

interface QuizzesPageProps {
  onNavigate: (page: string, meta?: any) => void;
}

export const QuizzesPage: React.FC<QuizzesPageProps> = ({ onNavigate }) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const topics = ['all', 'Subnetting', 'OSI Model', 'Switching', 'Routing', 'Troubleshooting', 'Security'];

  const questions: QuizQuestion[] = QUIZZES_DATA.filter(q => 
    selectedTopic === 'all' || q.topic.toLowerCase() === selectedTopic.toLowerCase()
  );

  const currentQ: QuizQuestion | undefined = questions[currentQuestionIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQ) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === currentQ.correctAnswerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizFinished(true);
      const totalScore = selectedOption === currentQ?.correctAnswerIndex ? score + 1 : score;
      const res = databaseService.recordQuizScore(selectedTopic === 'all' ? 'General' : selectedTopic, totalScore, questions.length);
      if (res.recommendation) {
        setRecommendation(res.recommendation);
      }
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizFinished(false);
    setRecommendation(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Brain size={22} className="text-cyan-400" />
            <span>Adaptive Networking & Security Assessments</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Test and strengthen your networking knowledge with instant conceptual explanations and personalized learning paths.
          </p>
        </div>

        {/* Topic Selector */}
        <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          {topics.map(t => (
            <button
              key={t}
              onClick={() => {
                setSelectedTopic(t);
                handleResetQuiz();
              }}
              className={`px-3 py-1.5 rounded-lg capitalize transition ${
                selectedTopic === t
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Adaptive Recommendation Alert Banner if triggered */}
      {recommendation && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start space-x-3 animate-fadeIn">
          <Sparkles size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-300">Adaptive Learning Recommendation:</div>
            <p className="leading-relaxed">{recommendation}</p>
          </div>
        </div>
      )}

      {/* Quiz Card */}
      {!quizFinished && currentQ ? (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 font-mono text-xs">
          
          {/* Progress Bar & Status */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 font-bold">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>• {currentQ.topic}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
              currentQ.difficulty === 'Beginner' ? 'text-emerald-400' : currentQ.difficulty === 'Intermediate' ? 'text-amber-400' : 'text-purple-400'
            }`}>
              {currentQ.difficulty}
            </span>
          </div>

          {/* Question Text */}
          <div className="text-sm font-semibold text-white font-sans leading-relaxed">
            {currentQ.questionText}
          </div>

          {/* Options Grid */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctAnswerIndex;

              let style = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700';
              if (isAnswerSubmitted) {
                if (isCorrect) {
                  style = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold';
                } else if (isSelected && !isCorrect) {
                  style = 'bg-red-950/40 border-red-500 text-red-200 font-bold';
                }
              } else if (isSelected) {
                style = 'bg-cyan-950/40 border-cyan-500 text-cyan-200 font-bold';
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${style}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-sans text-xs">{opt}</span>
                  </div>
                  {isAnswerSubmitted && isCorrect && (
                    <span className="text-emerald-400 text-xs font-bold">CORRECT</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation Box */}
          {isAnswerSubmitted && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-slate-300 font-sans leading-relaxed animate-fadeIn">
              <div className="text-cyan-400 font-bold font-mono text-[11px] uppercase">Explanation & Reference:</div>
              <p className="text-xs">{currentQ.explanation}</p>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-slate-500">Current Score: <strong className="text-cyan-400">{score}</strong></span>

            {!isAnswerSubmitted ? (
              <button
                disabled={selectedOption === null}
                onClick={handleSubmitAnswer}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs disabled:opacity-40 transition font-mono"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1 transition font-mono"
              >
                <span>{currentQuestionIndex + 1 < questions.length ? 'Next Question' : 'Finish Quiz'}</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Quiz Finished Summary */
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-6 font-mono text-xs">
          <div className="w-16 h-16 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center justify-center mx-auto text-2xl">
            <Award size={32} />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Assessment Complete!</h2>
            <p className="text-slate-400">Topic: {selectedTopic === 'all' ? 'General Networking' : selectedTopic}</p>
          </div>

          <div className="text-4xl font-extrabold text-cyan-400">
            {score} / {questions.length} ({Math.round((score / Math.max(1, questions.length)) * 100)}%)
          </div>

          <div className="flex justify-center space-x-3 pt-4">
            <button
              onClick={handleResetQuiz}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition"
            >
              <RotateCcw size={14} />
              <span>Retry Assessment</span>
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition"
            >
              <span>View Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
