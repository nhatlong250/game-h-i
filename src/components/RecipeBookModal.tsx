import React, { useState } from 'react';
import { RECIPES, getIngredientDisplayName } from '../game/recipes';
import { BookOpen, X, Clock, Award, CheckCircle2, Flame, Sparkles, ChefHat } from 'lucide-react';

interface RecipeBookModalProps {
  onClose: () => void;
}

export const RecipeBookModal: React.FC<RecipeBookModalProps> = ({ onClose }) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(RECIPES[0].id);

  const selectedRecipe = RECIPES.find(r => r.id === selectedRecipeId) || RECIPES[0];

  const getCookingSteps = (recipeId: string) => {
    switch (recipeId) {
      case 'banh_mi_op_la':
        return [
          { title: 'Lấy Đĩa Sạch', desc: 'Đến quầy đông lấy một chiếc đĩa sứ trắng sạch hoặc đặt sẵn lên bàn trình bày.' },
          { title: 'Thêm Bánh Mì & Pa-tê', desc: 'Tương tác với rổ bánh mì giòn và thố pa-tê gan để gắp trực tiếp vào đĩa.' },
          { title: 'Sơ Chế Dưa Leo', desc: 'Lấy dưa leo nguyên quả, đặt lên thớt bắc và giữ [E] hoặc [Chuột Trái] để thái lát mỏng.' },
          { title: 'Chiên Trứng Ốp La', desc: 'Lấy trứng gà sống cho vào chảo quầy tây, đợi viền vàng giòn (~7s) rồi gắp vào đĩa.' },
          { title: 'Thêm Tương Ớt & Giao Món', desc: 'Thêm một chút tương ớt đỏ rực lên đĩa rồi mang đến chuông sảnh rung giao cho khách!' },
        ];
      case 'com_chien_duong_chau':
        return [
          { title: 'Lấy Cơm Nóng & Rang Chảo', desc: 'Múc cơm nóng hổi từ nồi cơm điện tử quầy tây, cho vào chảo chiên đảo đều.' },
          { title: 'Chiên Trứng Ốp La', desc: 'Chiên trứng vàng thơm trên chảo thứ hai, gắp chung cùng cơm nóng.' },
          { title: 'Thái Lạp Xưởng & Hành Hoa', desc: 'Đặt lạp xưởng và hành hoa lên thớt, băm nhỏ đều tay để dậy hương vị.' },
          { title: 'Rưới Xì Dầu & Trình Bày', desc: 'Trộn đều các nguyên liệu ra đĩa, rưới thêm xì dầu sánh thơm rồi rung chuông phục vụ.' },
        ];
      case 'dia_op_la_xuc_xich':
        return [
          { title: 'Lấy Đĩa Điểm Tâm', desc: 'Chuẩn bị một chiếc đĩa sạch từ quầy đựng đĩa.' },
          { title: 'Chiên Trứng Lòng Đào', desc: 'Chiên trứng gà tươi trên bếp đến khi lòng đỏ sánh ngậy, lòng trắng viền giòn rụm.' },
          { title: 'Thái Lát Lạp Xưởng & Dưa Leo', desc: 'Thái mỏng lạp xưởng và dưa leo trên thớt tre, xếp ngay ngắn vào đĩa.' },
          { title: 'Hoàn Tất & Giao Khách', desc: 'Rung chuông tại quầy để chuyển đĩa điểm tâm ấm nóng đến tay khách hàng.' },
        ];
      case 'banh_mi_thap_cam':
        return [
          { title: 'Kẹp Bánh Mì & Pa-tê Gan', desc: 'Mở ổ bánh mì giòn tan, quét một lớp pa-tê gan nhà làm béo ngậy.' },
          { title: 'Chiên Trứng Vàng Ốm', desc: 'Chiên trứng ốp la trên chảo nóng, lòng đào vàng óng.' },
          { title: 'Thái Lạp Xưởng & Dưa Leo', desc: 'Thái mỏng lạp xưởng đậm đà cùng dưa leo tươi giòn trên thớt sơ chế.' },
          { title: 'Thêm Hành & Tương Ớt', desc: 'Cho hành hoa thơm phức và tương ớt cay nhẹ vào đĩa, giao trọn vẹn vị ngon Sài Gòn.' },
        ];
      case 'com_chien_dac_biet':
        return [
          { title: 'Rang Cơm & Chiên Trứng', desc: 'Cơm nóng đảo săn hạt trên chảo, kết hợp trứng chiên lòng đào thơm bùi.' },
          { title: 'Sơ Chế Thập Cẩm', desc: 'Thái lạp xưởng, hành hoa và dưa leo mát lành trên thớt sơ chế.' },
          { title: 'Đậm Đà Xì Dầu & Bày Đĩa', desc: 'Thêm xì dầu thơm dậy mùi, bày tất cả ra đĩa đầy đặn, nóng hổi.' },
          { title: 'Giao Ngay Khách Thưởng Thức', desc: 'Món ăn đặc biệt nhất quán, mang lại điểm số cao và nhiều tiền tip nhất!' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-4xl bg-neutral-950 border-2 border-amber-500/60 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Sổ Tay Bí Quyết Ẩm Thực · Bếp Duyên
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {RECIPES.length} Món Đặc Sắc
                </span>
              </h3>
              <p className="text-xs text-neutral-400">Cẩm nang phối hợp nguyên liệu và kỹ thuật nấu đạt chuẩn S-Rank</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer border border-neutral-700"
            title="Đóng [ESC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left: Recipe List */}
          <div className="md:col-span-5 p-4 border-r border-neutral-800 bg-neutral-950/70 overflow-y-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block px-1 mb-2">
              Danh Sách Món Ăn Trong Thực Đơn
            </span>

            {RECIPES.map(recipe => {
              const isSelected = recipe.id === selectedRecipeId;
              return (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipeId(recipe.id)}
                  type="button"
                  className={`w-full text-left p-3 rounded-2xl transition border cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <span className="text-3xl shrink-0 p-1.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    {recipe.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{recipe.vietnameseName}</h4>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        +{recipe.baseScore}đ
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-amber-300/80">
                        <Clock className="w-3 h-3" /> {recipe.timeLimit}s
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Chef Tip Card */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 mt-4 text-xs text-neutral-300 space-y-1.5">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" /> Bí Quyết Bếp Nhanh
              </span>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Cầm sẵn đĩa trên tay rồi tương tác với bánh mì, pa-tê, cơm hoặc dưa đã thái để <strong>gắp thẳng vào đĩa</strong> mà không tốn công chuyển tay!
              </p>
            </div>
          </div>

          {/* Right: Recipe Detail View */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5 bg-neutral-900/30">
            {/* Header info */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-400 font-bold block mb-1">
                  Công Thức Chuẩn Vị
                </span>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>{selectedRecipe.icon}</span> {selectedRecipe.name}
                </h2>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                  {selectedRecipe.description}
                </p>
              </div>

              <div className="shrink-0 text-right bg-neutral-950 border border-neutral-800 rounded-2xl p-3 shadow-inner">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Điểm thưởng</span>
                <span className="text-xl font-black text-emerald-400">+{selectedRecipe.baseScore}đ</span>
                <span className="text-[10px] text-amber-400 block mt-0.5">Thời hạn: {selectedRecipe.timeLimit}s</span>
              </div>
            </div>

            {/* Ingredients Required */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-amber-400" />
                Nguyên Liệu Cần Thiết ({selectedRecipe.requiredIngredients.length} món)
              </span>

              <div className="flex flex-wrap gap-2">
                {selectedRecipe.requiredIngredients.map(ing => (
                  <div
                    key={ing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-700/80 text-xs text-neutral-200 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{getIngredientDisplayName(ing)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cooking Procedure Steps */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2.5 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                Quy Trình Thực Hiện Từng Bước
              </span>

              <div className="space-y-2.5">
                {getCookingSteps(selectedRecipe.id).map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800"
                  >
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="font-bold text-xs text-neutral-100">{step.title}</h5>
                      <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Combo Pro Tip */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-neutral-900 border border-amber-500/40 flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-400 shrink-0" />
              <div className="text-xs text-neutral-200 leading-snug">
                <strong className="text-amber-300 block mb-0.5">Bí Quyết Combo Thần Tốc:</strong>
                Giao món khi thanh thời gian còn trên 50% sẽ kích hoạt chuỗi Combo x1.25 đến x2.0, mang lại cơn mưa tiền tip!
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
          <span>Bấm phím <strong>[B]</strong> hoặc biểu tượng Sổ Tay trong ca nấu để mở lại bất cứ lúc nào</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition cursor-pointer shadow-lg active:scale-95"
          >
            Đã Hiểu Rõ Công Thức
          </button>
        </div>

      </div>
    </div>
  );
};
