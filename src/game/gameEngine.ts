import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import confetti from 'canvas-confetti';
import { KitchenEnvironment, InteractiveStation } from './kitchenScene';
import { createFirstPersonHands, createDuyen3DModel, DuyenCharacterRig } from './character';
import { create3DItem } from './itemModels';
import { soundManager } from './audio';
import { ItemHeld, IngredientType, ActiveOrder, ShiftStats, GameSettings, DEFAULT_DUYEN_CUSTOMIZATION } from './types';
import { RECIPES, getIngredientDisplayName, validateRecipeMatch } from './recipes';

// Module-level pre-allocated vectors to eliminate GC in the 60fps render loop
const _moveDir = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _stationVec = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);

export interface GameEngineCallbacks {
  onOrderUpdate: (orders: ActiveOrder[]) => void;
  onItemHeldUpdate: (item: ItemHeld | null) => void;
  onPromptUpdate: (prompt: string | null) => void;
  onShiftEnd: (stats: ShiftStats) => void;
  onScoreUpdate: (score: number, tips: number) => void;
  onTimeUpdate: (timeLeft: number) => void;
  onComboUpdate?: (combo: number) => void;
  onCameraModeUpdate?: (isThirdPerson: boolean) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private kitchen: KitchenEnvironment;

  // Player controls
  private cameraPitch: number = 0;
  private cameraYaw: number = 0;
  private playerPos: THREE.Vector3 = new THREE.Vector3(0, 1.62, 1.2);
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private keys: Record<string, boolean> = {};
  private isPointerLocked: boolean = false;
  private isChopping: boolean = false;

  // Hands & Full 3D Character Model
  private hands: ReturnType<typeof createFirstPersonHands>;
  public isThirdPersonView: boolean = false;
  public duyenRig: DuyenCharacterRig;
  private duyenHeldItemMesh: THREE.Object3D | null = null;
  public itemHeld: ItemHeld | null = null;
  private heldItem3D: THREE.Group | null = null;

  // Cooking & Stations
  private currentLookingStation: InteractiveStation | null = null;
  private raycaster = new THREE.Raycaster();
  private lastFootstepTime = 0;
  private lastChopSoundTime = 0;

  // Shift & Orders
  private activeOrders: ActiveOrder[] = [];
  private activeChapterId: number = 1;
  private targetScore: number = 200;
  private allowedRecipeIds: string[] = ['banh_mi_op_la'];
  private shiftTimeTotal = 120;
  private shiftTimeRemaining = 120;
  private isShiftRunning = false;
  private isPaused = false;
  private score = 0;
  private totalTips = 0;
  private ordersServed = 0;
  private ordersFailed = 0;
  private orderSpawnTimer = 0;
  public comboStreak: number = 0;
  public upgrades: Record<string, number> = {};

