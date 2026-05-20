import { useEffect, useRef } from "react";
import * as THREE from "three";

type Electron = {
  object: THREE.Object3D;
  radiusX: number;
  radiusY: number;
  phase: number;
  speed: number;
  plane: "upper" | "lower" | "bondLeft" | "bondRight";
};

const oxygen = new THREE.Vector3(0, 0.18, 0);
const hydrogenLeft = new THREE.Vector3(-1.18, -0.7, 0.22);
const hydrogenRight = new THREE.Vector3(1.18, -0.7, -0.22);

export function WaterOrbitalScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const canvas = canvasRef.current;
    if (!mount || !canvas) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x071a32, 0.075);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.18, 5.2);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const molecule = new THREE.Group();
    molecule.rotation.set(-0.18, 0.62, 0.03);
    molecule.scale.setScalar(0.84);
    scene.add(molecule);

    const ambient = new THREE.AmbientLight(0xb9d8ff, 0.82);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3.2, 4.6, 4.2);
    const rimLight = new THREE.PointLight(0xffcad7, 7.2, 9);
    rimLight.position.set(-3.5, 2.3, 3);
    scene.add(ambient, keyLight, rimLight);

    const oxygenMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x8b1e3f,
      metalness: 0.08,
      roughness: 0.18,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      emissive: 0x2d0613,
      emissiveIntensity: 0.15
    });
    const hydrogenMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf2fbff,
      metalness: 0.04,
      roughness: 0.16,
      transmission: 0.12,
      thickness: 0.36,
      clearcoat: 0.95,
      clearcoatRoughness: 0.08,
      emissive: 0x12395f,
      emissiveIntensity: 0.08
    });
    const bondMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xb9d8ff,
      roughness: 0.36,
      transparent: true,
      opacity: 0.72,
      emissive: 0x12395f,
      emissiveIntensity: 0.1
    });
    const electronMaterial = new THREE.MeshBasicMaterial({ color: 0xd7f0ff });
    const electronGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x8ed7ff,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    molecule.add(createGlowSphere(oxygen, 0.59, 0x8b1e3f, 0.13));
    molecule.add(createGlowSphere(hydrogenLeft, 0.36, 0x8ed7ff, 0.13));
    molecule.add(createGlowSphere(hydrogenRight, 0.36, 0x8ed7ff, 0.13));
    molecule.add(createSphere(oxygen, 0.43, oxygenMaterial));
    molecule.add(createSphere(hydrogenLeft, 0.25, hydrogenMaterial));
    molecule.add(createSphere(hydrogenRight, 0.25, hydrogenMaterial));
    molecule.add(createBond(oxygen, hydrogenLeft, 0.075, bondMaterial));
    molecule.add(createBond(oxygen, hydrogenRight, 0.075, bondMaterial));

    const densityGroup = new THREE.Group();
    densityGroup.add(createOrbitalLine(1.95, 0.9, 0.55, -0.42, 0x8ed7ff, 0.42));
    densityGroup.add(createOrbitalLine(1.95, 0.9, -0.55, 0.42, 0xffcad7, 0.38));
    densityGroup.add(createOrbitalLine(1.58, 0.52, 0, Math.PI / 2, 0xffffff, 0.2));
    densityGroup.add(createOrbitalLine(2.28, 1.08, 0.16, 0.12, 0xb9d8ff, 0.18));
    molecule.add(densityGroup);

    const electrons: Electron[] = [];
    const electronGeometry = new THREE.SphereGeometry(0.045, 18, 18);
    const glowGeometry = new THREE.SphereGeometry(0.13, 18, 18);
    const electronSpecs: Omit<Electron, "object">[] = [
      { radiusX: 1.3, radiusY: 0.46, phase: 0.1, speed: 0.62, plane: "upper" },
      { radiusX: 1.3, radiusY: 0.46, phase: Math.PI, speed: 0.62, plane: "upper" },
      { radiusX: 1.04, radiusY: 0.38, phase: 1.5, speed: -0.72, plane: "lower" },
      { radiusX: 1.04, radiusY: 0.38, phase: 4.55, speed: -0.72, plane: "lower" },
      { radiusX: 0.42, radiusY: 0.16, phase: 0.45, speed: 1.25, plane: "bondLeft" },
      { radiusX: 0.42, radiusY: 0.16, phase: 3.55, speed: 1.25, plane: "bondLeft" },
      { radiusX: 0.42, radiusY: 0.16, phase: 2.1, speed: 1.18, plane: "bondRight" },
      { radiusX: 0.42, radiusY: 0.16, phase: 5.2, speed: 1.18, plane: "bondRight" },
      { radiusX: 0.72, radiusY: 0.23, phase: 0.8, speed: 0.86, plane: "upper" },
      { radiusX: 0.72, radiusY: 0.23, phase: 3.8, speed: 0.86, plane: "lower" }
    ];

    electronSpecs.forEach((spec) => {
      const electron = new THREE.Group();
      const glow = new THREE.Mesh(glowGeometry, electronGlowMaterial);
      const core = new THREE.Mesh(electronGeometry, electronMaterial);
      electron.add(glow, core);
      molecule.add(electron);
      electrons.push({ ...spec, object: electron });
    });

    const fieldParticles = createFieldParticles();
    scene.add(fieldParticles);

    const hoverState = { current: 0, target: 0 };
    const handlePointerEnter = () => {
      hoverState.target = 1;
    };
    const handlePointerLeave = () => {
      hoverState.target = 0;
    };
    mount.addEventListener("pointerenter", handlePointerEnter);
    mount.addEventListener("pointerleave", handlePointerLeave);

    let animationFrame = 0;
    const clock = new THREE.Clock();

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const animate = () => {
      const t = clock.getElapsedTime();
      hoverState.current += (hoverState.target - hoverState.current) * 0.045;
      const hoverTempo = 1 + hoverState.current * 0.28;
      molecule.rotation.y = 0.62 + t * 0.22 * hoverTempo;
      molecule.rotation.x = -0.18 + Math.sin(t * 0.48) * (0.08 + hoverState.current * 0.025);
      densityGroup.rotation.z = Math.sin(t * 0.32) * (0.08 + hoverState.current * 0.025);
      fieldParticles.rotation.y = t * 0.025 * hoverTempo;

      electrons.forEach((electron) => {
        const position = electronPosition(electron, t * hoverTempo, hoverState.current);
        electron.object.position.copy(position);
        const pulse = 1 + Math.sin(t * 3 + electron.phase) * (0.12 + hoverState.current * 0.04);
        electron.object.scale.setScalar(pulse);
      });

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      mount.removeEventListener("pointerenter", handlePointerEnter);
      mount.removeEventListener("pointerleave", handlePointerLeave);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, []);

  return (
    <div className="water-orbital-scene" ref={mountRef} aria-label="Dreidimensionales Wassermolekül mit Elektronenpunkten">
      <canvas className="water-model-canvas" ref={canvasRef} aria-hidden="true" />
    </div>
  );
}

