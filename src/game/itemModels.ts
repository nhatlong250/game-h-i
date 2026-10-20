import * as THREE from 'three';
import { IngredientType } from './types';
import { createBreadTexture, createCucumberTexture } from './textures';

export function create3DItem(type: IngredientType | 'plate' | 'pan'): THREE.Group {
  const group = new THREE.Group();

  switch (type) {
    case 'bread': {
      // Sculpted French Baguette with tapered ends and crust score marks
      const breadMat = new THREE.MeshStandardMaterial({
        map: createBreadTexture(),
        roughness: 0.55,
      });
      const bread = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.24, 12, 20), breadMat);
      bread.scale.set(0.9, 1.0, 1.25);
      bread.rotation.z = Math.PI / 2;
      bread.castShadow = true;
      group.add(bread);
      break;
    }

    case 'raw_egg': {
      // Natural organic egg curve
      const eggMat = new THREE.MeshStandardMaterial({
        color: 0xf5deb3,
        roughness: 0.35,
      });
      const egg = new THREE.Mesh(new THREE.SphereGeometry(0.036, 18, 18), eggMat);
      egg.scale.set(0.88, 1.3, 0.88);
      egg.castShadow = true;
      group.add(egg);
      break;
    }

    case 'fried_egg': {
      // The Sims style: organic undulating fried egg white with crispy ruffled edge
      const eggGroup = new THREE.Group();

      const whiteMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.25,
      });

      const crispyMat = new THREE.MeshStandardMaterial({
        color: 0xcd853f,
        roughness: 0.6,
      });

      // Crispy browned ruffled base rim
      const rimGeo = new THREE.CylinderGeometry(0.095, 0.098, 0.006, 24);
      rimGeo.scale(1.15, 1.0, 0.95);
      const rim = new THREE.Mesh(rimGeo, crispyMat);
      eggGroup.add(rim);

      // Cooked tender egg white body
      const bodyGeo = new THREE.CylinderGeometry(0.088, 0.092, 0.012, 24);
      bodyGeo.scale(1.12, 1.0, 0.96);
      const body = new THREE.Mesh(bodyGeo, whiteMat);
      body.position.y = 0.005;
      eggGroup.add(body);

      // Volumetric sunny-side runny yolk dome
      const yolkMat = new THREE.MeshPhysicalMaterial({
        color: 0xffa502,
        roughness: 0.15,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
      });
      const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.038, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2), yolkMat);
      yolk.position.set(-0.015, 0.01, -0.01);
      eggGroup.add(yolk);

      // Yolk gloss reflection highlight
      const specMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const spec = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), specMat);
      spec.position.set(-0.022, 0.045, -0.02);
      eggGroup.add(spec);

      group.add(eggGroup);
      break;
    }

    case 'burnt_egg': {
      const burntMat = new THREE.MeshStandardMaterial({
        color: 0x181818,
        roughness: 0.95,
      });
      const egg = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.015, 20), burntMat);
      group.add(egg);
      break;
    }

    case 'pate': {
      // Artisanal quenelle/scoop of smooth liver pâté
      const pateMat = new THREE.MeshStandardMaterial({
        color: 0x563020,
        roughness: 0.65,
      });
      const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 16), pateMat);
      scoop.scale.set(1.3, 0.75, 0.9);
      group.add(scoop);
      break;
    }

    case 'cucumber': {
      const cucMat = new THREE.MeshStandardMaterial({
        map: createCucumberTexture(),
        roughness: 0.45,
      });
      const cuc = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.22, 10, 16), cucMat);
      cuc.rotation.z = Math.PI / 2;
      group.add(cuc);
      break;
    }

    case 'sliced_cucumber': {
      const cucMat = new THREE.MeshStandardMaterial({
        map: createCucumberTexture(),
        roughness: 0.38,
      });
      for (let i = 0; i < 4; i++) {
        const slice = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.007, 18), cucMat);
        slice.position.set((i - 1.5) * 0.032, 0.003 * i, (i % 2) * 0.01);
        slice.rotation.y = i * 0.4;
        group.add(slice);
      }
      break;
    }

    case 'rice':
    case 'cooked_rice': {
      const riceMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.45,
      });
      // Fluffy rounded dome of jasmine rice
      const mound = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 18, 0, Math.PI * 2, 0, Math.PI / 2), riceMat);
      mound.scale.set(1.1, 0.85, 1.1);
      group.add(mound);
      break;
    }

    case 'scallion': {
      const scMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.45 });
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.24, 10), scMat);
      stalk.rotation.z = Math.PI / 2;
      group.add(stalk);
      break;
    }

    case 'chopped_scallion': {
      const scMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.4 });
      for (let i = 0; i < 8; i++) {
        const bit = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 10), scMat);
        bit.position.set((Math.random() - 0.5) * 0.07, 0, (Math.random() - 0.5) * 0.07);
        bit.rotation.x = Math.random() * 0.3;
        group.add(bit);
      }
      break;
    }

    case 'sausage': {
      // Curved Vietnamese Lap Xuong with natural sausage casing
      const sMat = new THREE.MeshStandardMaterial({ color: 0x9b1b22, roughness: 0.4 });
      const sausageCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.09, -0.01, 0),
        new THREE.Vector3(0, 0.015, 0),
        new THREE.Vector3(0.09, -0.01, 0),
      ]);
      const sausage = new THREE.Mesh(new THREE.TubeGeometry(sausageCurve, 16, 0.022, 12, false), sMat);
      group.add(sausage);
      break;
    }

    case 'sliced_sausage': {
      const sMat = new THREE.MeshStandardMaterial({ color: 0xa82830, roughness: 0.4 });
      for (let i = 0; i < 4; i++) {
        const slice = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.008, 16), sMat);
        slice.rotation.x = 0.2;
        slice.position.set((i - 1.5) * 0.028, 0.004 * i, 0);
        group.add(slice);
      }
      break;
    }

    case 'soy_sauce': {
      const soyMat = new THREE.MeshPhysicalMaterial({ color: 0x1f140e, roughness: 0.1, clearcoat: 0.9 });
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), soyMat);
      drop.scale.set(1.5, 0.3, 1.5);
      group.add(drop);
      break;
    }

    case 'chili_sauce': {
      // Artisanal swirl of sriracha chili sauce
      const chiliMat = new THREE.MeshPhysicalMaterial({ color: 0xd63031, roughness: 0.15, clearcoat: 0.8 });
      const swirlCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.04, 0, -0.02),
        new THREE.Vector3(0, 0.008, 0.03),
        new THREE.Vector3(0.03, 0.004, -0.01),
        new THREE.Vector3(0, 0.002, 0),
      ]);
      const swirl = new THREE.Mesh(new THREE.TubeGeometry(swirlCurve, 16, 0.008, 8, false), chiliMat);
      group.add(swirl);
      break;
    }

    case 'plate': {
      // Lathed ceramic dining plate with curved rim and shiny glaze
      const plateMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.15,
        clearcoat: 0.9,
      });
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.1, 0.022, 32), plateMat);
      plate.castShadow = true;
      plate.receiveShadow = true;
      group.add(plate);

      // Inner well rim
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.008, 8, 32), plateMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.01;
      group.add(rim);
      break;
    }

    case 'pan': {
      // Spun metal culinary skillet with sloping walls and ergonomic handle
      const panMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.3, metalness: 0.85 });
      const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.125, 0.045, 24), panMat);
      pan.castShadow = true;
      group.add(pan);

      const handleMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.5 });
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 12), handleMat);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(0.22, 0.035, 0);
      group.add(handle);
      break;
    }
  }

  return group;
}
