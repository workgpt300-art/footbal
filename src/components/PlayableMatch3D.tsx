import { useEffect, useRef, useState } from "react";
import type { Club, MatchEvent, MatchStats } from "../types";

type LiveMatchResult = { homeScore: number; awayScore: number; events: MatchEvent[]; stats: MatchStats };
type Props = {
  home: Club;
  away: Club;
  userClubId: string;
  playerName: string;
  rating: number;
  finishing: number;
  passing: number;
  dribbling: number;
  fitness: number;
  onFinish: (result: LiveMatchResult) => void;
};

type Actor = { root: any; legs: any[]; arms: any[]; baseX: number; baseZ: number; keeper?: boolean };
type Motion = {
  kind: "shot" | "pass";
  elapsed: number;
  duration: number;
  startX: number; startY: number; startZ: number;
  targetX: number; targetY: number; targetZ: number;
  success: boolean;
  points: number;
  description: string;
  targetActor?: number;
};

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const intBetween = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));
const colorHex = (color: string) => Number.parseInt(color.replace("#", ""), 16) || 0xffffff;

export function PlayableMatch3D({ home, away, userClubId, playerName, rating, finishing, passing, dribbling, fitness, onFinish }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef(onFinish);
  const actionRef = useRef<{pass:()=>void;through:()=>void;shoot:()=>void;move:(key:string,down:boolean)=>void;fullscreen:()=>void}>({pass:()=>{},through:()=>{},shoot:()=>{},move:()=>{},fullscreen:()=>{}});
  const [minute, setMinute] = useState(0);
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [status, setStatus] = useState("Гра завантажується…");
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [passAccuracy, setPassAccuracy] = useState<number | null>(null);
  useEffect(() => { finishRef.current = onFinish; }, [onFinish]);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let renderer: any = null;
    let scene: any = null;
    let camera: any = null;
    let observer: ResizeObserver | null = null;
    let resizeFallback: (() => void) | null = null;
    const cleanups: Array<() => void> = [];
    const keys = new Set<string>();
    const homeIsUser = home.id === userClubId;
    const userClub = homeIsUser ? home : away;
    const opponentClub = homeIsUser ? away : home;
    const events: MatchEvent[] = [];
    const ownGoals = { value: 0 }, opponentGoals = { value: 0 };
    const ownShots = { value: 0 }, ownOnTarget = { value: 0 }, opponentShots = { value: 0 }, opponentOnTarget = { value: 0 };
    const ownPasses = { value: 0 }, ownPassesComplete = { value: 0 };
    let activeIndex = 9;
    let ballAction: Motion | null = null;
    let kickoffMode = true;
    let opponentPossession = false;
    let opponentHolder: any = null;
    let opponentPossessionClock = 0;
    let lock = false;
    let sent = false;
    let timer = 0;
    let matchMinute = 0;
    let uiAccumulator = 0;
    let walkClock = 0;
    let aimX = 0;
    let aimZ = 0;
    let keeperReactAt = Number.POSITIVE_INFINITY;
    let keeperDiveX = 0;
    let cameraYaw = 0;
    let opponentGoalAt = intBetween(17, 34);

    function finishMatch() {
      if (sent || disposed) return;
      sent = true;
      const possessionOwn = clamp(46 + Math.round((passing - 55) * 0.24) + intBetween(-7, 7), 29, 71);
      const ownAcc = ownPasses.value ? Math.round(ownPassesComplete.value / ownPasses.value * 100) : 0;
      const oppPasses = intBetween(65, 115);
      const oppAcc = intBetween(68, 86);
      const ownShotsTotal = ownShots.value;
      const oppShotsTotal = opponentShots.value;
      const stats: MatchStats = {
        possessionHome: homeIsUser ? possessionOwn : 100 - possessionOwn,
        possessionAway: homeIsUser ? 100 - possessionOwn : possessionOwn,
        shotsHome: homeIsUser ? ownShotsTotal : oppShotsTotal,
        shotsAway: homeIsUser ? oppShotsTotal : ownShotsTotal,
        shotsOnTargetHome: homeIsUser ? ownOnTarget.value : opponentOnTarget.value,
        shotsOnTargetAway: homeIsUser ? opponentOnTarget.value : ownOnTarget.value,
        xgHome: Number(((homeIsUser ? ownOnTarget.value : opponentOnTarget.value) * 0.23 + (homeIsUser ? ownGoals.value : opponentGoals.value) * 0.22).toFixed(2)),
        xgAway: Number(((homeIsUser ? opponentOnTarget.value : ownOnTarget.value) * 0.23 + (homeIsUser ? opponentGoals.value : ownGoals.value) * 0.22).toFixed(2)),
        passesHome: homeIsUser ? ownPasses.value : oppPasses,
        passesAway: homeIsUser ? oppPasses : ownPasses.value,
        passAccuracyHome: homeIsUser ? ownAcc : oppAcc,
        passAccuracyAway: homeIsUser ? oppAcc : ownAcc,
        cornersHome: intBetween(1, 8), cornersAway: intBetween(1, 8),
        foulsHome: intBetween(4, 15), foulsAway: intBetween(4, 15),
        yellowsHome: intBetween(0, 3), yellowsAway: intBetween(0, 3),
        redsHome: 0, redsAway: 0,
        savesHome: homeIsUser ? opponentOnTarget.value - opponentGoals.value : ownOnTarget.value - ownGoals.value,
        savesAway: homeIsUser ? ownOnTarget.value - ownGoals.value : opponentOnTarget.value - opponentGoals.value,
      };
      const safeStats: MatchStats = { ...stats, savesHome: Math.max(0, stats.savesHome), savesAway: Math.max(0, stats.savesAway) };
      finishRef.current({ homeScore: homeIsUser ? ownGoals.value : opponentGoals.value, awayScore: homeIsUser ? opponentGoals.value : ownGoals.value, events: [...events].sort((a,b)=>a.minute-b.minute), stats: safeStats });
      setStatus("Фінальний свисток — матч збережено!");
    }

    function addEvent(kind: MatchEvent["kind"], clubId: string, description: string, minuteValue = Math.max(1, Math.min(90, Math.floor(matchMinute)),), player?: string) {
      events.push({ minute: minuteValue, kind, clubId, description, ...(player ? { playerName: player } : {}) });
    }

    async function startScene() {
      try {
        const url = "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
        const THREE = await import(/* @vite-ignore */ url) as unknown as Record<string, any>;
        if (disposed || !hostRef.current) return;
        const host = hostRef.current;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x08151a);
        scene.fog = new THREE.Fog(0x08151a, 32, 72);
        camera = new THREE.PerspectiveCamera(62, 1, 0.1, 180);
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.className = "match3d-canvas";
        renderer.domElement.setAttribute("aria-label", "Інтерактивний тривимірний футбольний матч");
        host.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xcaf0ff, 0x173523, 2.05));
        const sun = new THREE.DirectionalLight(0xffffff, 2.35);
        sun.position.set(-8, 17, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        scene.add(sun);

        const mat = (color: number, roughness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness });
        const grassA = mat(0x17613f), grassB = mat(0x1c7047);
        const lineMat = new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
        const userShirt = mat(colorHex(userClub.colors[0]), 0.65), userShorts = mat(colorHex(userClub.colors[1]), 0.75);
        const opponentShirt = mat(colorHex(opponentClub.colors[0]), 0.65), opponentShorts = mat(colorHex(opponentClub.colors[1]), 0.75);
        const skin = mat(0xe5b18c, 0.7), keeperMat = mat(0xffad55, 0.65), black = mat(0x172229, 0.7);
        const ballMaterial = mat(0xf4f4ed, 0.35);
        const box = (w:number,h:number,d:number,m:any,x:number,y:number,z:number,parent=scene) => {
          const o = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
          o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
        };
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(34,53),grassA);
        ground.rotation.x=-Math.PI/2;ground.position.set(0,0,0);ground.receiveShadow=true;scene.add(ground);
        for(let i=0;i<11;i+=1){
          const stripe=new THREE.Mesh(new THREE.PlaneGeometry(31,53/11+0.01),i%2?grassA:grassB);
          stripe.rotation.x=-Math.PI/2;stripe.position.set(0,0.012,-24+ i*(53/11)+53/22);scene.add(stripe);
        }
        const lineX=(x1:number,x2:number,z:number,y=0.025,t=0.045)=>box(x2-x1,0.018,t,lineMat,(x1+x2)/2,y,z);
        const lineZ=(x:number,z1:number,z2:number,y=0.025,t=0.045)=>box(t,0.018,z2-z1,lineMat,x,y,(z1+z2)/2);
        lineX(-16.2,16.2,25.5);lineX(-16.2,16.2,-25.5);lineZ(-16.2,-25.5,25.5);lineZ(16.2,-25.5,25.5);
        lineX(-14.5,14.5,0);
        const centerCircle=new THREE.Mesh(new THREE.RingGeometry(2.7,2.76,64),lineMat);centerCircle.rotation.x=-Math.PI/2;centerCircle.position.set(0,.032,0);scene.add(centerCircle);
        const centerDot=new THREE.Mesh(new THREE.CircleGeometry(.08,16),lineMat);centerDot.rotation.x=-Math.PI/2;centerDot.position.set(0,.035,0);scene.add(centerDot);
        lineX(-7.7,7.7,-17.8);lineZ(-7.7,-25.5,-17.8);lineZ(7.7,-25.5,-17.8);
        lineX(-7.7,7.7,17.8);lineZ(-7.7,17.8,25.5);lineZ(7.7,17.8,25.5);
        lineX(-4,4,-22.8);lineZ(-4,-25.5,-22.8);lineZ(4,-25.5,-22.8);
        lineX(-4,4,22.8);lineZ(-4,22.8,25.5);lineZ(4,22.8,25.5);

        // A proper 3D goal: frame, side bars and visible net strands.
        box(.16,3.05,.16,lineMat,-3.55,1.52,-25.2);box(.16,3.05,.16,lineMat,3.55,1.52,-25.2);box(7.1,.16,.16,lineMat,0,3.05,-25.2);
        box(7.0,2.95,.06,mat(0xd8e8df),0,1.48,-26.6);
        for(let x=-3.3;x<=3.31;x+=.5)box(.018,2.85,1.35,lineMat,x,1.45,-25.9);
        for(let y=.25;y<2.9;y+=.46)box(7.0,.018,1.34,lineMat,0,y,-25.9);
        // Opposite goal and net so both attacks have a physical target.
        box(.16,3.05,.16,lineMat,-3.55,1.52,25.2);box(.16,3.05,.16,lineMat,3.55,1.52,25.2);box(7.1,.16,.16,lineMat,0,3.05,25.2);
        box(7.0,2.95,.06,mat(0xd8e8df),0,1.48,26.6);
        for(let x=-3.3;x<=3.31;x+=.5)box(.018,2.85,1.35,lineMat,x,1.45,25.9);
        for(let y=.25;y<2.9;y+=.46)box(7.0,.018,1.34,lineMat,0,y,25.9);
        // A 3D stadium bowl with visible seating tiers and floodlights.
        const standMat=mat(0x263541),seatA=mat(0x607482),seatB=mat(0x9ba9b3),lightMat=mat(0xe9f6ff);
        box(4.6,4.2,60,standMat,-19.2,1.8,0);box(4.6,4.2,60,standMat,19.2,1.8,0);
        box(43,4.2,4.4,standMat,0,1.8,-30.6);box(43,4.2,4.4,standMat,0,1.8,30.6);
        for(let row=0;row<7;row+=1){
          for(let seat=-10;seat<=10;seat+=1){
            const x=seat*1.72;
            box(.72,.22,.42,(row+seat)%4===0?seatB:seatA,x,.5+row*.48,-30-row*.08);
            box(.72,.22,.42,(row-seat)%4===0?seatB:seatA,x,.5+row*.48,30+row*.08);
          }
          for(let seat=0;seat<16;seat+=1){
            const z=-27+seat*3.6;
            box(.42,.22,.92,(row+seat)%5===0?seatB:seatA,-18.6-row*.25,.5+row*.48,z);
            box(.42,.22,.92,(row+seat+2)%5===0?seatB:seatA,18.6+row*.25,.5+row*.48,z);
          }
        }
        for(const x of [-22,22]){
          box(.18,13,.18,standMat,x,6.2,-29);box(1.8,.18,1.8,lightMat,x,13,-29);
          box(.18,13,.18,standMat,x,6.2,29);box(1.8,.18,1.8,lightMat,x,13,29);
        }
        const actors:(Actor & { team:"user"|"opp"; index:number })[]=[];
        const makeActor=(x:number,z:number,shirt:any,shorts:any,team:"user"|"opp",index:number,keeper=false)=>{
          const root=new THREE.Group();root.position.set(x,0,z);
          const body=new THREE.Mesh(new THREE.CylinderGeometry(.31,.38,1.06,10),shirt);body.position.y=1.15;body.castShadow=true;root.add(body);
          const head=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),skin);head.position.y=1.89;head.castShadow=true;root.add(head);
          const leg1=new THREE.Mesh(new THREE.CylinderGeometry(.105,.12,.69,8),shorts);const leg2=leg1.clone();
          leg1.position.set(-.17,.42,.01);leg2.position.set(.17,.42,.01);root.add(leg1,leg2);
          const arm1=new THREE.Mesh(new THREE.CylinderGeometry(.075,.095,.67,8),shirt);const arm2=arm1.clone();
          arm1.position.set(-.43,1.2,0);arm2.position.set(.43,1.2,0);root.add(arm1,arm2);
          if(keeper){const glove=mat(0xf7f8f3);const g1=new THREE.Mesh(new THREE.SphereGeometry(.13,8,8),glove);const g2=g1.clone();g1.position.set(-.5,1,-.02);g2.position.set(.5,1,-.02);root.add(g1,g2);}
          scene.add(root);
          const actor={root,legs:[leg1,leg2],arms:[arm1,arm2],baseX:x,baseZ:z,keeper,team,index};
          actors.push(actor);return actor;
        };
        // Full 11v11: ten outfield players and a goalkeeper on each team.
        makeActor(0,23.1,keeperMat,userShorts,"user",-1,true);
        const userFormation:[number,number][]=[[-10,12],[-3,13],[3,13],[10,12],[-8,5],[-2,6],[4,5],[9,3],[-5,-8],[5,-10]];
        userFormation.forEach(([x,z],i)=>makeActor(x,z,userShirt,userShorts,"user",i));
        makeActor(0,-23.1,keeperMat,opponentShorts,"opp",-1,true);
        const opponentFormation:[number,number][]=[[-10,-12],[-3,-13],[3,-13],[10,-12],[-8,-5],[-2,-6],[4,-5],[9,-3],[-5,8],[5,10]];
        opponentFormation.forEach(([x,z],i)=>makeActor(x,z,opponentShirt,opponentShorts,"opp",i));
        const keeper=actors.find(a=>a.team==="opp"&&a.keeper)!;
        const userKeeper=actors.find(a=>a.team==="user"&&a.keeper)!;
        const userActors=actors.filter(a=>a.team==="user"&&!a.keeper);
        const oppActors=actors.filter(a=>a.team==="opp"&&!a.keeper);
        userActors[activeIndex].root.position.set(0,0,1.25);
        const ball=new THREE.Mesh(new THREE.SphereGeometry(.23,18,14),ballMaterial);ball.castShadow=true;ball.position.set(0,.23,0);scene.add(ball);
        const spotGroup=new THREE.Group();for(let i=0;i<5;i++){const patch=new THREE.Mesh(new THREE.CircleGeometry(.065,6),black);patch.position.set(Math.cos(i*Math.PI*2/5)*.19,.035,Math.sin(i*Math.PI*2/5)*.19);patch.rotation.x=-Math.PI/2;spotGroup.add(patch);}ball.add(spotGroup);
        const aimRing=new THREE.Mesh(new THREE.RingGeometry(.28,.38,28),mat(0xc3ff6a));aimRing.rotation.x=-Math.PI/2;aimRing.position.set(0,.05,-24.8);scene.add(aimRing);
        const clock=new THREE.Clock();
        const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
        let targetX=0;
        const controlled=()=>userActors[activeIndex]??userActors[9]??userActors[0];
        const clubFor=(team:"user"|"opp")=>team==="user"?userClub:opponentClub;
        const makeEvent=(kind:MatchEvent["kind"],team:"user"|"opp",desc:string,player?:string)=>{
          addEvent(kind,clubFor(team).id,desc,undefined,player);
        };
        const launchShot=()=>{
          if(lock||ballAction||sent)return;
          if(opponentPossession){setStatus("Суперник контролює м'яч — підійди ближче й натисни R для відбору.");return;}
          kickoffMode=false;
          const actor=controlled();ownShots.value+=1;
          const dz=Math.abs(actor.root.position.z+25);
          const distancePenalty=clamp((dz-10)*.009,0,.26);
          const accuracy=clamp(.39+(finishing-55)*.009-distancePenalty+(fitness-60)*.0014,.15,.9);
          const inFrame=Math.random()<accuracy;
          const x=clamp(targetX,-4.45,4.45);
          const framed=inFrame&&Math.abs(x)<=3.35;
          const saved=framed&&Math.random()<clamp(.58-(finishing-55)*.004,.22,.68);
          keeperReactAt=timer+.3;keeperDiveX=x;
          const goal=framed&&!saved;
          if(framed)ownOnTarget.value+=1;
          const desc=goal?"ГОЛ! "+playerName+" пробив воротаря!":saved?"Воротар відбив удар "+playerName+".":"Удар "+playerName+" — повз ворота.";
          ballAction={kind:"shot",elapsed:0,duration:1.05,startX:ball.position.x,startY:Math.max(.24,ball.position.y),startZ:ball.position.z,targetX:x,targetY:saved?1.2:.55+Math.random()*2.0,targetZ:-25.4,success:goal,points:goal?1:saved?2:0,description:desc};
          makeEvent("shot","user","Удар по воротах");
          if(goal){ownGoals.value+=1;makeEvent("goal","user",desc,playerName);setHomeGoals(homeIsUser?ownGoals.value:opponentGoals.value);setAwayGoals(homeIsUser?opponentGoals.value:ownGoals.value);}
          else if(saved){makeEvent("save","user",desc);addEvent("save",opponentClub.id,"Воротар парирував удар.");}
          setStatus(goal?"ГОЛ!":saved?"Сейв воротаря":"Удар — спробуй ще раз");
          lock=true;
        };
        const launchPass=(through=false)=>{
          if(lock||ballAction||sent)return;
          if(opponentPossession){setStatus("М'яч у суперника — підійди ближче й натисни R для відбору.");return;}
          kickoffMode=false;
          const actor=controlled();
          // Mouse target selects a teammate by position; the opposition is never a receiver option.
          const options=userActors.map((a,i)=>({
            a,i,
            dist:Math.hypot(a.root.position.x-actor.root.position.x,a.root.position.z-actor.root.position.z),
            aimDist:Math.hypot(a.root.position.x-targetX,a.root.position.z-aimZ),
            forward:actor.root.position.z-a.root.position.z,
          })).filter(o=>o.i!==activeIndex&&o.dist<25);
          options.sort((a,b)=>(a.aimDist+(through&&a.forward<1?18:0))-(b.aimDist+(through&&b.forward<1?18:0)));
          const choice=through?(options.find(o=>o.forward>1&&o.dist<25)??options[0]):options[0];
          ownPasses.value+=1;
          if(!choice){makeEvent("pass","user","Немає відкритого партнера для передачі.");setStatus("Наведи мишку на партнера або вільний простір поруч.");return;}
          const midX=(actor.root.position.x+choice.a.root.position.x)/2;
          const midZ=(actor.root.position.z+choice.a.root.position.z)/2;
          const defender=[...oppActors].sort((a,b)=>Math.hypot(a.root.position.x-midX,a.root.position.z-midZ)-Math.hypot(b.root.position.x-midX,b.root.position.z-midZ))[0];
          const pressure=defender?Math.max(0,2.4-Math.hypot(defender.root.position.x-midX,defender.root.position.z-midZ)):0;
          const chance=clamp(.84+(passing-55)*.006-choice.dist*.009-pressure*.12+(fitness-55)*.001,.22,.97);
          const success=Math.random()<chance;
          if(success)ownPassesComplete.value+=1;
          const desc=success?(through?"Пас у розріз дістався партнеру!":"Передача дійшла до партнера — керування перейшло до нього."):"Захисник прочитав пас і перехопив м'яч!";
          const target=success?choice.a:defender??oppActors[0];
          ballAction={kind:"pass",elapsed:0,duration:.52,startX:ball.position.x,startY:.25,startZ:ball.position.z,targetX:target.root.position.x,targetY:.3,targetZ:target.root.position.z,success,points:success?1:0,description:desc,targetActor:success?choice.i:undefined};
          makeEvent("pass","user",desc,success?playerName:undefined);
          if(!success){opponentPossession=true;opponentHolder=target;opponentPossessionClock=0;}
          setStatus(desc);lock=true;
        };
        const onKeyDown=(e:KeyboardEvent)=>{
          const k=e.key.toLowerCase();
          if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"," ","shift"].includes(k))e.preventDefault();
          if((k===" "||k==="e"||k==="q")&&!e.repeat){
            if(k===" "){launchShot();return;}
            if(k==="e"){launchPass(false);return;}
            if(k==="q"){launchPass(true);return;}
          }
          keys.add(k);
        };
        const onKeyUp=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());
        window.addEventListener("keydown",onKeyDown);window.addEventListener("keyup",onKeyUp);
        cleanups.push(()=>window.removeEventListener("keydown",onKeyDown),()=>window.removeEventListener("keyup",onKeyUp));

        const onPointerDown=(e:PointerEvent)=>{
          const rect=renderer.domElement.getBoundingClientRect();
          pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
          raycaster.setFromCamera(pointer,camera);
          const ray=raycaster.ray;
          if(Math.abs(ray.direction.y)>.0001){
            const dist=(0-ray.origin.y)/ray.direction.y;
            if(dist>0){const p=ray.origin.clone().add(ray.direction.clone().multiplyScalar(dist));targetX=clamp(p.x,-3.35,3.35);aimRing.position.x=targetX;setStatus("Приціл змінено — Space, щоб пробити.");}
          }
        };
        renderer.domElement.addEventListener("pointerdown",onPointerDown);cleanups.push(()=>renderer.domElement.removeEventListener("pointerdown",onPointerDown));

        resizeFallback=()=>{
          if(!host.clientWidth||!host.clientHeight)return;
          renderer.setSize(host.clientWidth,host.clientHeight,false);
          camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();
        };
        if(typeof ResizeObserver!=="undefined"){observer=new ResizeObserver(()=>resizeFallback?.());observer.observe(host);}
        else{window.addEventListener("resize",resizeFallback!);cleanups.push(()=>window.removeEventListener("resize",resizeFallback!));}
        resizeFallback();
        setStarted(true);setStatus("WASD — починай атаку · E — пас · Q — пас у розріз · Space — удар");
        let walk=0;
        const animate=()=>{
          if(disposed)return;
          frame=window.requestAnimationFrame(animate);
          const dt=Math.min(clock.getDelta(),.045);
          if(!sent){
            matchMinute=Math.min(90,matchMinute+dt*.79);
            timer+=dt;
            uiAccumulator+=dt;
            if(uiAccumulator>.15){setMinute(Math.floor(matchMinute));uiAccumulator=0;}
          }
          const actor=controlled();
          const forward=Number(keys.has("w")||keys.has("arrowup"))-Number(keys.has("s")||keys.has("arrowdown"));
          const side=Number(keys.has("d")||keys.has("arrowright"))-Number(keys.has("a")||keys.has("arrowleft"));
          const length=Math.hypot(forward,side)||1;
          const moving=(forward!==0||side!==0)&&!lock&&!sent;
          if(moving){
            const sprint=keys.has("shift")?1.42:1;
            const speed=(3.4+clamp(rating,35,95)*.009)*sprint;
            actor.root.position.z=clamp(actor.root.position.z-forward/length*speed*dt,-22.4,23.5);
            actor.root.position.x=clamp(actor.root.position.x+side/length*speed*dt,-13.2,13.2);
            actor.root.rotation.y=Math.atan2(side,-forward||.001);
            walk+=dt*(keys.has("shift")?11:7);
            actor.legs[0].rotation.x=Math.sin(walk)*.43;actor.legs[1].rotation.x=-Math.sin(walk)*.43;
            actor.arms[0].rotation.x=-Math.sin(walk)*.24;actor.arms[1].rotation.x=Math.sin(walk)*.24;
          }else{actor.legs.forEach((l:any)=>l.rotation.x*=.82);actor.arms.forEach((a:any)=>a.rotation.x*=.82);}
          // AI defenders close down space while teammates drift into support positions.
          oppActors.forEach((defender,i)=>{
            const d=Math.hypot(defender.root.position.x-actor.root.position.x,defender.root.position.z-actor.root.position.z);
            if(d>2.7){defender.root.position.x+=(actor.root.position.x-defender.root.position.x)/d*dt*(.45+i%2*.1);defender.root.position.z+=(actor.root.position.z-defender.root.position.z)/d*dt*(.45+i%2*.1);}
            else if(!lock&&Math.random()<dt*.18){
              setStatus("Захисник пресингує! Зміни напрямок або віддай пас.");
            }
          });
          userActors.forEach((mate,i)=>{
            if(mate===actor)return;
            const preferredX=mate.baseX+Math.sin(matchMinute*.07+i)*1.3;
            const preferredZ=mate.baseZ-Math.min(4,matchMinute*.04);
            mate.root.position.x+=(preferredX-mate.root.position.x)*dt*.12;
            mate.root.position.z+=(preferredZ-mate.root.position.z)*dt*.12;
          });

          if(ballAction){
            ballAction.elapsed+=dt;
            const t=clamp(ballAction.elapsed/ballAction.duration,0,1);
            ball.position.set(
              ballAction.startX+(ballAction.targetX-ballAction.startX)*t,
              Math.max(.22,ballAction.startY+Math.sin(t*Math.PI)*(ballAction.kind==="shot"?4.4:.85)),
              ballAction.startZ+(ballAction.targetZ-ballAction.startZ)*t
            );
            ball.rotation.x+=dt*7;ball.rotation.z+=dt*5;
            if(t>=1){
              const action=ballAction;
              if(action.kind==="pass"&&action.success&&action.targetActor!==undefined){
                activeIndex=action.targetActor;
                action.elapsed=action.duration;
              }else if(action.kind==="shot"&&action.success){
                // Ball drops inside the net and returns to the player for the next kickoff.
              }
              if(action.kind==="shot"&&action.points===2)keeper.root.position.x=clamp(action.targetX*.8,-2.9,2.9);
              ballAction=null;lock=false;
              setPassAccuracy(ownPasses.value ? Math.round(ownPassesComplete.value/ownPasses.value*100) : null);
              if(action.kind==="shot"&&action.success){
                ball.position.set(0,.25,9);userActors[0].root.position.set(0,0,9);activeIndex=0;
                aimRing.position.x=0;aimX=0;
              }else if(action.kind==="pass"&&!action.success){
                activeIndex=0;ball.position.set(0,.25,9);userActors[0].root.position.set(0,0,9);
              }else{
                const active=controlled();ball.position.set(active.root.position.x,.24,active.root.position.z-.75);
              }
              setStatus(action.description);
            }
          }else if(!lock&&!sent){
            const active=controlled();
            ball.position.set(active.root.position.x,.23,active.root.position.z-.8);
            ball.rotation.x+=dt*(moving?7:.4);
            aimX+=(targetX-aimX)*dt*2;
          }
          keeper.root.position.x+=(clamp(aimX*.75,-2.8,2.8)-keeper.root.position.x)*dt*.8;
          const cameraOffset=new THREE.Vector3(Math.sin(cameraYaw)*10,7.5,Math.cos(cameraYaw)*11);
          const desired=controlled().root.position.clone().add(cameraOffset);
          camera.position.lerp(desired,1-Math.exp(-dt*4.3));
          camera.lookAt(controlled().root.position.x,.7,controlled().root.position.z-4.3);
          renderer.render(scene,camera);

          if(!sent&&matchMinute>=90&&!ballAction){addEvent("fulltime",userClub.id,"Фінальний свисток.");finishMatch();}
          // Lightweight AI counterattacks keep both sides on the scoreboard.
          if(!sent&&!ballAction&&matchMinute>=opponentGoalAt){
            opponentGoalAt=matchMinute+intBetween(19,34);
            if(Math.random()<.43){
              opponentGoals.value+=1;opponentShots.value+=1;opponentOnTarget.value+=1;
              addEvent("shot",opponentClub.id,"Швидка контратака суперника.");
              addEvent("goal",opponentClub.id,"Суперник завершив контратаку голом.",undefined,"Гравець суперника");
              setHomeGoals(homeIsUser?ownGoals.value:opponentGoals.value);setAwayGoals(homeIsUser?opponentGoals.value:ownGoals.value);
              setStatus("Гол суперника. Потрібно відігратися!");
            }else{
              opponentShots.value+=1;
              addEvent("shot",opponentClub.id,"Суперник пробив, але не влучив у ворота.");
            }
          }
        };
        frame=window.requestAnimationFrame(animate);
      } catch (err) {
        if (!disposed) {
          setError("Не вдалося запустити 3D. Перевір інтернет і підтримку WebGL у браузері.");
          setStatus(err instanceof Error ? err.message : "Помилка 3D-сцени");
        }
      }
    }

    void startScene();
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      cleanups.forEach(fn=>fn());
      if(renderer){renderer.dispose();renderer.domElement.remove();}
      if(scene)scene.traverse((o:any)=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach((m:any)=>m.dispose?.());else o.material?.dispose?.();});
    };
  }, [home.id, away.id, userClubId, playerName, rating, finishing, passing, dribbling, fitness]);

  function buttonKey(key: string) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  }

  return <section className="panel live-match-panel">
    <div className="live-match-head">
      <div><span className="eyebrow">LIVE · 3D MATCH ENGINE</span><h2>Матч у твоїх руках</h2><p>{userClubId===home.id?home.name:away.name} · контролюй атаку й сам вирішуй, коли пасувати або бити</p></div>
      <div className="live-match-clock"><span>{minute}'</span><small>{minute<45?"1-Й ТАЙМ":minute<90?"2-Й ТАЙМ":"FT"}</small></div>
    </div>
    <div className="live-match-score">
      <div><span className="live-club-dot" style={{background:home.colors[0]}}/><b>{home.name}</b></div>
      <strong>{homeGoals} <i>:</i> {awayGoals}</strong>
      <div><span className="live-club-dot" style={{background:away.colors[0]}}/><b>{away.name}</b></div>
    </div>
    {error&&<div className="trial3d-error">{error}</div>}
    <div className="match3d-host" ref={hostRef}>
      <div className="match3d-loading">{error||status}</div>
      <div className="match3d-status"><span className="match-live-dot"/> {status}</div>
      <div className="match3d-controls">
        <span><b>W A S D</b> рух</span><span><b>Shift</b> ривок</span><span><b>E</b> пас</span><span><b>Q</b> пас у розріз</span><span><b>Space</b> удар</span>
      </div>
      <div className="match3d-buttons">
        <button type="button" onClick={()=>buttonKey("e")}>Пас · E</button>
        <button type="button" onClick={()=>buttonKey("q")}>У розріз · Q</button>
        <button type="button" onClick={()=>buttonKey(" ")}>Удар · Space</button>
      </div>
      {!started&&<div className="match3d-intro">WASD — вперед до воріт. Підійди до штрафного, відкрий партнера або пробий сам.</div>}
    </div>
    <div className="live-match-footer"><span><b>{playerName}</b> · OVR {rating}</span><span>Влучні передачі: {passAccuracy===null?"—":passAccuracy+"%"}</span><span>{minute<90?"Матч триває": "Матч завершено"}</span></div>
    <p className="live-match-tip">Порада: підведи футболіста ближче до штрафного перед ударом. Клацни мишкою по правій/лівій частині поля для прицілювання, потім натисни Space. На кожну дію є 3D-анімація м’яча.</p>
  </section>;
}