function createSphere(position: THREE.Vector3, radius: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 72, 72), material);
  mesh.position.copy(position);
  return mesh;
}

function createGlowSphere(position: THREE.Vector3, radius: number, color: number, opacity: number) {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 48), material);
  glow.position.copy(position);
  return glow;
}

function createBond(start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 28, 1);
  const bond = new THREE.Mesh(geometry, material);
  bond.position.copy(start).addScaledVector(direction, 0.5);
  bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return bond;
}

function createOrbitalLine(radiusX: number, radiusY: number, rotationX: number, rotationZ: number, color: number, opacity: number) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 180; i += 1) {
    const angle = (i / 180) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY + 0.06, 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.LineLoop(geometry, material);
  line.rotation.x = rotationX;
  line.rotation.z = rotationZ;
  return line;
}

function electronPosition(electron: Electron, time: number, hover: number) {
  const theta = electron.phase + time * electron.speed;
  const x = Math.cos(theta) * electron.radiusX * (1 + hover * 0.035);
  const y = Math.sin(theta) * electron.radiusY * (1 + hover * 0.035);
  const z = Math.sin(theta + electron.phase * 0.37) * (0.22 + hover * 0.035);

  if (electron.plane === "upper") {
    return new THREE.Vector3(x, y + 0.56, z).applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.58);
  }
  if (electron.plane === "lower") {
    return new THREE.Vector3(x, y - 0.02, z).applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.48);
  }

  const start = electron.plane === "bondLeft" ? oxygen : oxygen;
  const end = electron.plane === "bondLeft" ? hydrogenLeft : hydrogenRight;
  const center = new THREE.Vector3().copy(start).lerp(end, 0.58);
  const axis = new THREE.Vector3().subVectors(end, start).normalize();
  const side = new THREE.Vector3(axis.y, -axis.x, axis.z * 0.15).normalize();
  const lift = new THREE.Vector3(0, 0, electron.plane === "bondLeft" ? 1 : -1);
  return center
    .addScaledVector(side, Math.cos(theta) * electron.radiusX)
    .addScaledVector(lift, Math.sin(theta) * electron.radiusY);
}

function createFieldParticles() {
  const particleCount = 160;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const blue = new THREE.Color(0x8ed7ff);
  const rose = new THREE.Color(0xffcad7);

  for (let i = 0; i < particleCount; i += 1) {
    const radius = 2.3 + Math.random() * 2.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[i * 3 + 1] = Math.cos(phi) * radius * 0.78;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
    const color = i % 3 === 0 ? rose : blue;
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.018,
    vertexColors: true,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  return new THREE.Points(geometry, material);
}
