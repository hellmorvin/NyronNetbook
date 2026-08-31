import React, { useState } from 'react';
import {
  GraduationCap,
  X,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBrainStore } from '../../store/useBrainStore';

interface Flashcard {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
}

const SAMPLE_QUIZ: Flashcard[] = [
  {
    topic: 'Основы',
    question: 'Как связывать заметки между собой в NyronNotebook?',
    options: [
      'Через вики-ссылки [[Название заметки]]',
      'Только через экспорт файлов',
      'Связи формируются только вручную через код',
      'Через системный реестр Windows',
    ],
    correctAnswer: 'Через вики-ссылки [[Название заметки]]',
    explanation: 'Двойные квадратные скобки [[Имя заметки]] мгновенно соединяют нейроны в интерактивном графе.',
  },
];

export const QuizModal: React.FC = () => {
  const { isQuizOpen, setQuizOpen, activeNeuronId, setLearningState } = useBrainStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!isQuizOpen) return null;

  const currentCard = SAMPLE_QUIZ[currentIndex];

  const handleSelectOption = (option: string) => {
    if (isAnswered || !currentCard) return;
    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === currentCard.correctAnswer;
    if (isCorrect) {
      setScore((s) => s + 1);
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#7c5cff', '#f59e0b', '#10b981'],
      });
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < SAMPLE_QUIZ.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      if (activeNeuronId) {
        setLearningState(activeNeuronId, 'mastered');
      }
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#7c5cff', '#10b981', '#ffffff'],
      });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in"
      onClick={() => setQuizOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/[0.12] overflow-hidden shadow-2xl bg-[#14151c] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#111217]">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-white">
              Экзамен и активное припоминание
            </h3>
          </div>
          <button
            onClick={() => setQuizOpen(false)}
            className="p-1 rounded-md text-[#94a3b8] hover:text-white hover:bg-white/[0.08]"
          >
            <X size={15} />
          </button>
        </div>

        {/* Quiz Body */}
        <div className="p-6">
          {!isFinished && currentCard ? (
            <div className="space-y-4">
              {/* Progress & Topic */}
              <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <span className="px-2 py-0.5 rounded-md bg-[#191a22] border border-white/[0.08] text-[#7c5cff] font-medium text-[11px]">
                  {currentCard.topic}
                </span>
                <span>
                  Вопрос {currentIndex + 1} из {SAMPLE_QUIZ.length}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-sm font-semibold text-white leading-relaxed">
                {currentCard.question}
              </h2>

              {/* Options */}
              <div className="space-y-2">
                {currentCard.options.map((opt) => {
                  const isChosen = selectedOption === opt;
                  const isCorrect = opt === currentCard.correctAnswer;

                  let btnStyle = 'bg-[#161720] border-white/[0.08] text-[#cbd5e1] hover:bg-[#1c1e28]';
                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-[#10b981]/20 border-[#10b981] text-white font-medium';
                    } else if (isChosen) {
                      btnStyle = 'bg-[#f43f5e]/20 border-[#f43f5e] text-white';
                    } else {
                      btnStyle = 'bg-white/[0.02] border-white/5 text-[#64748b] opacity-40';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(opt)}
                      disabled={isAnswered}
                      className={`w-full p-3 text-left rounded-xl border text-xs transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                    >
                      <span className="leading-relaxed">{opt}</span>
                      {isAnswered && isCorrect && (
                        <CheckCircle2 size={15} className="text-[#10b981] shrink-0" />
                      )}
                      {isAnswered && isChosen && !isCorrect && (
                        <XCircle size={15} className="text-[#f43f5e] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (when answered) */}
              {isAnswered && (
                <div className="p-3 rounded-xl bg-[#161720] border border-white/[0.08] text-xs text-[#94a3b8] space-y-1 animate-fade-in">
                  <span className="font-semibold text-white">Объяснение:</span>
                  <p className="leading-relaxed">{currentCard.explanation}</p>
                </div>
              )}

              {/* Next Button */}
              {isAnswered && (
                <button
                  onClick={handleNext}
                  className="w-full py-2.5 rounded-xl bg-[#7c5cff] text-white font-semibold text-xs hover:bg-[#7c5cff]/90 glow-iris transition-all flex items-center justify-center gap-2"
                >
                  <span>{currentIndex + 1 < SAMPLE_QUIZ.length ? 'Следующий вопрос' : 'Завершить экзамен'}</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          ) : (
            /* Results Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#f59e0b]/15 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b] mx-auto">
                <Trophy size={28} />
              </div>
              <h2 className="text-base font-bold text-white">Сессия повторения завершена</h2>
              <p className="text-xs text-[#94a3b8]">
                Ваш результат:{' '}
                <strong className="text-[#f59e0b] font-bold">{score} из {SAMPLE_QUIZ.length}</strong>
              </p>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={handleRestart}
                  className="px-3.5 py-2 rounded-xl bg-[#161720] border border-white/[0.08] text-xs text-white hover:bg-white/[0.06] flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Повторить</span>
                </button>
                <button
                  onClick={() => setQuizOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#7c5cff] text-white font-medium text-xs hover:bg-[#7c5cff]/90"
                >
                  Вернуться
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
