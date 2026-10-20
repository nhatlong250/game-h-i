import { Recipe, IngredientType } from './types';

export const RECIPES: Recipe[] = [
  {
    id: 'banh_mi_op_la',
    name: 'Bánh Mì Trứng Ốp La Pa-tê',
    vietnameseName: 'Bánh Mì Ốp La Pa-tê',
    description: 'Bánh mì giòn rụm kẹp pa-tê béo ngậy, trứng gà ốp la chín vàng lòng đào, dưa leo tươi giòn và tương ớt cay nhẹ.',
    targetContainer: 'plate',
    requiredIngredients: ['bread', 'pate', 'fried_egg', 'sliced_cucumber', 'chili_sauce'],
    timeLimit: 55,
    baseScore: 120,
    icon: '🥖',
  },
  {
    id: 'com_chien_duong_chau',
    name: 'Cơm Chiên Trứng Lạp Xưởng',
    vietnameseName: 'Cơm Chiên Trứng Lạp Xưởng',
    description: 'Hạt cơm săn bóng đảo đều cùng trứng thơm vàng, lạp xưởng thái mỏng đậm đà, hành hoa dậy mùi và xì dầu.',
    targetContainer: 'plate',
    requiredIngredients: ['cooked_rice', 'fried_egg', 'sliced_sausage', 'chopped_scallion', 'soy_sauce'],
    timeLimit: 65,
    baseScore: 150,
    icon: '🍚',
  },
  {
    id: 'dia_op_la_xuc_xich',
    name: 'Đĩa Điểm Tâm Ốp La Lạp Xưởng',
    vietnameseName: 'Đĩa Điểm Tâm Ốp La',
    description: 'Món ăn sáng nhanh: Trứng ốp la viền giòn tan, lạp xưởng thơm nức và dưa leo thái lát thanh mát.',
    targetContainer: 'plate',
    requiredIngredients: ['fried_egg', 'sliced_sausage', 'sliced_cucumber'],
    timeLimit: 45,
    baseScore: 90,
    icon: '🍳',
  },
  {
    id: 'banh_mi_thap_cam',
    name: 'Bánh Mì Thập Cẩm Sài Gòn',
    vietnameseName: 'Bánh Mì Thập Cẩm',
    description: 'Bánh mì giòn rụm kẹp pa-tê gan béo ngậy, trứng ốp la lòng đào, lạp xưởng thái lát thơm bùi, dưa leo giòn rụm và tương ớt.',
    targetContainer: 'plate',
    requiredIngredients: ['bread', 'pate', 'fried_egg', 'sliced_sausage', 'sliced_cucumber', 'chili_sauce'],
    timeLimit: 70,
    baseScore: 180,
    icon: '🥖',
  },
  {
    id: 'com_chien_dac_biet',
    name: 'Cơm Chiên Hoàng Kim Thập Cẩm',
    vietnameseName: 'Cơm Chiên Hoàng Kim',
    description: 'Cơm nóng đảo đều cùng trứng vàng óng, lạp xưởng thái mỏng, hành hoa tươi, xì dầu thơm lừng và dưa leo giòn mát.',
    targetContainer: 'plate',
    requiredIngredients: ['cooked_rice', 'fried_egg', 'sliced_sausage', 'chopped_scallion', 'soy_sauce', 'sliced_cucumber'],
    timeLimit: 75,
    baseScore: 200,
    icon: '🍚',
  },
];

export function getIngredientDisplayName(type: IngredientType): string {
  switch (type) {
    case 'bread': return 'Bánh Mì Giòn';
    case 'raw_egg': return 'Trứng Gà Sống';
    case 'fried_egg': return 'Trứng Ốp La Vàng Giòn';
    case 'burnt_egg': return 'Trứng Cháy Đen';
    case 'pate': return 'Pa-tê Gan';
    case 'cucumber': return 'Dưa Leo Nguyên Quả';
    case 'sliced_cucumber': return 'Dưa Leo Cắt Lát';
    case 'rice': return 'Gạo Trắng';
    case 'cooked_rice': return 'Cơm Nóng Hổi';
    case 'scallion': return 'Hành Hoa';
    case 'chopped_scallion': return 'Hành Hoa Thái Nhỏ';
    case 'sausage': return 'Lạp Xưởng Tươi';
    case 'sliced_sausage': return 'Lạp Xưởng Cắt Lát';
    case 'soy_sauce': return 'Xì Dầu Thơm';
    case 'chili_sauce': return 'Tương Ớt Cay';
    default: return type;
  }
}

export function validateRecipeMatch(dishContents: IngredientType[]): { matched: Recipe | null; accuracy: number } {
  for (const recipe of RECIPES) {
    const required = [...recipe.requiredIngredients].sort();
    const current = [...dishContents].sort();

    // Check exact match
    if (required.length === current.length && required.every((val, idx) => val === current[idx])) {
      return { matched: recipe, accuracy: 100 };
    }

    // Partial match if contains required without burnt
    const hasBurnt = dishContents.includes('burnt_egg');
    if (!hasBurnt) {
      const matchCount = required.filter(item => dishContents.includes(item)).length;
      if (matchCount >= required.length - 1 && dishContents.length === required.length) {
        return { matched: recipe, accuracy: 80 };
      }
    }
  }

  return { matched: null, accuracy: 0 };
}
