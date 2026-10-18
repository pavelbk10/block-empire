export const ROUTE_STOPS=[
 ['שער הידע','trivia','?',450],['חצר המספרים','math','∑',500],['קפה החידות','trivia','◉',600],['תחנת החישוב','math','×',650],
 ['ספריית העיר','trivia','▤',700],['מעבדת ההיגיון','math','÷',750],['כיכר התרבות','trivia','✦',800],['תצפית המומחים','math','+',850],
 ['בית הממציאים','trivia','⚙',900],['שוק המספרים','math','∑',950],['בית ההיסטוריה','trivia','⌛',1000],['גשר האתגרים','math','×',1050],
 ['אולפן השאלות','trivia','?',1100],['מרכז החשיבה','math','÷',1150],['בית האלופים','trivia','♜',1200],['שער הבונוס','math','★',1250]
].map(([name,kind,icon,reward],id)=>({id,name,kind,icon,reward}));
export function initAdventures(s){if(s.adventureVersion===1)return s;s.adventureVersion=1;for(const p of s.players)p.adventure={position:0,movedTurn:0,visits:0,laps:0,earned:0,correct:0,seen:[],challenge:null,result:null,lastMove:null};return s;}
const check=(yes,msg)=>{if(!yes)throw Error(msg);};
export function makeMath(s,p,random){const tier=Math.min(4,1+Math.floor(p.adventure.visits/6)),kind=random(s,0,4);let a,b,value,q,explain;
 if(kind===0){a=random(s,10,25*tier);b=random(s,5,20*tier);value=a+b;q=`${a} + ${b} = ?`;explain=`${a} ועוד ${b} שווים ${value}.`;}
 else if(kind===1){a=random(s,30,50*tier);b=random(s,5,a-1);value=a-b;q=`${a} − ${b} = ?`;explain=`${a} פחות ${b} שווים ${value}.`;}
 else if(kind===2){a=random(s,3,5+tier*3);b=random(s,2,6+tier*2);value=a*b;q=`${a} × ${b} = ?`;explain=`${a} כפול ${b} שווים ${value}.`;}
 else if(kind===3){b=random(s,2,8+tier);value=random(s,3,8+tier*3);a=b*value;q=`${a} ÷ ${b} = ?`;explain=`${a} חלקי ${b} שווים ${value}.`;}
 else{b=[10,20,25,50][random(s,0,3)];a=random(s,2,12)*100;value=a*b/100;q=`כמה הם ${b}% מתוך ${a}?`;explain=`${a} כפול ${b} חלקי 100 הם ${value}.`;}
 const wrong=new Set();for(const delta of [1,-1,5,-5,10,2,-2]){const n=value+delta;if(n>=0&&n!==value)wrong.add(n);if(wrong.size===3)break;}
 return{category:'חשבון · רמה '+tier,q,options:[value,...wrong].map(String),answer:0,explain,kind:'math'};
}
export function adventureAction(s,id,cmd,arg,{random,spend,log,TRIVIA}){
 const p=s.players[id],r=p.adventure;
 if(cmd==='routeMove'){
 check(r.movedTurn!==s.turn,'אפשר לצאת למשימת צד אחת בכל תור');check(!r.challenge,'סיימו או דלגו על האתגר הפתוח');spend(p,0,1);
 const from=r.position,steps=random(s,1,3),total=from+steps,newLaps=Math.floor(total/ROUTE_STOPS.length);r.position=total%ROUTE_STOPS.length;r.visits++;r.movedTurn=s.turn;r.laps+=newLaps;r.result=null;r.lastMove={from,to:r.position,steps,turn:s.turn,lapBonus:newLaps*1000};
 if(newLaps){p.cash+=1000;r.earned+=1000;log(s,`${p.name} השלים הקפה במסלול המשימות וקיבל 1,000 קרדיטים.`,'adventure');}
 const stop=ROUTE_STOPS[r.position];let c;
 if(stop.kind==='math')c=makeMath(s,p,random);else{let pool=TRIVIA.filter(q=>!r.seen.includes(q.id));if(!pool.length){r.seen=[];pool=TRIVIA;}const q=pool[random(s,0,pool.length-1)];r.seen.push(q.id);c={category:q.category,q:q.q,options:[...q.options],answer:q.answer,explain:q.explain,kind:'trivia'};}
 const entries=c.options.map((text,index)=>({text,right:index===c.answer}));for(let i=3;i>0;i--){const j=random(s,0,i);[entries[i],entries[j]]=[entries[j],entries[i]];}
 r.challenge={...c,options:entries.map(v=>v.text),answer:entries.findIndex(v=>v.right),station:stop.id,reward:stop.reward,turn:s.turn};
 log(s,`${p.name} התקדם ${steps} תחנות אל ${stop.name}. אתגר ${stop.kind==='math'?'חשבון':'ידע'} עם בונוס ${stop.reward} קרדיטים.`,'adventure');
 }else if(cmd==='routeAnswer'){
 const c=r.challenge;check(c&&c.turn===s.turn,'אין משימת צד פתוחה בתור הזה');check(Number.isInteger(arg)&&arg>=0&&arg<4,'בחרו אחת מארבע התשובות');const correct=arg===c.answer,reward=correct?c.reward:0;
 if(correct){p.cash+=reward;p.xp+=20;p.points+=10;r.earned+=reward;r.correct++;}
 r.result={turn:s.turn,station:c.station,correct,reward,answer:c.options[c.answer],explain:c.explain};r.challenge=null;log(s,`${p.name}: ${correct?'פתר את משימת הצד וקיבל '+reward+' קרדיטים':'האתגר הסתיים ללא בונוס כספי'}.`,'adventure');
 }else if(cmd==='routeSkip'){
 check(r.challenge,'אין משימת צד פתוחה');r.result={turn:s.turn,station:r.position,correct:false,skipped:true,reward:0,explain:'אפשר לנסות משימה חדשה בתור הבא.'};r.challenge=null;
 }else return false;return true;
}
export function redactAdventures(s,seat){for(const p of s.players){if(p.id!==seat){delete p.adventure.challenge;delete p.adventure.result;delete p.adventure.seen;}else if(p.adventure.challenge){delete p.adventure.challenge.answer;delete p.adventure.challenge.explain;}}return s;}
