import * as THREE from 'three';
import { createDynamicFaceTexture } from './textures';
import { DuyenCustomization, DEFAULT_DUYEN_CUSTOMIZATION } from './types';

export interface DuyenCharacterRig {
  root: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  body: THREE.Group;
  chest: THREE.Group;
  eyelids: {
    leftUpper: THREE.Mesh;
    rightUpper: THREE.Mesh;
    leftLower?: THREE.Mesh;
    rightLower?: THREE.Mesh;
  };
  plumbob: THREE.Mesh | null;
  updateAnimation: (time: number, isWalking: boolean) => void;
  applyCustomization: (custom: DuyenCustomization) => void;
  setCustomPose?: (pose: string) => void;
}

// Reusable math vectors for zero GC in animation loop
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();

// Helper: build continuous smooth spline ribbon / tube for hair, ribbons, and cloth folds
function createCurvedStrand(
  points: THREE.Vector3[],
  radius: number,
  material: THREE.Material,
  taper: boolean = true,
  tubularSegments: number = 24,
  radialSegments: number = 10
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);

  if (taper) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const idx = Math.floor(i / (radialSegments + 1));
      const t = idx / tubularSegments;
      // Taper naturally towards the tip
      const factor = 1.0 - t * 0.55;
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Compute distance to center line approximately
      pos.setX(i, x * factor);
      pos.setZ(i, z * factor);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  return mesh;
}

// Helper: build smooth lofted anatomical limb segment with organic muscle curvature
function createSculptedOrganicLimb(
  radii: { y: number; rx: number; rz: number; offsetZ?: number; offsetX?: number }[],
  material: THREE.Material,
  segments: number = 28
): THREE.Mesh {
  const geo = new THREE.BufferGeometry();
  const ringCount = radii.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < ringCount; r++) {
    const ring = radii[r];
    const v = r / (ringCount - 1);
    const oz = ring.offsetZ || 0;
    const ox = ring.offsetX || 0;

    for (let s = 0; s <= segments; s++) {
      const u = s / segments;
      const angle = u * Math.PI * 2;
      const x = Math.sin(angle) * ring.rx + ox;
      const z = Math.cos(angle) * ring.rz + oz;
      positions.push(x, ring.y, z);
      uvs.push(u, v);
    }
  }

  const segCount = segments + 1;
  for (let r = 0; r < ringCount - 1; r++) {
    for (let s = 0; s < segments; s++) {
      const i0 = r * segCount + s;
      const i1 = r * segCount + (s + 1);
      const i2 = (r + 1) * segCount + s;
      const i3 = (r + 1) * segCount + (s + 1);

      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Helper: create organic sculpted feminine hand with 5 slender articulated fingers & manicured nails
function createSculptedFeminineHand(skinMat: THREE.Material, isRight: boolean): THREE.Group {
  const hand = new THREE.Group();
  const side = isRight ? 1 : -1;

  // Glossy manicured nail material (soft rose pearl)
  const nailMat = new THREE.MeshPhysicalMaterial({
    color: 0xf6d3d9,
    roughness: 0.12,
    metalness: 0.05,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
  });

  // 1. Palm with anatomical thenar (thumb pad) & hypothenar mound
  const palmRings = [
    { y: 0.0, rx: 0.024, rz: 0.015, offsetZ: 0 },
    { y: -0.016, rx: 0.026, rz: 0.017, offsetZ: 0.002 },
    { y: -0.034, rx: 0.025, rz: 0.016, offsetZ: 0.001 },
    { y: -0.046, rx: 0.023, rz: 0.013, offsetZ: 0 },
  ];
  const palm = createSculptedOrganicLimb(palmRings, skinMat, 20);
  hand.add(palm);

  // Thenar eminence cushion (bắp thịt cái bàn tay)
  const thenar = new THREE.Mesh(new THREE.SphereGeometry(0.011, 14, 14), skinMat);
  thenar.scale.set(0.9, 1.4, 0.75);
  thenar.position.set(-0.014 * side, -0.022, 0.007);
  hand.add(thenar);

  // Wrist bone prominence (Mỏm trâm xương trụ cổ tay)
  const styloidBone = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 12, 12), skinMat);
  styloidBone.position.set(0.018 * side, -0.003, -0.006);
  hand.add(styloidBone);

  // 2. Opposable Thumb with natural angled metacarpal & phalanges
  const thumbBase = new THREE.Group();
  thumbBase.position.set(-0.017 * side, -0.014, 0.007);
  thumbBase.rotation.z = -0.52 * side;
  thumbBase.rotation.y = 0.42 * side;
  thumbBase.rotation.x = 0.22;

  const thumbProx = createSculptedOrganicLimb([
    { y: 0, rx: 0.0065, rz: 0.006 },
    { y: -0.014, rx: 0.0058, rz: 0.0054 },
    { y: -0.022, rx: 0.0052, rz: 0.0048 },
  ], skinMat, 14);
  thumbBase.add(thumbProx);

  const thumbDistGroup = new THREE.Group();
  thumbDistGroup.position.set(0, -0.022, 0);
  thumbDistGroup.rotation.x = 0.22;

  const thumbDist = createSculptedOrganicLimb([
    { y: 0, rx: 0.0052, rz: 0.0048 },
    { y: -0.011, rx: 0.0050, rz: 0.0044 },
    { y: -0.018, rx: 0.0038, rz: 0.0032 },
  ], skinMat, 14);
  thumbDistGroup.add(thumbDist);

  // Thumb nail
  const thumbNailGeo = new THREE.CylinderGeometry(0.0038, 0.0042, 0.0075, 10, 1, false, -Math.PI * 0.4, Math.PI * 0.8);
  const thumbNail = new THREE.Mesh(thumbNailGeo, nailMat);
  thumbNail.position.set(0, -0.012, 0.004);
  thumbNail.rotation.x = -0.15;
  thumbDistGroup.add(thumbNail);

  thumbBase.add(thumbDistGroup);
  hand.add(thumbBase);

  // 3. Four Slender Feminine Fingers (Index, Middle, Ring, Pinky)
  // Anatomical cascade: natural resting curl increases from index to pinky
  const fingersConfig = [
    { name: 'index', len: 0.038, offset: -0.015, restingCurl: 0.14, splay: -0.06 },
    { name: 'middle', len: 0.042, offset: -0.005, restingCurl: 0.18, splay: -0.01 },
    { name: 'ring', len: 0.039, offset: 0.005, restingCurl: 0.24, splay: 0.04 },
    { name: 'pinky', len: 0.031, offset: 0.014, restingCurl: 0.32, splay: 0.10 },
  ];

  fingersConfig.forEach(cfg => {
    const fingerRoot = new THREE.Group();
    fingerRoot.position.set(cfg.offset * side, -0.045, 0);
    fingerRoot.rotation.x = cfg.restingCurl;
    fingerRoot.rotation.z = cfg.splay * side;

    // Proximal Phalanx
    const pLen = cfg.len * 0.45;
    const proxMesh = createSculptedOrganicLimb([
      { y: 0, rx: 0.0050, rz: 0.0046 },
      { y: -pLen * 0.5, rx: 0.0048, rz: 0.0043 },
      { y: -pLen, rx: 0.0044, rz: 0.0040 },
    ], skinMat, 14);
    fingerRoot.add(proxMesh);

    // Intermediate & Distal Phalanx (curling gracefully)
    const midGroup = new THREE.Group();
    midGroup.position.set(0, -pLen, 0);
    midGroup.rotation.x = cfg.restingCurl * 0.85;

    const mLen = cfg.len * 0.35;
    const midMesh = createSculptedOrganicLimb([
      { y: 0, rx: 0.0044, rz: 0.0040 },
      { y: -mLen * 0.5, rx: 0.0042, rz: 0.0038 },
      { y: -mLen, rx: 0.0038, rz: 0.0035 },
    ], skinMat, 12);
    midGroup.add(midMesh);

    // Distal Phalanx + Manicured Nail
    const distGroup = new THREE.Group();
    distGroup.position.set(0, -mLen, 0);
    distGroup.rotation.x = cfg.restingCurl * 0.7;

    const dLen = cfg.len * 0.28;
    const distMesh = createSculptedOrganicLimb([
      { y: 0, rx: 0.0038, rz: 0.0035 },
      { y: -dLen * 0.5, rx: 0.0036, rz: 0.0033 },
      { y: -dLen, rx: 0.0028, rz: 0.0026 },
    ], skinMat, 12);
    distGroup.add(distMesh);

    // Curved manicured fingernail
    const nailGeo = new THREE.CylinderGeometry(0.0032, 0.0036, 0.007, 10, 1, false, -Math.PI * 0.45, Math.PI * 0.9);
    const nail = new THREE.Mesh(nailGeo, nailMat);
    nail.position.set(0, -dLen * 0.5, 0.0034);
    nail.rotation.x = -0.12;
    distGroup.add(nail);

    midGroup.add(distGroup);
    fingerRoot.add(midGroup);
    hand.add(fingerRoot);
  });

  return hand;
}

