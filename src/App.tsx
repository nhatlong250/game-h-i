import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/gameEngine';
import { GameMode, ActiveOrder, ItemHeld, ShiftStats, GameSettings, Chapter, DuyenCustomization, DEFAULT_DUYEN_CUSTOMIZATION } from './game/types';
import { CHAPTERS } from './game/storyData';
import { TitleScreen } from './components/TitleScreen';
import { ChapterSelectionModal } from './components/ChapterSelectionModal';
import { HUD } from './components/HUD';
import { CharacterInspectionModal } from './components/CharacterInspectionModal';
import { StoryModal } from './components/StoryModal';
import { ShiftResultModal } from './components/ShiftResultModal';
import { SettingsModal } from './components/SettingsModal';
import { KitchenShopModal, getStoredUpgrades, saveStoredUpgrades } from './components/KitchenShopModal';
import { RecipeBookModal } from './components/RecipeBookModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [mode, setMode] = useState<GameMode>('title');
  const [selectedChapter, setSelectedChapter] = useState<Chapter>(CHAPTERS[0]);
  const [unlockedChapterId, setUnlockedChapterId] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('duyen_unlocked_chapter');
      return saved ? Math.max(1, parseInt(saved, 10)) : 1;
    } catch {
      return 1;
    }
  });

  const [bankBalance, setBankBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('duyen_bank_balance');
      return saved ? Math.max(0, parseInt(saved, 10)) : 150;
    } catch {
      return 150;
    }
  });

  const [upgrades, setUpgrades] = useState<Record<string, number>>(() => getStoredUpgrades());
  const [lastEarnedBank, setLastEarnedBank] = useState<number>(0);

  const [customization, setCustomization] = useState<DuyenCustomization>(() => {
    try {
      const saved = localStorage.getItem('duyen_custom_look');
      return saved ? { ...DEFAULT_DUYEN_CUSTOMIZATION, ...JSON.parse(saved) } : DEFAULT_DUYEN_CUSTOMIZATION;
    } catch {
      return DEFAULT_DUYEN_CUSTOMIZATION;
    }
  });

  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [itemHeld, setItemHeld] = useState<ItemHeld | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [tips, setTips] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [shiftStats, setShiftStats] = useState<ShiftStats | null>(null);
  const [isThirdPerson, setIsThirdPerson] = useState(false);

  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isRecipeBookModalOpen, setIsRecipeBookModalOpen] = useState(false);

  const [settings, setSettings] = useState<GameSettings>({
    mouseSensitivity: 1.0,
    invertY: false,
    cameraBobbing: true,
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.5,
    voiceVolume: 0.9,
  });

  // Callbacks for engine
  const handleOrderUpdate = useCallback((newOrders: ActiveOrder[]) => {
    setOrders(newOrders);
  }, []);

  const handleItemHeldUpdate = useCallback((newItem: ItemHeld | null) => {
    setItemHeld(newItem);
  }, []);

  const handlePromptUpdate = useCallback((newPrompt: string | null) => {
    setPrompt(newPrompt);
  }, []);

  const handleShiftEnd = useCallback((stats: ShiftStats) => {
    setShiftStats(stats);

    // Calculate revenue & tips to bank
    const baseRev = Math.round(stats.score * 1.5);
    const passBonus = stats.passed ? 150 : 50;
    const rankBonus = stats.rank === 'S' ? 120 : stats.rank === 'A' ? 60 : 0;
    const totalEarned = baseRev + stats.totalTips + passBonus + rankBonus;

    setLastEarnedBank(totalEarned);
    setBankBalance(prev => {
      const nextBank = prev + totalEarned;
      try {
        localStorage.setItem('duyen_bank_balance', nextBank.toString());
      } catch {}
      return nextBank;
    });

    if (stats.passed && stats.chapterId >= unlockedChapterId && stats.chapterId < CHAPTERS.length) {
      const nextId = stats.chapterId + 1;
      setUnlockedChapterId(nextId);
      try {
        localStorage.setItem('duyen_unlocked_chapter', nextId.toString());
      } catch {
        // Ignore localStorage error
      }
    }
    setMode('shift_result');
  }, [unlockedChapterId]);

  const handleScoreUpdate = useCallback((newScore: number, newTips: number) => {
    setScore(newScore);
    setTips(newTips);
  }, []);

  const handleComboUpdate = useCallback((newCombo: number) => {
    setCombo(newCombo);
  }, []);

  const handleTimeUpdate = useCallback((newTimeLeft: number) => {
    setTimeLeft(newTimeLeft);
  }, []);

  const handleCameraModeUpdate = useCallback((thirdPerson: boolean) => {
    setIsThirdPerson(thirdPerson);
  }, []);

  // Initialize Three.js Engine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onOrderUpdate: handleOrderUpdate,
      onItemHeldUpdate: handleItemHeldUpdate,
      onPromptUpdate: handlePromptUpdate,
      onShiftEnd: handleShiftEnd,
      onScoreUpdate: handleScoreUpdate,
      onTimeUpdate: handleTimeUpdate,
      onComboUpdate: handleComboUpdate,
      onCameraModeUpdate: handleCameraModeUpdate,
    });
    engine.updateUpgrades(upgrades);
    engineRef.current = engine;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        engine.unlockCursor();
        document.exitPointerLock?.();
        // If modals are open, close them
        setIsCharacterModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsShopModalOpen(false);
        setIsRecipeBookModalOpen(false);
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      engine.dispose();
      engineRef.current = null;
    };
  }, [
    handleOrderUpdate,
    handleItemHeldUpdate,
    handlePromptUpdate,
    handleShiftEnd,
    handleScoreUpdate,
    handleTimeUpdate,
    handleComboUpdate,
  ]);

  // Pause engine when overlay modals are open
  useEffect(() => {
    if (engineRef.current && mode === 'kitchen') {
      const shouldPause = isSettingsModalOpen || isCharacterModalOpen || isShopModalOpen || isRecipeBookModalOpen;
      engineRef.current.pauseShift(shouldPause);
    }
  }, [isSettingsModalOpen, isCharacterModalOpen, isShopModalOpen, isRecipeBookModalOpen, mode]);

  // Chapter Navigation Handlers
  const handleSelectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setMode('chapter_intro');
  };

  const handleStartKitchenShift = (chapter: Chapter) => {
    setMode('kitchen');
    setCombo(0);
    engineRef.current?.updateUpgrades(upgrades);
    engineRef.current?.startShift(chapter);
  };

  const handleExitShift = () => {
    engineRef.current?.exitShift();
    setMode('chapters');
  };

  const handleTogglePointerLock = () => {
    if (document.pointerLockElement) {
      engineRef.current?.unlockCursor();
    } else {
      canvasMountRef.current?.requestPointerLock?.();
    }
  };

  const handleSaveCustomization = (newCustom: DuyenCustomization) => {
    setCustomization(newCustom);
    engineRef.current?.updateCustomization(newCustom);
  };

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    engineRef.current?.updateSettings(updated);
  };

  const handleUpdateBank = (newBank: number) => {
    setBankBalance(newBank);
    try {
      localStorage.setItem('duyen_bank_balance', newBank.toString());
    } catch {}
  };

  const handleUpgradesChanged = (newUpgrades: Record<string, number>) => {
    setUpgrades(newUpgrades);
    saveStoredUpgrades(newUpgrades);
    engineRef.current?.updateUpgrades(newUpgrades);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 select-none">
      
      {/* Isolated Three.js Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* 1. Title Screen */}
      {mode === 'title' && (
        <TitleScreen
          bankBalance={bankBalance}
          onStartGame={() => setMode('chapters')}
          onOpenChapters={() => setMode('chapters')}
          onOpenCharacter={() => setIsCharacterModalOpen(true)}
          onOpenPrologue={() => {
            setSelectedChapter(CHAPTERS[0]);
            setMode('chapter_intro');
          }}
          onOpenShop={() => setIsShopModalOpen(true)}
          onOpenRecipeBook={() => setIsRecipeBookModalOpen(true)}
        />
      )}

      {/* 2. Chapters Selection Screen */}
      {mode === 'chapters' && (
        <ChapterSelectionModal
          bankBalance={bankBalance}
          unlockedChapterId={unlockedChapterId}
          onSelectChapter={handleSelectChapter}
          onBackToTitle={() => setMode('title')}
          onOpenCharacter={() => setIsCharacterModalOpen(true)}
          onOpenShop={() => setIsShopModalOpen(true)}
          onOpenRecipeBook={() => setIsRecipeBookModalOpen(true)}
        />
      )}

      {/* 3. Chapter Intro Story Dialogue */}
      {mode === 'chapter_intro' && (
        <StoryModal
          title={`${selectedChapter.title} · ${selectedChapter.subtitle}`}
          dialogues={selectedChapter.introDialogues}
          onComplete={() => handleStartKitchenShift(selectedChapter)}
          onExit={() => setMode('chapters')}
        />
      )}

      {/* 4. Active Kitchen Cooking HUD */}
      {mode === 'kitchen' && (
        <HUD
          orders={orders}
          itemHeld={itemHeld}
          prompt={prompt}
          score={score}
          tips={tips}
          combo={combo}
          timeLeft={timeLeft}
          currentChapter={selectedChapter}
          isThirdPerson={isThirdPerson}
          onToggleCameraMode={() => engineRef.current?.toggleThirdPersonView()}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenCharacter={() => setIsCharacterModalOpen(true)}
          onOpenRecipeBook={() => setIsRecipeBookModalOpen(true)}
          onOpenShop={() => setIsShopModalOpen(true)}
          onExitShift={handleExitShift}
          onExitToTitle={() => {
            handleExitShift();
            setMode('title');
          }}
          onTogglePointerLock={handleTogglePointerLock}
          onDropItem={() => engineRef.current?.dropOrClearItem()}
        />
      )}

      {/* 5. Shift Result Modal */}
      {mode === 'shift_result' && shiftStats && (
        <ShiftResultModal
          stats={shiftStats}
          earnedBank={lastEarnedBank}
          totalBank={bankBalance}
          onPlayAgain={() => handleStartKitchenShift(selectedChapter)}
          onProceedEpilogue={() => setMode('chapter_outro')}
          onExitToChapters={() => setMode('chapters')}
          onOpenCharacter={() => setIsCharacterModalOpen(true)}
          onOpenShop={() => setIsShopModalOpen(true)}
          onOpenRecipeBook={() => setIsRecipeBookModalOpen(true)}
        />
      )}

      {/* 6. Chapter Outro / Epilogue Story Dialogue */}
      {mode === 'chapter_outro' && (
        <StoryModal
          title={`Kết Thúc ${selectedChapter.title} · ${selectedChapter.subtitle}`}
          dialogues={selectedChapter.outroDialogues}
          onComplete={() => setMode('chapters')}
          onExit={() => setMode('chapters')}
        />
      )}

      {/* 7. Dedicated 3D Sims CAS Character Customization Modal */}
      <CharacterInspectionModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        customization={customization}
        onSaveCustomization={handleSaveCustomization}
      />

      {/* 8. Settings & Audio Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* 9. Kitchen Upgrades Shop Modal */}
      {isShopModalOpen && (
        <KitchenShopModal
          totalBank={bankBalance}
          onUpdateBank={handleUpdateBank}
          onClose={() => setIsShopModalOpen(false)}
          onUpgradesChanged={handleUpgradesChanged}
        />
      )}

      {/* 10. Comprehensive Recipe Book Modal */}
      {isRecipeBookModalOpen && (
        <RecipeBookModal
          onClose={() => setIsRecipeBookModalOpen(false)}
        />
      )}

    </div>
  );
}
