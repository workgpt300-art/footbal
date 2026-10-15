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
  actorName?: string;
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
    let userBallHolder: any = null;
    let opponentPossessionClock = 0;
    let teammatePossessionClock = 0;
    let lastTackleAt = -10;
    let halftimeLogged = false;
    let lock = false;
    let sent = false;
    let timer = 0;
    let matchMinute = 0;
    let uiAccumulator = 0;
    let walkClock = 0;
    let aimX = 0;
    let aimZ = -18;
    let aimHeight = 1.2;
    let aimedTeammateIndex: number | null = null;
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
        camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.className = "match3d-canvas";
        renderer.domElement.setAttribute("aria-label", "Інтерактивний тривимірний футбольний матч");
        renderer.domElement.tabIndex = 0;
        renderer.domElement.style.outline = "none";
        host.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xcaf0ff, 0x173523, 2.05));
        const sun = new THREE.DirectionalLight(0xffffff, 2.35);
        sun.position.set(-8, 17, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        scene.add(sun);

        const mat = (color: number, roughness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness });
        const grassA = mat(0x17613f), grassB = mat(0x1c7047);
        const lineMat = new THREE.MeshBasicMaterial({color:0xf8fff9,side:THREE.DoubleSide,toneMapped:false});
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
        const lineX=(x1:number,x2:number,z:number,y=0.045,t=0.075)=>box(x2-x1,0.025,t,lineMat,(x1+x2)/2,y,z);
        const lineZ=(x:number,z1:number,z2:number,y=0.045,t=0.075)=>box(t,0.025,z2-z1,lineMat,x,y,(z1+z2)/2);
        lineX(-16.2,16.2,25.5);lineX(-16.2,16.2,-25.5);lineZ(-16.2,-25.5,25.5);lineZ(16.2,-25.5,25.5);
        lineX(-14.5,14.5,0);
        const centerCircle=new THREE.Mesh(new THREE.RingGeometry(2.7,2.76,64),lineMat);centerCircle.rotation.x=-Math.PI/2;centerCircle.position.set(0,.032,0);scene.add(centerCircle);
        const centerDot=new THREE.Mesh(new THREE.CircleGeometry(.08,16),lineMat);centerDot.rotation.x=-Math.PI/2;centerDot.position.set(0,.035,0);scene.add(centerDot);
        lineX(-7.7,7.7,-17.8);lineZ(-7.7,-25.5,-17.8);lineZ(7.7,-25.5,-17.8);
        lineX(-7.7,7.7,17.8);lineZ(-7.7,17.8,25.5);lineZ(7.7,17.8,25.5);
        lineX(-4,4,-22.8);lineZ(-4,-25.5,-22.8);lineZ(4,-25.5,-22.8);
        lineX(-4,4,22.8);lineZ(-4,22.8,25.5);lineZ(4,22.8,25.5);
        // Penalty spots and arcs on both ends.
        for(const z of [-20.5,20.5]){
          const spot=new THREE.Mesh(new THREE.CircleGeometry(.12,20),lineMat);
          spot.rotation.x=-Math.PI/2;spot.position.set(0,.06,z);scene.add(spot);
          const arc=new THREE.Mesh(new THREE.RingGeometry(3.25,3.34,64,1,0,Math.PI),lineMat);
          arc.rotation.x=-Math.PI/2;arc.position.set(0,.055,z);scene.add(arc);
        }

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
        // Continuous coloured seating rows keep the bowl readable without hundreds of draw calls.
        for(let row=0;row<7;row+=1){
          const y=.55+row*.48;
          const seatMat=row%3===0?seatB:seatA;
          box(42,.2,.48,seatMat,0,y,-30-row*.08);
          box(42,.2,.48,seatMat,0,y,30+row*.08);
          box(.42,.2,55,seatMat,-18.5-row*.25,y,0);
          box(.42,.2,55,seatMat,18.5+row*.25,y,0);
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
        const aimRing=new THREE.Mesh(new THREE.RingGeometry(.28,.38,28),mat(0xc3ff6a));aimRing.rotation.x=-Math.PI/2;aimRing.position.set(0,.05,-18);scene.add(aimRing);
        const clock=new THREE.Clock();
        const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
        let targetX=0;
        const controlled=()=>userActors[9]??userActors[0];
        const userHasBall=()=>!opponentPossession&&!userBallHolder&&(kickoffMode||Math.hypot(ball.position.x-controlled().root.position.x,ball.position.z-controlled().root.position.z)<2.2);
        const clubFor=(team:"user"|"opp")=>team==="user"?userClub:opponentClub;
        const makeEvent=(kind:MatchEvent["kind"],team:"user"|"opp",desc:string,player?:string)=>{
          addEvent(kind,clubFor(team).id,desc,undefined,player);
        };
        const launchShot=(actorOverride?:any)=>{
          if(lock||ballAction||sent)return;
          if(opponentPossession){setStatus("Суперник контролює м'яч — підведи свого футболіста ближче й натисни R для відбору.");return;}
          const isAI=Boolean(actorOverride);
          if(!isAI&&!userHasBall()){
            setStatus(userBallHolder?"Партнер веде м'яч. Ти керуєш лише своїм футболістом — відкрийся, щоб отримати передачу.":"Підійди до м'яча, перш ніж бити.");
            return;
          }
          kickoffMode=false;
          const actor=actorOverride??controlled();
          ownShots.value+=1;
          const dz=Math.abs(actor.root.position.z+25);
          const distancePenalty=clamp((dz-10)*.008,0,.24);
          const x=clamp(isAI?(Math.random()<.5?-1:1)*(1.1+Math.random()*2.05):targetX,-4.45,4.45);
          const shotHeight=clamp(isAI ? .75+Math.random()*1.95 : aimHeight,.45,2.88);
          const accuracy=clamp(.55+(finishing-55)*.008-distancePenalty+(fitness-60)*.0015,.24,.96);
          const framed=Math.abs(x)<=3.4&&shotHeight<=3.0&&Math.random()<accuracy;
          const keeperDistance=Math.abs(x-keeper.root.position.x);
          const keeperCanReach=keeperDistance<=(2.3+Math.max(0,1.2-shotHeight)*.2);
          const cornerBonus=clamp((Math.abs(x)-1.15)*.075,0,.19);
          const heightBonus=clamp((shotHeight-1.1)*.065,0,.12);
          const saveChance=clamp((keeperCanReach ? .45 : .13)-(finishing-55)*.004-cornerBonus-heightBonus,.045,.64);
          const saved=framed&&Math.random()<saveChance;
          const goal=framed&&!saved;
          if(framed)ownOnTarget.value+=1;
          keeperReactAt=timer+.3;keeperDiveX=x;
          const scorer=actor===controlled()?playerName:"Гравець команди";
          const desc=goal?"ГОЛ! "+scorer+" пробив воротаря!":saved?"Воротар відбив удар "+scorer+".":"Удар "+scorer+" — повз ворота.";
          ballAction={kind:"shot",elapsed:0,duration:1.05,startX:ball.position.x,startY:Math.max(.24,ball.position.y),startZ:ball.position.z,targetX:x,targetY:shotHeight,targetZ:-25.4,success:goal,points:goal?1:saved?2:0,description:desc,actorName:scorer};
          makeEvent("shot","user",scorer===playerName?"Удар по воротах":"Удар команди по воротах",scorer);
          setStatus("Удар летить до воріт — голкіпер реагує із затримкою 0,3 с…");
          lock=true;
        };
        const launchPass=(through=false,actorOverride?:any)=>{
          if(lock||ballAction||sent)return;
          if(opponentPossession){setStatus("М'яч у суперника — підведи свого футболіста ближче й натисни R для відбору.");return;}
          const isAI=Boolean(actorOverride);
          if(!isAI&&!userHasBall()){
            setStatus(userBallHolder?"Партнер сам приймає рішення з м'ячем. Рухай свого футболіста, щоб відкритися для пасу.":"Підійди до м'яча перед передачею.");
            return;
          }
          const actor=actorOverride??controlled();
          kickoffMode=false;
          const aimPointX=isAI?controlled().root.position.x:targetX;
          const aimPointZ=isAI?controlled().root.position.z:aimZ;
          const options=userActors.map((a,i)=>({
            a,i,
            dist:Math.hypot(a.root.position.x-actor.root.position.x,a.root.position.z-actor.root.position.z),
            aimDist:Math.hypot(a.root.position.x-aimPointX,a.root.position.z-aimPointZ),
            forward:actor.root.position.z-a.root.position.z,
          })).filter(o=>o.i!==actor.index&&o.dist<25);
          ownPasses.value+=1;
          if(!options.length){makeEvent("pass","user","Немає відкритого партнера для передачі.");setStatus("Немає партнера для передачі.");return;}
          let choice:(typeof options)[number]|undefined;
          if(!isAI&&aimedTeammateIndex!==null)choice=options.find(o=>o.i===aimedTeammateIndex);
          if(isAI){
            const playerReceiver=options.find(o=>o.i===9);
            const forwardOptions=options.filter(o=>o.forward>1).sort((a,b)=>a.aimDist-b.aimDist);
            choice=(actor.root.position.z < -14&&forwardOptions.length&&Math.random()<.58)?forwardOptions[0]:(playerReceiver&&playerReceiver.dist<19?playerReceiver:forwardOptions[0]??options[0]);
          }else if(!choice){
            options.sort((a,b)=>(a.aimDist+(through&&a.forward<1?18:0)+a.dist*.035)-(b.aimDist+(through&&b.forward<1?18:0)+b.dist*.035));
            choice=through?(options.find(o=>o.forward>1)??options[0]):options[0];
          }
          if(!choice){setStatus("Наведи курсор на партнера своєї команди або вільну ділянку поля.");return;}
          const midX=(actor.root.position.x+choice.a.root.position.x)/2;
          const midZ=(actor.root.position.z+choice.a.root.position.z)/2;
          const defender=[...oppActors].sort((a,b)=>Math.hypot(a.root.position.x-midX,a.root.position.z-midZ)-Math.hypot(b.root.position.x-midX,b.root.position.z-midZ))[0];
          const pressure=defender?Math.max(0,2.4-Math.hypot(defender.root.position.x-midX,defender.root.position.z-midZ)):0;
          const chance=clamp(.88+(passing-55)*.006-choice.dist*.006-pressure*.13+(fitness-55)*.001,.28,.98);
          const defensiveLine=Math.min(...oppActors.map(a=>a.root.position.z));
          const offside=choice.a.root.position.z<0&&choice.a.root.position.z<actor.root.position.z-.25&&choice.a.root.position.z<defensiveLine-.25;
          const success=!offside&&Math.random()<chance;
          if(success)ownPassesComplete.value+=1;
          const desc=offside?"Поза грою! Свисток — вільний удар супернику.":success?(through?"Пас у розріз дістався партнеру!":"Передача дійшла до партнера команди."):"Захисник прочитав пас і перехопив м'яч!";
          const target=success?choice.a:defender??oppActors[0];
          ballAction={kind:"pass",elapsed:0,duration:.52,startX:ball.position.x,startY:.25,startZ:ball.position.z,targetX:target.root.position.x,targetY:.3,targetZ:target.root.position.z,success,points:success?1:0,description:desc,targetActor:success?choice.i:undefined,actorName:actor===controlled()?playerName:"Гравець команди"};
          makeEvent("pass","user",desc,isAI?undefined:playerName);
          if(offside)addEvent("foul",userClub.id,"Положення поза грою — вільний удар команді суперника.");
          if(!success){opponentPossession=true;opponentHolder=target;userBallHolder=null;opponentPossessionClock=0;}
          setStatus(desc);lock=true;
        };
        const onKeyDown=(e:KeyboardEvent)=>{
          const k=e.key.toLowerCase();
          if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"," ","shift"].includes(k))e.preventDefault();
          if((k===" "||k==="e"||k==="q"||k==="r")&&!e.repeat){
            if(k===" "){launchShot();return;}
            if(k==="e"){launchPass(false);return;}
            if(k==="q"){launchPass(true);return;}
            if(k==="r"){
              const carrier=opponentHolder??[...oppActors].sort((a,b)=>Math.hypot(a.root.position.x-controlled().root.position.x,a.root.position.z-controlled().root.position.z)-Math.hypot(b.root.position.x-controlled().root.position.x,b.root.position.z-controlled().root.position.z))[0];
              if(opponentPossession&&carrier&&Math.hypot(carrier.root.position.x-controlled().root.position.x,carrier.root.position.z-controlled().root.position.z)<2.8){
                opponentPossession=false;opponentHolder=null;userBallHolder=null;opponentPossessionClock=0;kickoffMode=false;
                ball.position.set(controlled().root.position.x,.23,controlled().root.position.z-.7);
                setStatus("Чудовий відбір! М'яч знову у твоєї команди.");
              } else setStatus("Підійди ближче до суперника та натисни R для відбору.");
              return;
            }
          }
          keys.add(k);
        };
        const onKeyUp=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());
        window.addEventListener("keydown",onKeyDown,true);window.addEventListener("keyup",onKeyUp,true);
        cleanups.push(()=>window.removeEventListener("keydown",onKeyDown,true),()=>window.removeEventListener("keyup",onKeyUp,true));

        const updateAim=(e:PointerEvent,announce=false)=>{
          const rect=renderer.domElement.getBoundingClientRect();
          pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
          aimHeight=clamp(.45+((pointer.y+1)/2)*2.4,.45,2.88);
          raycaster.setFromCamera(pointer,camera);
          const playerHits=raycaster.intersectObjects(actors.map(a=>a.root),true);
          aimedTeammateIndex=null;
          if(playerHits.length){
            let node=playerHits[0].object;
            while(node.parent&&!actors.some(a=>a.root===node))node=node.parent;
            const hitActor=actors.find(a=>a.root===node);
            if(hitActor&&hitActor.team==="user"&&!hitActor.keeper&&hitActor!==controlled())aimedTeammateIndex=hitActor.index;
          }
          const ray=raycaster.ray;
          if(Math.abs(ray.direction.y)>.0001){
            const dist=(0-ray.origin.y)/ray.direction.y;
            if(dist>0){
              const p=ray.origin.clone().add(ray.direction.clone().multiplyScalar(dist));
              targetX=clamp(p.x,-16,16);aimZ=clamp(p.z,-25,25);
              aimRing.position.set(targetX,.05,aimZ);
              if(announce)setStatus("Ціль наведено: E/Q — пас партнеру в цьому напрямку · Space — удар у ворота.");
            }
          }
        };
        const onPointerDown=(e:PointerEvent)=>{renderer.domElement.focus();updateAim(e,true);};
        const onPointerMove=(e:PointerEvent)=>{if(e.buttons===0)updateAim(e,false);};
        renderer.domElement.addEventListener("pointerdown",onPointerDown);
        renderer.domElement.addEventListener("pointermove",onPointerMove);
        cleanups.push(()=>renderer.domElement.removeEventListener("pointerdown",onPointerDown),()=>renderer.domElement.removeEventListener("pointermove",onPointerMove));

        resizeFallback=()=>{
          if(!host.clientWidth||!host.clientHeight)return;
          renderer.setSize(host.clientWidth,host.clientHeight,false);
          camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();
        };
        if(typeof ResizeObserver!=="undefined"){observer=new ResizeObserver(()=>resizeFallback?.());observer.observe(host);}
        else{window.addEventListener("resize",resizeFallback!);cleanups.push(()=>window.removeEventListener("resize",resizeFallback!));}
        resizeFallback();
        actionRef.current={
          pass:()=>launchPass(false),
          through:()=>launchPass(true),
          shoot:()=>launchShot(),
          move:(key,down)=>{if(down)keys.add(key.toLowerCase());else keys.delete(key.toLowerCase());},
          fullscreen:()=>{
            const element=host as HTMLDivElement & {webkitRequestFullscreen?:()=>Promise<void>|void};
            const doc=document as Document & {webkitExitFullscreen?:()=>Promise<void>|void};
            if(!document.fullscreenElement){if(element.requestFullscreen)void element.requestFullscreen();else void element.webkitRequestFullscreen?.();}
            else{if(document.exitFullscreen)void document.exitFullscreen();else void doc.webkitExitFullscreen?.();}
          },
        };
        setStarted(true);setStatus("Матч 11 на 11 · WASD/стрілки — рух · E — пас за прицілом · Q — розріз · Space — удар · R — відбір");
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
            if(matchMinute>=45&&!halftimeLogged){
              halftimeLogged=true;
              addEvent("halftime",userClub.id,"Перерва після першого тайму.");
              setStatus("Перерва! Рахунок зберігається — продовжуй грати в другому таймі.");
            }
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
            kickoffMode=false;
            walk+=dt*(keys.has("shift")?11:7);
            actor.legs[0].rotation.x=Math.sin(walk)*.55;actor.legs[1].rotation.x=-Math.sin(walk)*.55;
            actor.arms[0].rotation.x=-Math.sin(walk)*.3;actor.arms[1].rotation.x=Math.sin(walk)*.3;
          }else{actor.legs.forEach((l:any)=>l.rotation.x*=.82);actor.arms.forEach((a:any)=>a.rotation.x*=.82);}
          // Teammates support the attack; opposition closes passing lanes and tackles.
          oppActors.forEach((defender,i)=>{
            const carrier=userBallHolder??actor;
            const d=Math.hypot(defender.root.position.x-carrier.root.position.x,defender.root.position.z-carrier.root.position.z);
            if(opponentPossession&&opponentHolder===defender){
              const gx=clamp(defender.baseX*.45,-12,12),gz=24;
              const gd=Math.hypot(gx-defender.root.position.x,gz-defender.root.position.z)||1;
              defender.root.position.x+=(gx-defender.root.position.x)/gd*dt*2;
              defender.root.position.z+=(gz-defender.root.position.z)/gd*dt*2;
            }else{
              const px=carrier.root.position.x*.62+defender.baseX*.38;
              const pz=carrier.root.position.z*.62+defender.baseZ*.38;
              const pd=Math.hypot(px-defender.root.position.x,pz-defender.root.position.z)||1;
              if(pd>.9){defender.root.position.x+=(px-defender.root.position.x)/pd*dt*(1.45+i%3*.12);defender.root.position.z+=(pz-defender.root.position.z)/pd*dt*(1.45+i%3*.12);}
              if(!opponentPossession&&!lock&&!ballAction&&d<1.25&&timer-lastTackleAt>.65&&Math.random()<dt*.95){
                lastTackleAt=timer;opponentPossession=true;opponentHolder=defender;userBallHolder=null;opponentPossessionClock=0;kickoffMode=false;
                if(Math.random()<.12){
                  addEvent("foul",userClub.id,"Фол у боротьбі за м'яч — вільний удар супернику.");
                  if(Math.random()<.18)addEvent("yellow",userClub.id,"Жовта картка за зрив атаки.");
                  setStatus("Фол! Суддя зупинив гру; м'яч у суперника.");
                }else setStatus("Суперник відібрав м'яч! Притиснись до носія та натисни R.");
              }
            }
          });
          userActors.forEach((mate,i)=>{
            if(mate===actor||mate===userBallHolder)return;
            if(opponentPossession&&opponentHolder){
              const d=Math.hypot(mate.root.position.x-opponentHolder.root.position.x,mate.root.position.z-opponentHolder.root.position.z);
              const pressing=[...userActors].filter(p=>p!==actor).sort((a,b)=>Math.hypot(a.root.position.x-opponentHolder.root.position.x,a.root.position.z-opponentHolder.root.position.z)-Math.hypot(b.root.position.x-opponentHolder.root.position.x,b.root.position.z-opponentHolder.root.position.z)).slice(0,3).includes(mate);
              const gx=pressing?opponentHolder.root.position.x:mate.baseX;
              const gz=pressing?opponentHolder.root.position.z:mate.baseZ;
              const gd=Math.hypot(gx-mate.root.position.x,gz-mate.root.position.z)||1;
              mate.root.position.x+=(gx-mate.root.position.x)/gd*dt*(pressing?1.7:.6);
              mate.root.position.z+=(gz-mate.root.position.z)/gd*dt*(pressing?1.7:.6);
              if(pressing&&d<1.15&&!lock&&!ballAction&&timer-lastTackleAt>.65&&Math.random()<dt*.48){
                lastTackleAt=timer;opponentPossession=false;opponentHolder=null;userBallHolder=mate===controlled()?null:mate;teammatePossessionClock=0;
                ball.position.set(mate.root.position.x,.23,mate.root.position.z-.65);
                setStatus("Твій партнер виграв боротьбу й перехопив м'яч!");
              }
              return;
            }
            const supportX=clamp(mate.baseX+Math.sin(timer*1.25+i)*1.6+actor.root.position.x*.08,-13,13);
            const runZ=i>=7?-Math.min(6,Math.max(0,actor.root.position.z+5)*.24):0;
            const supportZ=clamp(mate.baseZ+Math.sin(timer*.7+i)*.55+runZ,-22,22);
            mate.root.position.x+=(supportX-mate.root.position.x)*dt*.16;
            mate.root.position.z+=(supportZ-mate.root.position.z)*dt*.16;
          });
          if(userBallHolder&&!opponentPossession&&!ballAction&&!lock&&!sent){
            teammatePossessionClock+=dt;
            const carrier=userBallHolder;
            const nearby=[...oppActors].map(d=>Math.hypot(d.root.position.x-carrier.root.position.x,d.root.position.z-carrier.root.position.z)).sort((a,b)=>a-b)[0]??99;
            carrier.root.position.z=clamp(carrier.root.position.z-dt*(nearby < 3 ? .9 : 1.65),-21.8,22.5);
            const laneX=clamp(carrier.root.position.x+Math.sin(timer*.8+carrier.index)*dt*1.4,-12.8,12.8);
            carrier.root.position.x+=(laneX-carrier.root.position.x)*dt*.8;
            carrier.root.rotation.y=Math.PI;
            if(teammatePossessionClock>(carrier.root.position.z < -15 ? 1.05 : 1.6)){
              teammatePossessionClock=0;
              if(carrier.root.position.z < -15&&Math.random()<.42)launchShot(carrier);
              else launchPass(false,carrier);
            }
          }
          // Leg and arm swings animate all 22 players, including AI runners.
          actors.forEach((a,i)=>{
            if(a!==actor){const phase=timer*5.5+i*.8;a.legs[0].rotation.x=Math.sin(phase)*.13;a.legs[1].rotation.x=-Math.sin(phase)*.13;a.arms[0].rotation.x=-Math.sin(phase)*.08;a.arms[1].rotation.x=Math.sin(phase)*.08;}
          });

          if(ballAction){
            ballAction.elapsed+=dt;
            const t=clamp(ballAction.elapsed/ballAction.duration,0,1);
            ball.position.set(
              ballAction.startX+(ballAction.targetX-ballAction.startX)*t,
              Math.max(.22,ballAction.startY+Math.sin(t*Math.PI)*(ballAction.kind==="shot"?clamp(ballAction.targetY+.2,.8,2.75):.85)),
              ballAction.startZ+(ballAction.targetZ-ballAction.startZ)*t
            );
            ball.rotation.x+=dt*7;ball.rotation.z+=dt*5;
            if(t>=1){
              const action=ballAction;
              if(action.kind==="pass"&&action.success&&action.targetActor!==undefined){
                const receiver=userActors[action.targetActor];
                userBallHolder=receiver===controlled()?null:receiver;
                teammatePossessionClock=0;kickoffMode=false;opponentPossession=false;opponentHolder=null;
              }
              if(action.kind==="shot"&&action.points===2){
                keeper.root.position.x=clamp(action.targetX*.8,-3.15,3.15);
                makeEvent("save","user","Воротар відбив удар.");
                addEvent("save",opponentClub.id,"Воротар парирував удар.");
                userBallHolder=null;
                opponentPossession=true;opponentHolder=oppActors[0];opponentPossessionClock=0;
              }
              if(action.kind==="shot"&&!action.success&&action.points!==2){
                // A missed effort gives the opposition a goal-kick/restart rather than teleporting possession back.
                userBallHolder=null;opponentPossession=true;opponentHolder=oppActors[0];opponentPossessionClock=0;
              }
              if(action.kind==="shot"&&action.success){
                ownGoals.value+=1;
                makeEvent("goal","user",action.description,action.actorName??"Гравець команди");
                setHomeGoals(homeIsUser?ownGoals.value:opponentGoals.value);setAwayGoals(homeIsUser?opponentGoals.value:ownGoals.value);
                userBallHolder=null;
              }
              keeperReactAt=Number.POSITIVE_INFINITY;
              ballAction=null;lock=false;
              setPassAccuracy(ownPasses.value ? Math.round(ownPassesComplete.value/ownPasses.value*100) : null);
              if(action.kind==="shot"&&action.success){
                ball.position.set(0,.23,0);userActors[9].root.position.set(0,0,1.25);activeIndex=9;kickoffMode=true;
                userBallHolder=null;opponentPossession=false;opponentHolder=null;teammatePossessionClock=0;
                targetX=0;aimX=0;aimZ=-18;aimRing.position.set(0,.05,-18);
              }else if(action.kind==="pass"&&!action.success){
                opponentPossession=true;userBallHolder=null;
                if(!opponentHolder)opponentHolder=oppActors[0];
                opponentPossessionClock=0;ball.position.set(opponentHolder.root.position.x,.23,opponentHolder.root.position.z+.65);
              }else if(opponentPossession&&opponentHolder){
                ball.position.set(opponentHolder.root.position.x,.23,opponentHolder.root.position.z+.65);
              }else if(userBallHolder){
                ball.position.set(userBallHolder.root.position.x,.24,userBallHolder.root.position.z-.72);
              }else{
                const active=controlled();ball.position.set(active.root.position.x,.24,active.root.position.z-.75);
              }
              setStatus(action.description);
            }
          }else if(!lock&&!sent){
            const active=controlled();
            if(kickoffMode)ball.position.set(0,.23,0);
            else if(opponentPossession&&opponentHolder)ball.position.set(opponentHolder.root.position.x,.23,opponentHolder.root.position.z+.65);
            else if(userBallHolder)ball.position.set(userBallHolder.root.position.x,.23,userBallHolder.root.position.z-.72);
            else ball.position.set(active.root.position.x,.23,active.root.position.z-.8);
            ball.rotation.x+=dt*(moving?7:.4);
          }
          // Keeper starts reacting only after a readable 300ms delay, not by following the cursor.
          if(timer>=keeperReactAt){
            const diveDirection=Math.sign(keeperDiveX-keeper.root.position.x);
            keeper.root.position.x+=(clamp(keeperDiveX,-3.15,3.15)-keeper.root.position.x)*Math.min(1,dt*4.2);
            keeper.root.rotation.z+=(diveDirection*.34-keeper.root.rotation.z)*Math.min(1,dt*3.5);
            keeper.arms[0].rotation.z+=(diveDirection*.8-keeper.arms[0].rotation.z)*Math.min(1,dt*5);
            keeper.arms[1].rotation.z+=(diveDirection*.8-keeper.arms[1].rotation.z)*Math.min(1,dt*5);
          }else{
            keeper.root.position.x+=(0-keeper.root.position.x)*dt*.22;
            keeper.root.rotation.z+=(0-keeper.root.rotation.z)*dt*3;
            keeper.arms.forEach((arm:any)=>{arm.rotation.z*=.88;});
          }
          userKeeper.root.position.x+=(clamp((opponentHolder?.root.position.x??0)*.18,-2.5,2.5)-userKeeper.root.position.x)*dt*.7;
          const cameraOffset=new THREE.Vector3(Math.sin(cameraYaw)*17,17.5,Math.cos(cameraYaw)*25);
          const desired=controlled().root.position.clone().add(cameraOffset);
          camera.position.lerp(desired,1-Math.exp(-dt*2.6));
          camera.lookAt(controlled().root.position.x,.7,controlled().root.position.z-7.5);
          renderer.render(scene,camera);

          if(!sent&&matchMinute>=90&&!ballAction){addEvent("fulltime",userClub.id,"Фінальний свисток.");finishMatch();}
          // Opponent attacks are resolved from actual possession and player movement.
          if(opponentPossession&&!ballAction&&!sent){
            opponentPossessionClock+=dt;
            if(opponentPossessionClock>2.8){
              opponentPossessionClock=0;opponentShots.value+=1;opponentOnTarget.value+=1;
              const scores=Math.random()<clamp(.24+(opponentClub.strength-userClub.strength)*.008,.12,.48);
              addEvent("shot",opponentClub.id,"Суперник завершив атаку ударом.");
              if(scores){
                opponentGoals.value+=1;addEvent("goal",opponentClub.id,"Гол суперника після швидкої атаки.",undefined,"Гравець суперника");
                setHomeGoals(homeIsUser?ownGoals.value:opponentGoals.value);setAwayGoals(homeIsUser?opponentGoals.value:ownGoals.value);
                setStatus("Гол суперника. Розіграш відновиться з центру поля.");
                opponentPossession=false;opponentHolder=null;kickoffMode=true;ball.position.set(0,.23,0);userActors[9].root.position.set(0,0,1.25);activeIndex=9;
              }else{
                addEvent("save",userClub.id,"Твій воротар відбив удар.");
                setStatus("Воротар врятував команду — м'яч знову у тебе.");
                opponentPossession=false;opponentHolder=null;kickoffMode=false;ball.position.set(controlled().root.position.x,.23,controlled().root.position.z-.65);
              }
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
      actionRef.current={pass:()=>{},through:()=>{},shoot:()=>{},move:()=>{},fullscreen:()=>{}};
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      cleanups.forEach(fn=>fn());
      if(renderer){renderer.dispose();renderer.domElement.remove();}
      if(scene)scene.traverse((o:any)=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach((m:any)=>m.dispose?.());else o.material?.dispose?.();});
    };
  }, [home.id, away.id, userClubId, playerName, rating, finishing, passing, dribbling, fitness]);

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
        <span><b>W A S D / стрілки</b> рух свого гравця</span><span><b>Shift</b> ривок</span><span><b>E</b> пас за курсором</span><span><b>Q</b> пас у розріз</span><span><b>Space</b> удар</span><span><b>R</b> відбір</span>
      </div>
      <div className="match3d-buttons">
        <button type="button" onClick={()=>actionRef.current.pass()}>Пас · E</button>
        <button type="button" onClick={()=>actionRef.current.through()}>У розріз · Q</button>
        <button type="button" onClick={()=>actionRef.current.shoot()}>Удар · Space</button>
        <button type="button" onClick={()=>actionRef.current.fullscreen()}>⛶ Повний екран</button>
      </div>
      <div className="match3d-touch-pad" aria-label="Сенсорне керування">
        <button type="button" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);actionRef.current.move("w",true)}} onPointerUp={()=>actionRef.current.move("w",false)} onPointerCancel={()=>actionRef.current.move("w",false)}>▲</button>
        <div><button type="button" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);actionRef.current.move("a",true)}} onPointerUp={()=>actionRef.current.move("a",false)} onPointerCancel={()=>actionRef.current.move("a",false)}>◀</button><button type="button" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);actionRef.current.move("s",true)}} onPointerUp={()=>actionRef.current.move("s",false)} onPointerCancel={()=>actionRef.current.move("s",false)}>▼</button><button type="button" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);actionRef.current.move("d",true)}} onPointerUp={()=>actionRef.current.move("d",false)} onPointerCancel={()=>actionRef.current.move("d",false)}>▶</button></div>
      </div>
      {!started&&<div className="match3d-intro">Матч 11 на 11 на стадіоні. Ти керуєш лише створеним футболістом — партнери та суперники діють самостійно. Наведи курсор саме на партнера для точної передачі. Голкіпер починає реакцію через 0,3 секунди, а результат удару фіксується після анімації польоту м'яча.</div>}
    </div>
    <div className="live-match-footer"><span><b>{playerName}</b> · OVR {rating}</span><span>Влучні передачі: {passAccuracy===null?"—":passAccuracy+"%"}</span><span>{minute<90?"Матч триває": "Матч завершено"}</span></div>
    <p className="live-match-tip">Порада: підведи футболіста ближче до штрафного перед ударом. Клацни мишкою по правій/лівій частині поля для прицілювання, потім натисни Space. На кожну дію є 3D-анімація м’яча.</p>
  </section>;
}
