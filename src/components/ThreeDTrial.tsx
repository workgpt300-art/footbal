import { useEffect, useRef, useState } from "react";

export type Trial3DPhase = "shooting" | "passing" | "dribbling";
export type Trial3DAction = { success: boolean; points: number; description: string };

type Props = {
  phase: Trial3DPhase;
  attempt: number;
  rating: number;
  finishing: number;
  passing: number;
  dribbling: number;
  fitness: number;
  onAction: (result: Trial3DAction) => void;
};

const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));

export function ThreeDTrial({ phase, attempt, rating, finishing, passing, dribbling, fitness, onAction }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const actionRef = useRef(onAction);
  const [message, setMessage] = useState("Завантаження 3D-поля…");
  const [loadError, setLoadError] = useState("");

  useEffect(() => { actionRef.current = onAction; }, [onAction]);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let renderer: any = null;
    let scene: any = null;
    let camera: any = null;
    let resizeObserver: ResizeObserver | null = null;
    let handleResize: (() => void) | null = null;
    const disposers: Array<() => void> = [];

    async function start() {
      try {
        // Loaded on demand so the rest of the game can start without bundling a 3D engine.
        const threeModuleUrl = "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
        const THREE = await import(/* @vite-ignore */ threeModuleUrl) as unknown as Record<string, any>;
        if (disposed || !mount.current) return;

        const host = mount.current;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x07131a);
        scene.fog = new THREE.Fog(0x07131a, 28, 65);

        camera = new THREE.PerspectiveCamera(54, 1, 0.1, 120);
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.className = "trial3d-canvas";
        renderer.domElement.setAttribute("aria-label", "Інтерактивне тривимірне футбольне поле");
        host.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xbde8ff, 0x183323, 2.0));
        const sun = new THREE.DirectionalLight(0xffffff, 2.4);
        sun.position.set(-7, 15, 9);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        scene.add(sun);

        const standard = (color: number, roughness = 0.84) => new THREE.MeshStandardMaterial({ color, roughness });
        const greenA = standard(0x1a6946);
        const greenB = standard(0x1d754e);
        const white = standard(0xe8f1ed);
        const dark = standard(0x17222a);
        const gold = standard(0xb8fa52);
        const playerBlue = standard(0x2e89df);
        const rivalRed = standard(0xed5360);
        const skin = standard(0xe6b28a);
        const keeperOrange = standard(0xffad55);
        const ballMat = new THREE.MeshStandardMaterial({ color: 0xf7f8f6, roughness: 0.45 });
        const blackBallMat = standard(0x17232b, 0.7);

        const box = (w: number, h: number, d: number, material: any, x: number, y: number, z: number, parent = scene) => {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
          mesh.position.set(x, y, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          parent.add(mesh);
          return mesh;
        };
        const plane = (w: number, h: number, material: any, x: number, y: number, z: number) => {
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(x, y, z);
          mesh.receiveShadow = true;
          scene.add(mesh);
          return mesh;
        };
        const lineX = (x1: number, x2: number, z: number, y = 0.035, thickness = 0.045) =>
          box(Math.abs(x2 - x1), 0.018, thickness, white, (x1 + x2) / 2, y, z);
        const lineZ = (x: number, z1: number, z2: number, y = 0.035, thickness = 0.045) =>
          box(thickness, 0.018, Math.abs(z2 - z1), white, x, y, (z1 + z2) / 2);

        // Pitch: a real perspective 3D ground plane with markings, grass bands, goal and net.
        plane(30, 50, greenA, 0, 0, -2);
        for (let i = 0; i < 10; i += 1) {
          plane(30, 2.5, i % 2 ? greenA : greenB, 0, 0.015, 20 - i * 4.7);
        }
        lineX(-14.4, 14.4, 20); lineX(-14.4, 14.4, -24);
        lineZ(-14.4, -24, 20); lineZ(14.4, -24, 20);
        lineX(-14.4, 14.4, -11);
        lineX(-7.8, 7.8, -15.4); lineZ(-7.8, -15.4, -11); lineZ(7.8, -15.4, -11);
        lineX(-4.6, 4.6, -19); lineZ(-4.6, -19, -15.4); lineZ(4.6, -19, -15.4);
        const centreCircle = new THREE.Mesh(new THREE.RingGeometry(2.65, 2.72, 64), white);
        centreCircle.rotation.x = -Math.PI / 2; centreCircle.position.set(0, 0.038, 5); scene.add(centreCircle);
        const centreDot = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), white);
        centreDot.rotation.x = -Math.PI / 2; centreDot.position.set(0, 0.04, 5); scene.add(centreDot);

        // Goal frame and mesh.
        const goalZ = -23;
        box(0.17, 3.1, 0.17, white, -3.65, 1.55, goalZ);
        box(0.17, 3.1, 0.17, white, 3.65, 1.55, goalZ);
        box(7.4, 0.17, 0.17, white, 0, 3.1, goalZ);
        const netMaterial = new THREE.MeshStandardMaterial({ color: 0xdce9e8, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
        box(7.2, 3, 0.07, netMaterial, 0, 1.5, goalZ - 1.35);
        for (let x = -3.3; x <= 3.31; x += 0.55) box(0.018, 2.9, 1.2, white, x, 1.48, goalZ - 0.66);
        for (let y = 0.3; y <= 2.75; y += 0.48) box(7.1, 0.018, 1.25, white, 0, y, goalZ - 0.66);

        type Actor = { root: any; legs: any[]; arms: any[]; baseX: number; baseZ: number };
        const makeActor = (x: number, z: number, shirt: any, shorts: any, isKeeper = false): Actor => {
          const root = new THREE.Group();
          root.position.set(x, 0, z);
          const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.4, 1.05, 10), shirt);
          torso.position.y = 1.16; torso.castShadow = true; root.add(torso);
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), skin);
          head.position.y = 1.9; head.castShadow = true; root.add(head);
          const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.12, 0.7, 8), shorts);
          const legR = legL.clone();
          legL.position.set(-0.17, 0.43, 0.01); legR.position.set(0.17, 0.43, 0.01);
          root.add(legL, legR);
          const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.68, 8), shirt);
          const armR = armL.clone();
          armL.position.set(-0.43, 1.2, 0); armR.position.set(0.43, 1.2, 0);
          root.add(armL, armR);
          if (isKeeper) {
            const gloveMat = standard(0xf6f6ed);
            const g1 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), gloveMat);
            const g2 = g1.clone(); g1.position.set(-0.48, 0.96, -0.02); g2.position.set(0.48, 0.96, -0.02); root.add(g1, g2);
          }
          scene.add(root);
          return { root, legs: [legL, legR], arms: [armL, armR], baseX: x, baseZ: z };
        };

        const player = makeActor(attempt % 3 === 0 ? -1.2 : attempt % 3 === 1 ? 0 : 1.2, 8, playerBlue, dark);
        const mates = [
          makeActor(-5, -1.5, playerBlue, dark),
          makeActor(5, -4.8, playerBlue, dark),
          makeActor(1.5, -9.2, playerBlue, dark),
        ];
        const defenders = [
          makeActor(-2.8, 1, rivalRed, dark),
          makeActor(2.5, -5.1, rivalRed, dark),
          makeActor(-0.6, -11.4, rivalRed, dark),
        ];
        const keeper = makeActor(0, -20.5, keeperOrange, dark, true);

        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.23, 18, 14), ballMat);
        ball.castShadow = true;
        const spots = new THREE.Group();
        for (let i = 0; i < 5; i += 1) {
          const spot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 6), blackBallMat);
          spot.position.set(Math.cos(i * Math.PI * 2 / 5) * 0.19, 0.04, Math.sin(i * Math.PI * 2 / 5) * 0.19);
          spot.rotation.x = -Math.PI / 2;
          spots.add(spot);
        }
        ball.add(spots); scene.add(ball);

        const targetMark = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.39, 32), gold);
        targetMark.rotation.x = -Math.PI / 2;
        targetMark.position.set(0, 0.075, -22.4);
        scene.add(targetMark);
        let targetX = 0;
        let cameraYaw = 0;
        let moving = false;
        let movingSeconds = 0;
        let elapsedSinceStart = 0;
        let lockAction = false;
        let priorZ = player.root.position.z;
        let actorWalk = 0;
        const keys = new Set<string>();
        let action: null | { kind: "shot" | "pass"; elapsed: number; duration: number; startX: number; startY: number; startZ: number; targetX: number; targetY: number; targetZ: number; success: boolean; points: number; description: string } = null;
        const clock = new THREE.Clock();

        const finishAction = (result: Trial3DAction) => {
          if (lockAction || disposed) return;
          lockAction = true;
          setMessage(result.description);
          actionRef.current(result);
        };
        const shoot = () => {
          if (phase !== "shooting" || lockAction || action) return;
          const sx = ball.position.x, sy = Math.max(0.23, ball.position.y), sz = ball.position.z;
          const heightAtGoal = 0.55 + Math.random() * 2.05;
          const inFrame = Math.abs(targetX) <= 3.25 && heightAtGoal <= 2.78;
          const keeperSaves = inFrame && Math.random() < clamp(0.42 - (finishing - 55) * 0.004, 0.18, 0.52);
          const points = !inFrame ? 0 : keeperSaves ? 1 : 2;
          const description = !inFrame ? "Промах — м'яч пролетів повз ворота." : keeperSaves ? "Удар у площину! Воротар стрибнув і відбив м'яч." : "ГОЛ! М'яч влетів у сітку після твого удару.";
          keeper.root.position.x = clamp(targetX * 0.68, -2.9, 2.9);
          keeper.root.position.y = keeperSaves ? 0.5 : 0;
          action = { kind: "shot", elapsed: 0, duration: 0.9, startX: sx, startY: sy, startZ: sz, targetX, targetY: heightAtGoal, targetZ: goalZ, success: points > 0, points, description };
          setMessage("Удар! Стеж за польотом м'яча.");
        };
        const pass = () => {
          if (phase !== "passing" || lockAction || action) return;
          const mate = [...mates].sort((a, b) => Math.hypot(a.root.position.x - player.root.position.x, a.root.position.z - player.root.position.z) - Math.hypot(b.root.position.x - player.root.position.x, b.root.position.z - player.root.position.z))[0];
          if (!mate) return;
          const sx = ball.position.x, sy = Math.max(0.23, ball.position.y), sz = ball.position.z;
          const chance = clamp(0.48 + (passing - 55) * 0.008 + (fitness - 60) * 0.002, 0.18, 0.93);
          const success = Math.random() < chance;
          const interceptor = defenders.sort((a, b) => Math.hypot(a.root.position.x - mate.root.position.x, a.root.position.z - mate.root.position.z) - Math.hypot(b.root.position.x - mate.root.position.x, b.root.position.z - mate.root.position.z))[0];
          action = {
            kind: "pass", elapsed: 0, duration: 0.82, startX: sx, startY: sy, startZ: sz,
            targetX: success ? mate.root.position.x : interceptor.root.position.x,
            targetY: success ? 0.25 : 0.22,
            targetZ: success ? mate.root.position.z : interceptor.root.position.z,
            success, points: success ? 1 : 0,
            description: success ? "Точний пас! Партнер прийняв м'яч." : "Передачу перехоплено. Треба краще оцінювати напрямок."
          };
          setMessage("Передача летить до партнера…");
        };
        const onKeyDown = (event: KeyboardEvent) => {
          const key = event.key.toLowerCase();
          if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
          if (key === " " && phase === "shooting") { if (!event.repeat) shoot(); return; }
          if (key === "e" && phase === "passing") { if (!event.repeat) pass(); return; }
          keys.add(key);
        };
        const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        disposers.push(() => window.removeEventListener("keydown", onKeyDown), () => window.removeEventListener("keyup", onKeyUp));

        let pointerStart: { x: number; y: number; dragged: boolean } | null = null;
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const onPointerDown = (event: PointerEvent) => {
          pointerStart = { x: event.clientX, y: event.clientY, dragged: false };
          renderer.domElement.setPointerCapture?.(event.pointerId);
        };
        const onPointerMove = (event: PointerEvent) => {
          if (!pointerStart) return;
          const dx = event.clientX - pointerStart.x;
          const dy = event.clientY - pointerStart.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) pointerStart.dragged = true;
          if (pointerStart.dragged) {
            cameraYaw = clamp(cameraYaw - dx * 0.004, -1.0, 1.0);
            pointerStart.x = event.clientX; pointerStart.y = event.clientY;
          }
        };
        const onPointerUp = (event: PointerEvent) => {
          if (pointerStart && !pointerStart.dragged) {
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
            raycaster.setFromCamera(pointer, camera);
            const hit = raycaster.intersectObject(scene.children.find((child: any) => child === scene.userData.pitch) ?? scene.children[0], false)[0];
            // Use a horizontal mathematical plane for reliable mouse aiming even when the ground is striped.
            const ray = raycaster.ray;
            const y = 0;
            if (Math.abs(ray.direction.y) > 0.0001) {
              const distance = (y - ray.origin.y) / ray.direction.y;
              if (distance > 0) {
                const point = ray.origin.clone().add(ray.direction.clone().multiplyScalar(distance));
                targetX = clamp(point.x, -3.45, 3.45);
                targetMark.position.x = targetX;
                setMessage("Ціль прицілювання змінено. Натисни пробіл для удару.");
              }
            } else if (hit?.point) {
              targetX = clamp(hit.point.x, -3.45, 3.45);
              targetMark.position.x = targetX;
            }
          }
          pointerStart = null;
        };
        renderer.domElement.addEventListener("pointerdown", onPointerDown);
        renderer.domElement.addEventListener("pointermove", onPointerMove);
        renderer.domElement.addEventListener("pointerup", onPointerUp);
        renderer.domElement.addEventListener("pointercancel", onPointerUp);
        disposers.push(() => renderer.domElement.removeEventListener("pointerdown", onPointerDown),
          () => renderer.domElement.removeEventListener("pointermove", onPointerMove),
          () => renderer.domElement.removeEventListener("pointerup", onPointerUp),
          () => renderer.domElement.removeEventListener("pointercancel", onPointerUp));

        handleResize = () => {
          if (!host.clientWidth || !host.clientHeight) return;
          renderer.setSize(host.clientWidth, host.clientHeight, false);
          camera.aspect = host.clientWidth / host.clientHeight;
          camera.updateProjectionMatrix();
        };
        if (typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() => handleResize?.());
          resizeObserver.observe(host);
        } else {
          window.addEventListener("resize", handleResize);
          disposers.push(() => window.removeEventListener("resize", handleResize!));
        }
        handleResize?.();

        setMessage(phase === "shooting" ? "Прицілься мишкою, рухайся WASD і бий пробілом." : phase === "passing" ? "Рухайся WASD, підведи м'яч і натисни E для пасу." : "Обведи захисника клавішами WASD та пройди за лінію.");
        const animate = () => {
          if (disposed) return;
          frame = window.requestAnimationFrame(animate);
          const dt = Math.min(clock.getDelta(), 0.05);
          elapsedSinceStart += dt;

          priorZ = player.root.position.z;
          const forward = Number(keys.has("w") || keys.has("arrowup")) - Number(keys.has("s") || keys.has("arrowdown"));
          const side = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft"));
          const len = Math.hypot(forward, side) || 1;
          moving = (forward !== 0 || side !== 0) && !action && !lockAction;
          if (moving) {
            const sprint = keys.has("shift") ? 1.38 : 1;
            const speed = (3.15 + clamp(rating, 40, 95) * 0.012) * sprint;
            player.root.position.z -= (forward / len) * speed * dt;
            player.root.position.x += (side / len) * speed * dt;
            player.root.position.x = clamp(player.root.position.x, -12.8, 12.8);
            player.root.position.z = clamp(player.root.position.z, -18, 18);
            actorWalk += dt * (keys.has("shift") ? 11 : 7);
            player.legs[0].rotation.x = Math.sin(actorWalk) * 0.42;
            player.legs[1].rotation.x = -Math.sin(actorWalk) * 0.42;
            player.arms[0].rotation.x = -Math.sin(actorWalk) * 0.25;
            player.arms[1].rotation.x = Math.sin(actorWalk) * 0.25;
            player.root.rotation.y = Math.atan2(side, -forward || 0.001);
            movingSeconds += dt;
          } else {
            player.legs.forEach((leg: any) => leg.rotation.x *= 0.82);
            player.arms.forEach((arm: any) => arm.rotation.x *= 0.82);
          }
          if (phase === "dribbling" && !lockAction && priorZ > 3.5 && player.root.position.z <= 3.5) {
            const nearby = defenders.some((defender) => Math.hypot(defender.root.position.x - player.root.position.x, defender.root.position.z - player.root.position.z) < 2.2);
            const chance = clamp(0.5 + (dribbling - 55) * 0.009 + (fitness - 60) * 0.002 + (nearby ? -0.1 : 0.18), 0.12, 0.94);
            const success = Math.random() < chance;
            if (success) player.root.position.z -= 1.2;
            finishAction({ success, points: success ? 1 : 0, description: success ? "Ти пройшов захисника з м'ячем!" : "Захисник відібрав м'яч. Спробуй змінити напрямок перед ривком." });
          } else if (phase === "dribbling" && !lockAction && elapsedSinceStart > 22) {
            finishAction({ success: false, points: 0, description: "Час спроби вичерпано — не вдалося пройти захисника." });
          }

          if (action) {
            action.elapsed += dt;
            const t = clamp(action.elapsed / action.duration, 0, 1);
            ball.position.set(
              action.startX + (action.targetX - action.startX) * t,
              Math.max(0.22, action.startY + (action.kind === "shot" ? Math.sin(t * Math.PI) * 4.4 : Math.sin(t * Math.PI) * 0.85)),
              action.startZ + (action.targetZ - action.startZ) * t
            );
            ball.rotation.x += dt * 6; ball.rotation.z += dt * 5;
            if (t >= 1) finishAction({ success: action.success, points: action.points, description: action.description });
          } else if (!lockAction) {
            ball.position.set(player.root.position.x, 0.23, player.root.position.z - 0.9);
            ball.rotation.x += dt * (moving ? 6 : 0.4);
          }
          const cameraOffset = new THREE.Vector3(Math.sin(cameraYaw) * 12, 7.8, Math.cos(cameraYaw) * 12);
          const desired = player.root.position.clone().add(cameraOffset);
          camera.position.lerp(desired, 1 - Math.exp(-dt * 5));
          camera.lookAt(player.root.position.x, 0.8, player.root.position.z - 4.7);
          renderer.render(scene, camera);
        };
        animate();
      } catch (err) {
        if (!disposed) {
          setLoadError("Не вдалося запустити WebGL. Перевір інтернет-з'єднання або ввімкнення апаратного прискорення в браузері.");
          setMessage(err instanceof Error ? err.message : "Помилка 3D-сцени");
        }
      }
    }

    void start();
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      disposers.forEach((dispose) => dispose());
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
      if (scene) {
        scene.traverse((object: any) => {
          object.geometry?.dispose?.();
          if (Array.isArray(object.material)) object.material.forEach((material: any) => material.dispose?.());
          else object.material?.dispose?.();
        });
      }
    };
  }, [phase, attempt, rating, finishing, passing, dribbling, fitness]);

  const buttonAction = (key: string) => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  };

  return <div className="trial3d-wrap">
    <div className="trial3d-header">
      <div><span className="eyebrow">WEBGL · 3D НАВЧАЛЬНЕ ПОЛЕ</span><b>{phase === "shooting" ? "Прицілься й бий" : phase === "passing" ? "Знайди партнера для пасу" : "Обведи захисника"}</b></div>
      <span className="trial3d-status">{loadError ? "3D недоступний" : "3D сцена"}</span>
    </div>
    {loadError && <div className="trial3d-error">{loadError}</div>}
    <div className="trial3d-canvas-host" ref={mount}>
      <div className="trial3d-loader">{loadError || message}</div>
      <div className="trial3d-help"><b>W A S D</b> рух <span>•</span> <b>Shift</b> ривок <span>•</span> <b>потягни мишкою</b> — обертання камери</div>
      <div className="trial3d-buttons">
        {phase === "shooting" && <button type="button" onClick={() => buttonAction(" ")}>Удар · Space</button>}
        {phase === "passing" && <button type="button" onClick={() => buttonAction("e")}>Пас · E</button>}
        {phase === "dribbling" && <span>Пройди повз захисника</span>}
      </div>
    </div>
    <div className="trial3d-tip">{phase === "shooting" ? "Клацни мишкою по напрямку воріт для прицілювання; траєкторія м’яча та реакція воротаря відтворюються в 3D." : phase === "passing" ? "Підійди до м’яча, знайди відкритого партнера та натисни E. М’яч реально летить до партнера або перехоплюється." : "Керуй футболістом у просторі, змінюй напрямок руху й проривайся через захисника."}</div>
  </div>;
}