// Helper: build high-fidelity modern designer sneaker with ergonomic outsole, molded midsole, leather panels & 3D laces
function createSculptedModernSneaker(shoeColorHex: string): THREE.Group {
  const shoe = new THREE.Group();

  const leatherUpperMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(shoeColorHex),
    roughness: 0.45,
    metalness: 0.02,
    clearcoat: 0.25,
    clearcoatRoughness: 0.2,
  });

  const midsoleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.01,
  });

  const outsoleMat = new THREE.MeshStandardMaterial({
    color: 0x1f2428,
    roughness: 0.65,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x4285f4, // Google blue accent
    roughness: 0.38,
  });

  // 1. Molded Ergonomic EVA Midsole & Outsole (with heel bevel and toe spring)
  const solePoints = [
    new THREE.Vector3(0, 0.005, -0.075),
    new THREE.Vector3(0.038, 0.008, -0.05),
    new THREE.Vector3(0.042, 0.012, 0.01),
    new THREE.Vector3(0.044, 0.016, 0.07),
    new THREE.Vector3(0, 0.025, 0.11), // Toe spring curve
    new THREE.Vector3(-0.044, 0.016, 0.07),
    new THREE.Vector3(-0.042, 0.012, 0.01),
    new THREE.Vector3(-0.038, 0.008, -0.05),
  ];
  const soleShape = new THREE.Shape();
  soleShape.moveTo(solePoints[0].x, solePoints[0].z);
  for (let i = 1; i < solePoints.length; i++) {
    soleShape.lineTo(solePoints[i].x, solePoints[i].z);
  }
  soleShape.closePath();

  const soleGeo = new THREE.ExtrudeGeometry(soleShape, {
    depth: 0.032,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.006,
    bevelThickness: 0.006,
  });
  soleGeo.rotateX(Math.PI / 2);
  const soleMesh = new THREE.Mesh(soleGeo, midsoleMat);
  soleMesh.position.set(0, 0.032, 0);
  soleMesh.castShadow = true;
  soleMesh.receiveShadow = true;
  shoe.add(soleMesh);

  // Black rubber tread outsole plate
  const treadGeo = new THREE.BoxGeometry(0.078, 0.006, 0.19);
  const tread = new THREE.Mesh(treadGeo, outsoleMat);
  tread.position.set(0, 0.003, 0.015);
  shoe.add(tread);

  // 2. Contoured Leather Upper
  const upperRings = [
    { y: 0.025, rx: 0.038, rz: 0.095, offsetZ: 0.015 },
    { y: 0.048, rx: 0.037, rz: 0.090, offsetZ: 0.012 },
    { y: 0.068, rx: 0.035, rz: 0.070, offsetZ: -0.005 },
    { y: 0.088, rx: 0.033, rz: 0.050, offsetZ: -0.018 },
  ];
  const upper = createSculptedOrganicLimb(upperRings, leatherUpperMat, 22);
  shoe.add(upper);

  // Rubber protective toe cap bumper
  const toeCapGeo = new THREE.SphereGeometry(0.036, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45);
  toeCapGeo.scale(0.9, 0.7, 1.25);
  const toeCap = new THREE.Mesh(toeCapGeo, midsoleMat);
  toeCap.position.set(0, 0.038, 0.082);
  shoe.add(toeCap);

  // Side dynamic Google-inspired swoosh/slash
  const slash = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.012, 0.06), accentMat);
  slash.position.set(0, 0.054, 0.02);
  slash.rotation.x = 0.25;
  shoe.add(slash);

  // 3. Ergonomic Curved Tongue & 3D Intertwined Laces
  const tongueCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.045, 0.065),
    new THREE.Vector3(0, 0.068, 0.045),
    new THREE.Vector3(0, 0.096, 0.018),
  ]);
  const tongue = createCurvedStrand(tongueCurve.getPoints(10), 0.016, leatherUpperMat, false, 12, 8);
  shoe.add(tongue);

  // 4 Cross-laced shoelaces
  for (let i = 0; i < 4; i++) {
    const yLace = 0.052 + i * 0.011;
    const zLace = 0.062 - i * 0.012;
    const laceCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.024, yLace - 0.002, zLace + 0.004),
      new THREE.Vector3(0, yLace + 0.005, zLace + 0.006),
      new THREE.Vector3(0.024, yLace - 0.002, zLace - 0.004),
    ]);
    const lace = createCurvedStrand(laceCurve.getPoints(8), 0.0032, midsoleMat, false, 10, 6);
    shoe.add(lace);
  }

  // Heel pull-tab
  const pullTabCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.075, -0.045),
    new THREE.Vector3(0, 0.102, -0.055),
    new THREE.Vector3(0, 0.082, -0.048),
  ]);
  const pullTab = createCurvedStrand(pullTabCurve.getPoints(8), 0.0035, accentMat, false, 8, 6);
  shoe.add(pullTab);

  return shoe;
}

/**
 * Creates the ultra-realistic, continuous organic 3D human model of Duyên
 * 21 years old Vietnamese female, university graduate & Google Ambassador
 * High-subdivision PBR materials, anatomical contours, lifelike procedural animations
 */
