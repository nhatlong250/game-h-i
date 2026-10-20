import * as THREE from 'three';
import {
  createWoodCounterTexture,
  createTileFloorTexture,
  createStainlessSteelTexture,
  createWallTexture,
  createCuttingBoardTexture,
  createBreadTexture,
  createCucumberTexture,
} from './textures';
import { IngredientType } from './types';

export interface InteractiveStation {
  id: string;
  name: string;
  type:
    | 'pantry_egg'
    | 'pantry_bread'
    | 'pantry_pate'
    | 'pantry_cucumber'
    | 'pantry_scallion'
    | 'pantry_sausage'
    | 'pantry_rice'
    | 'pantry_sauce_chili'
    | 'pantry_sauce_soy'
    | 'cutting_board'
    | 'stove_left'
    | 'stove_right'
    | 'plate_dispenser'
    | 'plating_counter'
    | 'counter_spot'
    | 'service_bell'
    | 'trash_bin'
    | 'sink';
  position: THREE.Vector3;
  interactionDistance: number;
  highlightMesh?: THREE.Mesh;
  cuttingProgress?: number;
  itemOnStation?: {
    type: 'ingredient' | 'plate' | 'pan';
    ingredient?: IngredientType;
    plateContents?: IngredientType[];
    panContents?: {
      item: IngredientType;
      cookProgress: number;
      isCooking: boolean;
    };
  };
  meshGroup?: THREE.Group;
  stationItemMesh?: THREE.Group;
}

export interface CollisionBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export class KitchenEnvironment {
  public scene: THREE.Scene;
  public stations: InteractiveStation[] = [];
  public collisionBoxes: CollisionBox[] = [];
  public steamParticles: THREE.Points[] = [];
  public fireLights: THREE.PointLight[] = [];
  public neonSignGroup: THREE.Group | null = null;
  public neonLight: THREE.PointLight | null = null;

