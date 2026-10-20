import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ShiftStats } from '../game/types';
import { Trophy, Star, RotateCcw, ArrowRight, User, LogOut, CheckCircle2, AlertCircle, ShoppingBag, DollarSign, BookOpen, Sparkles } from 'lucide-react';

interface ShiftResultModalProps {
  stats: ShiftStats;
  earnedBank?: number;
  totalBank?: number;
  onPlayAgain: () => void;
  onProceedEpilogue: () => void;
  onExitToChapters: () => void;
  onOpenCharacter: () => void;
  onOpenShop?: () => void;
  onOpenRecipeBook?: () => void;
}

export const ShiftResultModal: React.FC<ShiftResultModalProps> = ({
  stats,
  earnedBank = 0,
  totalBank = 0,
  onPlayAgain,
  onProceedEpilogue,
  onExitToChapters,
  onOpenCharacter,
  onOpenShop,
  onOpenRecipeBook,
}) => {
  useEffect(() => {
    if (stats.passed || stats.rank === 'S' || stats.rank === 'A') {
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  }, [stats.passed, stats.rank]);

  const getRankColor = (rank: ShiftStats['rank']) => {
    switch (rank) {
      case 'S': return 'text-amber-400 border-amber-400 bg-amber-400/10 shadow-amber-500/30';
      case 'A': return 'text-emerald-400 border-emerald-400 bg-emerald-400/10 shadow-emerald-500/30';
      case 'B': return 'text-blue-400 border-blue-400 bg-blue-400/10 shadow-blue-500/30';
      default: return 'text-neutral-400 border-neutral-400 bg-neutral-400/10 shadow-neutral-500/30';
    }
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    action();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto select-none animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-lg bg-neutral-950 border-2 border-neutral-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-center space-y-6">
        
        {/* Header Tag */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            {stats.passed ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn Thành Mục Tiêu Chương {stats.chapterId}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5" /> Cần Thêm Điểm Để Mở Khóa Chương Mới
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white pt-1">
            Tổng Kết Ca Nấu
          </h2>
        </div>

        {/* Rank Badge */}
        <div className="flex flex-col items-center">
          <div className={`w-24 h-24 rounded-3xl border-4 flex items-center justify-center font-black text-5xl shadow-2xl ${getRankColor(stats.rank)}`}>
            {stats.rank}
          </div>
          <span className="text-xs text-neutral-300 mt-2 font-semibold">
            {stats.rank === 'S' ? '🌟 Đầu Bếp Xuất Sắc!' : stats.rank === 'A' ? '✨ Phục Vụ Rất Tốt!' : '👍 Hoàn Thành Ca Nấu!'}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Tổng Điểm Đạt Được</span>
            <span className="text-2xl font-black text-amber-400 tabular-nums">{stats.score} đ</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Tiền Tip Thưởng</span>
            <span className="text-2xl font-black text-emerald-400 tabular-nums">+{stats.totalTips} đ</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Đơn Hoàn Thành</span>
            <span className="text-xl font-bold text-neutral-100 tabular-nums">{stats.ordersServed} món</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Độ Chính Xác</span>
            <span className="text-xl font-bold text-neutral-100 tabular-nums">{stats.accuracy}%</span>
          </div>
        </div>

        {/* Bank Earnings Card */}
        {earnedBank > 0 && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-neutral-900 border border-emerald-500/40 text-left flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Tiền Vốn Tích Lũy Ca Này</span>
                <span className="text-lg font-black text-emerald-400 tabular-nums">+{earnedBank.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block font-semibold">Tổng vốn hiện có</span>
              <span className="text-sm font-black text-white tabular-nums">{totalBank.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        )}

        {/* Commentary */}
        <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 leading-relaxed text-left italic">
          "Tay nghề của Duyên rất vững và tinh thần cầu tiến đáng khen. Từng đĩa món ăn thơm lừng đem lại niềm vui thật sự cho mọi người." — Chú Ba
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            onClick={(e) => handleAction(e, onProceedEpilogue)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm transition shadow-xl shadow-amber-500/25 cursor-pointer"
          >
            <span>Xem Cốt Truyện Kết Ca & Nhận Xét</span> <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          {onOpenShop && (
            <button
              onClick={(e) => handleAction(e, onOpenShop)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" /> <span>🛒 Ghé Cửa Hàng Nâng Cấp Thiết Bị Bếp</span>
            </button>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={(e) => handleAction(e, onPlayAgain)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold text-xs transition border border-neutral-700 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> <span>Nấu Lại</span>
            </button>

            {onOpenRecipeBook && (
              <button
                onClick={(e) => handleAction(e, onOpenRecipeBook)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 font-bold text-xs transition border border-neutral-700 cursor-pointer hover:border-amber-400"
              >
                <BookOpen className="w-4 h-4" /> <span>Sổ Tay</span>
              </button>
            )}

            <button
              onClick={(e) => handleAction(e, onExitToChapters)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-red-400 hover:text-red-300 font-bold text-xs transition border border-red-500/30 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> <span>Thoát Ra</span>
            </button>
          </div>
        </div>

        <button
          onClick={(e) => handleAction(e, onOpenCharacter)}
          className="text-xs text-neutral-400 hover:text-amber-400 transition inline-flex items-center gap-1.5 cursor-pointer"
        >
          <User className="w-3.5 h-3.5" /> Xem hồ sơ & mô hình 3D Duyên
        </button>

      </div>
    </div>
  );
};
