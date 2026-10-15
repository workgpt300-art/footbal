import type { CareerPlayer, CareerSave, Club, Fixture, LeagueDefinition, MatchEvent, MatchStats, Position, StandingRow, TrainingFocus, TransferOffer, VirtualPlayer } from "../types";

export const LEAGUES: LeagueDefinition[] = [
  { id:"england",name:"Premier League",country:"Англія",shortName:"ENG" }, { id:"spain",name:"La Liga",country:"Іспанія",shortName:"ESP" },
  { id:"italy",name:"Serie A",country:"Італія",shortName:"ITA" }, { id:"germany",name:"Bundesliga",country:"Німеччина",shortName:"GER" },
  { id:"france",name:"Ligue 1",country:"Франція",shortName:"FRA" }, { id:"portugal",name:"Primeira Liga",country:"Португалія",shortName:"POR" },
  { id:"netherlands",name:"Eredivisie",country:"Нідерланди",shortName:"NED" }, { id:"belgium",name:"Belgian Pro League",country:"Бельгія",shortName:"BEL" },
  { id:"turkey",name:"Süper Lig",country:"Туреччина",shortName:"TUR" }, { id:"scotland",name:"Scottish Premiership",country:"Шотландія",shortName:"SCO" },
  { id:"austria",name:"Austrian Bundesliga",country:"Австрія",shortName:"AUT" }, { id:"switzerland",name:"Swiss Super League",country:"Швейцарія",shortName:"SUI" },
  { id:"greece",name:"Super League Greece",country:"Греція",shortName:"GRE" }, { id:"denmark",name:"Danish Superliga",country:"Данія",shortName:"DEN" },
  { id:"norway",name:"Eliteserien",country:"Норвегія",shortName:"NOR" }, { id:"sweden",name:"Allsvenskan",country:"Швеція",shortName:"SWE" },
  { id:"poland",name:"Ekstraklasa",country:"Польща",shortName:"POL" }, { id:"czechia",name:"Czech First League",country:"Чехія",shortName:"CZE" },
  { id:"croatia",name:"HNL",country:"Хорватія",shortName:"CRO" }, { id:"ukr-premier-league",name:"Українська Прем'єр-ліга",country:"Україна",shortName:"UKR" },
];