export function createDuyen3DModel(initialCustom: DuyenCustomization = DEFAULT_DUYEN_CUSTOMIZATION): DuyenCharacterRig {
  const root = new THREE.Group();
  root.name = 'Duyen_Realistic_Human_Model';

  let currentCustom = { ...initialCustom };

  // --- 1. ADVANCED PBR MATERIALS WITH SUBSURFACE SCATTERING GLOW ---
  const faceTexture = createDynamicFaceTexture(currentCustom);

  // Subsurface skin material for face
  const skinFaceMaterial = new THREE.MeshPhysicalMaterial({
    map: faceTexture,
    roughness: 0.38,
    metalness: 0.0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.28,
    sheen: 0.45,
    sheenColor: new THREE.Color(0xffbfa8), // Warm peachy dermal scatter glow
  });

  // Body skin material matching chosen skin tone with subsurface sheen
  const skinBodyMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(currentCustom.skinTone),
    roughness: 0.40,
    metalness: 0.0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.32,
    sheen: 0.40,
    sheenColor: new THREE.Color(0xffbfa8),
  });

  // Silk / Hair material with anisotropic specular sheen
  const hairMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(currentCustom.hairColor),
    roughness: 0.36,
    metalness: 0.14,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
  });

  // Cloth materials with natural fabric roughness
  const shirtMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(currentCustom.shirtColor),
    roughness: 0.78,
    metalness: 0.02,
  });

  const apronMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(currentCustom.apronColor),
    roughness: 0.82,
    metalness: 0.02,
  });

  const pantsMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(currentCustom.pantsColor),
    roughness: 0.80,
    metalness: 0.02,
  });

  const goldMetallicMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1c40f,
    roughness: 0.20,
    metalness: 0.96,
  });

  // --- 2. SKELETAL RIG HIERARCHY ---
  // Root Pelvis / Hip Center
  const body = new THREE.Group();
  body.position.y = 0.95;
  root.add(body);

  // Chest / Thorax Group (rotates & expands during breathing)
  const chest = new THREE.Group();
  chest.position.y = 0.32;
  body.add(chest);

  // 3. CONTINUOUS SCULPTED FEMININE TORSO MESH
  // 14 high-precision anatomical cross-sections (neck base, clavicles, bust projection, waist 60, hips 90, glutes)
  const torsoRings = [
    { y: 0.19, rx: 0.062, rz: 0.052, offsetZ: 0.005 },   // 0. Base of neck
    { y: 0.15, rx: 0.142, rz: 0.092, offsetZ: 0.002 },   // 1. Clavicles / Shoulder girdle
    { y: 0.09, rx: 0.154, rz: 0.118, offsetZ: 0.016 },   // 2. Full bust prominence (natural projection)
    { y: 0.02, rx: 0.144, rz: 0.102, offsetZ: 0.008 },   // 3. Underbust
    { y: -0.06, rx: 0.132, rz: 0.088, offsetZ: 0.0 },    // 4. Ribcage lower margin
    { y: -0.13, rx: 0.122, rz: 0.079, offsetZ: -0.004 }, // 5. Natural slender waist indentation
    { y: -0.19, rx: 0.134, rz: 0.086, offsetZ: -0.002 }, // 6. Navel level / Iliac crest
    { y: -0.26, rx: 0.152, rz: 0.100, offsetZ: 0.002 },  // 7. High hip flare
    { y: -0.34, rx: 0.162, rz: 0.114, offsetZ: -0.002 }, // 8. Full pelvic / Gluteal curve
    { y: -0.42, rx: 0.140, rz: 0.094, offsetZ: 0.0 },    // 9. Crotch / Pelvic floor
  ];

  const segmentsPerRing = 36;
  const torsoGeo = new THREE.BufferGeometry();
  const torsoVerts: THREE.Vector3[][] = [];

  torsoRings.forEach(ring => {
    const ringList: THREE.Vector3[] = [];
    const oz = ring.offsetZ || 0;

    for (let i = 0; i < segmentsPerRing; i++) {
      const angle = (i / segmentsPerRing) * Math.PI * 2;
      let x = Math.sin(angle) * ring.rx;
      let z = Math.cos(angle) * ring.rz + oz;

      // Realistic Bust Curvature (+Z is chest front)
      if (ring.y > 0.02 && ring.y < 0.14 && z > 0) {
        const bustFactor = Math.sin(((ring.y - 0.02) / 0.12) * Math.PI);
        const lateralDist = Math.abs(x);
        if (lateralDist > 0.025 && lateralDist < 0.115) {
          // Anatomical cleavage & natural curved bust projection
          z += 0.032 * bustFactor * (1.0 - Math.abs(lateralDist - 0.068) / 0.048);
        }
      }

      // Natural Lumbar Inward Arch (-Z is back)
      if (ring.y < -0.02 && ring.y > -0.22 && z < 0) {
        z += 0.010 * Math.sin(((ring.y + 0.02) / -0.2) * Math.PI);
      }

      ringList.push(new THREE.Vector3(x, ring.y, z));
    }
    torsoVerts.push(ringList);
  });

  const flatPositions: number[] = [];
  const flatUVs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < torsoRings.length; r++) {
    const v = r / (torsoRings.length - 1);
    for (let s = 0; s < segmentsPerRing; s++) {
      const u = s / segmentsPerRing;
      const pt = torsoVerts[r][s];
      flatPositions.push(pt.x, pt.y, pt.z);
      flatUVs.push(u, v);
    }
  }

  for (let r = 0; r < torsoRings.length - 1; r++) {
    for (let s = 0; s < segmentsPerRing; s++) {
      const nextS = (s + 1) % segmentsPerRing;
      const i0 = r * segmentsPerRing + s;
      const i1 = r * segmentsPerRing + nextS;
      const i2 = (r + 1) * segmentsPerRing + s;
      const i3 = (r + 1) * segmentsPerRing + nextS;

      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  torsoGeo.setAttribute('position', new THREE.Float32BufferAttribute(flatPositions, 3));
  torsoGeo.setAttribute('uv', new THREE.Float32BufferAttribute(flatUVs, 2));
  torsoGeo.setIndex(indices);
  torsoGeo.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeo, shirtMaterial);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  chest.add(torsoMesh);

  // 4. ELEGANT SWAN NECK WITH CLAVICLE BONES & SUPRASTERNAL NOTCH
  const neckMesh = createSculptedOrganicLimb([
    { y: 0.17, rx: 0.052, rz: 0.048, offsetZ: 0.002 },
    { y: 0.23, rx: 0.046, rz: 0.042, offsetZ: 0.004 },
    { y: 0.30, rx: 0.043, rz: 0.040, offsetZ: 0.006 },
    { y: 0.34, rx: 0.046, rz: 0.042, offsetZ: 0.005 },
  ], skinBodyMaterial, 24);
  chest.add(neckMesh);

  // Sculpted Collarbone (Xương quai xanh thanh tú)
  const clavicleCurveL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.145, 0.065),
    new THREE.Vector3(0.045, 0.150, 0.070),
    new THREE.Vector3(0.125, 0.162, 0.048),
  ]);
  const clavicleL = createCurvedStrand(clavicleCurveL.getPoints(12), 0.0048, skinBodyMaterial, true, 12, 8);
  chest.add(clavicleL);

  const clavicleCurveR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.145, 0.065),
    new THREE.Vector3(-0.045, 0.150, 0.070),
    new THREE.Vector3(-0.125, 0.162, 0.048),
  ]);
  const clavicleR = createCurvedStrand(clavicleCurveR.getPoints(12), 0.0048, skinBodyMaterial, true, 12, 8);
  chest.add(clavicleR);

  // Dynamic Outfit Layer Group (Apron, Blazer, Cardigan, Gown, Badges, Lanyards)
  const outfitLayerGroup = new THREE.Group();
  chest.add(outfitLayerGroup);

  // --- 5. HEAD & SCULPTED ASIAN FEMININE FACIAL ANATOMY ---
  const head = new THREE.Group();
  head.position.y = 0.35;
  chest.add(head);

  // High-density sculpted head geometry with V-line jaw, delicate chin, cheekbones & brow
  const headGeo = new THREE.SphereGeometry(0.122, 48, 48);
  headGeo.scale(0.92, 1.14, 0.98);

  const posAttr = headGeo.attributes.position;
  const uvAttr = headGeo.attributes.uv;

  for (let i = 0; i < posAttr.count; i++) {
    let x = posAttr.getX(i);
    let y = posAttr.getY(i);
    let z = posAttr.getZ(i);

    // Taper lower jaw towards feminine rounded V-line chin
    if (y < -0.015 && z > -0.04) {
      const taper = 1.0 - ((-0.015 - y) / 0.125) * 0.36;
      x *= taper;
      z += (y + 0.015) * 0.085;
    }

    // Soft Asian cheekbone prominence (gò má bầu bĩnh trẻ trung)
    if (y > -0.02 && y < 0.045 && z > 0.045) {
      z += 0.0085 * (1.0 - Math.abs(x) / 0.105);
    }

    // Smooth forehead curvature
    if (y > 0.045 && z > 0.055) {
      z += 0.004;
    }

    // Soft temple indentation
    if (y > 0.02 && y < 0.08 && Math.abs(x) > 0.085) {
      x *= 0.96;
    }

    posAttr.setXYZ(i, x, y, z);

    // Precise orthographic UV unwrap for face texture projection
    if (z > -0.025) {
      const u = (x / 0.112) * 0.42 + 0.5;
      const v = (y / 0.132) * 0.42 + 0.5;
      uvAttr.setXY(i, Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)));
    }
  }
  headGeo.computeVertexNormals();
  uvAttr.needsUpdate = true;
  posAttr.needsUpdate = true;

  const headMesh = new THREE.Mesh(headGeo, skinFaceMaterial);
  headMesh.castShadow = true;
  head.add(headMesh);

  // 3D Sculpted Eyes with Dual Eyelids (Upper + Lower) & Cornea Refraction
  const create3DEyeWithLids = (isRight: boolean) => {
    const eyeGroup = new THREE.Group();
    const side = isRight ? 1 : -1;
    eyeGroup.position.set(0.042 * side, 0.014, 0.110);

    // 1. Wet Refractive Cornea Sphere
    const corneaMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      roughness: 0.02,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      ior: 1.336,
    });
    const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 18, 18), corneaMat);
    eyeGroup.add(cornea);

    // 2. Dynamic Upper Eyelid for Realistic Smooth Blinking
    const eyelidUpperGeo = new THREE.SphereGeometry(0.0132, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const upperEyelid = new THREE.Mesh(eyelidUpperGeo, skinBodyMaterial);
    upperEyelid.rotation.x = -Math.PI * 0.42; // Resting open position
    eyeGroup.add(upperEyelid);

    // 3. Dynamic Lower Eyelid (Elevates during radiant smile!)
    const eyelidLowerGeo = new THREE.SphereGeometry(0.0130, 18, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
    const lowerEyelid = new THREE.Mesh(eyelidLowerGeo, skinBodyMaterial);
    lowerEyelid.rotation.x = 0.22;
    eyeGroup.add(lowerEyelid);

    // 4. Feathered 3D Eyelash Curve with winged flick
    const lashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.015 * side, 0.007, 0.004),
      new THREE.Vector3(0, 0.012, 0.007),
      new THREE.Vector3(0.018 * side, 0.008, 0.004),
      new THREE.Vector3(0.025 * side, 0.012, -0.002), // Elegant winged cat-eye flick
    ]);
    const lashGeo = new THREE.TubeGeometry(lashCurve, 16, 0.0015, 6, false);
    const lashMat = new THREE.MeshStandardMaterial({ color: 0x090503, roughness: 0.25 });
    const lash = new THREE.Mesh(lashGeo, lashMat);
    eyeGroup.add(lash);

    return { eyeGroup, upperEyelid, lowerEyelid };
  };

  const leftEyeData = create3DEyeWithLids(false);
  const rightEyeData = create3DEyeWithLids(true);
  head.add(leftEyeData.eyeGroup);
  head.add(rightEyeData.eyeGroup);

  // 3D Sculpted Feminine Nose (Bridge, Supratip, Rounded Tip, Alar Wings)
  const noseGroup = new THREE.Group();
  noseGroup.position.set(0, -0.018, 0.120);

  // Nose tip
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.0078, 16, 16), skinBodyMaterial);
  noseTip.scale.set(1.02, 0.86, 1.05);
  noseGroup.add(noseTip);

  // Nasal bone bridge
  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.038, -0.008),
    new THREE.Vector3(0, 0.022, -0.004),
    new THREE.Vector3(0, 0.006, 0.002),
  ]);
  const bridge = createCurvedStrand(bridgeCurve.getPoints(10), 0.0045, skinBodyMaterial, false, 10, 8);
  noseGroup.add(bridge);

  // Alar nostril wings (cánh mũi thon gọn)
  for (const side of [-1, 1]) {
    const alar = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 12, 12), skinBodyMaterial);
    alar.scale.set(0.9, 0.75, 1.1);
    alar.position.set(0.0078 * side, -0.002, -0.002);
    noseGroup.add(alar);
  }
  head.add(noseGroup);

  // 3D Sculpted Ears (Helix, Antihelix, Concha, Lobe)
  const createSculptedEar = (isRight: boolean) => {
    const earGroup = new THREE.Group();
    const side = isRight ? 1 : -1;
    earGroup.position.set(0.110 * side, 0.014, -0.02);
    earGroup.rotation.y = 0.22 * side;

    // Outer helix rim
    const helix = new THREE.Mesh(new THREE.TorusGeometry(0.023, 0.0045, 10, 20), skinBodyMaterial);
    helix.scale.set(0.68, 1.18, 1.0);
    earGroup.add(helix);

    // Ear lobe (dái tai đầy đặn)
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 12, 12), skinBodyMaterial);
    lobe.position.set(0, -0.023, 0);
    earGroup.add(lobe);

    return earGroup;
  };
  head.add(createSculptedEar(false));
  head.add(createSculptedEar(true));

  // Dynamic Hair & Accessory Groups
  const hairGroup = new THREE.Group();
  head.add(hairGroup);

  const accessoryGroup = new THREE.Group();
  head.add(accessoryGroup);

  // Optional Sims Green Plumbob Diamond
  const plumbobMat = new THREE.MeshStandardMaterial({
    color: 0x2ecc71,
    emissive: 0x27ae60,
    emissiveIntensity: 0.65,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.92,
  });
  const plumbobGeo = new THREE.OctahedronGeometry(0.065, 0);
  plumbobGeo.scale(0.8, 1.7, 0.8);
  const plumbobMesh = new THREE.Mesh(plumbobGeo, plumbobMat);
  plumbobMesh.position.set(0, 0.44, 0);
  plumbobMesh.castShadow = true;
  plumbobMesh.visible = currentCustom.showPlumbob;
  head.add(plumbobMesh);

  // --- 6. SCULPTED ORGANIC LEGS (Continuous Thighs, Patella, Gastrocnemius Calves, Ankles, Shoes) ---
  const createOrganicLeg = (isRight: boolean) => {
    const legGroup = new THREE.Group();
    const side = isRight ? 1 : -1;
    legGroup.position.set(0.076 * side, -0.09, 0);

    // Upper Thigh (anatomical vastus lateralis bulge & smooth groin transition)
    const thighRings = [
      { y: 0.0, rx: 0.070, rz: 0.068, offsetX: 0.002 * side },
      { y: -0.10, rx: 0.065, rz: 0.062, offsetX: 0.004 * side },
      { y: -0.22, rx: 0.056, rz: 0.052, offsetX: 0.002 * side },
      { y: -0.34, rx: 0.046, rz: 0.044, offsetX: 0.0 },
    ];
    const thigh = createSculptedOrganicLimb(thighRings, pantsMaterial, 24);
    legGroup.add(thigh);

    // Knee Joint with Patella & Soft Tendon Recesses
    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(0, -0.36, 0.005);

    const patella = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 16), pantsMaterial);
    patella.scale.set(0.92, 1.08, 1.15);
    kneeGroup.add(patella);
    legGroup.add(kneeGroup);

    // Sculpted Calf (Natural gastrocnemius muscle curves tapering to delicate Achilles tendon)
    const calfRings = [
      { y: -0.38, rx: 0.044, rz: 0.042, offsetZ: 0.0 },
      { y: -0.48, rx: 0.048, rz: 0.046, offsetZ: -0.008 }, // Calf belly curve at back
      { y: -0.60, rx: 0.038, rz: 0.036, offsetZ: -0.004 },
      { y: -0.72, rx: 0.030, rz: 0.028, offsetZ: 0.0 },   // Slender ankle
    ];
    const calf = createSculptedOrganicLimb(calfRings, pantsMaterial, 24);
    legGroup.add(calf);

    // Delicate Ankle Malleolus Bones (Mắt cá chân: trong cao hơn ngoài)
    const innerAnkle = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 10, 10), pantsMaterial);
    innerAnkle.position.set(-0.028 * side, -0.73, 0);
    legGroup.add(innerAnkle);

    const outerAnkle = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 10, 10), pantsMaterial);
    outerAnkle.position.set(0.028 * side, -0.74, 0);
    legGroup.add(outerAnkle);

    // High-fidelity designer sneaker
    const shoe = createSculptedModernSneaker('#ffffff');
    shoe.position.set(0, -0.77, 0.02);
    legGroup.add(shoe);

    return legGroup;
  };

  const leftLeg = createOrganicLeg(false);
  const rightLeg = createOrganicLeg(true);
  body.add(leftLeg);
  body.add(rightLeg);

  // --- 7. SCULPTED ORGANIC ARMS (Deltoid, Bicep, Olecranon Elbow, Forearm, Delicate Hand) ---
  const createOrganicArm = (isRight: boolean) => {
    const armGroup = new THREE.Group();
    const side = isRight ? 1 : -1;
    armGroup.position.set(0.186 * side, 0.12, 0);

    // Deltoid Shoulder Cap smoothly blending into the arm
    const deltoidGeo = new THREE.SphereGeometry(0.046, 20, 20);
    deltoidGeo.scale(0.96, 1.28, 1.05);
    const deltoid = new THREE.Mesh(deltoidGeo, shirtMaterial);
    deltoid.position.set(0.012 * side, -0.02, 0);
    deltoid.castShadow = true;
    armGroup.add(deltoid);

    // Upper Arm (Bicep / Tricep natural taper)
    const upperArmRings = [
      { y: -0.02, rx: 0.042, rz: 0.038, offsetZ: 0 },
      { y: -0.12, rx: 0.038, rz: 0.034, offsetZ: 0.002 },
      { y: -0.22, rx: 0.032, rz: 0.030, offsetZ: 0 },
    ];
    const bicep = createSculptedOrganicLimb(upperArmRings, shirtMaterial, 20);
    armGroup.add(bicep);

    // Forearm Group with Elbow Articulation
    const forearmGroup = new THREE.Group();
    forearmGroup.position.y = -0.24;
    armGroup.add(forearmGroup);

    // Elbow Olecranon notch
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 14), shirtMaterial);
    elbow.position.set(0, 0, -0.006);
    forearmGroup.add(elbow);

    // Forearm (Brachioradialis muscle taper to delicate feminine wrist)
    const forearmRings = [
      { y: 0.0, rx: 0.032, rz: 0.029, offsetZ: 0.002 },
      { y: -0.08, rx: 0.034, rz: 0.031, offsetZ: 0.004 }, // Brachioradialis fullness
      { y: -0.16, rx: 0.026, rz: 0.023, offsetZ: 0.002 },
      { y: -0.22, rx: 0.022, rz: 0.018, offsetZ: 0.0 },   // Slender wrist
    ];
    const forearm = createSculptedOrganicLimb(forearmRings, skinBodyMaterial, 20);
    forearmGroup.add(forearm);

    // Organic Sculpted 5-Finger Feminine Hand
    const hand = createSculptedFeminineHand(skinBodyMaterial, isRight);
    hand.position.y = -0.22;
    forearmGroup.add(hand);

    return { armGroup, forearmGroup, hand };
  };

  const leftArmData = createOrganicArm(false);
  const rightArmData = createOrganicArm(true);
  chest.add(leftArmData.armGroup);
  chest.add(rightArmData.armGroup);

  const leftArm = leftArmData.armGroup;
  const leftForearm = leftArmData.forearmGroup;
  const rightArm = rightArmData.armGroup;
  const rightForearm = rightArmData.forearmGroup;

  // --- 8. PROCEDURAL HAIR GENERATOR (Silky Clusters, Curtain Bangs, Waves, Buns) ---
  const rebuildHair = (custom: DuyenCustomization) => {
    while (hairGroup.children.length > 0) {
      hairGroup.remove(hairGroup.children[0]);
    }

    hairMaterial.color.set(custom.hairColor);

    // 1. Skull crown cap with realistic scalp margin
    const capGeo = new THREE.SphereGeometry(
      0.126, 36, 36,
      Math.PI * 0.28, Math.PI * 1.44,
      0, Math.PI * 0.66
    );
    capGeo.scale(1.02, 1.14, 1.05);
    const cap = new THREE.Mesh(capGeo, hairMaterial);
    cap.position.set(0, 0.02, -0.015);
    cap.castShadow = true;
    hairGroup.add(cap);

    // Back hair volume
    const backGeo = new THREE.SphereGeometry(
      0.125, 32, 32,
      Math.PI * 0.45, Math.PI * 1.1,
      Math.PI * 0.2, Math.PI * 0.65
    );
    const backHair = new THREE.Mesh(backGeo, hairMaterial);
    backHair.position.set(0, 0.0, -0.022);
    hairGroup.add(backHair);

    // 2. Korean/Vietnamese Face-Framing Curtain Bangs ("Mái bay" duyên dáng)
    for (const side of [-1, 1]) {
      // Main curtain strand framing cheekbone
      hairGroup.add(createCurvedStrand([
        new THREE.Vector3(0.018 * side, 0.125, 0.062),
        new THREE.Vector3(0.058 * side, 0.095, 0.084),
        new THREE.Vector3(0.098 * side, 0.042, 0.068),
        new THREE.Vector3(0.118 * side, -0.025, 0.038),
      ], 0.013, hairMaterial, true, 20, 10));

      // Wispy temple strand
      hairGroup.add(createCurvedStrand([
        new THREE.Vector3(0.045 * side, 0.11, 0.04),
        new THREE.Vector3(0.085 * side, 0.06, 0.05),
        new THREE.Vector3(0.105 * side, -0.01, 0.02),
      ], 0.009, hairMaterial, true, 16, 8));
    }

    // 3. Hairstyle Specific Meshes
    if (custom.hairstyle === 'wavy_natural') {
      // Flowing natural waves over both shoulders
      for (const side of [-1, 1]) {
        // Front cascading S-wave
        hairGroup.add(createCurvedStrand([
          new THREE.Vector3(0.095 * side, 0.085, -0.008),
          new THREE.Vector3(0.128 * side, 0.005, 0.028),
          new THREE.Vector3(0.134 * side, -0.095, 0.048),
          new THREE.Vector3(0.118 * side, -0.215, 0.038),
          new THREE.Vector3(0.088 * side, -0.340, 0.018),
        ], 0.018, hairMaterial, true, 28, 10));

        // Side volume wave
        hairGroup.add(createCurvedStrand([
          new THREE.Vector3(0.075 * side, 0.045, -0.07),
          new THREE.Vector3(0.110 * side, -0.075, -0.06),
          new THREE.Vector3(0.100 * side, -0.235, -0.04),
        ], 0.019, hairMaterial, true, 22, 10));
      }

      // Volumetric back waves
      hairGroup.add(createCurvedStrand([
        new THREE.Vector3(0, 0.045, -0.112),
        new THREE.Vector3(0, -0.055, -0.165),
        new THREE.Vector3(0.015, -0.175, -0.155),
        new THREE.Vector3(-0.015, -0.300, -0.125),
      ], 0.026, hairMaterial, true, 26, 12));

    } else if (custom.hairstyle === 'chef_bun') {
      // Sculpted culinary high bun with braided wrap
      const bunGeo = new THREE.TorusGeometry(0.058, 0.029, 18, 32);
      const bun = new THREE.Mesh(bunGeo, hairMaterial);
      bun.rotation.x = Math.PI / 2;
      bun.position.set(0, 0.165, -0.042);
      hairGroup.add(bun);

      const bunCore = new THREE.Mesh(new THREE.SphereGeometry(0.054, 20, 20), hairMaterial);
      bunCore.position.set(0, 0.165, -0.042);
      hairGroup.add(bunCore);

      // Polished dark mahogany hairpin
      const pinMat = new THREE.MeshStandardMaterial({ color: 0x5a2d18, roughness: 0.35, metalness: 0.1 });
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0028, 0.24, 14), pinMat);
      pin.rotation.z = 0.72;
      pin.position.set(0, 0.172, -0.042);
      hairGroup.add(pin);

    } else if (custom.hairstyle === 'ponytail') {
      // High sleek athletic ponytail
      const tieMat = new THREE.MeshStandardMaterial({ color: 0x1f2428, roughness: 0.6 });
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0085, 12, 28), tieMat);
      tie.position.set(0, 0.125, -0.115);
      hairGroup.add(tie);

      // Flowing tail with natural bounce
      hairGroup.add(createCurvedStrand([
        new THREE.Vector3(0, 0.125, -0.125),
        new THREE.Vector3(0, 0.065, -0.225),
        new THREE.Vector3(0.015, -0.075, -0.235),
        new THREE.Vector3(0, -0.235, -0.195),
      ], 0.029, hairMaterial, true, 26, 12));

    } else if (custom.hairstyle === 'chic_bob') {
      // Parisian graduated chin-length bob
      for (const side of [-1, 1]) {
        hairGroup.add(createCurvedStrand([
          new THREE.Vector3(0.095 * side, 0.075, -0.01),
          new THREE.Vector3(0.128 * side, -0.015, 0.015),
          new THREE.Vector3(0.118 * side, -0.135, 0.035),
        ], 0.024, hairMaterial, true, 22, 10));
      }

    } else if (custom.hairstyle === 'braided') {
      // French side braid cascading over shoulder
      for (let i = 0; i < 7; i++) {
        const knot = new THREE.Mesh(new THREE.SphereGeometry(0.024 - i * 0.002, 16, 16), hairMaterial);
        knot.scale.set(1.15, 0.85, 1.0);
        knot.position.set(0.108 + i * 0.008, -0.015 - i * 0.055, 0.042 - i * 0.008);
        hairGroup.add(knot);
      }

    } else if (custom.hairstyle === 'glamour_waves') {
      // Hollywood glamorous side-swept waves
      for (const side of [-1, 1]) {
        hairGroup.add(createCurvedStrand([
          new THREE.Vector3(0.092 * side, 0.092, 0.012),
          new THREE.Vector3(0.134 * side, 0.022, 0.045),
          new THREE.Vector3(0.144 * side, -0.095, 0.065),
          new THREE.Vector3(0.124 * side, -0.215, 0.052),
          new THREE.Vector3(0.092 * side, -0.355, 0.032),
        ], 0.024, hairMaterial, true, 30, 12));
      }

    } else if (custom.hairstyle === 'twin_braids') {
      // Youthful twin braids
      for (const side of [-1, 1]) {
        for (let i = 0; i < 6; i++) {
          const knot = new THREE.Mesh(new THREE.SphereGeometry(0.021 - i * 0.0016, 14, 14), hairMaterial);
          knot.position.set(0.096 * side, -0.035 - i * 0.052, 0.022);
          hairGroup.add(knot);
        }
      }
    }
  };

  // --- 9. PROCEDURAL CLOTHING GENERATOR (NO BLOCKS/BOXES!) ---
  const rebuildOutfit = (custom: DuyenCustomization) => {
    while (outfitLayerGroup.children.length > 0) {
      outfitLayerGroup.remove(outfitLayerGroup.children[0]);
    }

    shirtMaterial.color.set(custom.shirtColor);
    apronMaterial.color.set(custom.apronColor);
    pantsMaterial.color.set(custom.pantsColor);

    if (custom.outfitStyle === 'bistro_chef') {
      // 1. Chef Coat Mandarin Collar with thickness & overlap
      const collarMesh = createSculptedOrganicLimb([
        { y: 0.155, rx: 0.056, rz: 0.052, offsetZ: 0.004 },
        { y: 0.185, rx: 0.058, rz: 0.054, offsetZ: 0.005 },
      ], shirtMaterial, 24);
      outfitLayerGroup.add(collarMesh);

      // Asymmetric double-breasted placket fabric line
      const placketCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.045, 0.17, 0.09),
        new THREE.Vector3(0.042, 0.05, 0.125),
        new THREE.Vector3(0.040, -0.10, 0.10),
      ]);
      const placket = createCurvedStrand(placketCurve.getPoints(12), 0.0045, shirtMaterial, false, 14, 8);
      outfitLayerGroup.add(placket);

      // Double-breasted Fabric Buttons with 4 stitched hole details
      for (let r = 0; r < 4; r++) {
        for (const col of [-0.034, 0.038]) {
          const btn = new THREE.Mesh(new THREE.SphereGeometry(0.0058, 12, 12), shirtMaterial);
          btn.scale.set(1.0, 1.0, 0.6);
          btn.position.set(col, 0.11 - r * 0.046, 0.112);
          outfitLayerGroup.add(btn);
        }
      }

      // Rolled-up 3/4 sleeves with thick cuffs on both arms
      for (const arm of [leftArm, rightArm]) {
        const cuff = createSculptedOrganicLimb([
          { y: -0.19, rx: 0.044, rz: 0.042 },
          { y: -0.23, rx: 0.046, rz: 0.044 },
        ], shirtMaterial, 20);
        arm.add(cuff);
      }

      // 2. Realistic Contoured Bistro Wrap Apron
      // Upper Bib contoured to the bust curve
      const bibRings = [
        { y: 0.08, rx: 0.125, rz: 0.122, offsetZ: 0.018 },
        { y: 0.0, rx: 0.148, rz: 0.108, offsetZ: 0.010 },
        { y: -0.12, rx: 0.128, rz: 0.084, offsetZ: 0.002 },
      ];
      const bib = createSculptedOrganicLimb(bibRings, apronMaterial, 28);
      outfitLayerGroup.add(bib);

      // Apron Skirt wrapping gracefully around hips & thighs
      const skirtRings = [
        { y: -0.14, rx: 0.134, rz: 0.088, offsetZ: 0.002 },
        { y: -0.24, rx: 0.156, rz: 0.106, offsetZ: 0.004 },
        { y: -0.34, rx: 0.168, rz: 0.118, offsetZ: 0.005 },
        { y: -0.42, rx: 0.176, rz: 0.124, offsetZ: 0.006 },
      ];
      const apronSkirt = createSculptedOrganicLimb(skirtRings, apronMaterial, 28);
      outfitLayerGroup.add(apronSkirt);

      // Deep Front Utility Pocket with fabric sag
      const pocketRings = [
        { y: -0.18, rx: 0.110, rz: 0.102, offsetZ: 0.045 },
        { y: -0.28, rx: 0.118, rz: 0.110, offsetZ: 0.048 },
      ];
      const pocket = createSculptedOrganicLimb(pocketRings, apronMaterial, 22);
      outfitLayerGroup.add(pocket);

      // Folded Waffle-Weave Kitchen Towel draped on left hip with natural cloth folds
      const towelMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f2, roughness: 0.88 });
      const towelCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.148, -0.14, 0.04),
        new THREE.Vector3(-0.168, -0.24, 0.045),
        new THREE.Vector3(-0.158, -0.34, 0.038),
      ]);
      const towel = createCurvedStrand(towelCurve.getPoints(12), 0.022, towelMat, false, 14, 8);
      towel.scale.set(0.45, 1.0, 1.15);
      outfitLayerGroup.add(towel);

      // Realistic Apron Tie Knot & Flowing Ribbon Tails at back
      const bowKnot = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.011, 12, 22), apronMaterial);
      bowKnot.position.set(0, -0.17, -0.125);
      outfitLayerGroup.add(bowKnot);

      const tailL = createCurvedStrand([
        new THREE.Vector3(-0.016, -0.17, -0.125),
        new THREE.Vector3(-0.034, -0.27, -0.138),
        new THREE.Vector3(-0.022, -0.38, -0.130),
      ], 0.0085, apronMaterial, true, 16, 8);
      outfitLayerGroup.add(tailL);

      const tailR = createCurvedStrand([
        new THREE.Vector3(0.016, -0.17, -0.125),
        new THREE.Vector3(0.034, -0.27, -0.138),
        new THREE.Vector3(0.022, -0.38, -0.130),
      ], 0.0085, apronMaterial, true, 16, 8);
      outfitLayerGroup.add(tailR);

      // Google Ambassador Metallic Gold Lapel Pin
      const pinBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.006, 20), goldMetallicMaterial);
      pinBadge.rotation.x = Math.PI / 2;
      pinBadge.position.set(-0.076, 0.082, 0.128);
      outfitLayerGroup.add(pinBadge);

    } else if (custom.outfitStyle === 'google_ambassador') {
      // Modern Tailored Tech Ambassador Blazer with structured shoulders & lapels
      const blazerRings = [
        { y: 0.14, rx: 0.152, rz: 0.098, offsetZ: 0.005 },
        { y: 0.06, rx: 0.158, rz: 0.116, offsetZ: 0.014 },
        { y: -0.08, rx: 0.136, rz: 0.086, offsetZ: 0.0 },
        { y: -0.20, rx: 0.148, rz: 0.096, offsetZ: 0.002 },
      ];
      const blazer = createSculptedOrganicLimb(blazerRings, new THREE.MeshStandardMaterial({ color: 0x1a73e8, roughness: 0.65 }), 28);
      outfitLayerGroup.add(blazer);

      // Tailored Notched Lapel Collar
      const lapelL = createCurvedStrand([
        new THREE.Vector3(0.045, 0.16, 0.08),
        new THREE.Vector3(0.075, 0.06, 0.11),
        new THREE.Vector3(0.025, -0.06, 0.12),
      ], 0.012, new THREE.MeshStandardMaterial({ color: 0x1557b0, roughness: 0.6 }), false, 14, 8);
      outfitLayerGroup.add(lapelL);

      const lapelR = createCurvedStrand([
        new THREE.Vector3(-0.045, 0.16, 0.08),
        new THREE.Vector3(-0.075, 0.06, 0.11),
        new THREE.Vector3(-0.025, -0.06, 0.12),
      ], 0.012, new THREE.MeshStandardMaterial({ color: 0x1557b0, roughness: 0.6 }), false, 14, 8);
      outfitLayerGroup.add(lapelR);

      // Google Ambassador Fabric Lanyard Ribbon
      const lanyardCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.055, 0.16, 0.025),
        new THREE.Vector3(-0.068, 0.06, 0.095),
        new THREE.Vector3(0, -0.065, 0.142),
        new THREE.Vector3(0.068, 0.06, 0.095),
        new THREE.Vector3(0.055, 0.16, 0.025),
      ]);
      const lanyard = createCurvedStrand(lanyardCurve.getPoints(24), 0.0058, new THREE.MeshStandardMaterial({ color: 0xea4335, roughness: 0.5 }), false, 24, 8);
      outfitLayerGroup.add(lanyard);

      // Dangling Holographic Acrylic ID Badge
      const badgeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.2,
        clearcoat: 0.8,
        transmission: 0.4,
      });
      const idBadge = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.095, 0.0035), badgeMat);
      idBadge.position.set(0, -0.115, 0.146);
      outfitLayerGroup.add(idBadge);

      // Rose-gold luxury minimalist watch on left wrist
      const watchMat = new THREE.MeshStandardMaterial({ color: 0xb76e79, metalness: 0.88, roughness: 0.22 });
      const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.012, 20), watchMat);
      watch.position.y = -0.19;
      leftForearm.add(watch);

    } else if (custom.outfitStyle === 'chic_casual') {
      // Soft Ribbed Knit Cardigan with scallops & pearl buttons
      const cardiganRings = [
        { y: 0.14, rx: 0.150, rz: 0.095, offsetZ: 0.004 },
        { y: 0.04, rx: 0.154, rz: 0.112, offsetZ: 0.012 },
        { y: -0.10, rx: 0.132, rz: 0.084, offsetZ: 0.0 },
        { y: -0.22, rx: 0.145, rz: 0.094, offsetZ: 0.002 },
      ];
      const cardigan = createSculptedOrganicLimb(cardiganRings, new THREE.MeshStandardMaterial({ color: 0x9c88ff, roughness: 0.86 }), 28);
      outfitLayerGroup.add(cardigan);

      // Pearl buttons
      for (let i = 0; i < 4; i++) {
        const btn = new THREE.Mesh(new THREE.SphereGeometry(0.0062, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.25 }));
        btn.position.set(0, 0.08 - i * 0.068, 0.118);
        outfitLayerGroup.add(btn);
      }

      // Pleated Flare Skirt with 16 distinct knife pleats
      const skirtMat = new THREE.MeshStandardMaterial({ color: 0x2f3640, roughness: 0.75 });
      const pleatGroup = new THREE.Group();
      pleatGroup.position.y = -0.24;

      const pleatCount = 18;
      for (let p = 0; p < pleatCount; p++) {
        const angle = (p / pleatCount) * Math.PI * 2;
        const pleatMesh = createCurvedStrand([
          new THREE.Vector3(Math.sin(angle) * 0.14, 0, Math.cos(angle) * 0.09),
          new THREE.Vector3(Math.sin(angle) * 0.22, -0.22, Math.cos(angle) * 0.15),
        ], 0.016, skirtMat, false, 8, 6);
        pleatGroup.add(pleatMesh);
      }
      outfitLayerGroup.add(pleatGroup);

    } else if (custom.outfitStyle === 'graduation_formal') {
      // Flowing Modern Vietnamese Áo Dài / Graduation Silk Gown
      const gownMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.82 });
      const gownRings = [
        { y: 0.12, rx: 0.148, rz: 0.096, offsetZ: 0.004 },
        { y: 0.0, rx: 0.152, rz: 0.112, offsetZ: 0.010 },
        { y: -0.16, rx: 0.134, rz: 0.088, offsetZ: 0.0 },
        { y: -0.36, rx: 0.170, rz: 0.115, offsetZ: 0.005 },
        { y: -0.60, rx: 0.210, rz: 0.140, offsetZ: 0.008 },
      ];
      const gown = createSculptedOrganicLimb(gownRings, gownMat, 30);
      outfitLayerGroup.add(gown);

      // Satin Gold Academic Honor Stole
      const stoleL = createCurvedStrand([
        new THREE.Vector3(-0.055, 0.15, 0.055),
        new THREE.Vector3(-0.078, 0.02, 0.125),
        new THREE.Vector3(-0.078, -0.22, 0.145),
      ], 0.019, goldMetallicMaterial, false, 18, 8);
      outfitLayerGroup.add(stoleL);

      const stoleR = createCurvedStrand([
        new THREE.Vector3(0.055, 0.15, 0.055),
        new THREE.Vector3(0.078, 0.02, 0.125),
        new THREE.Vector3(0.078, -0.22, 0.145),
      ], 0.019, goldMetallicMaterial, false, 18, 8);
      outfitLayerGroup.add(stoleR);

    } else if (custom.outfitStyle === 'streetwear') {
      // Oversized Cozy Streetwear Hoodie
      const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x222f3e, roughness: 0.82 });
      const hoodieRings = [
        { y: 0.14, rx: 0.162, rz: 0.108, offsetZ: 0.005 },
        { y: 0.04, rx: 0.174, rz: 0.128, offsetZ: 0.015 },
        { y: -0.10, rx: 0.158, rz: 0.108, offsetZ: 0.004 },
        { y: -0.25, rx: 0.165, rz: 0.114, offsetZ: 0.004 },
      ];
      const hoodie = createSculptedOrganicLimb(hoodieRings, hoodieMat, 28);
      outfitLayerGroup.add(hoodie);

      // Volumetric Cowl Hood resting behind neck & shoulders
      const hoodRest = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.038, 14, 28), hoodieMat);
      hoodRest.position.set(0, 0.125, -0.085);
      hoodRest.rotation.x = Math.PI * 0.36;
      outfitLayerGroup.add(hoodRest);

      // Front Kangaroo Pouch Pocket
      const pouchRings = [
        { y: -0.12, rx: 0.125, rz: 0.112, offsetZ: 0.035 },
        { y: -0.22, rx: 0.134, rz: 0.118, offsetZ: 0.040 },
      ];
      const pouch = createSculptedOrganicLimb(pouchRings, hoodieMat, 22);
      outfitLayerGroup.add(pouch);
    }
  };

  // --- 10. PROCEDURAL ACCESSORIES GENERATOR ---
  const rebuildAccessories = (custom: DuyenCustomization) => {
    while (accessoryGroup.children.length > 0) {
      accessoryGroup.remove(accessoryGroup.children[0]);
    }

    // Glasses
    if (custom.glasses === 'smart_round' || custom.glasses === 'chic_square') {
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x1b1464, metalness: 0.88, roughness: 0.18 });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.38,
        roughness: 0.03,
        transmission: 0.95,
        clearcoat: 1.0,
      });

      for (const side of [-1, 1]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0032, 10, 28), frameMat);
        ring.position.set(0.042 * side, 0.015, 0.126);
        accessoryGroup.add(ring);

        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.022, 22), glassMat);
        lens.position.set(0.042 * side, 0.015, 0.126);
        accessoryGroup.add(lens);
      }

      // Bridge connection over nose
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.018, 10), frameMat);
      bridge.rotation.z = Math.PI / 2;
      bridge.position.set(0, 0.016, 0.129);
      accessoryGroup.add(bridge);
    }

    // Earrings
    if (custom.earrings === 'pearl') {
      const pearlMat = new THREE.MeshPhysicalMaterial({
        color: 0xfffcf7,
        roughness: 0.14,
        metalness: 0.1,
        clearcoat: 0.9,
      });
      for (const side of [-1, 1]) {
        const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 14, 14), pearlMat);
        pearl.position.set(0.114 * side, -0.018, -0.02);
        accessoryGroup.add(pearl);
      }
    } else if (custom.earrings === 'gold_hoop') {
      const hoopMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.18, metalness: 0.96 });
      for (const side of [-1, 1]) {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.0026, 10, 22), hoopMat);
        hoop.position.set(0.114 * side, -0.026, -0.02);
        hoop.rotation.y = Math.PI / 2;
        accessoryGroup.add(hoop);
      }
    }

    // Headwear
    if (custom.headwear === 'chef_bandana') {
      const bandanaMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.62 });
      const band = createCurvedStrand([
        new THREE.Vector3(-0.115, 0.075, 0.02),
        new THREE.Vector3(0, 0.090, 0.125),
        new THREE.Vector3(0.115, 0.075, 0.02),
      ], 0.014, bandanaMat, false, 16, 8);
      accessoryGroup.add(band);
    }
  };

  // Build initial parts
  rebuildHair(currentCustom);
  rebuildOutfit(currentCustom);
  rebuildAccessories(currentCustom);

  // --- 11. LIFELIKE PROCEDURAL HUMAN BIOMECHANICS & ANIMATION SYSTEM ---
  let nextBlinkTime = 2.5;
  let isBlinking = false;
  let blinkProgress = 0;
  let gazeTargetX = 0;
  let gazeCurrentX = 0;
  let nextGazeTime = 3.0;

  const updateAnimation = (time: number, isWalking: boolean) => {
    // 1. DIAPHRAGMATIC BREATHING SYSTEM (~14 breaths / min)
    const breathFreq = 1.45;
    const breathSine = Math.sin(time * breathFreq);
    const breathPhaseLag = Math.sin(time * breathFreq - 0.25); // Shoulders rise slightly after chest

    // Chest expansion in 3D: rises and pushes slightly forward
    chest.scale.set(
      1.0 + breathSine * 0.010,
      1.0 + breathSine * 0.007,
      1.0 + breathSine * 0.018
    );
    chest.position.y = 0.32 + breathPhaseLag * 0.004;

    // 2. NATURAL SACCADIC EYE GAZE DARTING
    if (time > nextGazeTime) {
      // Pick a new subtle focal gaze point (subtle micro-movement)
      gazeTargetX = (Math.random() - 0.5) * 0.08;
      nextGazeTime = time + 2.5 + Math.random() * 2.5;
    }
    gazeCurrentX = THREE.MathUtils.damp(gazeCurrentX, gazeTargetX, 8, 0.016);
    leftEyeData.eyeGroup.rotation.y = gazeCurrentX;
    rightEyeData.eyeGroup.rotation.y = gazeCurrentX;

    // 3. NON-LINEAR DYNAMIC EYE BLINKING (Snap closed in 0.09s, smooth open in 0.16s)
    if (time > nextBlinkTime && !isBlinking) {
      isBlinking = true;
      blinkProgress = 0;
      nextBlinkTime = time + 3.2 + Math.random() * 2.4;
    }

    if (isBlinking) {
      blinkProgress += 0.016;
      let lidRatio = 0; // 0 = open, 1 = closed
      if (blinkProgress < 0.09) {
        // Fast snap down
        lidRatio = blinkProgress / 0.09;
      } else if (blinkProgress < 0.11) {
        // Brief pause at closed
        lidRatio = 1.0;
      } else if (blinkProgress < 0.27) {
        // Gentle ease open
        const t = (blinkProgress - 0.11) / 0.16;
        lidRatio = 1.0 - Math.sin(t * Math.PI * 0.5);
      } else {
        isBlinking = false;
        lidRatio = 0;
      }

      const openAngle = -Math.PI * 0.42;
      const closedAngle = 0.10;
      const angle = openAngle + lidRatio * (closedAngle - openAngle);
      leftEyeData.upperEyelid.rotation.x = angle;
      rightEyeData.upperEyelid.rotation.x = angle;
    }

    // Subtle lower eyelid squint when smiling
    const isSmiling = currentCustom.expression === 'radiant_smile' || currentCustom.expression === 'gentle_smile';
    const lowerLidTarget = isSmiling ? 0.35 : 0.22;
    leftEyeData.lowerEyelid.rotation.x = lowerLidTarget;
    rightEyeData.lowerEyelid.rotation.x = lowerLidTarget;

    // Plumbob floating & gentle spin
    if (plumbobMesh && plumbobMesh.visible) {
      plumbobMesh.rotation.y = time * 2.2;
      plumbobMesh.position.y = 0.44 + Math.sin(time * 3.2) * 0.025;
      (plumbobMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + Math.sin(time * 4) * 0.2;
    }

    // 4. NATURAL HUMAN WALKING GAIT LOCOMOTION
    if (isWalking) {
      const walkFreq = 6.4;
      const walkCycle = Math.sin(time * walkFreq);
      const walkCycleDouble = Math.sin(time * walkFreq * 2);

      // Pelvic vertical bounce (2 apexes per walk cycle)
      body.position.y = 0.95 + Math.abs(walkCycle) * 0.038;
      // Pelvic yaw & roll counter-rotation
      body.rotation.y = Math.sin(time * walkFreq) * 0.06;
      body.rotation.z = Math.cos(time * walkFreq) * 0.025;

      // Leg stride kinematics: hip swing, knee flex, heel roll
      leftLeg.rotation.x = -walkCycle * 0.58;
      rightLeg.rotation.x = walkCycle * 0.58;

      // Arm counter-swing with natural elbow bend
      leftArm.rotation.x = walkCycle * 0.48;
      leftArm.rotation.z = -0.14;
      leftForearm.rotation.x = Math.max(0, -walkCycle * 0.32);

      rightArm.rotation.x = -walkCycle * 0.48;
      rightArm.rotation.z = 0.14;
      rightForearm.rotation.x = Math.max(0, walkCycle * 0.32);

      // Head counter-stabilization (keeps gaze steady while walking)
      head.rotation.y = -Math.sin(time * walkFreq) * 0.045;
      head.rotation.z = -Math.cos(time * walkFreq) * 0.02;
      head.rotation.x = 0.02 + walkCycleDouble * 0.015;
      return;
    }

    // 5. NATURAL IDLE CONTRAPPOSTO & DYNAMIC WEIGHT SHIFTING
    // Humans gracefully shift their body weight every ~5.5 seconds!
    const shiftPeriod = 5.6;
    const shiftCycle = Math.sin((time / shiftPeriod) * Math.PI * 2);

    body.position.y = 0.95;
    leftLeg.rotation.x = 0;
    rightLeg.rotation.x = 0;

    // Weight shift: pelvis rolls slightly toward weight-bearing foot
    const hipRoll = shiftCycle * 0.032;
    body.rotation.z = hipRoll;
    body.rotation.y = shiftCycle * 0.02;

    // Spine compensates in smooth S-curve; head tilts back to maintain horizon
    chest.rotation.z = -hipRoll * 0.65;
    head.rotation.z = -hipRoll * 0.55;

    // Subtle micro-gestures per pose
    switch (currentCustom.casPose) {
      case 'friendly_wave': {
        // Welcoming hospitable Vietnamese greeting wave
        const waveSpeed = 6.0;
        rightArm.rotation.set(-1.18, 0.22, 0.72 + Math.sin(time * 1.6) * 0.03);
        rightForearm.rotation.set(0.12, 0, -0.62 + Math.sin(time * waveSpeed) * 0.36);

        // Left arm relaxed gracefully at hip
        leftArm.rotation.set(0.18, 0.18, -0.42);
        leftForearm.rotation.set(0.62, 0, 0.46);

        // Warm expressive head tilt with micro-nod
        head.rotation.set(
          0.045 + Math.sin(time * 1.8) * 0.016,
          0.080 + Math.cos(time * 1.3) * 0.022,
          0.065 + Math.sin(time * 1.6) * 0.018
        );
        break;
      }
      case 'proud_chef': {
        // Confident culinary posture
        rightArm.rotation.set(-0.72, 0.52, 0.16);
        rightForearm.rotation.set(0.52, 0, -1.22);
        leftArm.rotation.set(-0.72, -0.52, -0.16);
        leftForearm.rotation.set(0.52, 0, 1.22);
        head.rotation.set(-0.035 + breathSine * 0.012, Math.sin(time * 0.9) * 0.02, 0);
        break;
      }
      case 'ambassador_smile': {
        // Tech presentation open hands stance
        const pulse = Math.sin(time * 2.2) * 0.05;
        rightArm.rotation.set(-0.54, 0.30, 0.36 + pulse);
        rightForearm.rotation.set(0.32, 0, 0);
        leftArm.rotation.set(-0.54, -0.30, -0.36 - pulse);
        leftForearm.rotation.set(0.32, 0, 0);
        head.rotation.set(0.02, Math.sin(time * 1.4) * 0.045, 0);
        break;
      }
      case 'thinking': {
        // Inquisitive hand to chin gesture
        rightArm.rotation.set(-1.30, 0.36, 0.26);
        rightForearm.rotation.set(0.82, 0, -0.48);
        leftArm.rotation.set(0.12, 0, -0.24);
        leftForearm.rotation.set(0.40, 0, 0.76);
        head.rotation.set(-0.08, 0.15, -0.065);
        break;
      }
    }
  };

  const applyCustomization = (custom: DuyenCustomization) => {
    currentCustom = { ...custom };

    // Update face texture & skin tone
    const newFaceTexture = createDynamicFaceTexture(custom);
    skinFaceMaterial.map = newFaceTexture;
    skinFaceMaterial.needsUpdate = true;
    skinBodyMaterial.color.set(custom.skinTone);

    // Rebuild hair, outfit, accessories
    rebuildHair(custom);
    rebuildOutfit(custom);
    rebuildAccessories(custom);

    // Update plumbob
    if (plumbobMesh) {
      plumbobMesh.visible = custom.showPlumbob;
    }
  };

  return {
    root,
    head,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftLeg,
    rightLeg,
    body,
    chest,
    eyelids: {
      leftUpper: leftEyeData.upperEyelid,
      rightUpper: rightEyeData.upperEyelid,
      leftLower: leftEyeData.lowerEyelid,
      rightLower: rightEyeData.lowerEyelid,
    },
    plumbob: plumbobMesh,
    updateAnimation,
    applyCustomization,
  };
}

