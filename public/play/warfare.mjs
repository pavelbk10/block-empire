// Fictional turn-based conflict. All outcomes are resolved by the authoritative game engine.
export const OPERATIONS={
 recon:{name:'שליחת מרגל',icon:'◉',cost:450,ap:2,role:'spies',base:82,heat:5,desc:'תיק מודיעין פרטי ל־3 רבעונים ובונוס 12% לפעולה הבאה נגד היעד.'},
 heist:{name:'גניבת קרדיטים',icon:'◈',cost:900,ap:2,role:'spies',base:60,heat:16,desc:'מעבירה עד 12% מהיתרה שאינה מוגנת בכספת, בכפוף לתקרת השלל.'},
 raid:{name:'פשיטה על מבנה',icon:'⚔',cost:1100,ap:2,role:'enforcers',base:65,heat:20,desc:'גורמת 22–38 נזק למבנה ומפחיתה את הכנסתו עד לתיקון.'},
 sabotage:{name:'חבלה בעסק',icon:'⚡',cost:750,ap:2,role:'enforcers',base:70,heat:14,desc:'גורמת 14–26 נזק ומאבדת עד רבע ממלאי העסק או המפעל.'}
};
const check=(v,m)=>{if(!v)throw Error(m);};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const conditionFactor=a=>.4+.6*(a.health??100)/100;
export const vaultCapacity=p=>1500+(p.vault??0)*3000;
export const protectedCash=p=>Math.min(p.cash,vaultCapacity(p));
export const repairCost=a=>Math.ceil((100-(a.health??100))*(12+(a.level??1)*3));
export function initWarfare(s){
 if(s.warfareVersion===1)return s;
 s.warfareVersion=1;s.operations=[];s.operationSerial=0;s.conflicts=[];
 for(const p of s.players)Object.assign(p,{crew:{spies:1,enforcers:1},training:0,guards:0,vault:0,reports:[],intel:[],opRound:0,shieldUntil:0,stolen:0,damageDone:0,operationsWon:0});
 for(const a of s.assets)Object.assign(a,{health:100,security:0});return s;
}
export function operationPreview(s,id,kind,asset){
 const op=Object.hasOwn(OPERATIONS,kind)?OPERATIONS[kind]:null,p=s.players[id],a=s.assets[asset],victim=s.players[a?.owner];
 if(!op||!p||!a||!victim)return{allowed:false,reason:'בחרו מבנה של מתחרה',chance:0,cost:op?.cost??0};
 const info=p.intel?.find(i=>i.target===victim.id&&i.expires>=s.round),hidden=victim.guards===undefined||a.security===undefined;
 const defense=hidden?(info?.guards??2):(victim.guards??0),security=a.security??info?.assets?.find(v=>v.id===asset)?.security??2;
 const chance=clamp(op.base+(p.crew[op.role]-1)*3+p.training*4-defense*6-security*5+(kind!=='recon'&&info?12:0),15,92);
 let reason='';
 if(victim.id===id||victim.out||!a.level)reason='בחרו מבנה פעיל של מתחרה';
 else if(p.opRound===s.round)reason='כבר נשלח מבצע ברבעון הזה';
 else if(s.operations.some(o=>o.from===id&&o.role===op.role))reason='הצוות במשימה';
 else if(kind!=='recon'&&s.round<4)reason='הגנת פתיחה: עימותים נפתחים ברבעון 4';
 else if(kind!=='recon'&&victim.shieldUntil>=s.round)reason='היעד בתקופת התאוששות עד סוף רבעון '+victim.shieldUntil;
 else if(kind!=='recon'&&s.operations.some(o=>o.to===victim.id&&o.kind!=='recon'))reason='כבר יש מבצע התקפי בדרך ליעד';
 else if((p.crew[op.role]??0)<1)reason='חסר צוות מתאים';
 return{allowed:!reason,reason,chance,cost:op.cost,estimated:hidden,damage:kind==='raid'?'22–38':kind==='sabotage'?'14–26':null,lootCap:Math.min(1800+p.crew.spies*250,Math.floor(Math.max(0,victim.cash-protectedCash(victim))*.12))};
}
function report(s,to,data){const p=s.players[to];p.reports.unshift({id:++s.operationSerial,round:s.round,...data});p.reports=p.reports.slice(0,40);}
export function warfareAction(s,id,cmd,arg,{spend,log}){
 const p=s.players[id];
 if(cmd==='recruit'){check(['spies','enforcers'].includes(arg),'סוג צוות לא תקין');check(p.crew[arg]<8,'לכל היותר 8 חברים בצוות');spend(p,650+p.crew[arg]*100);p.crew[arg]++;log(s,`${p.name} הרחיב את צוות הארגון.`,'syndicate');}
 else if(cmd==='training'||cmd==='guards'||cmd==='vault'){
 const limits={training:5,guards:5,vault:5},base={training:1100,guards:900,vault:800};check(p[cmd]<limits[cmd],'השדרוג כבר ברמה 5');spend(p,base[cmd]*(p[cmd]+1));p[cmd]++;log(s,`${p.name} שדרג ${cmd==='training'?'אימון צוותים':cmd==='guards'?'אבטחת ארגון':'כספת'} לרמה ${p[cmd]}.`,'security');
 }else if(cmd==='security'||cmd==='repair'){
 const a=s.assets[arg];check(Number.isInteger(arg)&&a?.owner===id&&a.level,'בחרו מבנה שלכם');
 if(cmd==='security'){check(a.security<5,'אבטחת הנכס ברמה המרבית');spend(p,500*(a.security+1));a.security++;log(s,`${a.street}: אבטחת נכס שודרגה לרמה ${a.security}.`,'security');}
 else{check(a.health<100,'המבנה כבר תקין');const cost=repairCost(a);spend(p,cost);a.health=100;log(s,`${a.street}: שוקם במלואו. התפוקה חזרה ל־100%.`,'repair');}
 }else if(cmd==='operation'){
 const kind=arg?.kind,asset=arg?.asset,q=operationPreview(s,id,kind,asset);check(q.allowed,q.reason);const op=OPERATIONS[kind],a=s.assets[asset];spend(p,op.cost,op.ap);p.opRound=s.round;
 s.operations.push({id:++s.operationSerial,from:id,to:a.owner,asset,kind,role:op.role,launched:s.round,due:s.round+1});
 report(s,id,{kind:'dispatch',title:op.name+' בדרך',text:`היעד: ${a.street}, ${a.city}. הכרעה בתחילת רבעון ${s.round+1}.`,asset});
 if(kind!=='recon')report(s,a.owner,{kind:'warning',title:'התרעת איום',text:`פעילות חשודה ליד ${a.street}. אפשר לשפר אבטחה בתור שלכם לפני ההכרעה.`,asset});
 log(s,`${p.name} שלח צוות למשימה. התוצאה תתברר ברבעון הבא.`,'syndicate');
 }else return false;return true;
}
export function resolveOperations(s,{random,log}){
 for(const o of [...s.operations].filter(o=>o.due<=s.round)){
 s.operations=s.operations.filter(v=>v.id!==o.id);const p=s.players[o.from],victim=s.players[o.to],a=s.assets[o.asset],op=OPERATIONS[o.kind];
 if(p.out||victim.out||a.owner!==o.to||!a.level||(o.kind!=='recon'&&victim.shieldUntil>=s.round)){
 report(s,o.from,{kind:'cancelled',title:'המבצע בוטל',text:'הבעלות או הגנת היעד השתנו. תקציב ההיערכות כבר נוצל.',asset:o.asset});continue;}
 const q=operationPreview(s,p.id,o.kind,a.id),success=random(s,1,100)<=q.chance;
 p.heat=Math.min(85,p.heat+op.heat);if(o.kind!=='recon')p.rep=Math.max(0,p.rep-3);
 let detail='האבטחה סיכלה את המבצע. אין נזק או העברת כסף.';
 if(success){p.operationsWon++;p.xp+=25;
 if(o.kind==='recon'){
 const intel={target:victim.id,round:s.round,expires:s.round+2,guards:victim.guards,vault:victim.vault,training:victim.training,crew:{...victim.crew},assets:s.assets.filter(v=>v.owner===victim.id&&v.level).map(v=>({id:v.id,security:v.security,health:v.health}))};
 p.intel=p.intel.filter(i=>i.target!==victim.id);p.intel.push(intel);detail=`מודיעין על ${victim.name}: אבטחה ${victim.guards}/5, כספת ${victim.vault}/5. בונוס סיכוי 12% למבצעים התקפיים עד סוף רבעון ${intel.expires}.`;
 }else{
 if(o.kind==='heist'){const cash=Math.min(q.lootCap,victim.cash);victim.cash-=cash;p.cash+=cash;p.stolen+=cash;detail=`${cash.toLocaleString('he-IL')} קרדיטים הועברו מהיתרה החשופה של ${victim.name}. הכספת נשארה מוגנת.`;}
 else{const damage=Math.min(a.health-25,random(s,o.kind==='raid'?22:14,o.kind==='raid'?38:26)),loss=o.kind==='sabotage'?Math.floor((a.outputStock||a.stock||0)*.25):0;a.health-=Math.max(0,damage);p.damageDone+=Math.max(0,damage);if(o.kind==='sabotage'){a.outputStock=Math.max(0,a.outputStock-loss);a.stock=Math.max(0,a.stock-loss);}detail=`${a.street}: ${Math.max(0,damage)} נזק${loss?' ואובדן '+loss+' יחידות מלאי':''}. תקינות ${a.health}/100; תפוקה ${Math.round(conditionFactor(a)*100)}%.`;}
 victim.shieldUntil=s.round+1;p.points+=20;
 }
 }else{const fine=Math.min(p.cash,250);p.cash-=fine;detail+=` הארגון שילם ${fine} קרדיטים דמי חילוץ.`;}
 report(s,p.id,{kind:success?'success':'failed',title:op.name+(success?' הצליחה':' סוכלה'),text:detail,asset:a.id});
 if(o.kind!=='recon'||!success)report(s,victim.id,{kind:success?'damage':'defended',title:op.name+(success?' נגד הארגון שלך':' נבלמה'),text:detail,asset:a.id,attacker:p.id});
 if(o.kind!=='recon'){s.conflicts.unshift({round:s.round,from:p.id,to:victim.id,asset:a.id,kind:o.kind,success});s.conflicts=s.conflicts.slice(0,40);log(s,`${op.name} של ${p.name} נגד ${victim.name}: ${success?'הצליחה':'נבלמה'}.`,'conflict');}
 }
 for(const p of s.players)p.intel=p.intel.filter(i=>i.expires>=s.round);
}
// Return only the requesting seat's reports, reconnaissance and outgoing missions.
export function redactWarfare(s,seat){
 s.operations=s.operations.filter(o=>o.from===seat);
 for(const p of s.players)if(p.id!==seat){delete p.reports;delete p.intel;delete p.crew;delete p.training;delete p.guards;delete p.vault;delete p.opRound;}
 for(const a of s.assets)if(a.owner!==seat)delete a.security;
 return s;
}