  // High quality PBR materials
  private woodMat: THREE.MeshStandardMaterial;
  private floorMat: THREE.MeshStandardMaterial;
  private steelMat: THREE.MeshPhysicalMaterial;
  private wallMat: THREE.MeshStandardMaterial;
  private tileWainscotMat: THREE.MeshPhysicalMaterial;
  private cuttingMat: THREE.MeshStandardMaterial;
  private ceramicMat: THREE.MeshPhysicalMaterial;
  private brassMat: THREE.MeshPhysicalMaterial;
  private trimDarkMat: THREE.MeshStandardMaterial;
  private contactShadowMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Contact ambient occlusion shadow material
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 64);
    sGrad.addColorStop(0, 'rgba(10, 8, 6, 0.7)');
    sGrad.addColorStop(0.6, 'rgba(10, 8, 6, 0.35)');
    sGrad.addColorStop(1, 'rgba(10, 8, 6, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);

    this.contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });

    // PBR Materials with physical reflections
    this.woodMat = new THREE.MeshStandardMaterial({
      map: createWoodCounterTexture(),
      roughness: 0.38,
      metalness: 0.04,
    });

    this.floorMat = new THREE.MeshStandardMaterial({
      map: createTileFloorTexture(),
      roughness: 0.28,
      metalness: 0.05,
    });

    this.steelMat = new THREE.MeshPhysicalMaterial({
      map: createStainlessSteelTexture(),
      roughness: 0.22,
      metalness: 0.92,
      clearcoat: 0.45,
      clearcoatRoughness: 0.15,
    });

    this.wallMat = new THREE.MeshStandardMaterial({
      map: createWallTexture(),
      roughness: 0.88,
      metalness: 0.0,
    });

    // Glazed white subway tile wainscoting
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = 256;
    tileCanvas.height = 256;
    const tCtx = tileCanvas.getContext('2d')!;
    tCtx.fillStyle = '#f8f9fa';
    tCtx.fillRect(0, 0, 256, 256);
    tCtx.strokeStyle = '#c8d1d9';
    tCtx.lineWidth = 2;
    for (let y = 0; y < 256; y += 32) {
      tCtx.beginPath();
      tCtx.moveTo(0, y);
      tCtx.lineTo(256, y);
      tCtx.stroke();
      const offset = (y / 32) % 2 === 0 ? 0 : 32;
      for (let x = offset; x < 256; x += 64) {
        tCtx.beginPath();
        tCtx.moveTo(x, y);
        tCtx.lineTo(x, y + 32);
        tCtx.stroke();
      }
    }
    const tileTex = new THREE.CanvasTexture(tileCanvas);
    tileTex.colorSpace = THREE.SRGBColorSpace;
    tileTex.wrapS = THREE.RepeatWrapping;
    tileTex.wrapT = THREE.RepeatWrapping;
    tileTex.repeat.set(4, 2);

    this.tileWainscotMat = new THREE.MeshPhysicalMaterial({
      map: tileTex,
      roughness: 0.15,
      metalness: 0.02,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
    });

    this.cuttingMat = new THREE.MeshStandardMaterial({
      map: createCuttingBoardTexture(),
      roughness: 0.48,
      metalness: 0.04,
    });

    this.ceramicMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    });

    this.brassMat = new THREE.MeshPhysicalMaterial({
      color: 0xdeb841,
      roughness: 0.18,
      metalness: 0.92,
      clearcoat: 0.3,
    });

    this.trimDarkMat = new THREE.MeshStandardMaterial({
      color: 0x241812,
      roughness: 0.6,
      metalness: 0.1,
    });
  }

  public buildKitchen() {
    this.buildRoom();
    this.buildCounters();
    this.buildPantryStation();
    this.buildChoppingStation();
    this.buildStoveStation();
    this.buildPlatingAndServiceStation();
    this.buildCounterSpots();
    this.buildSinkAndTrash();
    this.buildLighting();
    this.buildDecorations();
    this.buildAmbientOcclusionPass();
  }

  // Helper: create rounded beveled countertop
  private createBeveledCountertop(width: number, height: number, depth: number, material: THREE.Material): THREE.Mesh {
    const shape = new THREE.Shape();
    const w = width / 2;
    const d = depth / 2;
    const r = 0.035;

    shape.moveTo(-w + r, -d);
    shape.lineTo(w - r, -d);
    shape.quadraticCurveTo(w, -d, w, -d + r);
    shape.lineTo(w, d - r);
    shape.quadraticCurveTo(w, d, w - r, d);
    shape.lineTo(-w + r, d);
    shape.quadraticCurveTo(-w, d, -w, d - r);
    shape.lineTo(-w, -d + r);
    shape.quadraticCurveTo(-w, -d, -w + r, -d);

    const extrudeSettings = {
      steps: 1,
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelOffset: 0,
      bevelSegments: 4,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.rotateX(Math.PI / 2);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Helper: add contact shadow plane
  private addContactShadow(x: number, z: number, width: number, depth: number, opacity: number = 0.75) {
    const shadowGeo = new THREE.PlaneGeometry(width * 1.35, depth * 1.35);
    const mat = this.contactShadowMat.clone();
    mat.opacity = opacity;
    const shadow = new THREE.Mesh(shadowGeo, mat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, 0.008, z);
    this.scene.add(shadow);
  }

  private buildRoom() {
    // 1. Floor with subtle bevel
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floor = new THREE.Mesh(floorGeo, this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Ceiling
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.9 });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), ceilingMat);
    ceiling.position.y = 3.3;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // 3. Walls with Subway Tile Wainscoting and Wooden Dado Rails
    const wallConfigs = [
      { pos: [0, 1.65, -3.4], rot: [0, 0, 0], w: 8, h: 3.3 }, // North
      { pos: [0, 1.65, 3.4], rot: [0, Math.PI, 0], w: 8, h: 3.3 }, // South
      { pos: [-3.4, 1.65, 0], rot: [0, Math.PI / 2, 0], w: 8, h: 3.3 }, // West
      { pos: [3.4, 1.65, 0], rot: [0, -Math.PI / 2, 0], w: 8, h: 3.3 }, // East
    ];

    wallConfigs.forEach(cfg => {
      // Upper wall plaster
      const upperH = cfg.h - 1.35;
      const upperMesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.w, upperH), this.wallMat);
      upperMesh.position.set(cfg.pos[0] as number, 1.35 + upperH / 2, cfg.pos[2] as number);
      upperMesh.rotation.set(cfg.rot[0] as number, cfg.rot[1] as number, cfg.rot[2] as number);
      upperMesh.receiveShadow = true;
      this.scene.add(upperMesh);

      // Lower wall glazed subway tiles
      const tileMesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.w, 1.35), this.tileWainscotMat);
      tileMesh.position.set(cfg.pos[0] as number, 1.35 / 2, cfg.pos[2] as number);
      tileMesh.rotation.set(cfg.rot[0] as number, cfg.rot[1] as number, cfg.rot[2] as number);
      tileMesh.receiveShadow = true;
      this.scene.add(tileMesh);

      // Wooden chair-rail molding strip
      const railGeo = new THREE.BoxGeometry(cfg.w, 0.05, 0.04);
      const rail = new THREE.Mesh(railGeo, this.trimDarkMat);
      rail.position.set(cfg.pos[0] as number, 1.35, cfg.pos[2] as number);
      rail.rotation.set(cfg.rot[0] as number, cfg.rot[1] as number, cfg.rot[2] as number);
      this.scene.add(rail);

      // Baseboard skirting molding
      const baseGeo = new THREE.BoxGeometry(cfg.w, 0.12, 0.035);
      const base = new THREE.Mesh(baseGeo, this.trimDarkMat);
      base.position.set(cfg.pos[0] as number, 0.06, cfg.pos[2] as number);
      base.rotation.set(cfg.rot[0] as number, cfg.rot[1] as number, cfg.rot[2] as number);
      this.scene.add(base);
    });

    // Outer Collisions
    this.collisionBoxes.push({ min: new THREE.Vector3(-3.4, 0, -3.5), max: new THREE.Vector3(3.4, 3, -3.2) });
    this.collisionBoxes.push({ min: new THREE.Vector3(-3.4, 0, 3.2), max: new THREE.Vector3(3.4, 3, 3.5) });
    this.collisionBoxes.push({ min: new THREE.Vector3(-3.5, 0, -3.5), max: new THREE.Vector3(-3.2, 3, 3.5) });
    this.collisionBoxes.push({ min: new THREE.Vector3(3.2, 0, -3.5), max: new THREE.Vector3(3.5, 3, 3.5) });
  }

  private buildCounters() {
    // 1. NORTH MAIN PREP COUNTER
    // Toe-kick base (recessed black kickplate)
    const northToe = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.12, 0.65), this.trimDarkMat);
    northToe.position.set(0, 0.06, -2.82);
    this.scene.add(northToe);

    // Main cabinet body with paneling
    const northBody = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.76, 0.78), this.woodMat);
    northBody.position.set(0, 0.5, -2.8);
    northBody.castShadow = true;
    northBody.receiveShadow = true;
    this.scene.add(northBody);

    // Shaker cabinet drawer handles
    for (let x = -2.2; x <= 2.2; x += 0.88) {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), this.brassMat);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(x, 0.72, -2.4);
      this.scene.add(handle);
    }

    // Beveled bullnose countertop
    const northTop = this.createBeveledCountertop(5.65, 0.05, 0.86, this.steelMat);
    northTop.position.set(0, 0.905, -2.8);
    this.scene.add(northTop);

    // Ambient occlusion contact shadow under north counter
    this.addContactShadow(0, -2.8, 5.6, 0.85, 0.85);

    this.collisionBoxes.push({
      min: new THREE.Vector3(-2.85, 0, -3.25),
      max: new THREE.Vector3(2.85, 1.2, -2.35),
    });

    // 2. WEST COOKING COUNTER
    const westToe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 3.8), this.trimDarkMat);
    westToe.position.set(-2.82, 0.06, 0.2);
    this.scene.add(westToe);

    const westBody = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.76, 3.9), this.steelMat);
    westBody.position.set(-2.8, 0.5, 0.2);
    westBody.castShadow = true;
    westBody.receiveShadow = true;
    this.scene.add(westBody);

    const westTop = this.createBeveledCountertop(0.86, 0.05, 4.05, this.steelMat);
    westTop.position.set(-2.8, 0.905, 0.2);
    this.scene.add(westTop);

    this.addContactShadow(-2.8, 0.2, 0.85, 4.0, 0.85);

    this.collisionBoxes.push({
      min: new THREE.Vector3(-3.25, 0, -1.8),
      max: new THREE.Vector3(-2.35, 1.2, 2.2),
    });

    // 3. EAST SERVICE PASS COUNTER
    const eastToe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 3.8), this.trimDarkMat);
    eastToe.position.set(2.82, 0.06, 0.2);
    this.scene.add(eastToe);

    const eastBody = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.9, 3.9), this.woodMat);
    eastBody.position.set(2.8, 0.57, 0.2);
    eastBody.castShadow = true;
    eastBody.receiveShadow = true;
    this.scene.add(eastBody);

    const eastTop = this.createBeveledCountertop(0.88, 0.06, 4.1, this.woodMat);
    eastTop.position.set(2.8, 1.05, 0.2);
    this.scene.add(eastTop);

    this.addContactShadow(2.8, 0.2, 0.88, 4.0, 0.85);

    this.collisionBoxes.push({
      min: new THREE.Vector3(2.35, 0, -1.8),
      max: new THREE.Vector3(3.25, 1.3, 2.2),
    });

    // 4. CENTER ISLAND
    const islandToe = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 0.75), this.trimDarkMat);
    islandToe.position.set(0, 0.06, 0.2);
    this.scene.add(islandToe);

    const islandBody = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.76, 0.85), this.woodMat);
    islandBody.position.set(0, 0.5, 0.2);
    islandBody.castShadow = true;
    islandBody.receiveShadow = true;
    this.scene.add(islandBody);

    const islandTop = this.createBeveledCountertop(1.68, 0.05, 0.98, this.steelMat);
    islandTop.position.set(0, 0.905, 0.2);
    this.scene.add(islandTop);

    this.addContactShadow(0, 0.2, 1.68, 0.98, 0.85);

    this.collisionBoxes.push({
      min: new THREE.Vector3(-0.88, 0, -0.32),
      max: new THREE.Vector3(0.88, 1.2, 0.72),
    });
  }

  private buildPantryStation() {
    // 1. Egg carton at X: -2.2, Z: -2.7
    const eggGroup = new THREE.Group();
    eggGroup.position.set(-2.2, 0.94, -2.7);

    this.addContactShadow(-2.2, -2.7, 0.35, 0.25, 0.65);

    const carton = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.2), new THREE.MeshStandardMaterial({ color: 0xcdb89e, roughness: 0.8 }));
    eggGroup.add(carton);

    for (let x = -0.09; x <= 0.09; x += 0.06) {
      for (let z = -0.05; z <= 0.05; z += 0.05) {
        const egg = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf6dfb8, roughness: 0.35 }));
        egg.scale.set(0.9, 1.25, 0.9);
        egg.position.set(x, 0.045, z);
        egg.castShadow = true;
        eggGroup.add(egg);
      }
    }
    this.scene.add(eggGroup);
    this.stations.push({
      id: 'pantry_egg',
      name: 'Trứng Gà Tươi',
      type: 'pantry_egg',
      position: new THREE.Vector3(-2.2, 1.0, -2.7),
      interactionDistance: 1.6,
      meshGroup: eggGroup,
    });

    // 2. Baguette Bread Basket at X: -1.6, Z: -2.7
    const breadGroup = new THREE.Group();
    breadGroup.position.set(-1.6, 0.94, -2.7);

    this.addContactShadow(-1.6, -2.7, 0.36, 0.36, 0.65);

    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.16, 20), new THREE.MeshStandardMaterial({ color: 0xa8713e, roughness: 0.85 }));
    breadGroup.add(basket);

    const breadMat = new THREE.MeshStandardMaterial({ map: createBreadTexture(), roughness: 0.55 });
    for (let i = 0; i < 3; i++) {
      const bread = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.28, 10, 14), breadMat);
      bread.position.set((i - 1) * 0.08, 0.15, 0);
      bread.rotation.z = (i - 1) * 0.22;
      bread.castShadow = true;
      breadGroup.add(bread);
    }
    this.scene.add(breadGroup);
    this.stations.push({
      id: 'pantry_bread',
      name: 'Bánh Mì Giòn',
      type: 'pantry_bread',
      position: new THREE.Vector3(-1.6, 1.0, -2.7),
      interactionDistance: 1.6,
      meshGroup: breadGroup,
    });

    // 3. Pâté Container at X: -1.0, Z: -2.7
    const pateGroup = new THREE.Group();
    pateGroup.position.set(-1.0, 0.94, -2.7);
    this.addContactShadow(-1.0, -2.7, 0.25, 0.25, 0.6);

    const pateDish = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.08, 20), this.ceramicMat);
    pateDish.castShadow = true;
    pateGroup.add(pateDish);

    const pateFill = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 20), new THREE.MeshStandardMaterial({ color: 0x6e3c2b, roughness: 0.65 }));
    pateFill.position.y = 0.02;
    pateGroup.add(pateFill);
    this.scene.add(pateGroup);

    this.stations.push({
      id: 'pantry_pate',
      name: 'Pa-tê Gan Nhà Làm',
      type: 'pantry_pate',
      position: new THREE.Vector3(-1.0, 1.0, -2.7),
      interactionDistance: 1.6,
      meshGroup: pateGroup,
    });

    // 4. Fresh Cucumber Basket at X: 0.8, Z: -2.7
    const cucGroup = new THREE.Group();
    cucGroup.position.set(0.8, 0.94, -2.7);
    this.addContactShadow(0.8, -2.7, 0.3, 0.22, 0.6);

    const cucBasket = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.2), this.woodMat);
    cucGroup.add(cucBasket);

    const cucMat = new THREE.MeshStandardMaterial({ map: createCucumberTexture(), roughness: 0.45 });
    for (let i = 0; i < 2; i++) {
      const cuc = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.22, 8, 12), cucMat);
      cuc.position.set((i - 0.5) * 0.08, 0.06, 0);
      cuc.rotation.z = Math.PI / 2;
      cuc.castShadow = true;
      cucGroup.add(cuc);
    }
    this.scene.add(cucGroup);

    this.stations.push({
      id: 'pantry_cucumber',
      name: 'Dưa Leo Tươi',
      type: 'pantry_cucumber',
      position: new THREE.Vector3(0.8, 1.0, -2.7),
      interactionDistance: 1.6,
      meshGroup: cucGroup,
    });

    // 5. Scallion & Sausage Bowl at X: 1.4, Z: -2.7
    const scallionGroup = new THREE.Group();
    scallionGroup.position.set(1.4, 0.94, -2.7);
    this.addContactShadow(1.4, -2.7, 0.24, 0.24, 0.6);

    const scBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.09, 18), this.ceramicMat);
    scBowl.castShadow = true;
    scallionGroup.add(scBowl);

    const scFill = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 18), new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.55 }));
    scFill.position.y = 0.02;
    scallionGroup.add(scFill);
    this.scene.add(scallionGroup);

    this.stations.push({
      id: 'pantry_scallion',
      name: 'Hành Hoa Tươi',
      type: 'pantry_scallion',
      position: new THREE.Vector3(1.4, 1.0, -2.7),
      interactionDistance: 1.6,
      meshGroup: scallionGroup,
    });

    // 6. Lạp Xưởng at X: 2.0, Z: -2.7
    const sausageGroup = new THREE.Group();
    sausageGroup.position.set(2.0, 0.94, -2.7);
    this.addContactShadow(2.0, -2.7, 0.25, 0.25, 0.6);

    const sPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.04, 18), this.ceramicMat);
    sPlate.castShadow = true;
    sausageGroup.add(sPlate);

    const sMat = new THREE.MeshStandardMaterial({ color: 0xa82328, roughness: 0.45 });
    for (let i = 0; i < 2; i++) {
      const sMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.16, 8, 12), sMat);
      sMesh.position.set(0, 0.04 + i * 0.03, (i - 0.5) * 0.06);
      sMesh.rotation.x = Math.PI / 2;
      sMesh.castShadow = true;
      sausageGroup.add(sMesh);
    }
    this.scene.add(sausageGroup);

    this.stations.push({
      id: 'pantry_sausage',
      name: 'Lạp Xưởng Tươi',
      type: 'pantry_sausage',
      position: new THREE.Vector3(2.0, 1.0, -2.7),
      interactionDistance: 1.6,
      meshGroup: sausageGroup,
    });

    // 7. Commercial Steamed Rice Cooker (Nồi cơm điện) at X: -2.7, Z: -1.2 on West Counter
    const riceGroup = new THREE.Group();
    riceGroup.position.set(-2.7, 0.94, -1.2);
    this.addContactShadow(-2.7, -1.2, 0.45, 0.45, 0.7);

    const riceCookerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 24), this.steelMat);
    riceCookerBody.castShadow = true;
    riceGroup.add(riceCookerBody);

    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), this.steelMat);
    lid.position.y = 0.16;
    riceGroup.add(lid);

    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12), this.brassMat);
    vent.position.set(0, 0.26, 0);
    riceGroup.add(vent);

    // Warm LED indicator light
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshBasicMaterial({ color: 0x27ae60 }));
    led.position.set(0.18, 0.05, 0.14);
    riceGroup.add(led);

    this.scene.add(riceGroup);
    this.stations.push({
      id: 'pantry_rice',
      name: 'Nồi Cơm Nóng',
      type: 'pantry_rice',
      position: new THREE.Vector3(-2.7, 1.0, -1.2),
      interactionDistance: 1.6,
      meshGroup: riceGroup,
    });

    // 8. Condiments on Center Island
    const chiliGroup = new THREE.Group();
    chiliGroup.position.set(-0.5, 0.94, 0.2);
    this.addContactShadow(-0.5, 0.2, 0.12, 0.12, 0.5);

    const chiliBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.22, 14), new THREE.MeshPhysicalMaterial({ color: 0xd63031, roughness: 0.15, transmission: 0.4 }));
    chiliBottle.castShadow = true;
    chiliGroup.add(chiliBottle);

    const chiliCap = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0x27ae60 }));
    chiliCap.position.y = 0.13;
    chiliGroup.add(chiliCap);

    this.scene.add(chiliGroup);
    this.stations.push({
      id: 'pantry_sauce_chili',
      name: 'Tương Ớt Cay',
      type: 'pantry_sauce_chili',
      position: new THREE.Vector3(-0.5, 1.0, 0.2),
      interactionDistance: 1.6,
      meshGroup: chiliGroup,
    });

    const soyGroup = new THREE.Group();
    soyGroup.position.set(0.5, 0.94, 0.2);
    this.addContactShadow(0.5, 0.2, 0.12, 0.12, 0.5);

    const soyBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.22, 14), new THREE.MeshPhysicalMaterial({ color: 0x1e1510, roughness: 0.15, transmission: 0.3 }));
    soyBottle.castShadow = true;
    soyGroup.add(soyBottle);

    const soyCap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0xf1c40f }));
    soyCap.position.y = 0.12;
    soyGroup.add(soyCap);

    this.scene.add(soyGroup);
    this.stations.push({
      id: 'pantry_sauce_soy',
      name: 'Xì Dầu Thơm',
      type: 'pantry_sauce_soy',
      position: new THREE.Vector3(0.5, 1.0, 0.2),
      interactionDistance: 1.6,
      meshGroup: soyGroup,
    });
  }

  private buildChoppingStation() {
    const chopGroup = new THREE.Group();
    chopGroup.position.set(0.0, 0.94, -2.7);

    this.addContactShadow(0.0, -2.7, 0.6, 0.45, 0.7);

    // Bamboo Chopping Board with beveled edge
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.045, 0.4), this.cuttingMat);
    board.castShadow = true;
    board.receiveShadow = true;
    chopGroup.add(board);

    // Knife
    const knifeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.042, 0.005), this.steelMat);
    knifeBlade.position.set(0.12, 0.034, -0.12);
    knifeBlade.castShadow = true;
    chopGroup.add(knifeBlade);

    const knifeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, 0.11, 12), this.woodMat);
    knifeHandle.rotation.z = Math.PI / 2;
    knifeHandle.position.set(0.29, 0.034, -0.12);
    chopGroup.add(knifeHandle);

    this.scene.add(chopGroup);
    this.stations.push({
      id: 'cutting_board',
      name: 'Thớt Sơ Chế',
      type: 'cutting_board',
      position: new THREE.Vector3(0.0, 1.0, -2.7),
      interactionDistance: 1.6,
      cuttingProgress: 0,
      meshGroup: chopGroup,
    });
  }

  private buildStoveStation() {
    // West Counter: Two Gas Stove Burners with Cast Iron Grates
    const stoveCoords = [
      { id: 'stove_left', name: 'Bếp Chiên Trái', z: -0.2 },
      { id: 'stove_right', name: 'Bếp Chiên Phải', z: 0.8 },
    ];

    stoveCoords.forEach(stove => {
      const stoveGroup = new THREE.Group();
      stoveGroup.position.set(-2.7, 0.94, stove.z);

      this.addContactShadow(-2.7, stove.z, 0.55, 0.55, 0.8);

      // Inset Stainless Basin
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.04, 24), this.steelMat);
      basin.position.y = 0.015;
      stoveGroup.add(basin);

      // Gas Burner Crown
      const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.03, 20), this.brassMat);
      burner.position.y = 0.03;
      stoveGroup.add(burner);

      // Cast iron spider grate
      const grateMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.7, metalness: 0.8 });
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
        const finger = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.02), grateMat);
        finger.position.set(Math.cos(angle) * 0.1, 0.045, Math.sin(angle) * 0.1);
        finger.rotation.y = angle;
        stoveGroup.add(finger);
      }

      // Dynamic Gas Fire Light
      const fireLight = new THREE.PointLight(0x3498db, 0, 1.5);
      fireLight.position.set(-2.7, 1.04, stove.z);
      this.scene.add(fireLight);
      this.fireLights.push(fireLight);

      this.scene.add(stoveGroup);
      this.stations.push({
        id: stove.id,
        name: stove.name,
        type: stove.id as InteractiveStation['type'],
        position: new THREE.Vector3(-2.7, 1.0, stove.z),
        interactionDistance: 1.6,
        meshGroup: stoveGroup,
      });
    });

    // Industrial Stainless Steel Range Hood above Stove
    const hoodGroup = new THREE.Group();
    hoodGroup.position.set(-2.7, 2.5, 0.3);

    const hoodCanopy = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.75, 0.6, 24, 1, false), this.steelMat);
    hoodCanopy.scale.set(1.0, 1.0, 2.4);
    hoodGroup.add(hoodCanopy);

    const hoodDuct = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.8, 20), this.steelMat);
    hoodDuct.position.y = 0.65;
    hoodGroup.add(hoodDuct);

    this.scene.add(hoodGroup);
  }

  private buildPlatingAndServiceStation() {
    // 1. Clean Plate Dispenser (X: 2.7, Z: -1.0 on East Counter)
    const plateGroup = new THREE.Group();
    plateGroup.position.set(2.7, 1.08, -1.0);

    this.addContactShadow(2.7, -1.0, 0.4, 0.4, 0.75);

    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.09, 0.022, 24), this.ceramicMat);
      p.position.y = i * 0.024;
      p.castShadow = true;
      p.receiveShadow = true;
      plateGroup.add(p);
    }
    this.scene.add(plateGroup);

    this.stations.push({
      id: 'plate_dispenser',
      name: 'Chồng Đĩa Sạch',
      type: 'plate_dispenser',
      position: new THREE.Vector3(2.7, 1.15, -1.0),
      interactionDistance: 1.6,
      meshGroup: plateGroup,
    });

    // 2. Plating Counter (X: 2.7, Z: 0.1)
    const platingGroup = new THREE.Group();
    platingGroup.position.set(2.7, 1.08, 0.1);
    this.addContactShadow(2.7, 0.1, 0.5, 0.5, 0.65);
    this.scene.add(platingGroup);

    this.stations.push({
      id: 'plating_counter',
      name: 'Bàn Bày Đĩa',
      type: 'plating_counter',
      position: new THREE.Vector3(2.7, 1.15, 0.1),
      interactionDistance: 1.6,
      meshGroup: platingGroup,
    });

    // 3. Service Call Bell (X: 2.7, Z: 1.1)
    const bellGroup = new THREE.Group();
    bellGroup.position.set(2.7, 1.08, 1.1);

    this.addContactShadow(2.7, 1.1, 0.25, 0.25, 0.75);

    const bellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.02, 20), this.trimDarkMat);
    bellGroup.add(bellBase);

    const bellDome = new THREE.Mesh(new THREE.SphereGeometry(0.065, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), this.brassMat);
    bellDome.position.y = 0.015;
    bellDome.castShadow = true;
    bellGroup.add(bellDome);

    const bellPlunger = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.03, 10), this.brassMat);
    bellPlunger.position.y = 0.08;
    bellGroup.add(bellPlunger);

    this.scene.add(bellGroup);
    this.stations.push({
      id: 'service_bell',
      name: 'Chuông Giao Món',
      type: 'service_bell',
      position: new THREE.Vector3(2.7, 1.15, 1.1),
      interactionDistance: 1.6,
      meshGroup: bellGroup,
    });
  }

  private buildCounterSpots() {
    const spots = [
      { id: 'counter_north_1', name: 'Bàn Bếp Số 1', pos: [-0.5, 0.94, -2.7] },
      { id: 'counter_north_2', name: 'Bàn Bếp Số 2', pos: [0.4, 0.94, -2.7] },
      { id: 'counter_west', name: 'Bàn Kê Bếp Nóng', pos: [-2.7, 0.94, 1.8] },
      { id: 'counter_east_2', name: 'Bàn Trình Bày Số 2', pos: [2.7, 1.08, -0.4] },
      { id: 'counter_island', name: 'Bàn Đảo Trung Tâm', pos: [0.0, 0.94, -0.2] },
    ];

    spots.forEach(sp => {
      const group = new THREE.Group();
      group.position.set(sp.pos[0], sp.pos[1], sp.pos[2]);

      // Silicone / stainless steel non-slip chef prep mat
      const matMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.008, 0.3),
        new THREE.MeshStandardMaterial({
          color: 0x2c3e50,
          roughness: 0.5,
          metalness: 0.25,
        })
      );
      matMesh.position.y = 0.004;
      matMesh.receiveShadow = true;
      group.add(matMesh);

      // Brass bracket trim
      const bracketGeo = new THREE.BoxGeometry(0.36, 0.009, 0.015);
      const b1 = new THREE.Mesh(bracketGeo, this.brassMat);
      b1.position.set(0, 0.005, -0.14);
      group.add(b1);
      const b2 = new THREE.Mesh(bracketGeo, this.brassMat);
      b2.position.set(0, 0.005, 0.14);
      group.add(b2);

      this.scene.add(group);

      this.stations.push({
        id: sp.id,
        name: sp.name,
        type: 'counter_spot',
        position: new THREE.Vector3(sp.pos[0], sp.pos[1] + 0.06, sp.pos[2]),
        interactionDistance: 1.6,
        meshGroup: group,
      });
    });
  }

  private buildSinkAndTrash() {
    // Stainless Wash Sink on Center Island
    const sinkGroup = new THREE.Group();
    sinkGroup.position.set(0.0, 0.94, 0.2);

    const basin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.36), this.steelMat);
    sinkGroup.add(basin);

    const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 12), this.steelMat);
    faucet.position.set(0, 0.12, -0.16);
    sinkGroup.add(faucet);

    this.scene.add(sinkGroup);
    this.stations.push({
      id: 'sink',
      name: 'Bồn Rửa Đĩa',
      type: 'sink',
      position: new THREE.Vector3(0.0, 1.0, 0.2),
      interactionDistance: 1.6,
      meshGroup: sinkGroup,
    });

    // Trash Bin in Corner (X: -2.7, Z: 2.6)
    const trashGroup = new THREE.Group();
    trashGroup.position.set(-2.7, 0.0, 2.6);

    this.addContactShadow(-2.7, 2.6, 0.45, 0.45, 0.85);

    const binBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.65, 20), new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.5 }));
    binBody.position.y = 0.325;
    binBody.castShadow = true;
    trashGroup.add(binBody);

    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.12), this.steelMat);
    pedal.position.set(0, 0.02, 0.2);
    trashGroup.add(pedal);

    this.scene.add(trashGroup);
    this.stations.push({
      id: 'trash_bin',
      name: 'Thùng Rác Bếp',
      type: 'trash_bin',
      position: new THREE.Vector3(-2.7, 0.5, 2.6),
      interactionDistance: 1.6,
      meshGroup: trashGroup,
    });
  }

  private buildLighting() {
    // 1. Ambient Hemisphere Fill (Warm ceiling bounce vs cool floor fill)
    const hemiLight = new THREE.HemisphereLight(0xfff5e6, 0x3d352e, 0.85);
    this.scene.add(hemiLight);

    // 2. Primary Warm Key Light (Directional sun streaming through window)
    const dirLight = new THREE.DirectionalLight(0xffedd5, 2.1);
    dirLight.position.set(3.5, 4.2, 1.8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 15;
    dirLight.shadow.camera.left = -4.5;
    dirLight.shadow.camera.right = 4.5;
    dirLight.shadow.camera.top = 4.5;
    dirLight.shadow.camera.bottom = -4.5;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    this.scene.add(dirLight);

    // 3. Hanging Pendant Downlights over workstations
    const lightPositions = [
      [-1.2, 2.8, -2.7],
      [1.2, 2.8, -2.7],
      [-2.7, 2.8, 0.3],
      [2.7, 2.8, 0.2],
      [0.0, 2.8, 0.2],
    ];

    lightPositions.forEach(pos => {
      const pointLight = new THREE.PointLight(0xffd59e, 1.3, 4.5, 1.4);
      pointLight.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(pointLight);

      // Brass pendant lampshade
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.12, 16, 1, true), this.brassMat);
      shade.position.set(pos[0], pos[1] + 0.06, pos[2]);
      this.scene.add(shade);

      // Hanging cord to ceiling
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 8), this.trimDarkMat);
      cord.position.set(pos[0], pos[1] + 0.35, pos[2]);
      this.scene.add(cord);
    });
  }

  private buildDecorations() {
    // 1. Outside Window on East Wall (view of sunny Saigon alley)
    const windowGroup = new THREE.Group();
    windowGroup.position.set(3.38, 1.8, 0.2);
    windowGroup.rotation.y = -Math.PI / 2;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.06), this.trimDarkMat);
    windowGroup.add(frame);

    // Sunny sky backdrop
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x74b9ff });
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), skyMat);
    sky.position.z = -0.02;
    windowGroup.add(sky);

    // Striped Awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.15, 0.45), new THREE.MeshStandardMaterial({ color: 0xe17055, roughness: 0.7 }));
    awning.position.set(0, 0.65, 0.2);
    awning.rotation.x = 0.35;
    windowGroup.add(awning);

    this.scene.add(windowGroup);

    // 2. Magnetic Knife Strip on North Wall
    const knifeStrip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.02), this.trimDarkMat);
    knifeStrip.position.set(0, 1.6, -3.36);
    this.scene.add(knifeStrip);

    for (let i = -0.4; i <= 0.4; i += 0.25) {
      const knife = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.28, 0.006), this.steelMat);
      knife.position.set(i, 1.6, -3.34);
      this.scene.add(knife);
    }

    // 3. Google Ambassador 2026 Certificate on North Wall
    const certFrame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.03), this.brassMat);
    certFrame.position.set(-1.8, 1.8, -3.36);
    const certPaper = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.58), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
    certPaper.position.set(-1.8, 1.8, -3.34);
    this.scene.add(certFrame);
    this.scene.add(certPaper);
  }

  private buildAmbientOcclusionPass() {
    // Corner Crevice Ambient Occlusion Strip geometry
    // Soft darkening where floor meets the 4 walls
    const createWallFloorAO = (length: number, isHorizontal: boolean) => {
      const geo = new THREE.PlaneGeometry(length, 0.35);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x050403,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      return mesh;
    };

    // North wall crevice
    const northAO = createWallFloorAO(6.8, true);
    northAO.position.set(0, 0.005, -3.22);
    this.scene.add(northAO);

    // West wall crevice
    const westAO = createWallFloorAO(6.8, false);
    westAO.rotation.z = Math.PI / 2;
    westAO.position.set(-3.22, 0.005, 0);
    this.scene.add(westAO);

    // East wall crevice
    const eastAO = createWallFloorAO(6.8, false);
    eastAO.rotation.z = -Math.PI / 2;
    eastAO.position.set(3.22, 0.005, 0);
    this.scene.add(eastAO);
  }

  public setNeonSignActive(active: boolean) {
    if (active && !this.neonSignGroup) {
      const group = new THREE.Group();
      group.position.set(0.0, 2.35, -3.34);

      // Backing dark acrylic plate with brass border
      const backPlate = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.45, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x120c18, roughness: 0.3, metalness: 0.6 })
      );
      group.add(backPlate);

      // Neon Canvas Texture with "✨ BẾP DUYÊN ✨"
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 144;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#0f0a14';
      ctx.fillRect(0, 0, 512, 144);

      // Border glow
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 496, 128);

      // Neon Text
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#fb7185';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#fff1f2';
      ctx.fillText('✨ BẾP DUYÊN BISTRO ✨', 256, 72);

      const neonTex = new THREE.CanvasTexture(canvas);
      neonTex.colorSpace = THREE.SRGBColorSpace;

      const signFace = new THREE.Mesh(
        new THREE.PlaneGeometry(1.54, 0.4),
        new THREE.MeshBasicMaterial({
          map: neonTex,
          transparent: true,
        })
      );
      signFace.position.z = 0.025;
      group.add(signFace);

      // Warm magenta neon ambient point light
      this.neonLight = new THREE.PointLight(0xf43f5e, 1.4, 4.2);
      this.neonLight.position.set(0.0, 2.35, -3.15);
      this.scene.add(this.neonLight);

      this.scene.add(group);
      this.neonSignGroup = group;
    } else if (!active && this.neonSignGroup) {
      this.scene.remove(this.neonSignGroup);
      this.neonSignGroup = null;
      if (this.neonLight) {
        this.scene.remove(this.neonLight);
        this.neonLight = null;
      }
    }
  }

  public update(time: number) {
    // Dynamic gas flame lights flicker on active cooking stoves
    this.fireLights.forEach((light, idx) => {
      if (light.intensity > 0) {
        light.intensity = 1.6 + Math.sin(time * 24 + idx * 3) * 0.4 + (Math.random() - 0.5) * 0.2;
      }
    });

    // Neon sign gentle glow pulse
    if (this.neonLight) {
      this.neonLight.intensity = 1.35 + Math.sin(time * 3.5) * 0.25;
    }
  }
}
