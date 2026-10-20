import * as THREE from 'three';
import { DuyenCustomization } from './types';

export function createWoodCounterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm rich mahogany wood
  ctx.fillStyle = '#6b3e26';
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankHeight = 64;
  for (let y = 0; y < 512; y += plankHeight) {
    ctx.strokeStyle = '#3d1f11';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    // Wood grain lines
    for (let i = 0; i < 20; i++) {
      const gy = y + Math.random() * plankHeight;
      ctx.strokeStyle = `rgba(40, 20, 10, ${0.15 + Math.random() * 0.25})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(170, gy + (Math.random() - 0.5) * 12, 340, gy + (Math.random() - 0.5) * 12, 512, gy);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createTileFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Retro Saigon encaustic cement tiles
  ctx.fillStyle = '#e8d8be';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 128;
  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      ctx.strokeStyle = '#b89d78';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, tileSize, tileSize);

      ctx.fillStyle = '#2c5e54';
      ctx.beginPath();
      ctx.arc(x + tileSize / 2, y + tileSize / 2, 44, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d48d42';
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const px = x + tileSize / 2 + Math.cos(angle) * 36;
        const py = y + tileSize / 2 + Math.sin(angle) * 36;
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + tileSize / 2, y + tileSize / 2, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createStainlessSteelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#9ba0a6';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 1) {
    const val = 145 + Math.floor((Math.random() - 0.5) * 35);
    ctx.strokeStyle = `rgb(${val}, ${val + 2}, ${val + 5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f4eedb';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const alpha = Math.random() * 0.08;
    ctx.fillStyle = `rgba(180, 160, 130, ${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createCuttingBoardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const blockSize = 32;
  for (let x = 0; x < 256; x += blockSize) {
    for (let y = 0; y < 256; y += blockSize) {
      const shade = 180 + Math.floor(Math.random() * 40);
      ctx.fillStyle = `rgb(${shade}, ${shade - 30}, ${shade - 70})`;
      ctx.fillRect(x, y, blockSize, blockSize);
      ctx.strokeStyle = '#7c4d23';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, blockSize, blockSize);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * High-definition The Sims 3 styled face texture generator for Duyên
 * Vietnamese female, 21 years old, university senior & Google Ambassador
 */
export function createDynamicFaceTexture(custom: Partial<DuyenCustomization> = {}): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const skinTone = custom.skinTone || '#f4cfb6';
  const lipstick = custom.lipstickColor || '#d96e68';
  const blush = custom.blushIntensity ?? 0.35;
  const hairColor = custom.hairColor || '#2b1a12';
  const expression = custom.expression || 'radiant_smile';

  // 1. Base Subsurface Skin Gradient with dermal warmth
  const skinGrad = ctx.createRadialGradient(512, 512, 60, 512, 512, 580);
  skinGrad.addColorStop(0, skinTone);
  skinGrad.addColorStop(0.65, skinTone);
  skinGrad.addColorStop(0.85, 'rgba(215, 155, 130, 0.95)');
  skinGrad.addColorStop(1, 'rgba(180, 120, 95, 0.98)');
  ctx.fillStyle = skinGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle pore / dermal grain texture (very fine and natural)
  for (let i = 0; i < 6000; i++) {
    const gx = Math.random() * 1024;
    const gy = Math.random() * 1024;
    ctx.fillStyle = `rgba(255, 230, 215, ${Math.random() * 0.04})`;
    ctx.fillRect(gx, gy, 1.5, 1.5);
  }

  // Soft contour shading around temples and lower jaw
  const jawShade = ctx.createLinearGradient(0, 680, 0, 1024);
  jawShade.addColorStop(0, 'rgba(0,0,0,0)');
  jawShade.addColorStop(1, 'rgba(145, 85, 55, 0.28)');
  ctx.fillStyle = jawShade;
  ctx.fillRect(0, 680, 1024, 344);

  // 2. Rosy Cheek Blush
  const blushAlpha = Math.max(0.12, Math.min(0.65, blush));
  const drawBlush = (cx: number, cy: number) => {
    const bGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 150);
    bGrad.addColorStop(0, `rgba(245, 110, 120, ${blushAlpha})`);
    bGrad.addColorStop(0.45, `rgba(240, 130, 130, ${blushAlpha * 0.6})`);
    bGrad.addColorStop(0.8, `rgba(240, 150, 140, ${blushAlpha * 0.2})`);
    bGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 150, 0, Math.PI * 2);
    ctx.fill();
  };
  drawBlush(315, 620);
  drawBlush(709, 620);

  // 3. Eyebrows (Realistic feathered Asian soft arched eyebrows)
  ctx.strokeStyle = hairColor;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Base soft arch
  ctx.beginPath();
  ctx.moveTo(245, 406);
  ctx.quadraticCurveTo(365, 362, 465, 402);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(779, 406);
  ctx.quadraticCurveTo(659, 362, 559, 402);
  ctx.stroke();

  // Individual feathered hair strokes for natural realism
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = hairColor;
  for (let i = 0; i < 28; i++) {
    const t = i / 28;
    const lx = 245 + t * 220;
    const ly = 406 - Math.sin(t * Math.PI) * 44;
    const rx = 779 - t * 220;
    const ry = 406 - Math.sin(t * Math.PI) * 44;

    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + 6 + t * 5, ly - 10 - (1 - t) * 6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 6 - t * 5, ry - 10 - (1 - t) * 6);
    ctx.stroke();
  }

  // 4. Large Sparkling Asian Eyes with Double Eyelid Crease & Aegyo-sal
  const drawEye = (cx: number, cy: number, isLeft: boolean) => {
    // A. Soft Aegyo-sal (Bọng mắt cười tự nhiên)
    const aegyoGrad = ctx.createRadialGradient(cx, cy + 42, 10, cx, cy + 42, 58);
    aegyoGrad.addColorStop(0, 'rgba(255, 240, 230, 0.45)');
    aegyoGrad.addColorStop(0.7, 'rgba(175, 115, 90, 0.22)');
    aegyoGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aegyoGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 42, 64, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // B. Double eyelid crease (Nếp mí đôi)
    ctx.strokeStyle = 'rgba(110, 60, 45, 0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy - 26, 72, Math.PI * 1.16, Math.PI * 1.84);
    ctx.stroke();

    // C. Sclera (White of eye with depth shading)
    ctx.fillStyle = '#faf8f6';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 68, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sclera upper shadow
    const scleraShade = ctx.createLinearGradient(cx, cy - 40, cx, cy);
    scleraShade.addColorStop(0, 'rgba(160, 140, 135, 0.35)');
    scleraShade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = scleraShade;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 68, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // D. Outer eye outline
    ctx.strokeStyle = '#1a0c08';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    // E. Realistic Multi-layered Iris (Deep hazel-amber Asian eye)
    // Dark Limbal Ring (Vành mắt ngoài sẫm màu)
    ctx.fillStyle = '#120703';
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();

    const irisGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 33);
    irisGrad.addColorStop(0, '#6d4023');
    irisGrad.addColorStop(0.45, '#4a2512');
    irisGrad.addColorStop(0.8, '#261108');
    irisGrad.addColorStop(1, '#120603');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 32.5, 0, Math.PI * 2);
    ctx.fill();

    // Iris stroma radial fibers
    ctx.strokeStyle = 'rgba(215, 145, 80, 0.25)';
    ctx.lineWidth = 1.2;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 10) {
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 14, cy + Math.sin(angle) * 14);
      ctx.lineTo(cx + Math.cos(angle) * 30, cy + Math.sin(angle) * 30);
      ctx.stroke();
    }

    // Pupil
    ctx.fillStyle = '#050201';
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();

    // Corneal Catchlights (Wet, glistening specular reflections)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 9, cy - 9, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(cx + 9, cy + 9, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx - 4, cy + 12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // F. Eyeliner & Winged Flick
    ctx.strokeStyle = '#0a0402';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 70, Math.PI * 1.14, Math.PI * 1.86);
    ctx.stroke();

    // Winged flick
    ctx.beginPath();
    ctx.moveTo(isLeft ? cx - 68 : cx + 68, cy - 6);
    ctx.lineTo(isLeft ? cx - 88 : cx + 88, cy - 20);
    ctx.stroke();

    // Lower lash line
    ctx.strokeStyle = 'rgba(50, 20, 10, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 6, 68, Math.PI * 0.22, Math.PI * 0.78);
    ctx.stroke();
  };

  drawEye(365, 470, true);
  drawEye(659, 470, false);

  // 5. Delicate Feminine Nose
  // Bridge soft highlight & shading
  ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.beginPath();
  ctx.ellipse(512, 532, 9, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lateral nose shadows
  const noseShadow = (xOffset: number) => {
    const sGrad = ctx.createLinearGradient(512 + xOffset, 500, 512 + xOffset * 1.5, 580);
    sGrad.addColorStop(0, 'rgba(150, 95, 65, 0.15)');
    sGrad.addColorStop(1, 'rgba(150, 95, 65, 0.35)');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.ellipse(512 + xOffset, 545, 6, 36, xOffset > 0 ? 0.1 : -0.1, 0, Math.PI * 2);
    ctx.fill();
  };
  noseShadow(-14);
  noseShadow(14);

  // Nose tip rounded highlight & soft nostril wings
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(512, 588, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(145, 85, 55, 0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(490, 595);
  ctx.quadraticCurveTo(512, 608, 534, 595);
  ctx.stroke();

  // Nostrils
  ctx.fillStyle = 'rgba(80, 38, 20, 0.7)';
  ctx.beginPath();
  ctx.ellipse(492, 592, 5, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(532, 592, 5, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Philtrum indentation
  ctx.strokeStyle = 'rgba(150, 95, 70, 0.32)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(507, 615);
  ctx.lineTo(507, 652);
  ctx.moveTo(517, 615);
  ctx.lineTo(517, 652);
  ctx.stroke();

  // 6. Plump Ombre Lips with Cupid's Bow & High-Gloss Highlight
  const isRadiant = expression === 'radiant_smile';

  // Base soft outer lip tint (viền môi nhạt mờ)
  const lipOuterGrad = ctx.createRadialGradient(512, 740, 20, 512, 740, 110);
  lipOuterGrad.addColorStop(0, lipstick);
  lipOuterGrad.addColorStop(0.7, lipstick);
  lipOuterGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = lipOuterGrad;
  ctx.beginPath();
  ctx.moveTo(395, 715);
  ctx.quadraticCurveTo(512, 685, 629, 715);
  ctx.quadraticCurveTo(512, isRadiant ? 810 : 785, 395, 715);
  ctx.fill();

  // Inner deep ombre tint (lòng môi thắm đượm kiểu Hàn Quốc)
  const lipInnerGrad = ctx.createRadialGradient(512, 730, 8, 512, 730, 65);
  lipInnerGrad.addColorStop(0, 'rgba(165, 30, 45, 0.85)');
  lipInnerGrad.addColorStop(0.7, 'rgba(185, 45, 55, 0.5)');
  lipInnerGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lipInnerGrad;
  ctx.beginPath();
  ctx.ellipse(512, 726, 75, isRadiant ? 25 : 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Upper lip contour (Cupid's bow define)
  ctx.strokeStyle = 'rgba(120, 40, 30, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(398, 715);
  ctx.quadraticCurveTo(460, 694, 512, 706);
  ctx.quadraticCurveTo(564, 694, 626, 715);
  ctx.stroke();

  if (isRadiant) {
    // Pearly white teeth gleam
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(512, 736, 42, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tooth separation hints
    ctx.strokeStyle = '#ded0c2';
    ctx.lineWidth = 1.5;
    for (let t = -24; t <= 24; t += 12) {
      ctx.beginPath();
      ctx.moveTo(512 + t, 728);
      ctx.lineTo(512 + t, 745);
      ctx.stroke();
    }
  }

  // Smile Dimples / Corners
  ctx.fillStyle = 'rgba(110, 50, 35, 0.55)';
  ctx.beginPath();
  ctx.ellipse(394, 712, 4.5, 7.5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(630, 712, 4.5, 7.5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // High-Gloss Wet Lip Specular Highlights (Bóng nước căng mọng)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.ellipse(512, isRadiant ? 772 : 755, 32, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(488, 708, 12, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(536, 708, 12, 4, 0.2, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createDuyenFaceTexture(): THREE.CanvasTexture {
  return createDynamicFaceTexture({
    skinTone: '#f4cfb6',
    lipstickColor: '#d96e68',
    blushIntensity: 0.35,
    hairColor: '#2b1a12',
    expression: 'radiant_smile',
  });
}

export function createBreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d28c46';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#8f4f1d';
  for (let i = 30; i < 240; i += 50) {
    ctx.beginPath();
    ctx.ellipse(128, i, 70, 12, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fce5be';
    ctx.beginPath();
    ctx.ellipse(128, i, 55, 6, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8f4f1d';
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCucumberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2d6a36';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d4edcf';
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#9fc899';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const sx = 64 + Math.cos(angle) * 22;
    const sy = 64 + Math.sin(angle) * 22;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 7, 3, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createEggTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#c7974e';
  ctx.beginPath();
  ctx.ellipse(128, 128, 110, 95, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fbfbfb';
  ctx.beginPath();
  ctx.ellipse(128, 128, 98, 85, 0.2, 0, Math.PI * 2);
  ctx.fill();

  const yolkGrad = ctx.createRadialGradient(120, 115, 10, 125, 120, 45);
  yolkGrad.addColorStop(0, '#ffd23f');
  yolkGrad.addColorStop(0.7, '#ff9f1c');
  yolkGrad.addColorStop(1, '#e07a00');
  ctx.fillStyle = yolkGrad;
  ctx.beginPath();
  ctx.arc(125, 120, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.ellipse(112, 105, 12, 6, -0.4, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