export const CLUBS: Club[] = [
  { id:"dynamo-kyiv",name:"Динамо Київ",city:"Київ",country:"Україна",leagueId:"ukr-premier-league",strength:77,colors:["#f5f7fb","#7b98ff"],initials:"ДК" },
  { id:"shakhtar-donetsk",name:"Шахтар Донецьк",city:"Донецьк",country:"Україна",leagueId:"ukr-premier-league",strength:78,colors:["#ff762d","#161a20"],initials:"ШД" },
  { id:"polissya-zhytomyr",name:"Полісся Житомир",city:"Житомир",country:"Україна",leagueId:"ukr-premier-league",strength:70,colors:["#f2c94c","#29374c"],initials:"ПЖ" },
  { id:"karpaty-lviv",name:"Карпати Львів",city:"Львів",country:"Україна",leagueId:"ukr-premier-league",strength:66,colors:["#16a36a","#f8fbfc"],initials:"КЛ" },
  { id:"ruh-lviv",name:"Рух Львів",city:"Львів",country:"Україна",leagueId:"ukr-premier-league",strength:65,colors:["#f5c847","#202b33"],initials:"РЛ" },
  { id:"kryvbas",name:"Кривбас",city:"Кривий Ріг",country:"Україна",leagueId:"ukr-premier-league",strength:67,colors:["#d94b4b","#f7f7f7"],initials:"КР" },
  { id:"zorya",name:"Зоря Луганськ",city:"Луганськ",country:"Україна",leagueId:"ukr-premier-league",strength:64,colors:["#f0d64d","#222b34"],initials:"ЗЛ" },
  { id:"lnz",name:"ЛНЗ Черкаси",city:"Черкаси",country:"Україна",leagueId:"ukr-premier-league",strength:63,colors:["#e8f0ff","#252a36"],initials:"ЛНЗ" },
  { id:"kolos",name:"Колос Ковалівка",city:"Ковалівка",country:"Україна",leagueId:"ukr-premier-league",strength:62,colors:["#20252e","#e9edf4"],initials:"КЛС" },
  { id:"veres",name:"Верес Рівне",city:"Рівне",country:"Україна",leagueId:"ukr-premier-league",strength:60,colors:["#e94a4a","#f6f7f9"],initials:"ВР" },
  { id:"obolon",name:"Оболонь Київ",city:"Київ",country:"Україна",leagueId:"ukr-premier-league",strength:59,colors:["#f4f8fb","#3289c9"],initials:"ОБ" },
  { id:"oleksandriya",name:"Олександрія",city:"Олександрія",country:"Україна",leagueId:"ukr-premier-league",strength:64,colors:["#f4d44c","#22272e"],initials:"ОЛ" },
  { id:"epl-42",name:"Arsenal",city:"Лондон",country:"Англія",leagueId:"england",strength:88,colors:["#ef233c","#ffffff"],initials:"ARS" },
  { id:"epl-66",name:"Aston Villa",city:"Бірмінгем",country:"Англія",leagueId:"england",strength:81,colors:["#8d1b3d","#83b9e8"],initials:"AVL" },
  { id:"epl-35",name:"Bournemouth",city:"Борнмут",country:"Англія",leagueId:"england",strength:74,colors:["#c92a2a","#171717"],initials:"BOU" },
  { id:"epl-55",name:"Brentford",city:"Лондон",country:"Англія",leagueId:"england",strength:76,colors:["#e63946","#ffffff"],initials:"BRE" },
  { id:"epl-51",name:"Brighton",city:"Брайтон",country:"Англія",leagueId:"england",strength:79,colors:["#1b67b1","#ffffff"],initials:"BHA" },
  { id:"epl-44",name:"Burnley",city:"Бернлі",country:"Англія",leagueId:"england",strength:68,colors:["#6d263b","#99d6ea"],initials:"BUR" },
  { id:"epl-49",name:"Chelsea",city:"Лондон",country:"Англія",leagueId:"england",strength:83,colors:["#1768d1","#ffffff"],initials:"CHE" },
  { id:"epl-52",name:"Crystal Palace",city:"Лондон",country:"Англія",leagueId:"england",strength:76,colors:["#2452a4","#e5394f"],initials:"CRY" },
  { id:"epl-45",name:"Everton",city:"Ліверпуль",country:"Англія",leagueId:"england",strength:74,colors:["#1746a2","#ffffff"],initials:"EVE" },
  { id:"epl-36",name:"Fulham",city:"Лондон",country:"Англія",leagueId:"england",strength:75,colors:["#f5f5f5","#20252b"],initials:"FUL" },
  { id:"epl-40",name:"Liverpool",city:"Ліверпуль",country:"Англія",leagueId:"england",strength:89,colors:["#c8102e","#ffffff"],initials:"LIV" },
  { id:"epl-1359",name:"Luton Town",city:"Лутон",country:"Англія",leagueId:"england",strength:66,colors:["#f07828","#ffffff"],initials:"LUT" },
  { id:"epl-50",name:"Manchester City",city:"Манчестер",country:"Англія",leagueId:"england",strength:92,colors:["#69bdf4","#ffffff"],initials:"MCI" },
  { id:"epl-33",name:"Manchester United",city:"Манчестер",country:"Англія",leagueId:"england",strength:82,colors:["#e31b23","#f8c52b"],initials:"MUN" },
  { id:"epl-34",name:"Newcastle United",city:"Ньюкасл",country:"Англія",leagueId:"england",strength:82,colors:["#ffffff","#222222"],initials:"NEW" },
  { id:"epl-65",name:"Nottingham Forest",city:"Ноттінгем",country:"Англія",leagueId:"england",strength:72,colors:["#df2027","#ffffff"],initials:"NFO" },
  { id:"epl-62",name:"Sheffield United",city:"Шеффілд",country:"Англія",leagueId:"england",strength:65,colors:["#dc252c","#ffffff"],initials:"SHU" },
  { id:"epl-47",name:"Tottenham Hotspur",city:"Лондон",country:"Англія",leagueId:"england",strength:82,colors:["#ffffff","#14285a"],initials:"TOT" },
  { id:"epl-48",name:"West Ham United",city:"Лондон",country:"Англія",leagueId:"england",strength:77,colors:["#7a263a","#5ab3e6"],initials:"WHU" },
  { id:"epl-39",name:"Wolverhampton",city:"Вулвергемптон",country:"Англія",leagueId:"england",strength:75,colors:["#fdb913","#222222"],initials:"WOL" },
];
export const POSITIONS: {value:Position;label:string}[] = [
  {value:"GK",label:"Воротар"},{value:"CB",label:"Центральний захисник"},{value:"LB",label:"Лівий захисник"},{value:"RB",label:"Правий захисник"},
  {value:"CDM",label:"Опорний півзахисник"},{value:"CM",label:"Центральний півзахисник"},{value:"CAM",label:"Атакувальний півзахисник"},
  {value:"LW",label:"Лівий вінгер"},{value:"RW",label:"Правий вінгер"},{value:"ST",label:"Нападник"},
];
export const TRAINING: {value:TrainingFocus;label:string;detail:string;attribute:string}[] = [
  {value:"finish",label:"Завершення атак",detail:"Удари та реалізація моментів",attribute:"Завершення"},
  {value:"passing",label:"Передачі",detail:"Короткий і довгий пас",attribute:"Пас"},
  {value:"dribbling",label:"Дриблінг",detail:"Контроль м'яча й обіграш",attribute:"Дриблінг"},
  {value:"pace",label:"Швидкість",detail:"Прискорення та ривки",attribute:"Швидкість"},
  {value:"strength",label:"Фізична підготовка",detail:"Сила та витривалість",attribute:"Фізика"},
  {value:"defending",label:"Захист",detail:"Відбір і позиційна гра",attribute:"Відбір"},
  {value:"vision",label:"Бачення поля",detail:"Створення моментів і рішення",attribute:"Бачення"},
];
export const POSITION_NAME: Record<Position,string> = Object.fromEntries(POSITIONS.map((item)=>[item.value,item.label])) as Record<Position,string>;
export const getClub = (id:string) => CLUBS.find((club)=>club.id===id) ?? CLUBS[0];
function clamp(value:number,min:number,max:number):number { return Math.min(max,Math.max(min,value)); }
function seeded(seed:number):()=>number { let state=seed>>>0; return ()=>{ state=(state*1664525+1013904223)>>>0; return state/4294967296; }; }
function stringSeed(text:string):number { let hash=2166136261; for(let i=0;i<text.length;i+=1){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);} return hash>>>0; }
function addDays(date:string,count:number):string { const value=new Date(date+"T12:00:00.000Z"); value.setUTCDate(value.getUTCDate()+count); return value.toISOString().slice(0,10); }

