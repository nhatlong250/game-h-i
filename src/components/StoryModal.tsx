import React, { useState, useEffect } from 'react';
import { DialogueNode } from '../game/types';
import { soundManager } from '../game/audio';
import { Volume2, ChevronRight, User, FastForward, ArrowLeft } from 'lucide-react';

interface StoryModalProps {
  dialogues: DialogueNode[];
  onComplete: () => void;
  onExit?: () => void;
  title: string;
}

export const StoryModal: React.FC<StoryModalProps> = ({ dialogues, onComplete, onExit, title }) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>(dialogues[0]?.id || '');
  const [selectedImpact, setSelectedImpact] = useState<string | null>(null);

  const currentNode = dialogues.find(d => d.id === currentNodeId) || dialogues[0];

  useEffect(() => {
    if (currentNode?.text) {
      soundManager.speakVietnamese(currentNode.text);
    }
  }, [currentNode]);

  const handleNext = () => {
    if (currentNode?.next) {
      setCurrentNodeId(currentNode.next);
    } else {
      onComplete();
    }
  };

  const handleChoice = (nextNodeId: string, impactDescription?: string) => {
    if (impactDescription) {
      setSelectedImpact(impactDescription);
    }
    setCurrentNodeId(nextNodeId);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    action();
  };

  if (!currentNode) return null;

  const isDuyen = currentNode.speaker.includes('Duyên');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 bg-black/75 backdrop-blur-md pointer-events-auto select-none animate-in fade-in">
      <div className="w-full max-w-4xl bg-neutral-950 border-2 border-amber-500/50 rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden">
        
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            {onExit && (
              <button
                onClick={(e) => handleAction(e, onExit)}
                type="button"
                className="flex items-center gap-1.5 text-xs text-neutral-200 hover:text-white px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 transition cursor-pointer font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>🚪 Thoát Ra</span>
              </button>
            )}
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">{title}</span>
            {selectedImpact && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                ✨ {selectedImpact}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleAction(e, () => soundManager.speakVietnamese(currentNode.text))}
              className="flex items-center gap-1 text-xs text-neutral-300 hover:text-amber-400 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 transition cursor-pointer"
              title="Đọc lại lời thoại"
            >
              <Volume2 className="w-3.5 h-3.5" /> Phát lại
            </button>

            <button
              onClick={(e) => handleAction(e, onComplete)}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 transition cursor-pointer"
              title="Bỏ qua hội thoại"
            >
              <FastForward className="w-3.5 h-3.5" /> Bỏ qua
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Avatar representation */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border-2 border-amber-500/60 bg-gradient-to-tr from-amber-950 to-neutral-900 flex items-center justify-center shadow-xl">
            {isDuyen ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-amber-950/40 text-amber-200">
                <span className="text-3xl">👩‍🍳</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mt-1">Duyên (21t)</span>
              </div>
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-200">
                <User className="w-9 h-9 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 mt-1">Chú Ba</span>
              </div>
            )}
          </div>

          {/* Dialogue text */}
          <div className="flex-1 space-y-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-lg font-black text-amber-300">{currentNode.speaker}</span>
              <span className="text-xs text-neutral-400 font-medium">({currentNode.role})</span>
            </div>

            <p className="text-neutral-100 text-base sm:text-lg leading-relaxed font-normal">
              "{currentNode.text}"
            </p>

            {/* Branching choices if available */}
            {currentNode.choices && currentNode.choices.length > 0 ? (
              <div className="pt-3 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Lựa chọn câu trả lời của Duyên:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {currentNode.choices.map((choice, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => handleAction(e, () => handleChoice(choice.nextNodeId, choice.impactDescription))}
                      className="text-left p-3.5 rounded-2xl bg-neutral-900 hover:bg-amber-500/20 hover:border-amber-400 border border-neutral-700 text-sm text-neutral-100 font-medium transition flex items-center justify-between group cursor-pointer shadow-md"
                    >
                      <span>👉 {choice.text}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 transition transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-4 flex justify-end">
                <button
                  onClick={(e) => handleAction(e, handleNext)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm transition shadow-xl shadow-amber-500/25 cursor-pointer active:scale-95"
                >
                  <span>{currentNode.next ? 'Tiếp Tục Lời Thoại' : 'Bắt Đầu Ca Nấu'}</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
