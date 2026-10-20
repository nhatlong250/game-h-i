import React, { useState, useEffect } from 'react';
import { Chapter } from '../game/types';
import { CHAPTERS } from '../game/storyData';
import { RECIPES } from '../game/recipes';
import { soundManager } from '../game/audio';
import {
  ArrowLeft,
  Play,
  Lock,
  CheckCircle2,
  Clock,
  Target,
  ChefHat,
  BookOpen,
  UserCheck,
  Sparkles,
  Award,
  ShoppingBag,
  DollarSign,
} from 'lucide-react';

interface ChapterSelectionModalProps {
  bankBalance: number;
  unlockedChapterId: number;
  onSelectChapter: (chapter: Chapter) => void;
  onOpenStoryOnly?: (chapter: Chapter) => void;
  onBackToTitle: () => void;
  onOpenCharacter: () => void;
  onOpenShop: () => void;
  onOpenRecipeBook: () => void;
}

export const ChapterSelectionModal: React.FC<ChapterSelectionModalProps> = ({
  bankBalance,
  unlockedChapterId,
  onSelectChapter,
  onOpenStoryOnly,
  onBackToTitle,
  onOpenCharacter,
  onOpenShop,
  onOpenRecipeBook,
}) => {
  const [activeStoryChapter, setActiveStoryChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    soundManager.speakGameAction('chapter_select');
  }, []);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-8 md:p-10 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 overflow-y-auto pointer-events-auto select-none">
      
      {/* --- TOP HEADER BAR --- */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToTitle}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs sm:text-sm font-bold transition border border-neutral-700 shadow-xl cursor-pointer hover:border-amber-400"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>🚪 Trang Đầu</span>
          </button>

          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-400">
              <Sparkles className="w-3.5 h-3.5" /> Hành Trình Ẩm Thực & Trưởng Thành Của Duyên
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-100 flex items-center gap-2.5 mt-0.5">
              <ChefHat className="w-7 h-7 text-amber-400" /> Các Chương Cốt Truyện
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bank balance counter */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-neutral-900/90 border border-emerald-500/50 shadow-inner">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-black text-emerald-400 tabular-nums">
              {bankBalance.toLocaleString('vi-VN')}đ
            </span>
            <span className="text-[10px] text-neutral-400 hidden sm:inline">vốn tích lũy</span>
          </div>

          <button
            onClick={onOpenShop}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition shadow-xl cursor-pointer"
            title="Mở Cửa Hàng Nâng Cấp Thiết Bị Bếp"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cửa Hàng Bếp</span>
          </button>

          <button
            onClick={onOpenRecipeBook}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-300 text-xs sm:text-sm font-bold transition shadow-xl cursor-pointer hover:border-amber-400"
            title="Mở Sổ Tay Công Thức"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Sổ Tay Món Ăn</span>
          </button>

          <button
            onClick={onOpenCharacter}
            type="button"
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-amber-500/50 text-amber-300 text-xs sm:text-sm font-bold transition shadow-xl cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>CAS 3D Duyên</span>
          </button>
        </div>
      </div>

      {/* --- CHAPTERS GRID --- */}
      <div className="py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto w-full">
        {CHAPTERS.map(chapter => {
          const isUnlocked = chapter.id <= unlockedChapterId;
          const isCompleted = chapter.id < unlockedChapterId;

          return (
            <div
              key={chapter.id}
              className={`relative rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                isUnlocked
                  ? 'bg-neutral-900/90 border-amber-500/40 hover:border-amber-400 shadow-2xl hover:shadow-amber-500/10'
                  : 'bg-neutral-950/70 border-neutral-800/60 opacity-65'
              }`}
            >
              <div className="space-y-4">
                {/* Chapter tag & badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                      {chapter.title}
                    </span>
                    {isCompleted && (
                      <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã Hoàn Thành
                      </span>
                    )}
                  </div>

                  {!isUnlocked ? (
                    <div className="flex items-center gap-1 text-xs text-neutral-400 font-bold bg-neutral-900/80 px-2.5 py-1 rounded-full border border-neutral-800">
                      <Lock className="w-3.5 h-3.5 text-neutral-400" /> Cần hoàn thành Chương {chapter.id - 1}
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400/80 font-mono font-bold">
                      {chapter.shiftDuration}s · {chapter.targetScore}đ
                    </span>
                  )}
                </div>

                {/* Subtitle & Lore */}
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-white">{chapter.subtitle}</h3>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">{chapter.lore}</p>
                </div>

                {/* Menu items for this shift */}
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider block mb-1.5">
                    Thực đơn ca nấu:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {chapter.availableRecipeIds.map(recId => {
                      const recipe = RECIPES.find(r => r.id === recId);
                      return (
                        <span
                          key={recId}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 font-semibold shadow-inner"
                        >
                          <span className="text-base">{recipe?.icon || '🍽️'}</span>
                          <span>{recipe?.vietnameseName}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Target & Time specs */}
                <div className="flex items-center gap-5 text-xs text-neutral-400 pt-1 border-t border-neutral-800/80">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-400" /> Mục tiêu điểm: <strong className="text-amber-300 tabular-nums">{chapter.targetScore}đ</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-400" /> Thời gian ca: <strong className="text-neutral-200 tabular-nums">{chapter.shiftDuration} giây</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons for Chapter */}
              <div className="pt-6 mt-4 border-t border-neutral-800 flex flex-wrap sm:flex-nowrap gap-2.5">
                {/* 1. Button Read Story */}
                <button
                  onClick={() => setActiveStoryChapter(chapter)}
                  type="button"
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold text-xs transition cursor-pointer hover:border-amber-400 shadow-md"
                  title="Xem cốt truyện và hội thoại của chương này"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Cốt Truyện</span>
                </button>

                {/* 2. Button Start Cooking Shift */}
                {isUnlocked ? (
                  <button
                    onClick={() => onSelectChapter(chapter)}
                    type="button"
                    className="w-full sm:flex-[1.5] flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs sm:text-sm transition shadow-xl shadow-amber-500/20 active:scale-98 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-neutral-950" />
                    <span>{isCompleted ? 'CHƠI LẠI CA NÀY' : 'VÀO CA NẤU NGAY'}</span>
                  </button>
                ) : (
                  <div className="w-full sm:flex-[1.5] py-3 text-center text-xs text-neutral-400 font-bold bg-neutral-900/50 rounded-2xl border border-neutral-800/60">
                    🔒 Khóa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- FOOTER BAR --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 pt-6 border-t border-neutral-800">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Game nấu ăn 3D theo chân Duyên · Phiên bản Google Ambassador & The Sims 3</span>
        </div>

        <button
          onClick={onBackToTitle}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer border border-neutral-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Trang Đầu</span>
        </button>
      </div>

      {/* --- STORY VIEWER MODAL (When clicking 'Cốt Truyện' on any chapter) --- */}
      {activeStoryChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-neutral-950 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {activeStoryChapter.title} · Cốt Truyện
                </span>
                <h3 className="text-xl font-black text-white">{activeStoryChapter.subtitle}</h3>
              </div>
              <button
                onClick={() => setActiveStoryChapter(null)}
                type="button"
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm leading-relaxed">
              <strong>Bối cảnh:</strong> {activeStoryChapter.lore}
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                Trích đoạn hội thoại chính:
              </span>
              {activeStoryChapter.introDialogues.map((diag, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">{diag.speaker}</span>
                    <span className="text-[10px] text-neutral-400">({diag.role})</span>
                  </div>
                  <p className="text-sm text-neutral-200 leading-relaxed font-normal">"{diag.text}"</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end gap-3">
              <button
                onClick={() => setActiveStoryChapter(null)}
                type="button"
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-700 cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const ch = activeStoryChapter;
                  setActiveStoryChapter(null);
                  onSelectChapter(ch);
                }}
                type="button"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black transition cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-neutral-950" />
                <span>Bắt Đầu Chương Này</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
