import React, { useEffect } from 'react';
import { Play, UserCheck, BookOpen, Sparkles, Award, ChefHat, ShoppingBag, DollarSign } from 'lucide-react';

interface TitleScreenProps {
  bankBalance: number;
  onStartGame: () => void;
  onOpenChapters: () => void;
  onOpenCharacter: () => void;
  onOpenPrologue: () => void;
  onOpenShop: () => void;
  onOpenRecipeBook: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  bankBalance,
  onStartGame,
  onOpenChapters,
  onOpenCharacter,
  onOpenPrologue,
  onOpenShop,
  onOpenRecipeBook,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        onOpenChapters();
      } else if (e.code === 'KeyB') {
        onOpenRecipeBook();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onOpenChapters, onOpenRecipeBook]);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    action();
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-12 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-transparent pointer-events-auto select-none overflow-y-auto">
      
      {/* Top Header info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/90 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-lg">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Google Ambassador 2026 Edition · Game Nấu Ăn 3D</span>
        </div>

        {/* Bank & Character quick actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={(e) => handleAction(e, onOpenShop)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-emerald-500/50 text-emerald-300 text-xs font-bold transition shadow-xl cursor-pointer"
            title="Mở Cửa Hàng Nâng Cấp Thiết Bị Bếp"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="tabular-nums font-black">{bankBalance.toLocaleString('vi-VN')}đ</span>
            <span className="hidden sm:inline text-neutral-400 font-normal">vốn tích lũy</span>
          </button>

          <button
            onClick={(e) => handleAction(e, onOpenCharacter)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-amber-500/40 text-amber-300 text-xs font-bold transition shadow-xl cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Hồ Sơ & Diện Mạo Duyên (3D)</span>
            <span className="sm:hidden">Duyên 3D</span>
          </button>
        </div>
      </div>

      {/* Center Title Lockup over negative space */}
      <div className="max-w-2xl space-y-6 my-auto py-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" /> Trải Nghiệm Ẩm Thực Góc Nhìn Thứ Nhất
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white flex flex-col drop-shadow-2xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 font-serif italic">
              DUYÊN
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-sans tracking-wide text-neutral-200 uppercase font-light mt-1">
              CĂN BẾP KHỞI ĐẦU
            </span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 max-w-xl leading-relaxed pt-2">
            Hóa thân thành Duyên — cô gái 21 tuổi bước vào giai đoạn tốt nghiệp đại học kiêm Google Ambassador. Trực tiếp di chuyển trong căn bếp 3D, lấy nguyên liệu, thái gọt trên thớt, chiên trứng xèo xèo và hoàn thành các đơn hàng Bánh Mì Ốp La & Cơm Chiên theo từng chương cốt truyện!
          </p>
        </div>

        {/* Primary Start CTA & Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <button
            onClick={(e) => handleAction(e, onOpenChapters)}
            className="group flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-base sm:text-lg transition shadow-xl shadow-amber-500/25 active:scale-95 cursor-pointer"
          >
            <ChefHat className="w-6 h-6 fill-neutral-950 transition transform group-hover:scale-110" />
            <span>CHỌN CHƯƠNG & BẮT ĐẦU</span>
          </button>

          <button
            onClick={(e) => handleAction(e, onOpenShop)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-emerald-500/50 text-emerald-300 font-bold text-sm transition cursor-pointer shadow-lg hover:border-emerald-400"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Cửa Hàng Thiết Bị Bếp</span>
          </button>

          <button
            onClick={(e) => handleAction(e, onOpenRecipeBook)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-amber-300 font-bold text-sm transition cursor-pointer shadow-lg hover:border-amber-400"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Sổ Tay Món Ăn [B]</span>
          </button>

          <button
            onClick={(e) => handleAction(e, onOpenPrologue)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-neutral-900/70 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-semibold text-xs sm:text-sm transition cursor-pointer"
          >
            <span>Cốt Truyện Mở Đầu</span>
          </button>
        </div>
      </div>

      {/* Flat Control Hint Line */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400 pt-4 border-t border-neutral-800/60 font-mono">
        <div>
          <span className="text-neutral-200 font-bold">WASD</span> Di chuyển · <span className="text-neutral-200 font-bold">Chuột</span> Quan sát · <span className="text-neutral-200 font-bold">E / Click</span> Thao tác · <span className="text-neutral-200 font-bold">Esc</span> Tạm dừng
        </div>
        <div className="text-neutral-400 text-[11px]">
          Nhấn <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-semibold">Space</kbd> hoặc <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-semibold">Enter</kbd> để vào game
        </div>
      </div>

    </div>
  );
};