/**
 * High-fidelity first-person hands for kitchen cooking interactions
 * Natural sculpted feminine hands, chef sleeve cuffs, realistic holding poses
 */
export function createFirstPersonHands(): {
  rig: THREE.Group;
  itemSocket: THREE.Group;
  update: (time: number, isMoving: boolean, isInteracting: boolean) => void;
  updateCustomization: (newCustom: DuyenCustomization) => void;
} {
  const rig = new THREE.Group();

  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4cfb6,
    roughness: 0.38,
    metalness: 0.0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.28,
    sheen: 0.42,
    sheenColor: new THREE.Color(0xffbfa8),
  });

  const sleeveMat = new THREE.MeshStandardMaterial({
    color: 0xfaf5ec,
    roughness: 0.78,
  });

  // Right Arm & Hand
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.28, -0.32, -0.45);
  rig.add(rightArmGroup);

  // Rolled-up Chef Sleeve Cuff
  const rightSleeve = createSculptedOrganicLimb([
    { y: 0.0, rx: 0.048, rz: 0.046 },
    { y: -0.14, rx: 0.046, rz: 0.044 },
    { y: -0.26, rx: 0.044, rz: 0.042 },
  ], sleeveMat, 22);
  rightSleeve.rotation.x = -0.92;
  rightSleeve.rotation.z = -0.22;
  rightSleeve.position.set(0.08, -0.09, 0.1);
  rightArmGroup.add(rightSleeve);

  const rightCuffFold = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.009, 10, 24), sleeveMat);
  rightCuffFold.rotation.x = -0.92;
  rightCuffFold.rotation.z = -0.22;
  rightCuffFold.position.set(0.05, -0.02, 0.035);
  rightArmGroup.add(rightCuffFold);

  // Sculpted Forearm with anatomical muscle curvature
  const rightForearmMesh = createSculptedOrganicLimb([
    { y: 0.0, rx: 0.036, rz: 0.032 },
    { y: -0.14, rx: 0.033, rz: 0.030 },
    { y: -0.28, rx: 0.024, rz: 0.021 },
  ], skinMat, 20);
  rightForearmMesh.rotation.x = -0.92;
  rightForearmMesh.rotation.z = -0.22;
  rightForearmMesh.position.set(0.04, -0.04, 0.02);
  rightArmGroup.add(rightForearmMesh);

  const rightHand = createSculptedFeminineHand(skinMat, true);
  rightHand.position.set(0, 0, -0.08);
  rightHand.rotation.x = -0.52;
  rightArmGroup.add(rightHand);

  // Left Arm & Hand
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.28, -0.32, -0.45);
  rig.add(leftArmGroup);

  const leftSleeve = createSculptedOrganicLimb([
    { y: 0.0, rx: 0.048, rz: 0.046 },
    { y: -0.14, rx: 0.046, rz: 0.044 },
    { y: -0.26, rx: 0.044, rz: 0.042 },
  ], sleeveMat, 22);
  leftSleeve.rotation.x = -0.92;
  leftSleeve.rotation.z = 0.22;
  leftSleeve.position.set(-0.08, -0.09, 0.1);
  leftArmGroup.add(leftSleeve);

  const leftCuffFold = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.009, 10, 24), sleeveMat);
  leftCuffFold.rotation.x = -0.92;
  leftCuffFold.rotation.z = 0.22;
  leftCuffFold.position.set(-0.05, -0.02, 0.035);
  leftArmGroup.add(leftCuffFold);

  const leftForearmMesh = createSculptedOrganicLimb([
    { y: 0.0, rx: 0.036, rz: 0.032 },
    { y: -0.14, rx: 0.033, rz: 0.030 },
    { y: -0.28, rx: 0.024, rz: 0.021 },
  ], skinMat, 20);
  leftForearmMesh.rotation.x = -0.92;
  leftForearmMesh.rotation.z = 0.22;
  leftForearmMesh.position.set(-0.04, -0.04, 0.02);
  leftArmGroup.add(leftForearmMesh);

  const leftHand = createSculptedFeminineHand(skinMat, false);
  leftHand.position.set(0, 0, -0.08);
  leftHand.rotation.x = -0.52;
  leftArmGroup.add(leftHand);

  const itemSocket = new THREE.Group();
  itemSocket.position.set(0, -0.24, -0.42);
  rig.add(itemSocket);

  const update = (time: number, isMoving: boolean, isInteracting: boolean) => {
    // Breathing sway
    const breathRate = 1.45;
    const breathSway = Math.sin(time * breathRate) * 0.006;

    const swaySpeed = isMoving ? 7.5 : 2.0;
    const swayAmp = isMoving ? 0.016 : 0.004;
    const swayX = Math.sin(time * swaySpeed) * swayAmp;
    const swayY = Math.cos(time * swaySpeed * 2) * swayAmp + breathSway;

    rightArmGroup.position.x = 0.28 + swayX;
    rightArmGroup.position.y = -0.32 + swayY;
    leftArmGroup.position.x = -0.28 - swayX;
    leftArmGroup.position.y = -0.32 + swayY;

    if (isInteracting) {
      // Rapid culinary chopping / stirring motion
      const interactThrust = Math.sin(time * 18) * 0.055;
      rightArmGroup.position.z = -0.45 + interactThrust;
      rightArmGroup.rotation.x = Math.sin(time * 18) * 0.08;
      itemSocket.position.z = -0.42 + interactThrust * 0.5;
    } else {
      rightArmGroup.rotation.x = 0;
      itemSocket.position.x = swayX * 0.5;
      itemSocket.position.y = -0.24 + swayY;
      itemSocket.position.z = -0.42;
    }
  };

  const updateCustomization = (newCustom: DuyenCustomization) => {
    skinMat.color.set(newCustom.skinTone);
    sleeveMat.color.set(newCustom.shirtColor);
  };

  return { rig, itemSocket, update, updateCustomization };
}
