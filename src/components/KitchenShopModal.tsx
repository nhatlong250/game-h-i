import React, { useState, useEffect } from 'react';
import { KitchenUpgrade, INITIAL_KITCHEN_UPGRADES } from '../game/types';
import { soundManager } from '../game/audio';
import { ShoppingBag, X, DollarSign, Check, ArrowUpRight, Sparkles, ShieldCheck } from 'lucide-react';

interface KitchenShopModalProps {
  totalBank: number;
  onUpdateBank: (newBank: number) => void;
  onClose: () => void;
  onUpgradesChanged?: (upgrades: Record<string, number>) => void;
}

const STORAGE_KEY = 'duyen_kitchen_upgrades_v1';

export function getStoredUpgrades(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    nonstick_pans: 0,
    chef_knife_set: 0,
    golden_bell: 0,
    bistro_neon_sign: 0,
  };
}

export function saveStoredUpgrades(upgrades: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(upgrades));
  } catch {}
}

export const KitchenShopModal: React.FC<KitchenShopModalProps> = ({
  totalBank,
  onUpdateBank,
  onClose,
  onUpgradesChanged,
}) => {
  const [upgrades, setUpgrades] = useState<Record<string, number>>(() => getStoredUpgrades());
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handlePurchase = (item: KitchenUpgrade) => {
    const currentLvl = upgrades[item.id] || 0;
    if (currentLvl >= item.maxLevel) return;

    const cost = item.cost * (currentLvl + 1);
    if (totalBank < cost) {
      soundManager.playFail();
      soundManager.speakVietnamese('Chưa đủ tiền tích lũy rồi Duyên ơi, ráng làm thêm một ca nữa nhé!');
      return;
    }

    const nextBank = totalBank - cost;
    const nextUpgrades = { ...upgrades, [item.id]: currentLvl + 1 };

    setUpgrades(nextUpgrades);
    saveStoredUpgrades(nextUpgrades);
    onUpdateBank(nextBank);
    onUpgradesChanged?.(nextUpgrades);

    soundManager.playSuccess();
    soundManager.speakVietnamese(`Đã nâng cấp ${item.name} lên cấp ${currentLvl + 1}!`);
    setSuccessToast(`Nâng cấp thành công: ${item.name} (Cấp ${currentLvl + 1})`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-3xl bg-neutral-950 border-2 border-emerald-500/60 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Cửa Hàng Nâng Cấp Bếp Chuyên Nghiệp
              </h3>
              <p className="text-xs text-neutral-400">Đầu tư thiết bị xịn để nấu nhanh hơn, chống cháy và thu hút tiền tip</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bank Balance */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-neutral-950 border border-emerald-500/50 shadow-inner">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-black text-emerald-400 tabular-nums">
                {totalBank.toLocaleString('vi-VN')}đ
              </span>
              <span className="text-[10px] text-neutral-400">tiền vốn</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer border border-neutral-700"
              title="Đóng [ESC]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="px-6 py-2.5 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top duration-150">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {successToast}
          </div>
        )}

        {/* Upgrades Grid */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3.5">
          {INITIAL_KITCHEN_UPGRADES.map(item => {
            const currentLevel = upgrades[item.id] || 0;
            const isMax = currentLevel >= item.maxLevel;
            const cost = item.cost * (currentLevel + 1);
            const canAfford = totalBank >= cost;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isMax
                    ? 'bg-neutral-900/40 border-neutral-800 opacity-90'
                    : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 shadow-md'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-2xl shadow-inner shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-neutral-100">{item.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono font-bold">
                        Cấp {currentLevel}/{item.maxLevel}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5 max-w-md leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Hiệu quả: {item.effectLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {isMax ? (
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-400">
                      <Check className="w-4 h-4 text-emerald-400" /> Đã Tối Đa
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      type="button"
                      disabled={!canAfford}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer active:scale-95 ${
                        canAfford
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Nâng Cấp ({cost.toLocaleString('vi-VN')}đ)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
          <span>Tiền vốn được tích lũy tự động từ doanh thu và tiền tip mỗi ca làm</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
