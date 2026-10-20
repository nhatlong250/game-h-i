import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createDuyen3DModel, DuyenCharacterRig } from '../game/character';
import { DuyenCustomization, DEFAULT_DUYEN_CUSTOMIZATION } from '../game/types';
import {
  X,
  Camera,
  Sun,
  Award,
  Sparkles,
  RotateCw,
  Palette,
  Scissors,
  Smile,
  Shirt,
  Glasses,
  Check,
  RotateCcw,
  LogOut,
  Gem,
  Play,
  Footprints,
} from 'lucide-react';

interface CharacterInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: DuyenCustomization;
  onSaveCustomization: (custom: DuyenCustomization) => void;
}

export const CharacterInspectionModal: React.FC<CharacterInspectionModalProps> = ({
  isOpen,
  onClose,
  customization: initialCustom,
  onSaveCustomization,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [custom, setCustom] = useState<DuyenCustomization>(initialCustom);
  const [activeTab, setActiveTab] = useState<'outfit' | 'hair' | 'makeup' | 'accessories' | 'pose'>('outfit');
  const [cameraPreset, setCameraPreset] = useState<'front' | 'three_quarter' | 'full' | 'hands'>('three_quarter');
  const [lightingPreset, setLightingPreset] = useState<'warm' | 'studio' | 'sunset'>('warm');
  const [isPreviewWalking, setIsPreviewWalking] = useState(false);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  const isPreviewWalkingRef = useRef(false);
  const isAutoSpinRef = useRef(false);

  const engineRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    rig: DuyenCharacterRig;
    targetCamPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    currentLookAt: THREE.Vector3;
    dirLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    isDragging: boolean;
    prevMouseX: number;
    animId: number;
  } | null>(null);

  // Sync internal custom state with props
  useEffect(() => {
    setCustom(initialCustom);
  }, [initialCustom]);

  // Initialize Three.js CAS Studio
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 20);
    camera.position.set(0.65, 1.55, 1.15);

    const rig = createDuyen3DModel(custom);
    scene.add(rig.root);

    // Decorative Studio Pedestal with Ambient Ring
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x181c20, roughness: 0.35, metalness: 0.3 });
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.06, 32), pedestalMat);
    pedestal.position.y = -0.03;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2ecc71 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.008, 8, 32), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    // High quality 3-point Lighting
    const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    dirLight.position.set(1.6, 3.2, 2.2);
    dirLight.castShadow = true;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x4a4a4a, 0.9);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x70a1ff, 1.4);
    rimLight.position.set(-2.2, 2.8, -2);
    scene.add(rimLight);

    const targetCamPos = new THREE.Vector3(0.65, 1.55, 1.15);
    const targetLookAt = new THREE.Vector3(0, 1.48, 0);
    const currentLookAt = new THREE.Vector3(0, 1.48, 0);

    const state = {
      renderer,
      scene,
      camera,
      rig,
      targetCamPos,
      targetLookAt,
      currentLookAt,
      dirLight,
      hemiLight,
      isDragging: false,
      prevMouseX: 0,
      animId: 0,
    };
    engineRef.current = state;

    let time = 0;
    const animate = () => {
      state.animId = requestAnimationFrame(animate);
      time += 0.016;

      if (isAutoSpinRef.current && !state.isDragging) {
        rig.root.rotation.y += 0.007;
      }

      rig.updateAnimation(time, isPreviewWalkingRef.current);

      camera.position.lerp(state.targetCamPos, 0.08);
      state.currentLookAt.lerp(state.targetLookAt, 0.08);
      camera.lookAt(state.currentLookAt);

      renderer.render(scene, camera);
    };
    animate();

    const onMouseDown = (e: MouseEvent) => {
      state.isDragging = true;
      state.prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!state.isDragging) return;
      const deltaX = e.clientX - state.prevMouseX;
      state.prevMouseX = e.clientX;
      rig.root.rotation.y += deltaX * 0.012;
    };
    const onMouseUp = () => {
      state.isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      cancelAnimationFrame(state.animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen]);

  // Apply customization changes live to 3D model
  useEffect(() => {
    if (engineRef.current?.rig) {
      engineRef.current.rig.applyCustomization(custom);
    }
  }, [custom]);

  // Camera presets
  useEffect(() => {
    if (!engineRef.current) return;
    const { targetCamPos, targetLookAt } = engineRef.current;

    switch (cameraPreset) {
      case 'front':
        targetCamPos.set(0, 1.56, 0.65);
        targetLookAt.set(0, 1.54, 0);
        break;
      case 'three_quarter':
        targetCamPos.set(0.65, 1.52, 1.05);
        targetLookAt.set(0, 1.45, 0);
        break;
      case 'full':
        targetCamPos.set(0, 1.05, 2.5);
        targetLookAt.set(0, 0.90, 0);
        break;
      case 'hands':
        targetCamPos.set(0.28, 1.15, 0.65);
        targetLookAt.set(0.12, 1.05, 0);
        break;
    }
  }, [cameraPreset]);

  // Lighting presets
  useEffect(() => {
    if (!engineRef.current) return;
    const { dirLight, hemiLight } = engineRef.current;
    if (lightingPreset === 'warm') {
      dirLight.color.setHex(0xfff2dc);
      dirLight.intensity = 2.2;
      hemiLight.color.setHex(0xffffff);
    } else if (lightingPreset === 'studio') {
      dirLight.color.setHex(0xffffff);
      dirLight.intensity = 2.6;
      hemiLight.color.setHex(0xddeeff);
    } else if (lightingPreset === 'sunset') {
      dirLight.color.setHex(0xff7640);
      dirLight.intensity = 2.4;
      hemiLight.color.setHex(0x3a2040);
    }
  }, [lightingPreset]);

  const handleSave = () => {
    onSaveCustomization(custom);
    try {
      localStorage.setItem('duyen_custom_look', JSON.stringify(custom));
    } catch {
      // Ignore localStorage error
    }
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleReset = () => {
    setCustom(DEFAULT_DUYEN_CUSTOMIZATION);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-5 animate-in fade-in duration-200 pointer-events-auto select-none">
      <div className="relative w-full max-w-6xl h-[94vh] bg-neutral-950 border-2 border-neutral-700/80 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Top Floating Exit / Close Button */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          <button
            onClick={onClose}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 hover:text-white transition cursor-pointer border border-neutral-700 shadow-xl font-bold text-xs"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Thoát Phòng CAS</span>
          </button>
          <button
            onClick={onClose}
            type="button"
            className="p-2.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer border border-neutral-700 shadow-xl"
            title="Đóng phòng tùy chỉnh"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- LEFT / CENTER: 3D SIMS CAS VIEWPORT --- */}
        <div className="relative flex-1 h-full min-h-[380px] bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Top Camera Presets */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
            <button
              onClick={() => setCameraPreset('front')}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                cameraPreset === 'front'
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Gương Mặt
            </button>
            <button
              onClick={() => setCameraPreset('three_quarter')}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                cameraPreset === 'three_quarter'
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Bán Thân (3/4)
            </button>
            <button
              onClick={() => setCameraPreset('full')}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                cameraPreset === 'full'
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Toàn Thân
            </button>
            <button
              onClick={() => setCameraPreset('hands')}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                cameraPreset === 'hands'
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Bàn Tay & Chi Tiết
            </button>

            {/* Live Animation Mode Toggles */}
            <button
              onClick={() => {
                const next = !isPreviewWalking;
                setIsPreviewWalking(next);
                isPreviewWalkingRef.current = next;
              }}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isPreviewWalking
                  ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-md'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 text-emerald-400 border-emerald-700/60'
              }`}
              title="Xem dáng đi bộ tự nhiên của Duyên"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>{isPreviewWalking ? 'Đang Đi Bộ (Dừng)' : 'Xem Dáng Đi Bộ'}</span>
            </button>

            <button
              onClick={() => {
                const next = !isAutoSpin;
                setIsAutoSpin(next);
                isAutoSpinRef.current = next;
              }}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isAutoSpin
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 border-amber-700/60'
              }`}
              title="Tự động xoay tròn 360 độ chiêm ngưỡng nhân vật"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isAutoSpin ? 'Đang Xoay 360°' : 'Xoay 360°'}</span>
            </button>
          </div>

          {/* Bottom Drag Hint & Lighting & Plumbob */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-950/80 px-3.5 py-1.5 rounded-full border border-neutral-800">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" /> Kéo chuột để xoay nhân vật 360°
            </div>

            <div className="flex gap-2 pointer-events-auto">
              <button
                onClick={() => setCustom({ ...custom, showPlumbob: !custom.showPlumbob })}
                type="button"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  custom.showPlumbob
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-400'
                }`}
                title="Bật/Tắt Plumbob xanh lá The Sims"
              >
                <Gem className="w-3.5 h-3.5 text-emerald-400" />
                <span>Plumbob</span>
              </button>

              <button
                onClick={() => setLightingPreset('warm')}
                type="button"
                className={`p-2 rounded-xl text-xs border transition cursor-pointer ${
                  lightingPreset === 'warm'
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-400'
                }`}
                title="Ánh sáng bếp ấm áp"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightingPreset('studio')}
                type="button"
                className={`p-2 rounded-xl text-xs border transition cursor-pointer ${
                  lightingPreset === 'studio'
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-400'
                }`}
                title="Ánh sáng Studio The Sims"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT: THE SIMS 3 CAS CUSTOMIZER PANEL --- */}
        <div className="w-full md:w-[450px] border-t md:border-t-0 md:border-l-2 border-neutral-800 bg-neutral-950 flex flex-col justify-between overflow-hidden">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-800 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Award className="w-3.5 h-3.5" /> The Sims 3 CAS · Duyên Studio
            </div>
            <h2 className="text-xl font-black text-white">Tùy Chỉnh Nhân Vật Duyên</h2>
            <p className="text-xs text-neutral-400">Tùy biến phong cách, kiểu tóc, gương mặt và trang phục theo The Sims 3</p>

            {/* Category Tabs */}
            <div className="grid grid-cols-5 gap-1 pt-3">
              <button
                onClick={() => setActiveTab('outfit')}
                type="button"
                className={`py-2 flex flex-col items-center gap-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                  activeTab === 'outfit'
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Shirt className="w-4 h-4" /> Phong Cách
              </button>

              <button
                onClick={() => setActiveTab('hair')}
                type="button"
                className={`py-2 flex flex-col items-center gap-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                  activeTab === 'hair'
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Scissors className="w-4 h-4" /> Kiểu Tóc
              </button>

              <button
                onClick={() => setActiveTab('makeup')}
                type="button"
                className={`py-2 flex flex-col items-center gap-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                  activeTab === 'makeup'
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4" /> Gương Mặt
              </button>

              <button
                onClick={() => setActiveTab('accessories')}
                type="button"
                className={`py-2 flex flex-col items-center gap-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                  activeTab === 'accessories'
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Glasses className="w-4 h-4" /> Phụ Kiện
              </button>

              <button
                onClick={() => setActiveTab('pose')}
                type="button"
                className={`py-2 flex flex-col items-center gap-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                  activeTab === 'pose'
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Smile className="w-4 h-4" /> Dáng Đứng
              </button>
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            
            {/* --- TAB 1: OUTFIT & STYLES --- */}
            {activeTab === 'outfit' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Chọn Phong Cách Trang Phục (Outfits):
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    {
                      id: 'bistro_chef',
                      name: 'Đầu Bếp Khởi Đầu (Bistro Signature)',
                      desc: 'Áo sơ mi linen cổ bẻ, tạp dề bọc eo ôm dáng, nơ thắt lưng & huy hiệu vàng Google Ambassador.',
                      icon: '👩‍🍳',
                    },
                    {
                      id: 'google_ambassador',
                      name: 'Google Ambassador Công Nghệ',
                      desc: 'Áo polo trắng viền xanh Google, dây thẻ sinh viên đại học & quần jeans thời thượng.',
                      icon: '💻',
                    },
                    {
                      id: 'chic_casual',
                      name: 'Cà Phê Sài Gòn Cuối Tuần',
                      desc: 'Áo cardigan len dệt pastel V-neck, chân váy xòe thanh lịch & thắt lưng da.',
                      icon: '☕',
                    },
                    {
                      id: 'graduation_formal',
                      name: 'Đêm Lễ Tốt Nghiệp Đại Học',
                      desc: 'Áo cử nhân trang trọng, dải băng danh dự Google Ambassador mạ vàng & bằng cử nhân.',
                      icon: '🎓',
                    },
                    {
                      id: 'streetwear',
                      name: 'Streetwear Sinh Viên Năng Động',
                      desc: 'Áo thun oversize graphic trẻ trung, quần jogger thể thao & giày sneaker trắng.',
                      icon: '👟',
                    },
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => setCustom({ ...custom, outfitStyle: style.id as DuyenCustomization['outfitStyle'] })}
                      type="button"
                      className={`text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                        custom.outfitStyle === style.id
                          ? 'border-amber-400 bg-amber-500/15 shadow-lg'
                          : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-2xl">{style.icon}</span>
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-neutral-100 block">{style.name}</span>
                        <p className="text-xs text-neutral-400 leading-relaxed">{style.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Color Swatches for Apron / Shirt */}
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Màu Tạp Dề / Áo Khoác (The Sims Color Wheel):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { color: '#2e4a3b', name: 'Xanh Rêu Bếp' },
                      { color: '#8b263e', name: 'Đỏ Rượu Vang' },
                      { color: '#1e3799', name: 'Xanh Navy Sâu' },
                      { color: '#d35400', name: 'Cam Đất Ấm' },
                      { color: '#2c3e50', name: 'Than Đen Hiện Đại' },
                      { color: '#e67e22', name: 'Vàng Mù Tạt' },
                      { color: '#6c5ce7', name: 'Tím Lavender' },
                    ].map(swatch => (
                      <button
                        key={swatch.color}
                        onClick={() => setCustom({ ...custom, apronColor: swatch.color })}
                        type="button"
                        className={`w-9 h-9 rounded-xl border-2 transition cursor-pointer flex items-center justify-center ${
                          custom.apronColor === swatch.color ? 'border-amber-400 scale-110 shadow-lg' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: swatch.color }}
                        title={swatch.name}
                      >
                        {custom.apronColor === swatch.color && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 2: HAIR & HAIR COLOR --- */}
            {activeTab === 'hair' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Chọn Kiểu Tóc Nữ Tính The Sims 3:
                </span>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'wavy_natural', name: 'Tóc Uốn Sóng Tự Nhiên (Chuẩn Ảnh Mẫu Duyên)', desc: 'Mái tóc bồng bềnh uốn sóng nhẹ đặc trưng của cô gái 21 tuổi trong ảnh tham chiếu' },
                    { id: 'chef_bun', name: 'Tóc Búi Cao Làm Bếp (Chef Bun)', desc: 'Gọn gàng chuyên nghiệp với trâm cài gỗ và vài lọn tóc mai buông lơi' },
                    { id: 'ponytail', name: 'Tóc Buộc Đuôi Ngựa Năng Động', desc: 'Trẻ trung, linh hoạt cho ngày hoạt động sôi nổi' },
                    { id: 'chic_bob', name: 'Tóc Bob Ngang Cằm Hiện Đại', desc: 'Thanh lịch và cá tính cúp đuôi' },
                    { id: 'braided', name: 'Tóc Tết Bím Lệch Dịu Dàng (Side Braid)', desc: 'Dịu dàng truyền thống đậm chất Á Đông' },
                    { id: 'glamour_waves', name: 'Tóc Xoăn Sóng Lọn Dạ Hội (Red Carpet)', desc: 'Lãng mạn bồng bềnh dành cho ngày lễ tốt nghiệp' },
                    { id: 'twin_braids', name: 'Tóc Tết Hai Bên Nữ Sinh Đại Học', desc: 'Ngọt ngào, đáng yêu phong cách thanh xuân' },
                  ].map(h => (
                    <button
                      key={h.id}
                      onClick={() => setCustom({ ...custom, hairstyle: h.id as DuyenCustomization['hairstyle'] })}
                      type="button"
                      className={`text-left p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        custom.hairstyle === h.id
                          ? 'border-amber-400 bg-amber-500/15'
                          : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-neutral-100 block">{h.name}</span>
                        <span className="text-[10px] text-neutral-400">{h.desc}</span>
                      </div>
                      {custom.hairstyle === h.id && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  ))}
                </div>

                {/* Hair Color Palette */}
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Màu Tóc (The Sims 3 Swatches):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { color: '#2b1a12', name: 'Nâu Sẫm Tự Nhiên (Chuẩn Ảnh Mẫu Duyên)' },
                      { color: '#110b08', name: 'Đen Tuyền Á Đông' },
                      { color: '#4a2c11', name: 'Nâu Hạt Dẻ Ấm Áp' },
                      { color: '#684530', name: 'Nâu Trà Sữa (Milk Tea)' },
                      { color: '#8e44ad', name: 'Tím Khói Cá Tính' },
                      { color: '#d35400', name: 'Nâu Đồng Caramel' },
                    ].map(swatch => (
                      <button
                        key={swatch.color}
                        onClick={() => setCustom({ ...custom, hairColor: swatch.color })}
                        type="button"
                        className={`w-9 h-9 rounded-xl border-2 transition cursor-pointer flex items-center justify-center ${
                          custom.hairColor === swatch.color ? 'border-amber-400 scale-110 shadow-lg' : 'border-neutral-700'
                        }`}
                        style={{ backgroundColor: swatch.color }}
                        title={swatch.name}
                      >
                        {custom.hairColor === swatch.color && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 3: MAKEUP & FACE --- */}
            {activeTab === 'makeup' && (
              <div className="space-y-4">
                {/* Facial Expression */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Biểu Cảm Khuôn Mặt:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'radiant_smile', name: 'Nụ Cười Rạng Rỡ (Chuẩn Ảnh)', desc: 'Cười tươi khoe răng như ảnh' },
                      { id: 'gentle_smile', name: 'Tươi Tắn Nhẹ Nhàng', desc: 'Mỉm cười ấm áp tự nhiên' },
                      { id: 'focused', name: 'Tập Trung Nghiêm Túc', desc: 'Bản lĩnh bếp trưởng' },
                      { id: 'playful', name: 'Nhí Nhảnh Đáng Yêu', desc: 'Hào hứng thanh xuân' },
                    ].map(exp => (
                      <button
                        key={exp.id}
                        onClick={() => setCustom({ ...custom, expression: exp.id as DuyenCustomization['expression'] })}
                        type="button"
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          custom.expression === exp.id
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                            : 'border-neutral-800 bg-neutral-900/60 text-neutral-300'
                        }`}
                      >
                        <span className="text-xs font-bold block">{exp.name}</span>
                        <span className="text-[10px] text-neutral-400">{exp.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skin tone */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Tông Màu Da (Skin Tone):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { color: '#f4cfb6', name: 'Da Sáng Tự Nhiên (Ảnh mẫu)' },
                      { color: '#ffe2d1', name: 'Da Trắng Hồng Thanh Tú' },
                      { color: '#dfa785', name: 'Da Bánh Mật Khỏe Khoắn' },
                    ].map(tone => (
                      <button
                        key={tone.color}
                        onClick={() => setCustom({ ...custom, skinTone: tone.color })}
                        type="button"
                        className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          custom.skinTone === tone.color
                            ? 'border-amber-400 bg-amber-500/15'
                            : 'border-neutral-800 bg-neutral-900/60'
                        }`}
                      >
                        <span className="w-6 h-6 rounded-full border border-black/30 shadow-inner" style={{ backgroundColor: tone.color }} />
                        <span className="text-[10px] font-bold text-neutral-200">{tone.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lipstick Palette */}
                <div className="pt-2 space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Màu Son Môi:
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { color: '#d96e68', name: 'Hồng San Hô (Mặc định Duyên)' },
                      { color: '#c0392b', name: 'Đỏ Ruby Kiêu Kỳ' },
                      { color: '#e17055', name: 'Cam Đào Tươi Trẻ' },
                      { color: '#e84393', name: 'Hồng Rose Dịu Dàng' },
                      { color: '#a0522d', name: 'Nâu Đất Thanh Lịch' },
                    ].map(lip => (
                      <button
                        key={lip.color}
                        onClick={() => setCustom({ ...custom, lipstickColor: lip.color })}
                        type="button"
                        className={`w-9 h-9 rounded-xl border-2 transition cursor-pointer flex items-center justify-center ${
                          custom.lipstickColor === lip.color ? 'border-amber-400 scale-110 shadow-lg' : 'border-neutral-700'
                        }`}
                        style={{ backgroundColor: lip.color }}
                        title={lip.name}
                      >
                        {custom.lipstickColor === lip.color && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blush Intensity Slider */}
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-xs text-neutral-300">
                    <span>Độ Đậm Phấn Má Hồng (Blush):</span>
                    <span className="font-mono text-amber-400">{Math.round(custom.blushIntensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.6"
                    step="0.05"
                    value={custom.blushIntensity}
                    onChange={e => setCustom({ ...custom, blushIntensity: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* --- TAB 4: ACCESSORIES --- */}
            {activeTab === 'accessories' && (
              <div className="space-y-4">
                {/* Glasses */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Kính Mắt:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', name: 'Không Đeo Kính' },
                      { id: 'smart_round', name: 'Kính Tròn Trí Thức' },
                    ].map(g => (
                      <button
                        key={g.id}
                        onClick={() => setCustom({ ...custom, glasses: g.id as DuyenCustomization['glasses'] })}
                        type="button"
                        className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                          custom.glasses === g.id
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                            : 'border-neutral-800 bg-neutral-900/60 text-neutral-300'
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Earrings */}
                <div className="pt-2 space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Hoa Tai:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'none', name: 'Không' },
                      { id: 'pearl', name: 'Ngọc Trai' },
                      { id: 'gold_hoop', name: 'Vòng Vàng Kim' },
                    ].map(e => (
                      <button
                        key={e.id}
                        onClick={() => setCustom({ ...custom, earrings: e.id as DuyenCustomization['earrings'] })}
                        type="button"
                        className={`p-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer text-center ${
                          custom.earrings === e.id
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                            : 'border-neutral-800 bg-neutral-900/60 text-neutral-300'
                        }`}
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Headwear */}
                <div className="pt-2 space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Khăn Băng Đô Bếp:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', name: 'Để Tự Nhiên' },
                      { id: 'chef_bandana', name: 'Khăn Băng Đô Bếp Đỏ' },
                    ].map(h => (
                      <button
                        key={h.id}
                        onClick={() => setCustom({ ...custom, headwear: h.id as DuyenCustomization['headwear'] })}
                        type="button"
                        className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                          custom.headwear === h.id
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                            : 'border-neutral-800 bg-neutral-900/60 text-neutral-300'
                        }`}
                      >
                        {h.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 5: POSES --- */}
            {activeTab === 'pose' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Tư Thế Chụp Hình / Tạo Dáng (The Sims Poses):
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: 'friendly_wave', name: 'Vẫy Tay Chào Đón Ấm Áp', desc: 'Dáng vẫy tay chào thân thiện với nụ cười tỏa sáng' },
                    { id: 'proud_chef', name: 'Tự Tin Bếp Trưởng (Khoanh Tay)', desc: 'Tư thế đầu bếp chuyên nghiệp, bản lĩnh' },
                    { id: 'ambassador_smile', name: 'Nụ Cười Đại Sứ Google', desc: 'Tác phong thuyết trình truyền cảm hứng' },
                    { id: 'thinking', name: 'Suy Tư Sáng Tạo Công Thức', desc: 'Tay chống cằm suy nghĩ về món ăn mới' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setCustom({ ...custom, casPose: p.id as DuyenCustomization['casPose'] })}
                      type="button"
                      className={`text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        custom.casPose === p.id
                          ? 'border-amber-400 bg-amber-500/15'
                          : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-neutral-100 block">{p.name}</span>
                        <span className="text-[10px] text-neutral-400">{p.desc}</span>
                      </div>
                      {custom.casPose === p.id && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  ))}
                </div>

                {/* Anatomy & Realism Details Card */}
                <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Mô Hình Giải Phẫu Cơ Thể Người Thật:</span>
                  </div>
                  <ul className="text-neutral-400 text-[11px] space-y-1 leading-relaxed list-disc list-inside">
                    <li>Đường cong mềm mại, eo thon 60cm, hông nở và xương quai xanh thanh tú.</li>
                    <li>Bàn tay 5 ngón thon dài có khớp xương, móng tay ngọc trai bóng mượt.</li>
                    <li>Vải áo sơ mi & tạp dề lượn sóng tự nhiên, nơ thắt lưng đung đưa mềm mại.</li>
                    <li>Giày sneaker thiết kế đế đúc công thái học, dây đan 3D và gót bảo vệ.</li>
                    <li>Chớp mắt phi tuyến tính tự nhiên, đảo mắt nhìn quanh và nhịp thở lồng ngực sống động.</li>
                  </ul>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Actions Bar */}
          <div className="p-4 sm:p-5 border-t border-neutral-800 space-y-2 bg-neutral-950">
            {savedNotification && (
              <div className="py-1.5 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
                ✨ Đã lưu diện mạo Duyên thành công và áp dụng vào game!
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                type="button"
                className="flex-1 py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm transition shadow-xl shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>LƯU & SỬ DỤNG DIỆN MẠO NÀY</span>
              </button>

              <button
                onClick={handleReset}
                type="button"
                className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer"
                title="Đặt lại diện mạo ban đầu (Chuẩn ảnh mẫu)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                type="button"
                className="p-3.5 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition cursor-pointer font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
