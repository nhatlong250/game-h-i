import React, { useState, useEffect } from 'react';
import { ActiveOrder, ItemHeld, Chapter } from '../game/types';
import { RECIPES } from '../game/recipes';
import {
  Clock,
  DollarSign,
  BookOpen,
  Settings,
  User,
  ChevronDown,
  ChevronUp,
  LogOut,
  MousePointer,
  Play,
  Target,
  Home,
  ArrowDownToLine,
  ShoppingBag,
  Flame,
  Sparkles,
  Camera,
} from 'lucide-react';

interface HUDProps {
  orders: ActiveOrder[];
  itemHeld: ItemHeld | null;
  prompt: string | null;
  score: number;
  tips: number;
  combo?: number;
  timeLeft: number;
  currentChapter: Chapter | null;
  isThirdPerson?: boolean;
  onToggleCameraMode?: () => void;
  onOpenSettings: () => void;
  onOpenCharacter: () => void;
  onOpenRecipeBook: () => void;
  onOpenShop: () => void;
  onExitShift: () => void;
  onExitToTitle?: () => void;
  onTogglePointerLock: () => void;
  onDropItem?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  orders,
  itemHeld,
  prompt,
  score,
  tips,
  combo = 0,
  timeLeft,
  currentChapter,
  isThirdPerson = false,
  onToggleCameraMode,
  onOpenSettings,
  onOpenCharacter,
  onOpenRecipeBook,
  onOpenShop,
  onExitShift,
  onExitToTitle,
  onTogglePointerLock,
  onDropItem,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);

  // Listen to keyboard shortcut [P] or [Escape] for pause, [B] for recipe book
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        document.exitPointerLock?.();
        setIsPauseMenuOpen(prev => !prev);
      } else if (e.code === 'KeyB') {
        document.exitPointerLock?.();
        onOpenRecipeBook();
      } else if (e.code === 'Tab') {
        e.preventDefault();
        onTogglePointerLock();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onTogglePointerLock, onOpenRecipeBook]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    document.exitPointerLock?.();
    action();
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-3 sm:p-6 overflow-hidden">
      
      {/* --- TOP ROW: Orders Cluster, Chapter Goal & Exit Bar --- */}
      <div className="flex justify-between items-start w-full gap-3">
        
        {/* Left: Active Orders Bar */}
        <div className="flex flex-col gap-2 max-w-md pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300 drop-shadow flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /> Đơn Hàng Cần Giao ({orders.length}/3)
            </span>
            {currentChapter && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-900/90 border border-neutral-700 text-neutral-300 font-semibold">
                {currentChapter.title}: {currentChapter.subtitle}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {orders.map(order => {
              const recipe = RECIPES.find(r => r.id === order.recipeId);
              const progress = Math.max(0, Math.min(100, (order.timeLeft / order.maxTime) * 100));
              const isUrgent = progress < 30;

              return (
                <div
                  key={order.id}
                  className={`w-40 sm:w-44 p-2.5 rounded-2xl border bg-neutral-950/95 shadow-xl transition-all ${
                    isUrgent ? 'border-red-500 ring-2 ring-red-500/30' : 'border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-neutral-100 truncate max-w-[100px]">{order.customerName}</span>
                    <span className="text-xl leading-none">{recipe?.icon || '🍽️'}</span>
                  </div>

                  <div className="text-[11px] font-semibold text-amber-300 truncate mb-1">
                    {recipe?.vietnameseName}
                  </div>

                  {/* Patience Bar */}
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        progress > 50 ? 'bg-emerald-500' : progress > 25 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1 tabular-nums font-mono">
                    <span>{Math.ceil(order.timeLeft)}s</span>
                    <span className="text-emerald-400 font-bold">+{order.totalScore}đ</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Stats, Combo Streak, Free Cursor & Unmistakable EXIT BUTTON */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Combo Streak Banner */}
          {combo > 1 && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 text-neutral-950 font-black text-xs shadow-xl shadow-orange-500/30 border border-yellow-300 animate-pulse">
              <Flame className="w-4 h-4 fill-neutral-950 text-neutral-950" />
              <span>COMBO x{combo}!</span>
              <span className="text-[10px] bg-neutral-950/20 px-1.5 py-0.5 rounded-full font-extrabold text-neutral-950">+{combo * 30}đ</span>
            </div>
          )}

          {/* Target Score / Progress */}
          {currentChapter && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-neutral-900/90 border border-neutral-700/80 text-xs font-semibold text-neutral-300 shadow-lg">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Mục tiêu: <strong className="text-amber-300 tabular-nums">{score}/{currentChapter.targetScore}đ</strong></span>
            </div>
          )}

          {/* Time & Earnings Cluster */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-neutral-950/95 border border-amber-500/40 rounded-2xl px-3.5 py-2 shadow-xl">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs sm:text-sm font-bold tabular-nums">
              <Clock className="w-4 h-4 text-amber-400" /> {formatTime(timeLeft)}
            </div>
            <div className="h-4 w-[1px] bg-neutral-800" />
            <div className="flex items-center gap-1 text-emerald-400 text-xs sm:text-sm font-bold tabular-nums">
              <DollarSign className="w-4 h-4 text-emerald-400" /> {score} <span className="text-[10px] font-normal text-neutral-400 hidden sm:inline">({tips} tip)</span>
            </div>
          </div>

          {/* Toggle 3D 1st / 3rd Person View */}
          {onToggleCameraMode && (
            <button
              onClick={(e) => handleAction(e, onToggleCameraMode)}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition shadow-lg cursor-pointer ${
                isThirdPerson
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-700 text-neutral-200'
              }`}
              title="Chuyển đổi Góc nhìn 1st Person / 3rd Person nhân vật Duyên [Phím V]"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{isThirdPerson ? 'Góc Nhìn 3D Duyên [V]' : 'Góc Nhìn Thứ Nhất [V]'}</span>
              <span className="sm:hidden">{isThirdPerson ? '3D [V]' : '1P [V]'}</span>
            </button>
          )}

          {/* Toggle Free Cursor Button */}
          <button
            onClick={(e) => handleAction(e, onTogglePointerLock)}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold transition shadow-lg cursor-pointer"
            title="Bật/Tắt khóa chuột (Phím [Tab])"
          >
            <MousePointer className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Chuột [Tab]</span>
          </button>

          {/* PROMINENT EXIT / PAUSE BUTTON */}
          <button
            onClick={(e) => handleAction(e, () => setIsPauseMenuOpen(true))}
            type="button"
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition shadow-xl shadow-red-600/30 cursor-pointer active:scale-95"
            title="Tạm dừng ca nấu và mở menu thoát [ESC / P]"
          >
            <LogOut className="w-4 h-4" />
            <span>🚪 Thoát [ESC]</span>
          </button>
        </div>
      </div>

      {/* --- CENTER VIEWPORT: Reticle & Interactive Prompt --- */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-white/80 bg-black/40 mb-8 shadow-sm" />

        {/* Dynamic Context Prompt */}
        {prompt && (
          <div className="px-5 py-2.5 rounded-2xl bg-neutral-950/95 border-2 border-amber-400 text-amber-300 text-sm font-bold tracking-wide shadow-2xl animate-in zoom-in-95 duration-150">
            {prompt}
          </div>
        )}
      </div>

      {/* Held Item Badge (Lower-Right) with Drop / Put Down Button */}
      {itemHeld && (
        <div className="absolute bottom-24 right-4 sm:right-6 pointer-events-auto bg-neutral-950/95 border-2 border-emerald-500/80 rounded-2xl p-3 sm:p-3.5 shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
            {itemHeld.type === 'plate' ? '🍽️' : itemHeld.ingredient === 'bread' ? '🥖' : itemHeld.ingredient === 'raw_egg' ? '🥚' : itemHeld.ingredient === 'cucumber' ? '🥒' : itemHeld.ingredient === 'sausage' ? '🌭' : '🍳'}
          </div>
          <div className="min-w-[120px] max-w-[180px]">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">Đang cầm trên tay:</span>
            <span className="text-sm font-black text-neutral-100 truncate block">{itemHeld.name}</span>
            {itemHeld.plateContents && itemHeld.plateContents.length > 0 && (
              <span className="text-[10px] text-neutral-400 block mt-0.5 truncate">
                {itemHeld.plateContents.length} món trên đĩa
              </span>
            )}
          </div>
          {onDropItem && (
            <button
              onClick={(e) => handleAction(e, onDropItem)}
              type="button"
              className="flex flex-col items-center justify-center px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition shadow-md cursor-pointer active:scale-95 border border-amber-300"
              title="Đặt món xuống bàn gần nhất hoặc bỏ tay (Phím Q hoặc Chuột Phải)"
            >
              <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[10px] leading-tight mt-0.5 font-bold">Đặt xuống [Q]</span>
            </button>
          )}
        </div>
      )}

      {/* --- BOTTOM COLLAPSIBLE DOCK --- */}
      <div className="w-full flex flex-col items-center pointer-events-auto">
        <button
          onClick={(e) => handleAction(e, () => setIsDockCollapsed(!isDockCollapsed))}
          type="button"
          className="mb-1.5 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-neutral-900/90 border border-neutral-700/90 text-[11px] font-semibold text-neutral-300 hover:text-white transition shadow-md cursor-pointer"
        >
          {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {isDockCollapsed ? 'Hiện Thanh Công Cụ Bếp' : 'Ẩn Thanh Công Cụ'}
        </button>

        {!isDockCollapsed && (
          <div className="w-full max-w-4xl bg-neutral-950/95 border border-neutral-700/80 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
            {/* Left Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleAction(e, onOpenRecipeBook)}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md transition cursor-pointer"
                title="Mở Sổ Tay Công Thức (Phím [B])"
              >
                <BookOpen className="w-4 h-4" /> Sổ Tay [B]
              </button>

              <button
                onClick={(e) => handleAction(e, onOpenShop)}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition cursor-pointer"
                title="Mở Cửa Hàng Nâng Cấp Thiết Bị Bếp"
              >
                <ShoppingBag className="w-4 h-4" /> Cửa Hàng Bếp
              </button>

              <button
                onClick={(e) => handleAction(e, onOpenCharacter)}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 transition cursor-pointer"
              >
                <User className="w-4 h-4 text-amber-400" /> Tùy Chỉnh 3D Duyên
              </button>
            </div>

            {/* Quick Control Hints */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-neutral-200 font-bold">WASD</span> Di chuyển
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-neutral-200 font-bold">Shift</span> Chạy nhanh
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-neutral-200 font-bold">E / Click</span> Nấu
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-neutral-200 font-bold">Q / Chuột Phải</span> Đặt xuống
            </div>

            {/* Right Settings & Exit */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleAction(e, onOpenSettings)}
                type="button"
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer border border-neutral-700"
                title="Cài đặt trò chơi"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => handleAction(e, () => setIsPauseMenuOpen(true))}
                type="button"
                className="px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                title="Tạm dừng / Thoát ca"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Thoát</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- PAUSE / EXIT MENU MODAL --- */}
      {isPauseMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto">
          <div className="w-full max-w-md bg-neutral-950 border-2 border-neutral-700 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-1">
                Tạm Dừng Trò Chơi [ESC]
              </span>
              <h3 className="text-2xl font-black text-white">
                {currentChapter ? `${currentChapter.title}: ${currentChapter.subtitle}` : 'Căn Bếp Khởi Đầu'}
              </h3>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={(e) => handleAction(e, () => setIsPauseMenuOpen(false))}
                type="button"
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Play className="w-4 h-4 fill-neutral-950" /> Tiếp Tục Ca Nấu
              </button>

              <button
                onClick={(e) => handleAction(e, () => { setIsPauseMenuOpen(false); onOpenRecipeBook(); })}
                type="button"
                className="w-full py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100 font-bold text-xs transition border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-400" /> Xem Sổ Tay Công Thức [B]
              </button>

              <button
                onClick={(e) => handleAction(e, () => { setIsPauseMenuOpen(false); onOpenShop(); })}
                type="button"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 font-bold text-xs transition border border-emerald-500/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" /> Cửa Hàng Nâng Cấp Thiết Bị Bếp
              </button>

              <button
                onClick={(e) => handleAction(e, () => { setIsPauseMenuOpen(false); onOpenCharacter(); })}
                type="button"
                className="w-full py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100 font-bold text-xs transition border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 text-emerald-400" /> Tùy Chỉnh 3D Duyên (The Sims 3 CAS)
              </button>

              <button
                onClick={(e) => handleAction(e, () => { setIsPauseMenuOpen(false); onOpenSettings(); })}
                type="button"
                className="w-full py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100 font-bold text-xs transition border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-neutral-300" /> Cài Đặt Âm Lượng & Độ Nhạy
              </button>

              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <button
                  onClick={(e) => handleAction(e, () => { setIsPauseMenuOpen(false); onExitShift(); })}
                  type="button"
                  className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> 🚪 Thoát Về Danh Sách Chương
                </button>

                {onExitToTitle && (
                  <button
                    onClick={(e) => handleAction(e, () => { setIsPauseMenuOpen(false); onExitToTitle(); })}
                    type="button"
                    className="w-full py-2.5 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold text-xs transition border border-neutral-800 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Home className="w-4 h-4" /> 🏠 Thoát Về Màn Hình Chính
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
