import React from 'react';
import { GameSettings } from '../game/types';
import { X, Volume2, Sliders, Eye } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-2xl p-6 shadow-2xl relative space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" /> Cài Đặt Trò Chơi
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders and Toggles */}
        <div className="space-y-4">
          
          {/* Controls */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Điều Khiển & Góc Nhìn
            </span>

            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Độ nhạy chuột</span>
                <span className="font-mono">{settings.mouseSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.1"
                value={settings.mouseSensitivity}
                onChange={e => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-neutral-300">Đảo ngược trục Y (Invert Mouse Y)</span>
              <input
                type="checkbox"
                checked={settings.invertY}
                onChange={e => onUpdateSettings({ invertY: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-neutral-300">Rung lắc camera khi bước đi (Head Bobbing)</span>
              <input
                type="checkbox"
                checked={settings.cameraBobbing}
                onChange={e => onUpdateSettings({ cameraBobbing: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Audio */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" /> Âm Lượng & Lồng Tiếng
            </span>

            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Âm lượng tổng (Master)</span>
                <span className="font-mono">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={e => onUpdateSettings({ masterVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Hiệu ứng nấu nướng (SFX: Tiếng xèo, dao thái, chuông)</span>
                <span className="font-mono">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={e => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Nhạc nền quán (BGM)</span>
                <span className="font-mono">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={e => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Giọng lồng tiếng Duyên (Voice)</span>
                <span className="font-mono">{Math.round(settings.voiceVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.voiceVolume}
                onChange={e => onUpdateSettings({ voiceVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition"
          >
            Lưu & Tiếp Tục Chơi
          </button>
        </div>

      </div>
    </div>
  );
};