function buildFixtures(startDate="2026-07-25"):Fixture[] {
  const byLeague=new Map<string,string[]>();
  for(const club of CLUBS){const ids=byLeague.get(club.leagueId)??[];ids.push(club.id);byLeague.set(club.leagueId,ids);}
  const fixtures:Fixture[]=[];let serial=0;
  for(const [leagueId,leagueIds] of byLeague){
    const ids=[...leagueIds].sort();const count=ids.length;
    if(count<2)continue;
    const rotation=[...ids];const firstHalf:{home:string;away:string;round:number}[]=[];
    const rounds=count-1;const half=Math.floor(count/2);
    for(let round=0;round<rounds;round+=1){
      for(let i=0;i<half;i+=1){
        const a=rotation[i],b=rotation[count-1-i];
        const home=(round+i)%2===0?a:b;const away=home===a?b:a;
        firstHalf.push({home,away,round:round+1});
      }
      const fixed=rotation[0];const tail=rotation.slice(1);tail.unshift(tail.pop()!);rotation.splice(0,rotation.length,fixed,...tail);
    }
    const addFixture=(home:string,away:string,round:number)=>{
      serial+=1;
      const winterBreak=round>rounds?14:0;
      const date=addDays(startDate,(round-1)*7+winterBreak);
      fixtures.push({id:"fixture-"+leagueId+"-"+serial,date,round,homeClubId:home,awayClubId:away,status:"scheduled",homeScore:null,awayScore:null,events:[],stats:null,seed:stringSeed(leagueId+"|"+home+"|"+away+"|"+round)});
    };
    for(const match of firstHalf)addFixture(match.home,match.away,match.round);
    for(const match of firstHalf)addFixture(match.away,match.home,match.round+rounds);
  }
  return fixtures.sort((a,b)=>a.date.localeCompare(b.date)||a.round-b.round);
}
function makeAttributes(position:Position,overall:number):Record<string,number>{
  const a:Record<string,number>={speed:overall+2,acceleration:overall+3,stamina:overall-1,strength:overall-2,finishing:overall,passing:overall-1,vision:overall-1,dribbling:overall,tackling:overall-3,positioning:overall,composure:overall-1,heading:overall-2,reaction:overall,handling:overall,reflexes:overall,kicking:overall};
  if(position==="ST"||position==="LW"||position==="RW"){a.finishing+=5;a.speed+=3;a.dribbling+=3;a.tackling-=7;}
  if(position==="CB"||position==="LB"||position==="RB"||position==="CDM"){a.tackling+=6;a.positioning+=3;a.heading+=3;a.finishing-=5;}
  if(position==="GK"){a.reflexes+=10;a.handling+=9;a.kicking+=2;a.finishing=Math.max(15,overall-30);}
  Object.keys(a).forEach((key)=>{a[key]=clamp(a[key],25,95);}); return a;
}
export function createCareer(input:{playerName:string;clubId:string;position:Position;age:number;nationality:string;preferredFoot:"Права"|"Ліва";difficulty:CareerSave["difficulty"]}):CareerSave{
  const club=getClub(input.clubId); const age=clamp(input.age,16,38); const base=clamp(57+(19-age)*1.25+(club.strength-65)*0.15,48,72); const rating=Math.round(base);
  const potential=Math.round(clamp(rating+(age<21?20:age<25?13:age<29?7:2),rating+1,92)); const today="2026-07-24";
  const player:CareerPlayer={id:"player-"+Date.now(),name:input.playerName.trim()||"Новий футболіст",age,nationality:input.nationality||"Україна",position:input.position,preferredFoot:input.preferredFoot,height:input.position==="GK"||input.position==="CB"?188:178,weight:input.position==="GK"||input.position==="CB"?80:72,number:input.position==="GK"?1:input.position==="ST"?9:27,rating,potential,fitness:94,morale:76,form:64,value:Math.round(Math.max(25000,rating*rating*(potential/65)*1100)),wage:Math.round(rating*145),attributes:makeAttributes(input.position,rating),stats:{matches:0,starts:0,goals:0,assists:0,minutes:0,yellowCards:0,averageRating:0},lastTrainingDate:null,clubId:club.id,joinedAt:today};
  const id="save-"+Date.now();
  return {id,name:input.playerName.trim()?input.playerName.trim()+" — кар'єра":"Моя кар'єра",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),date:today,season:"2026/27",player,clubId:club.id,contractStatus:"active",contractEndDate:"2027-07-24",tryoutApplications:[],activeTryout:null,contractNegotiation:null,fixtures:buildFixtures(addDays(today,1)),offers:[],seasonHistory:[],news:[{id:"news-start-"+id,date:today,category:"system",title:"Кар'єру розпочато",body:player.name+" підписав перший контракт із клубом "+club.name+". Починається сезон 2026/27 у симуляційному світі."}],trainingFocus:input.position==="ST"?"finish":"passing",difficulty:input.difficulty,lastEvent:"Перший день у клубі",isDemoWorld:true};
}
export function getVirtualSquad(clubId:string):VirtualPlayer[]{
  const club=getClub(clubId); const random=seeded(stringSeed(clubId+"-virtual-squad"));
  const positions:Position[]=["GK","GK","CB","CB","CB","LB","RB","CDM","CDM","CM","CM","CAM","LW","RW","ST","ST","CM","CB","LW","RW","ST"];
  return positions.map((position,index)=>({id:clubId+"-virtual-"+(index+1),name:"Віртуальний гравець "+String(index+1).padStart(2,"0"),position,rating:clamp(Math.round(club.strength+(random()-.5)*18+(position==="GK"?1:0)),46,84),clubId}));
}
function choose<T>(items:T[],random:()=>number):T{return items[Math.floor(random()*items.length)];}
function makeMatchStats(values:number[]):MatchStats{
  const [possessionHome,shotsHome,shotsAway,onHome,onAway,xgHome,xgAway,passesHome,passesAway,accurateHome,accurateAway,cornersHome,cornersAway,foulsHome,foulsAway,yellowsHome,yellowsAway,redsHome,redsAway,savesHome,savesAway]=values;
  return {possessionHome,possessionAway:100-possessionHome,shotsHome,shotsAway,shotsOnTargetHome:onHome,shotsOnTargetAway:onAway,xgHome:Number(xgHome.toFixed(2)),xgAway:Number(xgAway.toFixed(2)),passesHome,passesAway,passAccuracyHome:passesHome?Math.round(accurateHome/passesHome*100):0,passAccuracyAway:passesAway?Math.round(accurateAway/passesAway*100):0,cornersHome,cornersAway,foulsHome,foulsAway,yellowsHome,yellowsAway,redsHome,redsAway,savesHome,savesAway};
}
export function simulateFixture(fixture:Fixture,user:CareerSave):Fixture{
  if(fixture.status==="played")return fixture;
  const home=getClub(fixture.homeClubId);const away=getClub(fixture.awayClubId);const random=seeded(fixture.seed^stringSeed(user.id+fixture.date));
  const homeUser=user.clubId===home.id;const awayUser=user.clubId===away.id;
  const tacticsBonus=user.trainingFocus==="finish"&&["ST","LW","RW"].includes(user.player.position)?1:0;
  const homePower=home.strength+(homeUser?(user.player.rating-home.strength)*.08+tacticsBonus*.25:0);
  const awayPower=away.strength+(awayUser?(user.player.rating-away.strength)*.08+tacticsBonus*.25:0);
  let hs=0,as=0,posH=0,sh=0,sa=0,onH=0,onA=0,xgH=0,xgA=0,ph=0,pa=0,ah=0,aa=0,ch=0,ca=0,fh=0,fa=0,yh=0,ya=0,rh=0,ra=0,savesH=0,savesA=0;
  const events:MatchEvent[]=[{minute:0,kind:"kickoff",clubId:home.id,description:"Стартовий свисток. "+home.name+" — "+away.name+"."}];
  const squadHome=getVirtualSquad(home.id).filter((p)=>p.position!=="GK");const squadAway=getVirtualSquad(away.id).filter((p)=>p.position!=="GK");
  for(let minute=1;minute<=90;minute+=1){
    const homeBall=random()<clamp(.5+(homePower-awayPower)*.008,.35,.65);if(homeBall)posH+=1;
    const attack=homeBall?home:away;const defend=homeBall?away:home;const att=homeBall?homePower:awayPower;const def=homeBall?awayPower:homePower;
    const isUser=homeBall?homeUser:awayUser;const shotP=clamp(.105+(att-def)*.003+(user.difficulty==="Легенда"?-.012:user.difficulty==="Складна"?-.006:0),.055,.19);
    const count=2+Math.floor(random()*4);
    if(homeBall){ph+=count;ah+=Math.round(count*(.69+random()*.25));}else{pa+=count;aa+=Math.round(count*(.69+random()*.25));}
    if(random()<shotP){
      const quality=clamp(.055+random()*.23+(att-def)*.0015,.025,.38);const onTarget=random()<clamp(.28+quality*.75+(att-def)*.002,.25,.64);const goal=onTarget&&random()<clamp(quality*1.9+(att-def)*.002,.06,.72);
      if(homeBall){sh+=1;xgH+=quality;if(onTarget)onH+=1;}else{sa+=1;xgA+=quality;if(onTarget)onA+=1;}
      events.push({minute,kind:"shot",clubId:attack.id,description:"Удар команди "+attack.name+(onTarget?" у площину.":" повз ворота.")});
      if(goal){
        if(homeBall)hs+=1;else as+=1;
        const candidates=homeBall?squadHome:squadAway;
        const scorer=isUser&&random()<(user.player.position==="ST"?.27:["LW","RW","CAM"].includes(user.player.position)?.16:.055)?user.player.name:choose(candidates,random).name;
        events.push({minute,kind:"goal",clubId:attack.id,description:"ГОЛ! "+scorer+" забиває за "+attack.name+".",playerName:scorer});
      }else if(onTarget){if(homeBall)savesA+=1;else savesH+=1;events.push({minute,kind:"save",clubId:defend.id,description:"Воротар "+defend.name+" відбиває удар."});}
    }
    if(random()<.115){const fouled=random()<.5?home:away;if(fouled.id===home.id)fa+=1;else fh+=1;events.push({minute,kind:"foul",clubId:fouled.id,description:"Фол у центрі поля. М'яч переходить супернику."});if(random()<.18){if(fouled.id===home.id)ya+=1;else yh+=1;events.push({minute,kind:"yellow",clubId:fouled.id===home.id?away.id:home.id,description:"Жовта картка за грубий фол."});}}
    if(random()<.025){const c=random()<.5?home:away;if(c.id===home.id)ch+=1;else ca+=1;events.push({minute,kind:"corner",clubId:c.id,description:"Кутовий для "+c.name+"."});}
  }
  events.push({minute:90,kind:"fulltime",clubId:home.id,description:"Фінальний свисток. Рахунок "+hs+":"+as+"."});
  const possession=clamp(Math.round(posH/90*100),25,75);const stats=makeMatchStats([possession,sh,sa,onH,onA,xgH,xgA,ph,pa,ah,aa,ch,ca,fh,fa,yh,ya,rh,ra,savesH,savesA]);
  const involved=homeUser||awayUser;const diff=homeUser?hs-as:as-hs;const rating=involved?clamp(Math.round(6.2+random()*1.8+diff*.24+(user.player.fitness/100-.7)),4,10):null;
  return {...fixture,status:"played",homeScore:hs,awayScore:as,events:events.sort((a,b)=>a.minute-b.minute),stats,playerRating:rating};
}
function randomForEvent(seed:number):number{return seeded(seed>>>0)();}
export function advanceOneDay(save:CareerSave):CareerSave{
  const date=addDays(save.date,1);
  let next:CareerSave={...save,date,updatedAt:new Date().toISOString(),player:{...save.player,fitness:clamp(save.player.fitness+2,15,100),morale:clamp(save.player.morale+.2,30,100)},fixtures:save.fixtures.map((f)=>({...f})),news:[...save.news]};
  const today=next.fixtures.filter((f)=>f.status==="scheduled"&&f.date===date);
  if(today.length){
    for(const fixture of today){
      const played=simulateFixture(fixture,next);next.fixtures=next.fixtures.map((item)=>item.id===played.id?played:item);
      if(played.homeClubId===next.clubId||played.awayClubId===next.clubId){
        const goals=played.events.filter((e)=>e.kind==="goal"&&e.clubId===next.clubId&&e.playerName===next.player.name).length;
        const started=next.player.rating>=55&&next.player.fitness>=45;const minutes=started?(next.player.fitness>70?90:65):next.player.fitness>=30?22:0;
        const assists=played.events.filter((e)=>e.kind==="goal"&&e.clubId===next.clubId&&randomForEvent(e.minute+played.seed)<.2).length;
        const matchRating=played.playerRating??6.5;const old=next.player.stats.matches;const avg=old===0?matchRating:(next.player.stats.averageRating*old+matchRating)/(old+1);
        const playerScore=played.homeClubId===next.clubId?played.homeScore!:played.awayScore!;const otherScore=played.homeClubId===next.clubId?played.awayScore!:played.homeScore!;
        next.player={...next.player,fitness:clamp(next.player.fitness-(minutes>0?12:3),15,100),form:clamp(Math.round(next.player.form*.7+matchRating*10*.3),30,100),morale:clamp(next.player.morale+(playerScore===otherScore?1:playerScore>otherScore?4:-3),20,100),stats:{...next.player.stats,matches:next.player.stats.matches+(minutes>0?1:0),starts:next.player.stats.starts+(started&&minutes>0?1:0),goals:next.player.stats.goals+goals,assists:next.player.stats.assists+assists,minutes:next.player.stats.minutes+minutes,averageRating:Number(avg.toFixed(2))}};
        const ownClub=getClub(next.clubId);const opponent=getClub(played.homeClubId===next.clubId?played.awayClubId:played.homeClubId);
        next.lastEvent="Матч: "+ownClub.name+" "+playerScore+":"+otherScore+" "+opponent.name;
        next.news.unshift({id:"news-"+played.id,date,category:"match",title:next.lastEvent,body:played.events.filter((e)=>e.kind==="goal").map((e)=>e.minute+"' "+(e.playerName||"Гравець")).join(" · ")||"Матч завершився без голів."});
      }
    }
    next.news.unshift({id:"news-round-"+date,date,category:"match",title:"Зіграно тур "+today[0].round,body:"Симулятор обробив "+today.length+" матчів. Турнірна таблиця та статистика оновлені."});
  }
  if(next.contractStatus==="active"&&next.contractEndDate&&date>next.contractEndDate){
    next={...next,contractStatus:"free-agent",news:[{id:"contract-expired-"+date,date,category:"system",title:"Контракт завершився",body:next.player.name+" став вільним агентом після завершення контракту."},...next.news]};
  }
  if(next.fixtures.length>0&&next.fixtures.every((fixture)=>fixture.status==="played")){
    const standings=getStandings(next.fixtures,getClub(next.clubId).leagueId);
    const tablePosition=standings.findIndex((row)=>row.clubId===next.clubId)+1;
    const nextSeasonStart=addDays(date,60);
    const currentStart=Number(next.season.split("/")[0])||2026;
    const nextSeason=String(currentStart+1)+"/"+String(currentStart+2).slice(-2);
    const summary={season:next.season,clubId:next.clubId,finishedAt:date,tablePosition:tablePosition>0?tablePosition:null,careerMatches:next.player.stats.matches,careerGoals:next.player.stats.goals,careerAssists:next.player.stats.assists};
    const expired=Boolean(next.contractEndDate&&next.contractEndDate<=nextSeasonStart);
    next={...next,season:nextSeason,fixtures:buildFixtures(nextSeasonStart),seasonHistory:[...(next.seasonHistory??[]),summary],
      player:{...next.player,age:Math.min(40,next.player.age+1),morale:clamp(next.player.morale+4,20,100)},
      contractStatus:expired?"free-agent":next.contractStatus,
      activeTryout:null,contractNegotiation:null,
      news:[{id:"season-start-"+nextSeason,date,title:"Починається сезон "+nextSeason,category:"system",body:"Попередній сезон завершено"+(summary.tablePosition?" із "+summary.tablePosition+" місцем у твоїй лізі":"")+". Календар оновлено, вік футболіста збільшився на рік."},...next.news],
      lastEvent:"Починається сезон "+nextSeason};
  }
  return {...next,news:next.news.slice(0,60)};
}
export function advanceToNextMatch(save:CareerSave):CareerSave{
  const fixture=save.fixtures.find((f)=>f.status==="scheduled"&&f.date>save.date&&(f.homeClubId===save.clubId||f.awayClubId===save.clubId));
  if(!fixture)return save;let next=save;while(next.date<fixture.date)next=advanceOneDay(next);return next;
}
export function trainPlayer(save:CareerSave,focus:TrainingFocus):{save:CareerSave;message:string}{
  if(save.player.lastTrainingDate===save.date)return {save,message:"Сьогодні ти вже тренувався. Перейди до наступного дня для відновлення."};
  if(save.player.fitness<24)return {save,message:"Замало фізичної готовності. Відпочинь перед наступним тренуванням."};
  const map:Record<TrainingFocus,string>={finish:"finishing",passing:"passing",dribbling:"dribbling",pace:"speed",strength:"stamina",defending:"tackling",vision:"vision"};
  const attribute=map[focus];const current=save.player.attributes[attribute]??save.player.rating;
  if(save.player.rating>=save.player.potential&&current>=save.player.potential+5)return {save,message:"Футболіст уже близько до свого потенціалу. Спробуй інший напрям розвитку."};
  const attributes={...save.player.attributes,[attribute]:clamp(current+1,25,99)};
  const rating=clamp(save.player.rating+(save.player.rating<save.player.potential&&current>=save.player.rating-2?1:0),35,save.player.potential);
  const label=TRAINING.find((item)=>item.value===focus)?.label??focus;
  const updated:CareerSave={...save,updatedAt:new Date().toISOString(),trainingFocus:focus,player:{...save.player,attributes,rating,fitness:clamp(save.player.fitness-6,15,100),morale:clamp(save.player.morale+1,20,100),value:Math.round(Math.max(save.player.value,rating*rating*1050)),lastTrainingDate:save.date},lastEvent:"Тренування: "+label,news:[{id:"training-"+save.date+"-"+focus,date:save.date,category:"training" as const,title:"Тренування завершено",body:save.player.name+" працював над напрямом «"+label+"». Готовність: "+clamp(save.player.fitness-6,15,100)+"%."},...save.news].slice(0,60)};
  return {save:updated,message:"Тренування збережено. Прогрес залежить від потенціалу та фізичного стану."};
}
export function createTransferOffers(save:CareerSave):{save:CareerSave;message:string}{
  if(save.offers.some((offer)=>offer.status==="pending"))return {save,message:"У тебе вже є пропозиції, які очікують рішення."};
  const targets=CLUBS.filter((club)=>club.id!==save.clubId&&Math.abs(club.strength-save.player.rating)<=16).sort((a,b)=>Math.abs(a.strength-save.player.rating)-Math.abs(b.strength-save.player.rating)).slice(0,3);
  if(!targets.length)return {save,message:"Зараз немає клубів, що відповідають твоєму поточному рівню. Покращуй форму й повтори запит пізніше."};
  const offers:TransferOffer[]=targets.map((club,index)=>({id:"offer-"+Date.now()+"-"+index,clubId:club.id,createdAt:save.date,fee:Math.round(save.player.value*(.85+index*.17)),wage:Math.round(save.player.wage*(1.04+index*.12)),contractYears:3,status:"pending",type:index===2&&save.player.age<22?"loan":"transfer"}));
  return {save:{...save,offers:[...offers,...save.offers],updatedAt:new Date().toISOString(),lastEvent:"Отримано нові пропозиції клубів",news:[{id:"transfer-news-"+Date.now(),date:save.date,category:"transfer" as const,title:"Інтерес на трансферному ринку",body:"Агент повідомив про інтерес від "+targets.map((club)=>club.name).join(", ")+"."},...save.news].slice(0,60)},message:"Нові пропозиції доступні в розділі «Трансфери»."};
}
export function decideTransfer(save:CareerSave,offerId:string,accept:boolean):{save:CareerSave;message:string}{
  const offer=save.offers.find((item)=>item.id===offerId);if(!offer||offer.status!=="pending")return {save,message:"Ця пропозиція вже неактивна."};
  const target=getClub(offer.clubId);
  if(!accept){return {save:{...save,offers:save.offers.map((item)=>item.id===offerId?{...item,status:"rejected" as const}:item),updatedAt:new Date().toISOString()},message:"Пропозицію від "+target.name+" відхилено."};}
  const old=getClub(save.clubId);const offers=save.offers.map((item)=>item.id===offerId?{...item,status:"accepted" as const}:item.status==="pending"?{...item,status:"expired" as const}:item);
  const updated:CareerSave={...save,clubId:target.id,player:{...save.player,clubId:target.id,wage:offer.wage,value:Math.round(save.player.value*1.05),fitness:clamp(save.player.fitness+4,15,100)},offers,updatedAt:new Date().toISOString(),lastEvent:"Трансфер до клубу "+target.name,news:[{id:"transfer-complete-"+offer.id,date:save.date,category:"transfer" as const,title:"Новий клуб: "+target.name,body:save.player.name+" перейшов із "+old.name+" до "+target.name+". Зарплата за тиждень: "+formatMoney(offer.wage)+"."},...save.news].slice(0,60)};
  return {save:updated,message:"Трансфер завершено. Майбутні матчі й статистика кар'єри продовжуються."};
}
export function getStandings(fixtures:Fixture[],leagueId?:string):StandingRow[]{
  const rows=new Map<string,StandingRow>();for(const club of CLUBS.filter((item)=>!leagueId||item.leagueId===leagueId))rows.set(club.id,{clubId:club.id,played:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0,goalDifference:0,points:0,form:[]});
  for(const f of fixtures.filter((item)=>item.status==="played")){const h=rows.get(f.homeClubId);const a=rows.get(f.awayClubId);if(!h||!a||f.homeScore===null||f.awayScore===null)continue;h.played+=1;a.played+=1;h.goalsFor+=f.homeScore;h.goalsAgainst+=f.awayScore;a.goalsFor+=f.awayScore;a.goalsAgainst+=f.homeScore;
    if(f.homeScore>f.awayScore){h.wins+=1;a.losses+=1;h.points+=3;h.form.push("В");a.form.push("П");}else if(f.homeScore<f.awayScore){a.wins+=1;h.losses+=1;a.points+=3;a.form.push("В");h.form.push("П");}else{h.draws+=1;a.draws+=1;h.points+=1;a.points+=1;h.form.push("Н");a.form.push("Н");}}
  const result=[...rows.values()];result.forEach((row)=>{row.goalDifference=row.goalsFor-row.goalsAgainst;row.form=row.form.slice(-5);});
  return result.sort((a,b)=>b.points-a.points||b.goalDifference-a.goalDifference||b.goalsFor-a.goalsFor||getClub(a.clubId).name.localeCompare(getClub(b.clubId).name));
}
export function getUpcomingFixtures(save:CareerSave,limit=5):Fixture[]{return save.fixtures.filter((f)=>f.status==="scheduled"&&f.date>=save.date).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,limit);}
export function formatMoney(value:number):string{if(value>=1000000)return "€"+(value/1000000).toFixed(value>=10000000?0:1)+" млн";if(value>=1000)return "€"+Math.round(value/1000)+" тис.";return "€"+Math.round(value);}
export function formatDate(date:string):string{return new Intl.DateTimeFormat("uk-UA",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(date+"T12:00:00Z"));}
export function shortDate(date:string):string{return new Intl.DateTimeFormat("uk-UA",{day:"2-digit",month:"short",timeZone:"UTC"}).format(new Date(date+"T12:00:00Z"));}
export function getTrainingLabel(focus:TrainingFocus):string{return TRAINING.find((item)=>item.value===focus)?.label??"Індивідуальна підготовка";}
export function nextFixtureForPlayer(save:CareerSave):Fixture|undefined{return save.fixtures.find((f)=>f.status==="scheduled"&&f.date>=save.date&&(f.homeClubId===save.clubId||f.awayClubId===save.clubId));}