  // Callbacks
  private callbacks: GameEngineCallbacks;
  public settings: GameSettings = {
    mouseSensitivity: 1.0,
    invertY: false,
    cameraBobbing: true,
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.5,
    voiceVolume: 0.9,
  };

  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf6ede2);
    this.scene.fog = new THREE.Fog(0xf6ede2, 8, 20);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 30);
    this.camera.position.copy(this.playerPos);
    this.scene.add(this.camera);

    // 4. Kitchen World
    this.kitchen = new KitchenEnvironment(this.scene);
    this.kitchen.buildKitchen();

    // 5. First person hands & Full 3D Character Model
    this.hands = createFirstPersonHands();
    this.camera.add(this.hands.rig);

    this.duyenRig = createDuyen3DModel(DEFAULT_DUYEN_CUSTOMIZATION);
    this.duyenRig.root.visible = false;
    this.scene.add(this.duyenRig.root);

    // 6. Bind inputs
    this.bindEvents();
    this.renderer.compile(this.scene, this.camera);
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('mouseup', this.onMouseUp);
    this.container.addEventListener('contextmenu', this.onContextMenu);
  }

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    if (this.isPointerLocked) {
      this.dropOrClearItem();
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (e.code === 'KeyE' || e.code === 'Space') {
      this.handleInteract();
      if (this.currentLookingStation?.type === 'cutting_board' && this.currentLookingStation.itemOnStation?.ingredient) {
        this.isChopping = true;
      }
    } else if (e.code === 'KeyQ' || e.code === 'KeyG' || e.code === 'Backspace') {
      this.dropOrClearItem();
    } else if (e.code === 'KeyV') {
      this.toggleThirdPersonView();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    if (e.code === 'KeyE' || e.code === 'Space') {
      this.isChopping = false;
    }
  };

  private onMouseDown = (e: MouseEvent) => {
    // Only capture if clicking directly on the canvas element, not UI
    if (e.target !== this.renderer.domElement) {
      return;
    }

    if (!this.isPointerLocked) {
      this.container.requestPointerLock?.();
      soundManager.resume();
      return;
    }

    if (e.button === 0) {
      // Left click action
      this.handleInteract();
      if (this.currentLookingStation?.type === 'cutting_board' && this.currentLookingStation.itemOnStation?.ingredient) {
        this.isChopping = true;
      }
    } else if (e.button === 2) {
      // Right click drop
      e.preventDefault();
      this.dropOrClearItem();
    }
  };

  public unlockCursor() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  public exitShift() {
    this.unlockCursor();
    this.isShiftRunning = false;
    soundManager.setSizzle(false);
  }

  public toggleThirdPersonView(force?: boolean) {
    this.isThirdPersonView = force !== undefined ? force : !this.isThirdPersonView;
    if (this.hands && this.hands.rig) {
      this.hands.rig.visible = !this.isThirdPersonView;
    }
    if (this.duyenRig && this.duyenRig.root) {
      this.duyenRig.root.visible = this.isThirdPersonView;
    }
    this.callbacks.onCameraModeUpdate?.(this.isThirdPersonView);
    soundManager.playBell();
    soundManager.speakVietnamese(this.isThirdPersonView ? 'Góc nhìn 3D toàn thân Duyên' : 'Góc nhìn thứ nhất làm bếp');
  }

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isChopping = false;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;

    const sens = 0.0022 * this.settings.mouseSensitivity;
    this.cameraYaw -= e.movementX * sens;
    const invert = this.settings.invertY ? -1 : 1;
    this.cameraPitch -= e.movementY * sens * invert;
    this.cameraPitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.cameraPitch));
  };

  private onPointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.container;
  };

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public startShift(chapter?: { id: number; targetScore: number; shiftDuration: number; availableRecipeIds: string[] }) {
    if (chapter) {
      this.activeChapterId = chapter.id;
      this.targetScore = chapter.targetScore;
      this.shiftTimeTotal = chapter.shiftDuration;
      this.shiftTimeRemaining = chapter.shiftDuration;
      this.allowedRecipeIds = chapter.availableRecipeIds;
    } else {
      this.shiftTimeRemaining = this.shiftTimeTotal;
    }

    this.score = 0;
    this.totalTips = 0;
    this.ordersServed = 0;
    this.ordersFailed = 0;
    this.comboStreak = 0;
    this.activeOrders = [];
    this.isShiftRunning = true;
    this.isPaused = false;
    this.itemHeld = null;
    this.updateHeldItem3D();
    this.callbacks.onComboUpdate?.(0);

    // Apply 3D neon sign if bistro upgrade is present
    this.kitchen.setNeonSignActive((this.upgrades.bistro_neon_sign || 0) > 0);

    // Spawn initial orders from allowed recipes
    this.spawnOrder();
    setTimeout(() => this.spawnOrder(), 4000);

    soundManager.init();
    soundManager.speakVietnamese(`Bắt đầu ca nấu Chương ${this.activeChapterId} rồi, cố lên Duyên ơi!`);

    this.lastTime = performance.now();
    this.loop();
  }

  public updateUpgrades(upgrades: Record<string, number>) {
    this.upgrades = { ...upgrades };
    this.kitchen.setNeonSignActive((this.upgrades.bistro_neon_sign || 0) > 0);
  }

  public pauseShift(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      this.unlockCursor();
    }
  }

  private spawnOrder() {
    if (this.activeOrders.length >= 3) return;

    const availableRecipes = RECIPES.filter(r => this.allowedRecipeIds.includes(r.id));
    const recipe = availableRecipes.length > 0
      ? availableRecipes[Math.floor(Math.random() * availableRecipes.length)]
      : RECIPES[0];

    const customers = [
      { name: 'Sinh viên Hùng', note: 'Em ăn trước giờ vào lớp ạ!' },
      { name: 'Chị Mai công sở', note: 'Làm giòn cho chị nhé em gái!' },
      { name: 'Bác Nam', note: 'Cho bác ít tương ớt thôi nghen cô chủ.' },
      { name: 'Em Lan', note: 'Một phần mang đi hộp gọn gàng ạ!' },
      { name: 'Thầy Tuấn', note: 'Thầy ghé ủng hộ quán Duyên đây!' },
    ];
    const customer = customers[Math.floor(Math.random() * customers.length)];

    const order: ActiveOrder = {
      id: 'order_' + Math.random().toString(36).substring(2, 7),
      recipeId: recipe.id,
      customerName: customer.name,
      customerNote: customer.note,
      maxTime: recipe.timeLimit,
      timeLeft: recipe.timeLimit,
      totalScore: recipe.baseScore,
    };

    this.activeOrders.push(order);
    this.callbacks.onOrderUpdate([...this.activeOrders]);
    soundManager.playNewOrder();
  }

  // --- INTERACTION LOGIC ---
  // --- VISUAL STATION 3D ITEM SYNC ---
  private updateStationVisual(station: InteractiveStation) {
    if (station.stationItemMesh) {
      this.scene.remove(station.stationItemMesh);
      station.stationItemMesh = undefined;
    }

    if (!station.itemOnStation) return;

    if (station.itemOnStation.type === 'ingredient' && station.itemOnStation.ingredient) {
      const mesh = create3DItem(station.itemOnStation.ingredient);
      mesh.position.set(station.position.x, station.position.y - 0.04, station.position.z);
      this.scene.add(mesh);
      station.stationItemMesh = mesh;
    } else if (station.itemOnStation.type === 'plate') {
      const plateMesh = create3DItem('plate');
      if (station.itemOnStation.plateContents && station.itemOnStation.plateContents.length > 0) {
        station.itemOnStation.plateContents.forEach((ing, idx) => {
          const itemMesh = create3DItem(ing);
          itemMesh.scale.set(0.65, 0.65, 0.65);
          itemMesh.position.set(
            (idx % 2 - 0.5) * 0.05,
            0.02 + idx * 0.005,
            (Math.floor(idx / 2) - 0.5) * 0.05
          );
          plateMesh.add(itemMesh);
        });
      }
      plateMesh.position.set(station.position.x, station.position.y - 0.04, station.position.z);
      this.scene.add(plateMesh);
      station.stationItemMesh = plateMesh;
    } else if (station.itemOnStation.type === 'pan' && station.itemOnStation.panContents) {
      const pan = station.itemOnStation.panContents;
      const ingType = pan.cookProgress >= 160
        ? 'burnt_egg'
        : (pan.cookProgress >= 80
            ? (pan.item === 'raw_egg' ? 'fried_egg' : 'cooked_rice')
            : pan.item);
      const foodMesh = create3DItem(ingType);
      foodMesh.position.set(station.position.x, station.position.y + 0.02, station.position.z);
      this.scene.add(foodMesh);
      station.stationItemMesh = foodMesh;
    }
  }

  // --- INTERACTION LOGIC ---
  private handleInteract() {
    if (!this.currentLookingStation) return;
    const station = this.currentLookingStation;

    // 1. PANTRY GRAB & SWAP & DIRECT PLATING
    if (station.type.startsWith('pantry_')) {
      let ingredient: IngredientType | null = null;
      switch (station.type) {
        case 'pantry_egg': ingredient = 'raw_egg'; break;
        case 'pantry_bread': ingredient = 'bread'; break;
        case 'pantry_pate': ingredient = 'pate'; break;
        case 'pantry_cucumber': ingredient = 'cucumber'; break;
        case 'pantry_scallion': ingredient = 'scallion'; break;
        case 'pantry_sausage': ingredient = 'sausage'; break;
        case 'pantry_rice': ingredient = 'cooked_rice'; break;
        case 'pantry_sauce_chili': ingredient = 'chili_sauce'; break;
        case 'pantry_sauce_soy': ingredient = 'soy_sauce'; break;
      }
      if (!ingredient) return;

      // Case A: Holding plate -> can direct-plate ready-to-eat ingredients!
      if (this.itemHeld?.type === 'plate') {
        const directPlateIngredients: IngredientType[] = ['bread', 'pate', 'cooked_rice', 'chili_sauce', 'soy_sauce'];
        if (directPlateIngredients.includes(ingredient)) {
          this.itemHeld.plateContents = this.itemHeld.plateContents || [];
          this.itemHeld.plateContents.push(ingredient);
          this.itemHeld.name = `Đĩa thức ăn (${this.itemHeld.plateContents.length} món)`;
          soundManager.playPlace();
          soundManager.speakVietnamese(`Đã thêm ${getIngredientDisplayName(ingredient)} vào đĩa`);
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate({ ...this.itemHeld });
          return;
        } else {
          soundManager.speakVietnamese('Món này cần sơ chế trên thớt hoặc chiên trước khi cho vào đĩa!');
          return;
        }
      }

      // Case B: Holding another ingredient -> SWAP!
      if (this.itemHeld?.type === 'ingredient') {
        if (this.itemHeld.ingredient === ingredient) {
          soundManager.speakVietnamese(`Đang cầm ${this.itemHeld.name} rồi!`);
          return;
        }
        const oldName = this.itemHeld.name;
        this.itemHeld = {
          type: 'ingredient',
          id: Math.random().toString(),
          name: getIngredientDisplayName(ingredient),
          ingredient,
        };
        soundManager.playPickup();
        soundManager.speakVietnamese(`Đã cất ${oldName}, đổi lấy ${this.itemHeld.name}`);
        this.updateHeldItem3D();
        this.callbacks.onItemHeldUpdate(this.itemHeld);
        return;
      }

      // Case C: Empty hands -> PICK UP
      this.itemHeld = {
        type: 'ingredient',
        id: Math.random().toString(),
        name: getIngredientDisplayName(ingredient),
        ingredient,
      };
      soundManager.playPickup();
      soundManager.speakGameAction('pickup_' + ingredient.replace('raw_', '').replace('cooked_', ''));
      this.updateHeldItem3D();
      this.callbacks.onItemHeldUpdate(this.itemHeld);
      return;
    }

    // 2. PLATE DISPENSER
    if (station.type === 'plate_dispenser') {
      if (!this.itemHeld) {
        this.itemHeld = {
          type: 'plate',
          id: Math.random().toString(),
          name: 'Đĩa Sạch',
          plateContents: [],
        };
        soundManager.playPickup();
        soundManager.speakGameAction('pickup_plate');
        this.updateHeldItem3D();
        this.callbacks.onItemHeldUpdate(this.itemHeld);
        return;
      }
      if (this.itemHeld.type === 'ingredient') {
        // Place ingredient down on nearest free counter and pick up plate!
        const freeCounter = this.kitchen.stations.find(s => (s.type === 'counter_spot' || s.type === 'plating_counter') && !s.itemOnStation);
        if (freeCounter) {
          freeCounter.itemOnStation = {
            type: 'ingredient',
            ingredient: this.itemHeld.ingredient,
          };
          this.updateStationVisual(freeCounter);
          soundManager.playPlace();
          this.itemHeld = {
            type: 'plate',
            id: Math.random().toString(),
            name: 'Đĩa Sạch',
            plateContents: [],
          };
          soundManager.playPickup();
          soundManager.speakVietnamese(`Đã đặt đồ sang ${freeCounter.name} và lấy đĩa sạch`);
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate(this.itemHeld);
          return;
        }
        soundManager.speakVietnamese('Bấm phím Q để đặt món xuống bàn rồi lấy đĩa');
        return;
      }
      soundManager.speakVietnamese('Đang cầm đĩa trên tay rồi!');
      return;
    }

    // 3. CHOPPING BOARD
    if (station.type === 'cutting_board') {
      // 3A. If board has chopped item:
      if (station.itemOnStation?.ingredient && ['sliced_cucumber', 'chopped_scallion', 'sliced_sausage'].includes(station.itemOnStation.ingredient)) {
        const chopped = station.itemOnStation.ingredient;
        // If holding plate -> TRANSFER TO PLATE
        if (this.itemHeld?.type === 'plate') {
          this.itemHeld.plateContents = this.itemHeld.plateContents || [];
          this.itemHeld.plateContents.push(chopped);
          this.itemHeld.name = `Đĩa thức ăn (${this.itemHeld.plateContents.length} món)`;
          station.itemOnStation = undefined;
          this.updateStationVisual(station);
          soundManager.playPickup();
          soundManager.speakVietnamese(`Đã gắp ${getIngredientDisplayName(chopped)} vào đĩa`);
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate({ ...this.itemHeld });
          return;
        }
        // If empty hand -> PICK UP
        if (!this.itemHeld) {
          this.itemHeld = {
            type: 'ingredient',
            id: Math.random().toString(),
            name: getIngredientDisplayName(chopped),
            ingredient: chopped,
          };
          station.itemOnStation = undefined;
          this.updateStationVisual(station);
          soundManager.playPickup();
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate(this.itemHeld);
          return;
        }
        // If holding another ingredient -> SWAP
        const oldIng = this.itemHeld.ingredient!;
        this.itemHeld = {
          type: 'ingredient',
          id: Math.random().toString(),
          name: getIngredientDisplayName(chopped),
          ingredient: chopped,
        };
        station.itemOnStation = { type: 'ingredient', ingredient: oldIng };
        this.updateStationVisual(station);
        soundManager.playPickup();
        this.updateHeldItem3D();
        this.callbacks.onItemHeldUpdate(this.itemHeld);
        return;
      }

      // 3B. If board has unchopped item:
      if (station.itemOnStation?.ingredient) {
        if (!this.itemHeld) {
          // CHOP!
          this.isChopping = true;
          station.cuttingProgress = (station.cuttingProgress || 0) + 34;
          soundManager.playChop();
          soundManager.speakGameAction('start_chop');
          if (station.cuttingProgress >= 100) {
            let res: IngredientType = station.itemOnStation.ingredient;
            if (res === 'cucumber') res = 'sliced_cucumber';
            if (res === 'scallion') res = 'chopped_scallion';
            if (res === 'sausage') res = 'sliced_sausage';
            station.itemOnStation.ingredient = res;
            station.cuttingProgress = 0;
            this.isChopping = false;
            this.updateStationVisual(station);
            soundManager.playSuccess();
            soundManager.speakVietnamese('Thái xong rồi!');
          }
          return;
        }
        // If holding plate:
        if (this.itemHeld.type === 'plate') {
          soundManager.speakVietnamese('Cần thái xong mới gắp vào đĩa được!');
          return;
        }
        // If holding another ingredient: SWAP!
        if (this.itemHeld.type === 'ingredient' && ['cucumber', 'scallion', 'sausage'].includes(this.itemHeld.ingredient!)) {
          const swapIng = station.itemOnStation.ingredient;
          station.itemOnStation.ingredient = this.itemHeld.ingredient!;
          station.cuttingProgress = 0;
          this.itemHeld = {
            type: 'ingredient',
            id: Math.random().toString(),
            name: getIngredientDisplayName(swapIng),
            ingredient: swapIng,
          };
          this.updateStationVisual(station);
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate(this.itemHeld);
          soundManager.playPlace();
          return;
        }
      }

      // 3C. If board is empty:
      if (!station.itemOnStation) {
        if (this.itemHeld?.ingredient && ['cucumber', 'scallion', 'sausage'].includes(this.itemHeld.ingredient)) {
          station.itemOnStation = {
            type: 'ingredient',
            ingredient: this.itemHeld.ingredient,
          };
          station.cuttingProgress = 0;
          this.itemHeld = null;
          soundManager.playPlace();
          soundManager.speakVietnamese('Đã đặt lên thớt, bấm hoặc giữ Chuột Trái để thái!');
          this.updateStationVisual(station);
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate(null);
          return;
        }
        if (this.itemHeld) {
          soundManager.speakVietnamese('Thớt dùng để thái dưa leo, hành hoa hoặc lạp xưởng.');
          return;
        }
      }
      return;
    }

    // 4. STOVE & FRYING PAN
    if (station.type === 'stove_left' || station.type === 'stove_right') {
      const panState = station.itemOnStation?.panContents;
      const nonstickLvl = this.upgrades.nonstick_pans || 0;
      const burnLimit = 160 + nonstickLvl * 45;

      // If pan is cooking or done
      if (panState && panState.isCooking) {
        // Can take cooked item if holding plate
        if (this.itemHeld?.type === 'plate') {
          const cookedItem = panState.cookProgress >= burnLimit ? 'burnt_egg' : (panState.item === 'raw_egg' ? 'fried_egg' : panState.item);
          this.itemHeld.plateContents = this.itemHeld.plateContents || [];
          this.itemHeld.plateContents.push(cookedItem as IngredientType);
          this.itemHeld.name = `Đĩa thức ăn (${this.itemHeld.plateContents.length} món)`;

          panState.isCooking = false;
          panState.cookProgress = 0;
          station.itemOnStation = undefined;
          this.updateStationVisual(station);
          soundManager.setSizzle(false);
          soundManager.playPickup();
          soundManager.speakVietnamese('Đã gắp món chiên vào đĩa!');
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate({ ...this.itemHeld });
          return;
        }

        // Or pick up directly if empty hands
        if (!this.itemHeld && panState.cookProgress >= 80) {
          const finalItem = panState.cookProgress >= burnLimit ? 'burnt_egg' : (panState.item === 'raw_egg' ? 'fried_egg' : 'cooked_rice');
          this.itemHeld = {
            type: 'ingredient',
            id: Math.random().toString(),
            name: getIngredientDisplayName(finalItem as IngredientType),
            ingredient: finalItem as IngredientType,
          };
          panState.isCooking = false;
          panState.cookProgress = 0;
          station.itemOnStation = undefined;
          this.updateStationVisual(station);
          soundManager.setSizzle(false);
          soundManager.playPickup();
          soundManager.speakVietnamese(`Đã gắp ${this.itemHeld.name} ra tay!`);
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate(this.itemHeld);
          return;
        }

        // If burnt and empty hands or holding trash item
        if (panState.cookProgress >= burnLimit) {
          panState.isCooking = false;
          panState.cookProgress = 0;
          station.itemOnStation = undefined;
          this.updateStationVisual(station);
          soundManager.setSizzle(false);
          soundManager.playPlace();
          soundManager.speakVietnamese('Đã đổ bỏ phần cháy, chảo đã sạch!');
          return;
        }

        if (this.itemHeld) {
          soundManager.speakVietnamese('Cần đĩa hoặc tay trống để gắp món chiên! Bấm [Q] để đặt đồ trên tay xuống bàn.');
          return;
        }
      }

      // If pan is free and player holds raw egg or cooked rice -> START COOKING
      if (this.itemHeld?.ingredient && ['raw_egg', 'cooked_rice'].includes(this.itemHeld.ingredient)) {
        if (!panState?.isCooking) {
          station.itemOnStation = {
            type: 'pan',
            panContents: {
              item: this.itemHeld.ingredient,
              cookProgress: 0,
              isCooking: true,
            },
          };
          this.updateStationVisual(station);
          this.itemHeld = null;
          soundManager.playPlace();
          soundManager.setSizzle(true);
          soundManager.speakGameAction('start_fry');
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate(null);
        }
        return;
      }
      if (this.itemHeld) {
        soundManager.speakVietnamese('Bếp dùng để chiên trứng hoặc rang cơm nóng.');
      }
      return;
    }

    // 5. COUNTER SPOTS & PLATING COUNTER
    if (station.type === 'counter_spot' || station.type === 'plating_counter') {
      // 5A. Table is EMPTY -> PLACE HELD ITEM ON TABLE
      if (!station.itemOnStation) {
        if (this.itemHeld) {
          if (this.itemHeld.type === 'ingredient') {
            station.itemOnStation = {
              type: 'ingredient',
              ingredient: this.itemHeld.ingredient,
            };
          } else if (this.itemHeld.type === 'plate') {
            station.itemOnStation = {
              type: 'plate',
              plateContents: this.itemHeld.plateContents || [],
            };
          }
          const placedName = this.itemHeld.name;
          this.itemHeld = null;
          this.updateStationVisual(station);
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate(null);
          soundManager.playPlace();
          soundManager.speakVietnamese(`Đã đặt ${placedName} xuống bàn`);
          return;
        }
        return;
      }

      // 5B. Table has a PLATE:
      if (station.itemOnStation.type === 'plate') {
        const plate = station.itemOnStation;
        // If holding ingredient -> ADD TO PLATE
        if (this.itemHeld?.ingredient) {
          plate.plateContents = plate.plateContents || [];
          plate.plateContents.push(this.itemHeld.ingredient);
          soundManager.playPlace();
          soundManager.speakVietnamese(`Đã thêm ${this.itemHeld.name} vào đĩa`);
          this.itemHeld = null;
          this.updateStationVisual(station);
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate(null);
          return;
        }
        // If empty hands -> PICK UP PLATE
        if (!this.itemHeld) {
          this.itemHeld = {
            type: 'plate',
            id: Math.random().toString(),
            name: `Đĩa thức ăn (${plate.plateContents?.length || 0} món)`,
            plateContents: plate.plateContents || [],
          };
          station.itemOnStation = undefined;
          this.updateStationVisual(station);
          soundManager.playPickup();
          soundManager.speakVietnamese('Cầm đĩa lên!');
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate(this.itemHeld);
          return;
        }
        // If holding another plate -> SWAP
        if (this.itemHeld.type === 'plate') {
          const temp = this.itemHeld.plateContents || [];
          this.itemHeld.plateContents = plate.plateContents || [];
          this.itemHeld.name = `Đĩa thức ăn (${this.itemHeld.plateContents.length} món)`;
          plate.plateContents = temp;
          this.updateStationVisual(station);
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate({ ...this.itemHeld });
          soundManager.playPickup();
          soundManager.speakVietnamese('Đã đổi đĩa!');
          return;
        }
      }

      // 5C. Table has an INGREDIENT:
      if (station.itemOnStation.type === 'ingredient') {
        const tableIng = station.itemOnStation.ingredient!;
        // If empty hands -> PICK UP INGREDIENT
        if (!this.itemHeld) {
          this.itemHeld = {
            type: 'ingredient',
            id: Math.random().toString(),
            name: getIngredientDisplayName(tableIng),
            ingredient: tableIng,
          };
          station.itemOnStation = undefined;
          this.updateStationVisual(station);
          soundManager.playPickup();
          soundManager.speakVietnamese(`Cầm ${this.itemHeld.name} lên`);
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate(this.itemHeld);
          return;
        }
        // If holding a plate -> GATHER INGREDIENT INTO PLATE
        if (this.itemHeld.type === 'plate') {
          this.itemHeld.plateContents = this.itemHeld.plateContents || [];
          this.itemHeld.plateContents.push(tableIng);
          this.itemHeld.name = `Đĩa thức ăn (${this.itemHeld.plateContents.length} món)`;
          station.itemOnStation = undefined;
          this.updateStationVisual(station);
          soundManager.playPickup();
          soundManager.speakVietnamese(`Đã gắp ${getIngredientDisplayName(tableIng)} vào đĩa`);
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate({ ...this.itemHeld });
          return;
        }
        // If holding another ingredient -> SWAP!
        if (this.itemHeld.type === 'ingredient') {
          const heldIng = this.itemHeld.ingredient!;
          station.itemOnStation.ingredient = heldIng;
          this.itemHeld = {
            type: 'ingredient',
            id: Math.random().toString(),
            name: getIngredientDisplayName(tableIng),
            ingredient: tableIng,
          };
          this.updateStationVisual(station);
          soundManager.playPickup();
          soundManager.speakVietnamese(`Đã đổi lấy ${this.itemHeld.name}`);
          this.updateHeldItem3D();
          this.callbacks.onItemHeldUpdate(this.itemHeld);
          return;
        }
      }
      return;
    }

    // 6. SERVICE BELL (DELIVERY)
    if (station.type === 'service_bell') {
      if (this.itemHeld?.type === 'plate' && this.itemHeld.plateContents) {
        soundManager.playBell();
        const { matched, accuracy } = validateRecipeMatch(this.itemHeld.plateContents);

        if (matched) {
          // Check matching active order
          const orderIdx = this.activeOrders.findIndex(o => o.recipeId === matched.id);
          if (orderIdx !== -1) {
            const order = this.activeOrders[orderIdx];
            const speedRatio = order.timeLeft / order.maxTime;

            // Upgrade: Golden bell tip bonus (+35% per level)
            const bellLvl = this.upgrades.golden_bell || 0;
            const bellMultiplier = 1 + bellLvl * 0.35;

            // Combo streak logic
            this.comboStreak++;
            const comboBonus = (this.comboStreak > 1) ? (this.comboStreak - 1) * 30 : 0;
            const comboTipBonus = (this.comboStreak > 1) ? (this.comboStreak - 1) * 20 : 0;

            const tipEarned = Math.round(order.totalScore * 0.25 * speedRatio * bellMultiplier) + comboTipBonus;
            const orderScore = Math.round(order.totalScore * (accuracy / 100)) + comboBonus;

            this.score += orderScore;
            this.totalTips += tipEarned;
            this.ordersServed++;

            if (this.comboStreak > 1) {
              soundManager.playCombo(this.comboStreak);
              soundManager.speakVietnamese(`Combo nhân ${this.comboStreak}! Tuyệt vời quá Duyên ơi!`);
              if (this.comboStreak >= 3) {
                confetti({
                  particleCount: 60 + this.comboStreak * 15,
                  spread: 80,
                  origin: { y: 0.7 },
                });
              }
            } else {
              soundManager.playSuccess();
              soundManager.speakVietnamese(`Món ${matched.name} hoàn thành xuất sắc! Khách rất hài lòng.`);
            }

            this.callbacks.onComboUpdate?.(this.comboStreak);
            this.activeOrders.splice(orderIdx, 1);
            this.callbacks.onOrderUpdate([...this.activeOrders]);
            this.callbacks.onScoreUpdate(this.score, this.totalTips);

            // Clear hands
            this.itemHeld = null;
            this.updateHeldItem3D();
            this.callbacks.onItemHeldUpdate(null);

            // Spawn next order after slight delay
            setTimeout(() => this.spawnOrder(), 3500);
            return;
          }
        }

        // No matching order or incorrect ingredients
        this.comboStreak = 0;
        this.callbacks.onComboUpdate?.(0);
        soundManager.playFail();
        this.score = Math.max(0, this.score - 20);
        this.callbacks.onScoreUpdate(this.score, this.totalTips);
        soundManager.speakVietnamese('Món này chưa đúng yêu cầu của khách rồi Duyên ơi!');
      } else {
        soundManager.playBell();
        if (this.itemHeld) {
          soundManager.speakVietnamese('Cần bày món ra đĩa trước khi giao!');
        }
      }
      return;
    }

    // 7. TRASH BIN
    if (station.type === 'trash_bin') {
      if (this.itemHeld) {
        const discarded = this.itemHeld.name;
        soundManager.playPlace();
        this.itemHeld = null;
        this.updateHeldItem3D();
        this.callbacks.onItemHeldUpdate(null);
        soundManager.speakVietnamese(`Đã bỏ ${discarded} vào thùng rác`);
      }
      return;
    }
  }

  public dropOrClearItem() {
    if (!this.itemHeld) return;

    const itemName = this.itemHeld.name;

    // 1. If currently looking at an empty counter/board/table
    if (this.currentLookingStation) {
      const st = this.currentLookingStation;
      if ((st.type === 'counter_spot' || st.type === 'plating_counter') && !st.itemOnStation) {
        if (this.itemHeld.type === 'ingredient') {
          st.itemOnStation = { type: 'ingredient', ingredient: this.itemHeld.ingredient };
        } else if (this.itemHeld.type === 'plate') {
          st.itemOnStation = { type: 'plate', plateContents: this.itemHeld.plateContents || [] };
        }
        this.updateStationVisual(st);
        this.itemHeld = null;
        this.updateHeldItem3D();
        this.callbacks.onItemHeldUpdate(null);
        soundManager.playPlace();
        soundManager.speakVietnamese(`Đã đặt ${itemName} xuống ${st.name}`);
        return;
      }
    }

    // 2. Find nearest empty counter spot in the kitchen
    const freeCounters = this.kitchen.stations.filter(
      s => (s.type === 'counter_spot' || s.type === 'plating_counter') && !s.itemOnStation
    );

    if (freeCounters.length > 0) {
      freeCounters.sort((a, b) => this.playerPos.distanceTo(a.position) - this.playerPos.distanceTo(b.position));
      const target = freeCounters[0];
      if (this.itemHeld.type === 'ingredient') {
        target.itemOnStation = { type: 'ingredient', ingredient: this.itemHeld.ingredient };
      } else if (this.itemHeld.type === 'plate') {
        target.itemOnStation = { type: 'plate', plateContents: this.itemHeld.plateContents || [] };
      }
      this.updateStationVisual(target);
      this.itemHeld = null;
      this.updateHeldItem3D();
      this.callbacks.onItemHeldUpdate(null);
      soundManager.playPlace();
      soundManager.speakVietnamese(`Đã đặt ${itemName} xuống ${target.name}`);
      return;
    }

    // 3. Fallback: safely clear from hands
    soundManager.playPlace();
    soundManager.speakVietnamese(`Đã bỏ ${itemName} ra khỏi tay`);
    this.itemHeld = null;
    this.updateHeldItem3D();
    this.callbacks.onItemHeldUpdate(null);
  }

  private updateHeldItem3D() {
    if (this.heldItem3D) {
      this.hands.itemSocket.remove(this.heldItem3D);
      this.heldItem3D = null;
    }
    if (this.duyenHeldItemMesh) {
      this.duyenRig.rightForearm.remove(this.duyenHeldItemMesh);
      this.duyenHeldItemMesh = null;
    }

    if (!this.itemHeld) return;

    if (this.itemHeld.type === 'ingredient' && this.itemHeld.ingredient) {
      this.heldItem3D = create3DItem(this.itemHeld.ingredient);
      this.hands.itemSocket.add(this.heldItem3D);

      const duyenItem = create3DItem(this.itemHeld.ingredient);
      duyenItem.scale.set(0.7, 0.7, 0.7);
      duyenItem.position.set(0, -0.22, 0.05);
      this.duyenHeldItemMesh = duyenItem;
      this.duyenRig.rightForearm.add(duyenItem);
    } else if (this.itemHeld.type === 'plate') {
      this.heldItem3D = create3DItem('plate');

      const duyenPlate = create3DItem('plate');
      duyenPlate.scale.set(0.7, 0.7, 0.7);
      duyenPlate.position.set(0, -0.22, 0.06);
      this.duyenHeldItemMesh = duyenPlate;

      // If plate has ingredients, add mini representations
      if (this.itemHeld.plateContents) {
        this.itemHeld.plateContents.forEach((ing, idx) => {
          const itemMesh = create3DItem(ing);
          itemMesh.scale.set(0.65, 0.65, 0.65);
          itemMesh.position.set((idx % 2 - 0.5) * 0.05, 0.02 + idx * 0.005, (Math.floor(idx / 2) - 0.5) * 0.05);
          this.heldItem3D?.add(itemMesh);

          const duyenFood = create3DItem(ing);
          duyenFood.scale.set(0.55, 0.55, 0.55);
          duyenFood.position.set((idx % 2 - 0.5) * 0.04, 0.02 + idx * 0.005, (Math.floor(idx / 2) - 0.5) * 0.04);
          this.duyenHeldItemMesh?.add(duyenFood);
        });
      }
      this.hands.itemSocket.add(this.heldItem3D);
      this.duyenRig.rightForearm.add(this.duyenHeldItemMesh);
    }
  }

  // --- GAME LOOP ---
  private loop = () => {
    this.animationFrameId = requestAnimationFrame(this.loop);
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05);
    this.lastTime = now;

    if (!this.isPaused && this.isShiftRunning) {
      this.updateSimulation(dt, now);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updateSimulation(dt: number, now: number) {
    // 1. Shift Timer
    this.shiftTimeRemaining -= dt;
    this.callbacks.onTimeUpdate(Math.max(0, Math.floor(this.shiftTimeRemaining)));

    if (this.shiftTimeRemaining <= 0) {
      this.endShift();
      return;
    }

    // 2. Order Timers
    let ordersChanged = false;
    for (let i = this.activeOrders.length - 1; i >= 0; i--) {
      const order = this.activeOrders[i];
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        // Order failed/expired!
        this.activeOrders.splice(i, 1);
        this.ordersFailed++;
        this.comboStreak = 0;
        this.callbacks.onComboUpdate?.(0);
        this.score = Math.max(0, this.score - 40);
        soundManager.playFail();
        ordersChanged = true;
      }
    }

    // Periodic order spawning
    this.orderSpawnTimer += dt;
    if (this.orderSpawnTimer > 18 && this.activeOrders.length < 3) {
      this.orderSpawnTimer = 0;
      this.spawnOrder();
    } else if (ordersChanged) {
      this.callbacks.onOrderUpdate([...this.activeOrders]);
      this.callbacks.onScoreUpdate(this.score, this.totalTips);
    }

    // 3. Stove Cooking Logic & Gas Flame Visuals
    let leftStoveCooking = false;
    let rightStoveCooking = false;
    const nonstickLvl = this.upgrades.nonstick_pans || 0;
    const burnLimit = 160 + nonstickLvl * 45;

    this.kitchen.stations.forEach(station => {
      if ((station.type === 'stove_left' || station.type === 'stove_right') && station.itemOnStation?.panContents?.isCooking) {
        if (station.type === 'stove_left') leftStoveCooking = true;
        if (station.type === 'stove_right') rightStoveCooking = true;

        const pan = station.itemOnStation.panContents;
        pan.cookProgress += dt * 14; // takes ~7 seconds to cook

        // If cooked just now
        if (pan.cookProgress >= 100 && pan.cookProgress < 105) {
          this.updateStationVisual(station);
          soundManager.speakGameAction(pan.item === 'raw_egg' ? 'egg_ready' : 'rice_ready');
        } else if (pan.cookProgress >= burnLimit && pan.cookProgress < burnLimit + 5) {
          this.updateStationVisual(station);
          soundManager.playBurnWarning();
          soundManager.speakGameAction('burn_warning');
        }
      }
    });

    if (this.kitchen.fireLights[0]) {
      this.kitchen.fireLights[0].intensity = leftStoveCooking ? 2.0 : 0;
    }
    if (this.kitchen.fireLights[1]) {
      this.kitchen.fireLights[1].intensity = rightStoveCooking ? 2.0 : 0;
    }

    // 4. Continuous Chopping (with Damascus knife speed upgrade)
    if (this.isChopping && this.currentLookingStation?.type === 'cutting_board') {
      const board = this.currentLookingStation;
      if (board.itemOnStation?.ingredient && ['cucumber', 'scallion', 'sausage'].includes(board.itemOnStation.ingredient)) {
        const knifeLvl = this.upgrades.chef_knife_set || 0;
        const knifeSpeed = 1 + knifeLvl * 0.45;
        board.cuttingProgress = (board.cuttingProgress || 0) + dt * 45 * knifeSpeed;
        if (now - this.lastChopSoundTime > 200 / knifeSpeed) {
          soundManager.playChop();
          this.lastChopSoundTime = now;
        }
        if (board.cuttingProgress >= 100) {
          let res: IngredientType = board.itemOnStation.ingredient;
          if (res === 'cucumber') res = 'sliced_cucumber';
          if (res === 'scallion') res = 'chopped_scallion';
          if (res === 'sausage') res = 'sliced_sausage';
          board.itemOnStation.ingredient = res;
          board.cuttingProgress = 0;
          this.isChopping = false;
          this.updateStationVisual(board);
          soundManager.playSuccess();
          soundManager.speakVietnamese(`Đã thái xong ${getIngredientDisplayName(res)}!`);
        }
      } else {
        this.isChopping = false;
      }
    }

    // 5. Player Movement & Collision (zero allocations per frame)
    _moveDir.set(0, 0, 0);
    if (this.keys['KeyW']) _moveDir.z -= 1;
    if (this.keys['KeyS']) _moveDir.z += 1;
    if (this.keys['KeyA']) _moveDir.x -= 1;
    if (this.keys['KeyD']) _moveDir.x += 1;

    const isMoving = _moveDir.lengthSq() > 0;
    if (isMoving) {
      _moveDir.normalize();
      const speed = this.keys['ShiftLeft'] ? 3.6 : 2.4;
      _moveDir.applyAxisAngle(_upAxis, this.cameraYaw);

      this.playerPos.addScaledVector(_moveDir, speed * dt);
      // Kitchen bounds
      this.playerPos.x = Math.max(-2.2, Math.min(2.2, this.playerPos.x));
      this.playerPos.z = Math.max(-2.2, Math.min(2.4, this.playerPos.z));

      // Footstep sound
      if (now - this.lastFootstepTime > (this.keys['ShiftLeft'] ? 320 : 450)) {
        soundManager.playFootstep();
        this.lastFootstepTime = now;
      }
    }

    if (this.isThirdPersonView) {
      // Third Person Mode: Position and animate full 3D Duyen
      this.duyenRig.root.position.set(this.playerPos.x, 0, this.playerPos.z);
      this.duyenRig.root.rotation.y = this.cameraYaw;
      this.duyenRig.updateAnimation(now * 0.001, isMoving);

      if (this.isChopping) {
        // Chopping arm animation in 3rd person
        const chopSpeed = now * 0.025;
        this.duyenRig.rightArm.rotation.set(-1.05, 0.15, 0.1);
        this.duyenRig.rightForearm.rotation.set(0.85 + Math.sin(chopSpeed) * 0.35, 0, 0);
        this.duyenRig.leftArm.rotation.set(-0.85, -0.2, -0.15);
        this.duyenRig.leftForearm.rotation.set(0.72, 0, 0.1);
      } else if (this.itemHeld) {
        // Holding plate / ingredient in hands
        this.duyenRig.rightArm.rotation.set(-0.68, 0.22, 0.18);
        this.duyenRig.rightForearm.rotation.set(0.82, 0, -0.22);
      }

      // Smooth Over-the-Shoulder / Third Person Camera
      const camDist = 1.75;
      const camHeight = 0.35;
      const cosYaw = Math.sin(this.cameraYaw);
      const sinYaw = Math.cos(this.cameraYaw);
      const cosPitch = Math.cos(this.cameraPitch * 0.7);
      const sinPitch = Math.sin(this.cameraPitch * 0.7);

      const cx = this.playerPos.x + cosYaw * camDist * cosPitch;
      const cy = this.playerPos.y + camHeight + sinPitch * camDist;
      const cz = this.playerPos.z + sinYaw * camDist * cosPitch;

      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(this.playerPos.x, this.playerPos.y - 0.18, this.playerPos.z);
    } else {
      // First Person Mode
      this.camera.rotation.set(0, 0, 0);
      this.camera.rotation.y = this.cameraYaw;
      this.camera.rotation.x = this.cameraPitch;

      // Camera bobbing
      const bob = (isMoving && this.settings.cameraBobbing) ? Math.sin(now * 0.01) * 0.03 : 0;
      this.camera.position.set(this.playerPos.x, this.playerPos.y + bob, this.playerPos.z);

      // Hands animation
      this.hands.update(now * 0.001, isMoving, this.isChopping);
    }

    // 6. Raycasting for contextual interact prompts (zero-alloc)
    this.raycastStations();

    // 7. Kitchen ambient effects & dynamic fire flicker
    this.kitchen.update(now * 0.001);
  }

  private raycastStations() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    let closestStation: InteractiveStation | null = null;
    let minDistance = 2.2;

    this.camera.getWorldDirection(_forward);

    this.kitchen.stations.forEach(st => {
      const dist = this.playerPos.distanceTo(st.position);
      if (dist < st.interactionDistance && dist < minDistance) {
        _stationVec.copy(st.position).sub(this.camera.position).normalize();
        if (_forward.dot(_stationVec) > 0.6) {
          minDistance = dist;
          closestStation = st;
        }
      }
    });

    this.currentLookingStation = closestStation;

    // Prompt generator
    if (!closestStation) {
      this.callbacks.onPromptUpdate(null);
      return;
    }

    const st = closestStation as InteractiveStation;
    let promptText = `[E] ${st.name}`;

    if (st.type.startsWith('pantry_')) {
      if (!this.itemHeld) {
        promptText = `[E] Lấy ${st.name}`;
      } else if (this.itemHeld.type === 'ingredient') {
        promptText = `[E] Đổi ${this.itemHeld.name} lấy ${st.name}`;
      } else if (this.itemHeld.type === 'plate') {
        promptText = `[E] Cho ${st.name} vào đĩa`;
      }
    } else if (st.type === 'plate_dispenser') {
      if (!this.itemHeld) {
        promptText = `[E] Lấy Đĩa Sạch`;
      } else if (this.itemHeld.type === 'ingredient') {
        promptText = `[E] Đặt ${this.itemHeld.name} xuống & lấy đĩa`;
      } else {
        promptText = `Đĩa Sạch (Đang cầm trên tay)`;
      }
    } else if (st.type === 'cutting_board') {
      if (st.itemOnStation?.ingredient) {
        const item = st.itemOnStation.ingredient;
        if (['sliced_cucumber', 'chopped_scallion', 'sliced_sausage'].includes(item)) {
          if (this.itemHeld?.type === 'plate') {
            promptText = `[E] Gắp ${getIngredientDisplayName(item)} vào đĩa`;
          } else if (!this.itemHeld) {
            promptText = `[E] Cầm ${getIngredientDisplayName(item)}`;
          } else {
            promptText = `[E] Đổi lấy ${getIngredientDisplayName(item)}`;
          }
        } else {
          if (!this.itemHeld) {
            promptText = `[Giữ E hoặc Chuột Trái] Thái ${getIngredientDisplayName(item)} (${Math.round(st.cuttingProgress || 0)}%)`;
          } else if (['cucumber', 'scallion', 'sausage'].includes(this.itemHeld.ingredient || '')) {
            promptText = `[E] Đổi lấy ${getIngredientDisplayName(item)}`;
          } else {
            promptText = `[Q] Đặt ${this.itemHeld.name} xuống để thái`;
          }
        }
      } else if (this.itemHeld?.ingredient && ['cucumber', 'scallion', 'sausage'].includes(this.itemHeld.ingredient)) {
        promptText = `[E] Đặt ${this.itemHeld.name} lên thớt`;
      } else if (this.itemHeld) {
        promptText = `Thớt: Cần dưa leo, hành hoặc lạp xưởng`;
      }
    } else if (st.type === 'stove_left' || st.type === 'stove_right') {
      const pan = st.itemOnStation?.panContents;
      const nonstickLvl = this.upgrades.nonstick_pans || 0;
      const burnLimit = 160 + nonstickLvl * 45;

      if (pan?.isCooking) {
        if (pan.cookProgress >= burnLimit) {
          promptText = `⚠️ ĐÃ CHÁY! [E] Đổ bỏ`;
        } else if (pan.cookProgress >= 80) {
          promptText = `✨ Chín thơm giòn! [E] Gắp ra ${this.itemHeld?.type === 'plate' ? 'đĩa' : 'tay'}`;
        } else {
          promptText = `🔥 Đang chiên xèo xèo (${Math.round(pan.cookProgress)}%)`;
        }
      } else if (this.itemHeld?.ingredient && ['raw_egg', 'cooked_rice'].includes(this.itemHeld.ingredient)) {
        promptText = `[E] Đặt vào chảo & Bật bếp chiên ${this.itemHeld.name}`;
      }
    } else if (st.type === 'counter_spot' || st.type === 'plating_counter') {
      if (!st.itemOnStation) {
        if (this.itemHeld) {
          promptText = `[E / Q] Đặt ${this.itemHeld.name} xuống ${st.name}`;
        } else {
          promptText = `${st.name} (Bàn trống - sẵn sàng đặt đồ)`;
        }
      } else if (st.itemOnStation.type === 'plate') {
        if (this.itemHeld?.ingredient) {
          promptText = `[E] Thêm ${this.itemHeld.name} vào đĩa`;
        } else if (!this.itemHeld) {
          promptText = `[E] Cầm đĩa thức ăn lên`;
        } else if (this.itemHeld.type === 'plate') {
          promptText = `[E] Hoán đổi đĩa`;
        }
      } else if (st.itemOnStation.type === 'ingredient') {
        const ingName = getIngredientDisplayName(st.itemOnStation.ingredient!);
        if (!this.itemHeld) {
          promptText = `[E] Cầm ${ingName} lên`;
        } else if (this.itemHeld.type === 'plate') {
          promptText = `[E] Gắp ${ingName} vào đĩa`;
        } else if (this.itemHeld.type === 'ingredient') {
          promptText = `[E] Đổi lấy ${ingName}`;
        }
      }
    } else if (st.type === 'service_bell') {
      if (this.itemHeld?.type === 'plate') {
        promptText = `🔔 [E] Rung chuông & Giao đĩa cho khách`;
      } else {
        promptText = `🔔 [E] Rung chuông sảnh`;
      }
    } else if (st.type === 'trash_bin') {
      if (this.itemHeld) {
        promptText = `🗑️ [E] Vứt ${this.itemHeld.name}`;
      }
    }

    this.callbacks.onPromptUpdate(promptText);
  }

  private endShift() {
    this.unlockCursor();
    this.isShiftRunning = false;
    soundManager.setSizzle(false);

    // Calculate rating
    const accuracy = this.ordersServed > 0
      ? Math.round((this.ordersServed / (this.ordersServed + this.ordersFailed)) * 100)
      : 0;

    let rank: ShiftStats['rank'] = 'C';
    if (this.score >= this.targetScore * 1.3 && accuracy >= 90) rank = 'S';
    else if (this.score >= this.targetScore && accuracy >= 75) rank = 'A';
    else if (this.score >= this.targetScore * 0.7) rank = 'B';

    const stats: ShiftStats = {
      chapterId: this.activeChapterId,
      ordersServed: this.ordersServed,
      ordersFailed: this.ordersFailed,
      totalTips: this.totalTips,
      accuracy,
      score: this.score,
      rank,
      duration: this.shiftTimeTotal,
      passed: this.score >= this.targetScore,
    };

    soundManager.speakGameAction(stats.passed ? 'shift_end_success' : 'shift_end_fail');
    this.callbacks.onShiftEnd(stats);
  }

  public updateSettings(settings: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...settings };
    soundManager.updateSettings(settings);
  }

  public updateCustomization(custom: import('./types').DuyenCustomization) {
    this.hands.updateCustomization(custom);
    if (this.duyenRig) {
      this.duyenRig.applyCustomization(custom);
    }
  }

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('mouseup', this.onMouseUp);

    soundManager.dispose();
    this.renderer.dispose();
  }
}
