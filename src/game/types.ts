export type GameMode =
  | 'title'
  | 'chapters'
  | 'chapter_intro'
  | 'chapter_outro'
  | 'kitchen'
  | 'character_view'
  | 'shift_result'
  | 'paused';

export type IngredientType =
  | 'bread'
  | 'raw_egg'
  | 'fried_egg'
  | 'burnt_egg'
  | 'pate'
  | 'cucumber'
  | 'sliced_cucumber'
  | 'rice'
  | 'cooked_rice'
  | 'scallion'
  | 'chopped_scallion'
  | 'sausage'
  | 'sliced_sausage'
  | 'soy_sauce'
  | 'chili_sauce';

export interface ItemHeld {
  type: 'ingredient' | 'plate' | 'pan';
  id: string;
  name: string;
  ingredient?: IngredientType;
  plateContents?: IngredientType[];
  panContents?: {
    item: IngredientType;
    cookProgress: number; // 0 to 100 (100 = done, >160 = burnt)
    isCooking: boolean;
  };
}

export interface Recipe {
  id: string;
  name: string;
  vietnameseName: string;
  description: string;
  targetContainer: 'plate' | 'bowl';
  requiredIngredients: IngredientType[];
  timeLimit: number; // in seconds
  baseScore: number;
  icon: string;
}

export interface ActiveOrder {
  id: string;
  recipeId: string;
  customerName: string;
  customerNote: string;
  maxTime: number;
  timeLeft: number;
  totalScore: number;
}

export interface ShiftStats {
  chapterId: number;
  ordersServed: number;
  ordersFailed: number;
  totalTips: number;
  accuracy: number;
  score: number;
  rank: 'S' | 'A' | 'B' | 'C';
  duration: number;
  passed: boolean;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  role: string;
  text: string;
  choices?: {
    text: string;
    nextNodeId: string;
    impactDescription?: string;
  }[];
  next?: string;
}

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  lore: string;
  targetScore: number;
  shiftDuration: number;
  availableRecipeIds: string[];
  introDialogues: DialogueNode[];
  outroDialogues: DialogueNode[];
}

export interface GameSettings {
  mouseSensitivity: number;
  invertY: boolean;
  cameraBobbing: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  voiceVolume: number;
}

export interface DuyenCustomization {
  hairstyle: 'wavy_natural' | 'chef_bun' | 'ponytail' | 'chic_bob' | 'braided' | 'glamour_waves' | 'twin_braids';
  hairColor: string;
  skinTone: string;
  lipstickColor: string;
  blushIntensity: number;
  outfitStyle: 'bistro_chef' | 'google_ambassador' | 'chic_casual' | 'graduation_formal' | 'streetwear';
  shirtColor: string;
  apronColor: string;
  pantsColor: string;
  glasses: 'none' | 'smart_round' | 'chic_square';
  earrings: 'none' | 'pearl' | 'gold_hoop';
  headwear: 'none' | 'chef_bandana' | 'hair_ribbon';
  casPose: 'friendly_wave' | 'proud_chef' | 'ambassador_smile' | 'thinking';
  showPlumbob: boolean;
  expression: 'radiant_smile' | 'gentle_smile' | 'focused' | 'playful';
}

export const DEFAULT_DUYEN_CUSTOMIZATION: DuyenCustomization = {
  hairstyle: 'wavy_natural',
  hairColor: '#2b1a12',
  skinTone: '#f4cfb6',
  lipstickColor: '#d96e68',
  blushIntensity: 0.35,
  outfitStyle: 'bistro_chef',
  shirtColor: '#faf5ec',
  apronColor: '#2e4a3b',
  pantsColor: '#252b33',
  glasses: 'none',
  earrings: 'pearl',
  headwear: 'none',
  casPose: 'friendly_wave',
  showPlumbob: true,
  expression: 'radiant_smile',
};

export interface KitchenUpgrade {
  id: string;
  name: string;
  category: 'speed' | 'quality' | 'decor';
  description: string;
  cost: number;
  icon: string;
  level: number;
  maxLevel: number;
  effectLabel: string;
}

export const INITIAL_KITCHEN_UPGRADES: KitchenUpgrade[] = [
  {
    id: 'nonstick_pans',
    name: 'Chảo Chống Dính Ceramic',
    category: 'quality',
    description: 'Chảo đá phủ gốm tự nhiên giúp trứng vàng ươm và kéo dài thời gian chống cháy thêm 50%.',
    cost: 150,
    icon: '🍳',
    level: 0,
    maxLevel: 3,
    effectLabel: '+50% thời gian chống cháy',
  },
  {
    id: 'chef_knife_set',
    name: 'Bộ Dao Thép Nhật Bén Ngọt',
    category: 'speed',
    description: 'Lưỡi dao Damascus sắc bén giúp Duyên thái dưa leo, hành và lạp xưởng nhanh hơn 40%.',
    cost: 180,
    icon: '🔪',
    level: 0,
    maxLevel: 3,
    effectLabel: '+40% tốc độ thái',
  },
  {
    id: 'golden_bell',
    name: 'Chuông Đồng Phục Vụ Cao Cấp',
    category: 'speed',
    description: 'Âm chuông sang trọng giúp khách hào phóng thưởng thêm 30% tiền tip khi giao nhanh.',
    cost: 220,
    icon: '🔔',
    level: 0,
    maxLevel: 3,
    effectLabel: '+30% tiền tip',
  },
  {
    id: 'bistro_neon_sign',
    name: 'Đèn Neon Bếp Duyên Xinh Xắn',
    category: 'decor',
    description: 'Ánh sáng ấm cúng mang lại không khí vui tươi, kích hoạt điểm thưởng Combo x1.5.',
    cost: 280,
    icon: '✨',
    level: 0,
    maxLevel: 2,
    effectLabel: 'Tăng điểm Combo',
  },
];
