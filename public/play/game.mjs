import {initExchange,exchangeAction,advanceExchange,investmentValue,liquidateInvestments,botInvestment} from './exchange.mjs?v=13';
import {initCityMissions,cityMissionBoard,rewardCityMissions,applyCityMissionSteps} from './city-missions.mjs';
export {CITY_MISSIONS,cityMissionBoard} from './city-missions.mjs';
import {initAdventures,adventureAction} from './adventures.mjs?v=10';
import {seasonOptions,extendSeason} from './seasons.mjs?v=10';
import {EXTRA_TRIVIA} from './trivia-extra.mjs?v=9';
import {initWarfare,conditionFactor,warfareAction,resolveOperations,operationPreview} from './warfare.mjs?v=8';
export const COLORS=['#66e6b5','#ba9bff','#ffbe73','#70c8f3'];
export const GOAL=12000,MAX_ROUNDS=80;
export const DISTRICTS=[
 {id:0,name:'רובע החוף',city:'נתניה',special:'home',color:'#70c8f3',streets:['הרצל','סמילנסקי','דיזנגוף','אוסישקין','גורדון','ביאליק','ויצמן','מקדונלד']},
 {id:1,name:'רובע היזמות',city:'תל אביב',special:'office',color:'#ba9bff',streets:['רוטשילד','אחד העם','נחלת בנימין','אלנבי','לילינבלום','מונטיפיורי','שינקין','החשמונאים']},
 {id:2,name:'הרובע הירוק',city:'רעננה',special:'home',color:'#66e6b5',streets:['אחוזה','ויצמן','בורוכוב','בן גוריון','קרן היסוד','הרצל','הנשיאים','ברנר']},
 {id:3,name:'רובע המסחר',city:'ירושלים',special:'shop',color:'#ffd18e',streets:['יפו','הנביאים','בצלאל','אגריפס','בן יהודה','הלל','שמאי','המלך ג׳ורג׳']},
 {id:4,name:'רובע התעשייה',city:'חיפה',special:'factory',color:'#87a6b2',streets:['העצמאות','הנמל','דרך יפו','בן גוריון','הנביאים','שדרות המגינים','החלוץ','הרצל']},
 {id:5,name:'רובע הפנאי',city:'אילת',special:'hotel',color:'#f49c83',streets:['שדרות התמרים','דרך הערבה','קאמפן','דרך הים','לוס אנג׳לס','שדרות ששת הימים','הברוש','דרך המלונות']}
];
// Twelve districts, twelve distinct numbered parcels per district.
DISTRICTS.push(...[
 ['רובע החדשנות','באר שבע','office','#d2b8e9',['רגר','העצמאות','החלוץ','ההסתדרות','הנרייטה סולד','שז״ר']],
 ['רובע המשפחות','ראשון לציון','home','#a9ca9a',['רוטשילד','הרצל','ז׳בוטינסקי','ירושלים','עין הקורא','הכרמל']],
 ['רובע הנמל','אשדוד','factory','#8ebfd2',['העצמאות','הרצל','רוגוזין','הציונות','הנביאים','שבי ציון']],
 ['רובע השוק','פתח תקווה','shop','#e5bc7e',['חיים עוזר','חובבי ציון','בר כוכבא','מוהליבר','פינסקר','רוטשילד']],
 ['רובע הגנים','כפר סבא','home','#94b99a',['ויצמן','רוטשילד','ירושלים','טשרניחובסקי','בן גוריון','הכרמל']],
 ['רובע התיירות','טבריה','hotel','#e6a6a0',['הגליל','הירדן','הבנים','הגדוד העברי','אלחדיף','טבור הארץ']]
].map(([name,city,special,color,streets],i)=>({id:i+6,name,city,special,color,streets})));
for(const d of DISTRICTS)d.streets=Array.from({length:12},(_,n)=>d.streets[n%d.streets.length]+' '+(n<d.streets.length?'12':'24'));
export const MATERIALS={cement:{name:'מלט',price:65},steel:{name:'פלדה',price:110},wood:{name:'עץ',price:45},glass:{name:'זכוכית',price:85},brick:{name:'לבנים',price:35}};
export const VEHICLES={car:{name:'רכב משלוחים',price:1700,income:125,upkeep:25,capacity:8,icon:'🚚'},taxi:{name:'מונית',price:2600,income:230,upkeep:60,capacity:12,icon:'🚕'},bus:{name:'אוטובוס',price:5400,income:480,upkeep:130,capacity:30,icon:'🚌'},train:{name:'רכבת שכונתית',price:9500,income:850,upkeep:210,capacity:55,icon:'🚆'}};
export const DEVELOPMENT=[0,1,1.6,2.4,3.5,5];
export const materialsFor=(a,type=a.type)=>BUILDINGS[type]?.produces?{cement:0,steel:0,wood:0,glass:0,brick:0}:{cement:2+a.level,steel:1+Math.floor(a.level/2),wood:2,glass:Math.max(0,a.level-1),brick:1+Math.floor(a.level/2)};
export const BUILDINGS={
 home:{name:'בית מגורים',cost:1100,income:190,energy:1,unlock:1,icon:'⌂',color:'#e7d8b6',need:'housing',stages:['בית בסיסי','בית משופץ','בית משפחתי','וילת יוקרה','אחוזה מפוארת']},
 shop:{name:'מכולת שכונתית',cost:1500,income:280,energy:1,unlock:1,icon:'🛒',color:'#efb980',retail:true,need:'food'},
 supermarket:{name:'סופרמרקט',cost:2600,income:460,energy:2,unlock:1,icon:'🏪',color:'#98caa5',retail:true,need:'food',demand:1.5},
 cafe:{name:'בית קפה',cost:1600,income:300,energy:1,unlock:1,icon:'☕',color:'#c7a77f',retail:true,need:'food'},
 restaurant:{name:'מסעדה',cost:2300,income:410,energy:2,unlock:1,icon:'🍽',color:'#e8ad89',retail:true,need:'food',demand:1.25},
 bakery:{name:'מאפייה',cost:1700,income:310,energy:1,unlock:1,icon:'🥐',color:'#e4c17f',retail:true,need:'food'},
 pharmacy:{name:'בית מרקחת',cost:2100,income:350,energy:1,unlock:1,icon:'✚',color:'#9accc3',retail:true,need:'health'},
 clinic:{name:'מרפאה',cost:2800,income:390,energy:2,unlock:1,icon:'🏥',color:'#b9dcd8',need:'health'},
 gym:{name:'חדר כושר',cost:2400,income:380,energy:2,unlock:1,icon:'🏋',color:'#b8abc8',need:'leisure'},
 daycare:{name:'גן ילדים',cost:2000,income:320,energy:1,unlock:1,icon:'🧸',color:'#e5cb8d',need:'education'},
 laundry:{name:'מכבסה',cost:1800,income:300,energy:2,unlock:1,icon:'◉',color:'#abc6d9',need:'daily'},
 hardware:{name:'חנות כלי עבודה',cost:1900,income:330,energy:1,unlock:1,icon:'🔧',color:'#c8b69c',retail:true,need:'repair'},
 garage:{name:'מוסך',cost:2500,income:410,energy:2,unlock:1,icon:'🚘',color:'#a2b2bc',need:'repair'},
 horsefarm:{name:'חוות סוסים ורכיבה',cost:3200,income:440,energy:1,unlock:1,icon:'🐎',color:'#b8c394',need:'leisure',stages:['אורווה קטנה','מועדון רכיבה','מרכז סוסים','חוות אירוח','אקדמיית רכיבה']},
 bitcoinfarm:{name:'חוות ביטקוין מדומה',cost:3800,income:200,energy:4,unlock:1,icon:'₿',color:'#9eb4c2',need:'tech',stages:['שרת כרייה','חדר שרתים','מרכז כרייה','קמפוס כרייה','חוות ענן']},
 station:{name:'תחנת רכבת',cost:4200,income:540,energy:3,unlock:1,icon:'🚉',color:'#9dbcc0',need:'transport',stages:['תחנה מקומית','תחנה משופרת','מרכז תחבורה','מסוף אזורי','מרכז מטרופוליני']},
 office:{name:'מגדל משרדים',cost:2300,income:420,energy:2,unlock:2,icon:'▥',color:'#93bbce',need:'jobs'},
 hotel:{name:'מלון בוטיק',cost:2900,income:510,energy:2,unlock:3,icon:'♜',color:'#c6acd9',need:'tourism'},
 factory:{name:'מפעל חכם',cost:1900,income:365,energy:2,unlock:2,icon:'⚙',color:'#93a5ad',need:'jobs'}
};
Object.assign(BUILDINGS,{
 cementworks:{name:'מפעל מלט',cost:1700,income:185,energy:1,unlock:1,icon:'▤',color:'#b5b7ab',need:'industry',produces:'cement',yield:12},
 sawmill:{name:'מפעל עץ',cost:1500,income:160,energy:1,unlock:1,icon:'🪵',color:'#bca780',need:'industry',produces:'wood',yield:14},
 glassworks:{name:'מפעל זכוכית',cost:2100,income:205,energy:2,unlock:1,icon:'◇',color:'#8bcbd1',need:'industry',produces:'glass',yield:10},
 steelworks:{name:'מפעל פלדה',cost:2400,income:230,energy:2,unlock:1,icon:'⚒',color:'#9faebd',need:'industry',produces:'steel',yield:8},
 brickworks:{name:'מפעל לבנים',cost:1400,income:155,energy:1,unlock:1,icon:'▦',color:'#d49e81',need:'industry',produces:'brick',yield:16},
 airport:{name:'שדה תעופה',cost:7200,income:690,energy:3,unlock:1,icon:'✈',color:'#a5c6d2',need:'tourism',stages:['שדה מקומי','טרמינל משופר','שדה אזורי','נמל בינלאומי','מרכז תעופה עולמי']}
});
export const VACATIONS={weekend:{name:'סוף שבוע',factor:1,wellness:20,duration:2},resort:{name:'חופשה מפנקת',factor:2,wellness:35,duration:3},luxury:{name:'חופשת יוקרה',factor:4,wellness:50,duration:4}};
export const baseFare=kind=>({car:25,taxi:60,bus:20,train:45})[kind];
export const factoryType=kind=>Object.keys(BUILDINGS).find(k=>BUILDINGS[k].produces===kind);
export function factoryOutput(s,a){const b=BUILDINGS[a.type];return a.owner!==null&&a.level&&b?.produces?Math.max(0,Math.min(500-(a.outputStock??0),Math.floor(b.yield*DEVELOPMENT[a.level]*conditionFactor(a)*(energy(s,a.owner).shortage?.5:1)))):0;}
export const productionUnitCost=a=>Math.max(1,Math.round((MATERIALS[BUILDINGS[a.type]?.produces]?.price??0)*.12));
export function vacationPrice(s,id,a,kind){const pack=VACATIONS[kind];return pack?Math.round((a.flightPrice??350)*pack.factor*(a.owner===id?.3:1)):Infinity;}
function initBusiness(a,type){const b=BUILDINGS[type];if(b.retail)a.stock=40;if(b.produces){a.outputStock=b.yield;a.materialPrice=MATERIALS[b.produces].price;}if(type==='airport')a.flightPrice=350;}
export const stageName=(type,lv)=>lv?BUILDINGS[type]?.stages?.[lv-1]??['עסק התחלתי','עסק משופר','עסק מתקדם','עסק פרימיום','עסק דגל'][lv-1]:'קרקע לפיתוח';
export const isRetail=a=>!!BUILDINGS[a.type]?.retail;
export const PROJECTS={park:{name:'גן ציבורי',cost:1200,icon:'🌳',happiness:4},solar:{name:'אנרגיה סולארית',cost:1500,icon:'☀',happiness:0},transit:{name:'תחבורה מקומית',cost:1800,icon:'⇄',happiness:2},playground:{name:'גן שעשועים',cost:1300,icon:'🛝',happiness:3},paths:{name:'שבילי הליכה ואופניים',cost:1100,icon:'🚲',happiness:3},community:{name:'מרכז קהילתי',cost:1900,icon:'♧',happiness:4},school:{name:'בית ספר',cost:2700,icon:'🎓',happiness:4}};
export function wellbeing(s,d){const services=new Set(s.assets.filter(a=>a.district===d&&a.level&&a.owner!==null&&a.type!=='home').map(a=>BUILDINGS[a.type].need)),infrastructure=s.players.flatMap(p=>p.projects).filter(q=>q.district===d).reduce((n,q)=>n+(PROJECTS[q.kind]?.happiness??0)*(q.level??1),0),transport=s.players.flatMap(p=>p.fleet).filter(v=>v.district===d).length;return Math.min(100,40+services.size*4+Math.min(35,infrastructure)+Math.min(9,transport*3));}
export function customerDemand(s,a){if(!isRetail(a)||!a.level||a.owner===null)return 0;const p=s.players[a.owner],homes=s.assets.filter(b=>b.district===a.district&&b.type==='home').reduce((n,b)=>n+b.level,0),traffic=p.fleet.filter(v=>v.district===a.district).reduce((n,v)=>n+VEHICLES[v.kind].capacity*(1+(v.level-1)*.2),0),station=s.assets.some(b=>b.owner===a.owner&&b.type==='station'&&b.district===a.district&&b.level);return Math.max(0,Math.floor(conditionFactor(a)*((8+5*DEVELOPMENT[a.level])*(BUILDINGS[a.type].demand??1)+homes*2+traffic*(station?1.2:1))*(1+(wellbeing(s,a.district)-40)*.004)*(a.marketing>=s.round?1.4:1)*(1-(a.salePrice-55)/200)));}
export function salesForecast(s,a){return Math.min(a.stock??0,customerDemand(s,a));}
export function miningOutput(s,id){const p=s.players[id];return energy(s,id).shortage?0:p.rigs*(3+p.skills.tech)+s.assets.filter(a=>a.owner===id&&a.type==='bitcoinfarm'&&a.level).reduce((n,a)=>n+Math.floor(4*DEVELOPMENT[a.level]*(1+p.skills.tech*.2)*conditionFactor(a)),0);}
// Quote the entire supply chain without changing cash or inventory.
export function materialPlan(s,id,a,type=a.type){const p=s.players[id],requirements=materialsFor(a,type),items=[];let cost=0;for(const[k,required]of Object.entries(requirements)){if(!required)continue;const fromInventory=Math.min(required,p.materials[k]??0);let remaining=required-fromInventory;const factories=s.assets.filter(f=>f.owner!==null&&f.level&&BUILDINGS[f.type]?.produces===k&&(f.outputStock??0)>0&&!s.players[f.owner].out).sort((x,y)=>(x.owner===id?0:1)-(y.owner===id?0:1)||x.materialPrice-y.materialPrice||x.id-y.id),orders=[],fallbackPrice=Math.round(MATERIALS[k].price*1.2);for(const f of factories){if(!remaining)break;const unitPrice=f.owner===id?0:f.materialPrice;if(!Number.isSafeInteger(unitPrice)||unitPrice<0||unitPrice>fallbackPrice)continue;const quantity=Math.min(remaining,f.outputStock),total=quantity*unitPrice;orders.push({asset:f.id,owner:f.owner,quantity,unitPrice,total});remaining-=quantity;cost+=total;}const wholesale=remaining;cost+=wholesale*fallbackPrice;items.push({kind:k,required,fromInventory,orders,wholesale,fallbackPrice});}return{cost,items};}
export function developmentCost(s,id,a,type=a.type){return buildingCost(a,type,s.players[id].skills.planning)+materialPlan(s,id,a,type).cost;}
export function businessCost(s,id,asset,type){const a=s.assets[asset];return a?(a.owner===null?a.price:0)+Math.round(350*(s.players[id].skills.planning>=2?.85:1))+developmentCost(s,id,a,type):Infinity;}
function applyMaterialPlan(s,id,a,plan){const p=s.players[id];for(const item of plan.items){p.materials[item.kind]=(p.materials[item.kind]??0)-item.fromInventory;for(const order of item.orders){const f=s.assets[order.asset];f.outputStock-=order.quantity;if(order.owner!==id){const seller=s.players[order.owner];seller.cash+=order.total;seller.tradeEarned+=order.total;f.factorySales+=order.quantity;f.factoryRevenue+=order.total;log(s,`${p.name}: אספקה אוטומטית מ${seller.name} · ${order.quantity} יחידות ${MATERIALS[item.kind].name}, ${order.total} קרדיטים.`,'industry');}}}a.lastSupply={turn:s.turn,cost:plan.cost,items:plan.items};}
function checkQuotedPrice(actual,maximum){if(maximum!==undefined){ensure(Number.isSafeInteger(maximum)&&maximum>=0,'מחיר עסקה לא תקין');ensure(actual<=maximum,'מחיר האספקה השתנה. בדקו את המחיר המעודכן ונסו שוב.');}}
function upgradeV4(s){if(s.version>=4)return s;for(const p of s.players){p.quizSteps??=0;for(const v of p.fleet)v.level=Math.min(5,(v.level??0)+1);for(const q of p.projects)q.level??=1;}for(const a of s.assets){if(a.construction){a.level=Math.min(5,a.level+1);if(a.owner!==null){s.players[a.owner].xp+=35;s.players[a.owner].points+=35+a.level*10;}}delete a.construction;}if(s.quiz)Object.assign(s.quiz,{index:0,total:3,correctCount:0,earnedSteps:0,results:[]});s.version=4;log(s,'העיר שודרגה: פיתוח מיידי ברמות 1–5, עסקים חדשים ושאלוני ידע עם צעדי בונוס.','system');return s;}
export function upgradeGame(s){initWarfare(s);initAdventures(s);initExchange(s);if(s.version>=5){initCityMissions(s);return s;}upgradeV4(s);for(const p of s.players){p.materials.glass??=4;p.materials.brick??=8;p.supplier=null;p.wellness??=50;p.vacationUntil??=0;p.vacationReady??=0;p.rideTurn??=0;p.tradeEarned??=0;p.fareEarned??=0;p.flightEarned??=0;p.location??=0;for(const v of p.fleet)v.fare??=baseFare(v.kind);}for(const a of s.assets){a.outputStock??=0;a.materialPrice??=0;a.factorySales??=0;a.factoryRevenue??=0;a.flightPrice??=350;}s.version=5;initCityMissions(s);log(s,'כלכלה חדשה: ייצור חומרים במפעלים, מסחר בין שחקנים, נסיעות בתשלום וחופשות.','system');return s;}
export const SKILLS={planning:{name:'תכנון עירוני',desc:'רמה 1: היתר מהיר; רמה 2: אגרות 15%−; רמה 3: בנייה 10%−',icon:'▧'},finance:{name:'ניהול פיננסי',desc:'מפחית מס וריבית על הלוואות',icon:'◒'},tech:{name:'טכנולוגיה',desc:'מוסיף תפוקת כרייה וקיבולת אנרגיה',icon:'◈'}};
export const EVENTS=[{id:'stable',name:'שוק מאוזן',desc:'רבעון של צמיחה יציבה.',mult:1},{id:'housing',name:'גל ביקוש לדיור',desc:'הכנסת בתי מגורים עולה ב־30% ברבעון הזה.',kind:'home',mult:1.3},{id:'tourism',name:'עונת התיירות',desc:'הכנסת מלונות עולה ב־35% ברבעון הזה.',kind:'hotel',mult:1.35},{id:'slow',name:'האטה במשק',desc:'הכנסות הנכסים יורדות ב־15% ברבעון הזה.',mult:.85},{id:'innovation',name:'גל השקעות טכנולוגיה',desc:'הכנסת משרדים עולה ב־30% ברבעון הזה.',kind:'office',mult:1.3},{id:'power',name:'עומס ברשת החשמל',desc:'קיבולת האנרגיה יורדת ב־2 ברבעון הזה.',mult:1},{id:'festival',name:'פסטיבל עירוני',desc:'הכנסת עסקים מקומיים עולה ב־30% ברבעון הזה.',kind:'shop',mult:1.3}];
export const TRIVIA=[
 ['חשיבה','מחיר עלה מ־100 ל־120. בכמה אחוזים עלה?',['20%','10%','25%','12%'],0,'ההפרש 20 מתוך מחיר התחלתי 100 הוא 20%.'],
 ['עסקים','איזה נתון מתאר כסף שנכנס ויוצא בפועל?',['תזרים מזומנים','לוגו','נתח שוק','מיקום העסק'],0,'תזרים מתאר את תנועות המזומנים בתקופה.'],
 ['מדע','איזו יחידה מודדת הספק?',['ואט','מטר','ליטר','קילוגרם'],0,'ואט הוא יחידת הספק; אנרגיה לאורך זמן.'],
 ['ישראל','באיזו עיר נמצאים הגנים הבהאיים שעל הכרמל?',['חיפה','אילת','נתניה','באר שבע'],0,'הגנים שעל הכרמל נמצאים בחיפה.'],
 ['טכנולוגיה','מה פירוש ראשי התיבות CPU?',['יחידת עיבוד מרכזית','יחידת קירור ציבורית','מטבע דיגיטלי','מסך מחשב'],0,'Central Processing Unit היא יחידת העיבוד המרכזית.'],
 ['חשיבה','מהו השטח של מלבן באורך 8 וברוחב 5?',['40','26','13','80'],0,'שטח מלבן הוא אורך כפול רוחב: 8 × 5 = 40.'],
 ['עולם','איזה אוקיינוס הוא הגדול בעולם?',['השקט','האטלנטי','ההודי','הארקטי'],0,'האוקיינוס השקט הוא הגדול בשטחו.'],
 ['עסקים','הכנסה 1,000 והוצאות 700. מה הרווח?',['300','700','1,700','30'],0,'רווח בחישוב הזה הוא הכנסה פחות הוצאות.'],
 ['מדע','איזה כוכב לכת מכונה כוכב הלכת האדום?',['מאדים','נוגה','צדק','שבתאי'],0,'מאדים נראה אדמדם בשל תחמוצות הברזל שעל פניו.'],
 ['חשיבה','מהו הממוצע של 10, 20 ו־30?',['20','15','25','60'],0,'סכום 60 מחולק בשלושה מספרים נותן 20.'],
 ['ישראל','איזו עיר ישראלית שוכנת לחוף ים סוף?',['אילת','אשדוד','חיפה','נתניה'],0,'אילת שוכנת במפרץ אילת, בקצה הצפוני של ים סוף.'],
 ['טכנולוגיה','מה תפקידו העיקרי של נתב רשת?',['להעביר נתונים בין רשתות','להגדיל את המסך','להדפיס מסמכים','לקרר את המעבד'],0,'נתב מכוון מנות נתונים בין רשתות.'],
 ['מדע','מהי הנוסחה הכימית של מים?',['H₂O','CO₂','O₂','NaCl'],0,'מולקולת מים מכילה שני אטומי מימן ואטום חמצן.'],
 ['חשיבה','אחרי הנחה של 25% על 200, כמה משלמים?',['150','175','125','50'],0,'ההנחה היא 50; המחיר לאחריה 150.'],
 ['עסקים','איזה מהם הוא נכס מוחשי?',['בניין','מוניטין','סימן מסחר','זכות יוצרים'],0,'בניין הוא נכס פיזי שניתן לגעת בו.'],
 ['עולם','באיזו יבשת נמצאת ברזיל?',['דרום אמריקה','אירופה','אסיה','אפריקה'],0,'ברזיל נמצאת בדרום אמריקה.'],
 ['מדע','איזה גז קולט הצמח בתהליך הפוטוסינתזה?',['פחמן דו־חמצני','הליום','ניאון','ארגון'],0,'בפוטוסינתזה נקלט פחמן דו־חמצני ונפלט חמצן.'],
 ['חשיבה','כמה דקות יש ב־2.5 שעות?',['150','125','120','250'],0,'2.5 כפול 60 נותן 150 דקות.'],
 ['עסקים','מהי נקודת איזון בחישוב רווח?',['הכנסות שוות להוצאות','כל המלאי נמכר','מספר עובדים כפול','אין מתחרים'],0,'בנקודת האיזון אין רווח או הפסד לפי העלויות שנכללו בחישוב.'],
 ['טכנולוגיה','איזו אפשרות היא אמצעי אחסון?',['SSD','HDMI','מאוורר','מקלדת'],0,'SSD שומר נתונים בזיכרון שאינו נדיף.'],
 ['חשיבה','מה ההסתברות לקבל 6 בקובייה הוגנת אחת?',['1 מתוך 6','1 מתוך 2','1 מתוך 3','1 מתוך 12'],0,'לקובייה שש תוצאות שוות הסתברות ורק אחת היא 6.'],
 ['עולם','מהי בירת יפן?',['טוקיו','קיוטו','אוסקה','סיאול'],0,'טוקיו היא בירת יפן.'],
 ['מדע','איזה מקור אנרגיה מתחדש?',['אור השמש','פחם','נפט','גז טבעי'],0,'אנרגיית השמש מתחדשת בקנה המידה האנושי.'],
 ['חשיבה','מהו החציון של 2, 4, 9, 15, 20?',['9','10','4','15'],0,'בסדרה מסודרת של חמישה מספרים החציון הוא המספר השלישי.'],
 ['עסקים','הכנסה 2,000 ורווח 500. מה שיעור הרווח מההכנסה?',['25%','50%','20%','40%'],0,'500 חלקי 2,000 הוא רבע, כלומר 25%.'],
 ['ישראל','איזה ים נמצא ממערב למישור החוף בישראל?',['הים התיכון','ים סוף','הים הכספי','הים השחור'],0,'מישור החוף הישראלי גובל בים התיכון במערב.'],
 ['טכנולוגיה','מהי מטרתה של סיסמה חד־פעמית באימות?',['להוסיף בדיקת זהות','להאיץ הורדה','לצבוע את המסך','להגדיל שטח אחסון'],0,'קוד חד־פעמי משמש לאימות גישה, לעיתים כשלב נוסף.'],
 ['חשיבה','מהו האיבר הבא בסדרה 3, 6, 12, 24?',['48','30','36','42'],0,'כל איבר מוכפל בשניים.'],
 ['מדע','מה קורה למים טהורים בקירור לנקודת הקיפאון בלחץ רגיל?',['הם קופאים','הם בוערים','הם הופכים למתכת','הם נעלמים'],0,'מים טהורים קופאים סביב 0 מעלות צלזיוס בלחץ אטמוספרי רגיל.'],
 ['עסקים','למה מתייחס המושג פיזור השקעות?',['חלוקה בין כמה השקעות','קנייה של נכס יחיד','הוצאה מיידית של כל המזומן','הגדלת חוב בלבד'],0,'פיזור פירושו חלוקה בין השקעות שונות; הוא אינו מבטיח רווח.'],
 ['חשיבה','ארבע מכונות מייצרות 3 מטבעות כל אחת. כמה ייצרו?',['12','7','9','16'],0,'4 × 3 = 12.'],
 ['מדע','איזה כוח מושך עצמים לכיוון מרכז כדור הארץ?',['כבידה','חיכוך','מגנטיות בלבד','עילוי'],0,'כוח הכבידה גורם למשיכה בין מסות.'],
 ...EXTRA_TRIVIA
].map(([category,q,options,answer,explain],id)=>({id,category,q,options,answer,explain}));
export const MISSIONS=[
 {id:'first',name:'חתימה ראשונה',desc:'רכישת המגרש הראשון',cash:400,points:80},
 {id:'builder',name:'לבנים ראשונות',desc:'בניית שני מבנים',cash:700,points:100},
 {id:'business',name:'רוח יזמית',desc:'הקמת שני עסקים שאינם בתי מגורים',cash:700,points:110},
 {id:'neighborhood',name:'בונים קהילה',desc:'הכרזה על שכונה ראשונה',cash:1000,points:140},
 {id:'trivia',name:'ידע הוא כוח',desc:'שלוש תשובות טריוויה נכונות',cash:500,points:100},
 {id:'green',name:'חושבים קדימה',desc:'הקמת תשתית ראשונה',cash:500,points:80},
 {id:'miner',name:'העתיד הדיגיטלי',desc:'כריית 15 מטבעות BE',cash:400,points:70}
];
export const level=p=>1+Math.floor(p.xp/120);
export function random(s,min,max){s.seed^=s.seed<<13;s.seed^=s.seed>>>17;s.seed^=s.seed<<5;s.seed>>>=0;return min+Math.floor((s.seed/4294967296)*(max-min+1));}
export function createGame(name='פבל',difficulty='smart',seed=Date.now(),options={}){
 const s={version:5,...seasonOptions(options),seed:(seed>>>0)||123,round:1,turn:1,active:0,phase:'action',difficulty,rate:35,winner:null,auction:null,quiz:null,quizResult:null,dice:[1,1],event:0,logs:[],offers:[],vehicleSerial:0,offerSerial:0,
 players:[name,'מאיה ונטורס','איתן גרופ','נועה קפיטל'].map((name,id)=>({id,name:String(name).slice(0,24),cash:18000,xp:40,points:0,avatar:1,rigs:0,coins:0,mined:0,rep:55,heat:0,ap:5,loan:0,bot:id!==0,out:false,color:COLORS[id],skills:{planning:0,finance:0,tech:0},neighborhoods:{},projects:[],missions:[],triviaRight:0,streak:0,quizTurn:0,seen:[],surveyTurn:0,auctionTurn:0,lastIncome:0,permitVoucher:0,history:[],quizSteps:0,wellness:50,vacationUntil:0,vacationReady:0,rideTurn:0,tradeEarned:0,fareEarned:0,flightEarned:0,location:0,materials:{cement:8,steel:5,wood:8,glass:4,brick:8},fleet:[],supplier:null})),
 assets:DISTRICTS.flatMap((d)=>d.streets.map((street,n)=>({id:d.id*12+n,district:d.id,street,city:d.city,x:(d.id%3)*5+(n%4),y:Math.floor(d.id/3)*5+Math.floor(n/4),price:850+d.id*160+(n%4)*130,owner:null,type:'land',level:0,permit:'none',due:0,manager:false,green:false,marketing:0,stock:0,salePrice:55,totalCustomers:0,lastCustomers:0,outputStock:0,materialPrice:0,factorySales:0,factoryRevenue:0,flightPrice:350}))) };
 log(s,'עיר חדשה, חוקים חדשים. בחרו מגרש, תכננו, קבלו היתר ובנו.','system');initWarfare(s);initAdventures(s);initExchange(s);initCityMissions(s);return s;
}
function ensure(ok,msg){if(!ok)throw Error(msg);}
export function log(s,text,type='system'){s.logs.unshift({text,type,turn:s.turn,quarter:s.round});s.logs=s.logs.slice(0,60);}
export function buildingCost(a,type=a.type,planning=0){const b=BUILDINGS[type];return b?Math.round(b.cost*(1+a.level*.55)*(planning>=3?.9:1)):0;}
export function worth(s,id){const p=s.players[id];return p.cash+investmentValue(s,id)+s.offers.filter(o=>o.from===id).reduce((n,o)=>n+o.price,0)-p.loan+p.coins*s.rate+p.rigs*700+s.assets.filter(a=>a.owner===id).reduce((v,a)=>v+a.price+(BUILDINGS[a.type]?.cost??0)*a.level*.65+(a.manager?350:0)+(a.green?350:0),0)+p.fleet.reduce((v,f)=>v+VEHICLES[f.kind].price*.65,0)+Object.entries(p.materials).reduce((v,[k,n])=>v+MATERIALS[k].price*n,0)+p.projects.reduce((v,r)=>v+PROJECTS[r.kind].cost*.6,0);}
export function score(s,id){const p=s.players[id];return Math.floor(p.points+Math.max(0,worth(s,id))/90+p.rep*2+Object.values(p.neighborhoods).reduce((a,b)=>a+b,0)*80);}
export function energy(s,id){const p=s.players[id],supply=5+p.skills.tech*2+p.projects.filter(x=>x.kind==='solar').reduce((n,q)=>n+6*(q.level??1),0)-(EVENTS[s.event].id==='power'?2:0),demand=p.rigs*2+s.assets.filter(a=>a.owner===id).reduce((v,a)=>v+Math.max(0,(BUILDINGS[a.type]?.energy??0)*a.level-(a.green?1:0)),0);return{ supply,demand,shortage:demand>supply };}
export function assetIncome(s,a){if(a.owner===null||!a.level)return 0;const p=s.players[a.owner],b=BUILDINGS[a.type],district=DISTRICTS[a.district];let factor=1+(district.special===a.type?.25:0)+(a.manager?.2:0)+(a.marketing>=s.round?.4:0)+(p.neighborhoods[a.district]??0)*.12+p.projects.filter(q=>q.district===a.district&&q.kind==='transit').reduce((n,q)=>n+.10*(q.level??1),0);factor*=1+(wellbeing(s,a.district)-40)*.005;factor*=1+((p.wellness??50)-50)*.002+(p.vacationUntil>=s.round?.1:0);if(a.type==='horsefarm')factor*=1+(s.players.flatMap(p=>p.projects).filter(q=>q.district===a.district&&q.kind==='park').length?.15:0);const ev=EVENTS[s.event];if(!ev.kind||ev.kind===a.type)factor*=ev.mult;factor*=conditionFactor(a);return isRetail(a)?Math.floor(salesForecast(s,a)*a.salePrice*factor/conditionFactor(a)):Math.floor(b.income*DEVELOPMENT[a.level]*factor);}
export function forecast(s,id){const p=s.players[id],assets=s.assets.filter(a=>a.owner===id),e=energy(s,id);let gross=assets.reduce((v,a)=>v+assetIncome(s,a),0)+p.fleet.reduce((n,v)=>n+VEHICLES[v.kind].income*(1+(v.level-1)*.25),0);if(e.shortage)gross=Math.floor(gross*.65);const tax=Math.floor(gross*Math.max(.02,.08-p.skills.finance*.015)),upkeep=(p.crew?((p.crew.spies+p.crew.enforcers-2)*30+(p.guards??0)*40):(p.organizationUpkeep??0))+assets.reduce((v,a)=>v+12+25*a.level+factoryOutput(s,a)*productionUnitCost(a),0)+p.rigs*25+p.fleet.reduce((n,v)=>n+VEHICLES[v.kind].upkeep,0),interest=Math.ceil(p.loan*Math.max(.01,.03-p.skills.finance*.005));return{gross,tax,upkeep,interest,net:gross-tax-upkeep-interest+300,...e};}
export function missionReady(s,id,m){const p=s.players[id],aa=s.assets.filter(a=>a.owner===id);return({first:aa.length>=1,builder:aa.filter(a=>a.level).length>=2,business:aa.filter(a=>a.level&&a.type!=='home').length>=2,neighborhood:Object.keys(p.neighborhoods).length>0,trivia:p.triviaRight>=3,green:p.projects.length>0,miner:p.mined>=15})[m];}
function missions(s,id){const p=s.players[id];for(const m of MISSIONS)if(!p.missions.includes(m.id)&&missionReady(s,id,m.id)){p.missions.push(m.id);p.cash+=m.cash;p.points+=m.points;log(s,`${p.name}: המשימה ״${m.name}״ הושלמה · ${m.cash}+ קרדיטים, ${m.points}+ יוקרה.`,'mission');}}
function checkWinner(s){if(s.phase==='finished')return;const alive=s.players.filter(p=>!p.out),best=[...alive].sort((a,b)=>score(s,b.id)-score(s,a.id))[0];if(alive.length<=1||((s.goal??GOAL)>0&&alive.some(p=>score(s,p.id)>=(s.goal??GOAL)))||((s.maxRounds??MAX_ROUNDS)>0&&s.round>(s.maxRounds??MAX_ROUNDS))){s.winner=best?.id??null;s.phase='finished';s.quiz=null;log(s,`מועצת העיר הכריזה: ${best?.name??'אין שחקן'} מוביל את העיר!`,'win');}}
function spend(p,cost,ap=1){ensure(p.ap>=ap,'אין מספיק נקודות פעולה בתור הזה');ensure(p.cash>=cost,'אין מספיק קרדיטים');p.cash-=cost;p.ap-=ap;}
function requireAsset(s,id,n){ensure(Number.isInteger(n)&&s.assets[n],'בחרו מגרש תקין');const a=s.assets[n];ensure(a.owner===id,'המגרש אינו בבעלותכם');return a;}
function release(a){Object.assign(a,{health:100,security:0,owner:null,type:'land',level:0,permit:'none',due:0,manager:false,green:false,marketing:0,stock:0,salePrice:55,totalCustomers:0,lastCustomers:0,outputStock:0,materialPrice:0,factorySales:0,factoryRevenue:0,flightPrice:350});}
function charge(s,id,amount){const p=s.players[id];p.cash-=amount;if(p.cash<0)liquidateInvestments(s,id,{log});while(p.cash<0){const a=s.assets.filter(a=>a.owner===id).sort((a,b)=>b.price-a.price)[0];if(!a)break;const cash=Math.floor((a.price+(BUILDINGS[a.type]?.cost??0)*a.level*.65)*.55);p.cash+=cash;log(s,`${p.name}: ${a.street} מומש אוטומטית ב־${cash} לכיסוי התחייבויות.`,'risk');release(a);}if(p.cash<0){p.cash=0;p.out=true;p.rigs=0;p.coins=0;p.projects=[];p.neighborhoods={};p.fleet=[];p.materials={cement:0,steel:0,wood:0,glass:0,brick:0};log(s,`${p.name} יצא מהתחרות עקב חדלות פירעון.`,'risk');}}
function endQuarter(s){
 for(const p of s.players)if(!p.out){
 for(const a of s.assets.filter(a=>a.owner===p.id&&isRetail(a))){a.lastCustomers=salesForecast(s,a);a.totalCustomers+=a.lastCustomers;}
 const f=forecast(s,p.id);p.lastIncome=f.net;p.history??=[];p.history.push({q:s.round,net:f.net});if(f.net>=0)p.cash+=f.net;else charge(s,p.id,-f.net);if(p.out)continue;for(const a of s.assets.filter(a=>a.owner===p.id&&isRetail(a))){a.stock-=a.lastCustomers;if(a.lastCustomers)log(s,`${a.street}: ${a.lastCustomers} לקוחות קנו בחנות. נותר מלאי ${a.stock}.`,'business');}
 for(const a of s.assets.filter(a=>a.owner===p.id&&BUILDINGS[a.type]?.produces)){const n=factoryOutput(s,a);a.outputStock+=n;if(n)log(s,`${a.street}: המפעל ייצר ${n} יחידות ${MATERIALS[BUILDINGS[a.type].produces].name}. מלאי למכירה: ${a.outputStock}.`,'industry');}
 const mined=miningOutput(s,p.id);if(mined){p.coins+=mined;p.mined+=mined;}

 if(p.heat>0){if(random(s,1,100)<=p.heat){const fine=900+p.heat*18;charge(s,p.id,fine);p.rep=Math.max(0,p.rep-12);p.points=Math.max(0,p.points-60);for(const a of s.assets)if(a.owner===p.id&&a.permit==='approved')a.permit='none';log(s,`${p.name}: ביקורת עירונית חשפה אי־סדרים. קנס ${fine}, פגיעה במוניטין וביטול היתרים לא מנוצלים.`,'risk');}p.heat=Math.max(0,p.heat-8);}
 missions(s,p.id);
 }
 for(const p of s.players)p.wellness=Math.max(50,(p.wellness??50)-5);
 s.round++;resolveOperations(s,{random,log});for(const o of [...s.offers])if(o.expires<=s.round||s.assets[o.asset].owner!==o.to||s.players[o.from].out){s.players[o.from].cash+=o.price;s.offers.splice(s.offers.indexOf(o),1);}
 s.event=random(s,0,EVENTS.length-1);s.rate=Math.max(15,Math.min(70,s.rate+random(s,-7,7)));advanceExchange(s,{log});
 for(const a of s.assets)if(a.permit==='pending'&&a.due<=s.round){a.permit='approved';log(s,`הוועדה אישרה היתר: ${a.street}, ${a.city}.`,'permit');}
 initCityMissions(s);
 log(s,`רבעון ${s.round}: ${EVENTS[s.event].name} · ${EVENTS[s.event].desc}`,'event');checkWinner(s);
}
function next(s){s.players[s.active].adventure.challenge=null;s.quiz=null;s.quizResult=null;checkWinner(s);if(s.phase==='finished')return;const old=s.active;do{s.active=(s.active+1)%4;}while(s.players[s.active].out);if(s.active<=old)endQuarter(s);if(s.phase==='finished')return;s.turn++;const p=s.players[s.active];p.ap=5+(p.avatar>=3?1:0);applyCityMissionSteps(p);p.supplier=null;p.xp+=10;s.phase='action';}
export function settleAuction(s,now=Date.now()){if(s.phase!=='auction'||!s.auction||now<s.auction.endsAt)return false;const t=s.auction,a=s.assets[t.asset];if(t.bidder!==null&&!s.players[t.bidder].out&&s.players[t.bidder].cash>=t.bid){s.players[t.bidder].cash-=t.bid;s.players[t.bidder].points+=25;s.players[t.bidder].xp+=30;if(t.seller!==null)s.players[t.seller].cash+=t.bid;a.owner=t.bidder;for(const o of [...s.offers])if(o.asset===a.id){s.players[o.from].cash+=o.price;s.offers.splice(s.offers.indexOf(o),1);}a.permit='none';a.due=0;log(s,`${s.players[t.bidder].name} זכה ב${a.street} ב־${t.bid.toLocaleString()} קרדיטים.`,'auction');missions(s,t.bidder);}else log(s,'המכרז נסגר ללא הצעות.','auction');s.auction=null;s.phase='action';checkWinner(s);return true;}
function question(s,p,exclude=[]){let pool=TRIVIA.filter(q=>!p.seen.includes(q.id)&&!exclude.includes(q.id));if(!pool.length){p.seen=[];pool=TRIVIA.filter(q=>!exclude.includes(q.id));}const q=pool[random(s,0,pool.length-1)],order=[0,1,2,3];for(let i=3;i>0;i--){const j=random(s,0,i);[order[i],order[j]]=[order[j],order[i]];}return {id:q.id,order};}
function openQuiz(s,p){ensure(p.quizTurn!==s.turn,'שאלון הידע כבר נוצל בתור הזה');ensure(!s.quiz,'כבר יש שאלון פתוח');s.quiz={player:p.id,...question(s,p),index:0,total:3,correctCount:0,earnedSteps:0,results:[]};p.quizTurn=s.turn;s.quizResult=null;}
export function action(s,id,cmd,arg=null,now=Date.now()){
 upgradeGame(s);if(cmd==='extendSeason'){ensure(id===0,'רק מארח המשחק יכול להאריך את העונה');return extendSeason(s,arg,{score,log});}ensure(s.players[id]&&!s.players[id].out,'השחקן אינו פעיל');ensure(s.phase!=='finished','העונה הסתיימה');const p=s.players[id];
 if(cmd==='bid'){const t=s.auction;ensure(s.phase==='auction'&&t&&now<t.endsAt,'אין מכרז פתוח');ensure(t.seller!==id&&t.bidder!==id,'אי אפשר להציע על נכס שלכם או להעלות להצעה שלכם');const min=t.bidder===null?t.minimum:t.bid+100;ensure(Number.isSafeInteger(arg)&&arg>=min&&arg<=p.cash,'בדקו מחיר מינימום ויתרה');t.bid=arg;t.bidder=id;t.endsAt=Math.max(t.endsAt,now+5000);log(s,`${p.name} הציע ${arg.toLocaleString()} קרדיטים.`,'auction');return s;}
 ensure(s.active===id,'זה לא התור שלכם');ensure(s.phase==='action','מסיימים קודם את המכרז');
 ensure(!p.adventure.challenge||['routeAnswer','routeSkip','end'].includes(cmd),'סיימו או דלגו על משימת הצד הפתוחה');
 if(cmd==='quiz'){openQuiz(s,p);return s;}
 if(cmd==='answer'){ensure(s.quiz?.player===id,'אין שאלה פתוחה');ensure(Number.isInteger(arg)&&arg>=0&&arg<4,'בחרו תשובה');const quiz=s.quiz,q=TRIVIA[quiz.id],correct=quiz.order[arg]===q.answer;p.seen.push(q.id);if(correct){p.cash+=350;p.xp+=40;p.points+=30;p.triviaRight++;p.streak++;p.ap++;p.quizSteps++;quiz.correctCount++;quiz.earnedSteps++;}else p.streak=0;quiz.results.push({id:q.id,correct,answer:q.options[q.answer],explain:q.explain});quiz.index++;const complete=quiz.index>=quiz.total;if(complete&&quiz.correctCount===quiz.total){p.ap+=2;p.quizSteps+=2;quiz.earnedSteps+=2;p.permitVoucher++;}s.quizResult={correct,answer:q.options[q.answer],explain:q.explain,complete,correctCount:quiz.correctCount,total:quiz.total,earnedSteps:quiz.earnedSteps,results:[...quiz.results]};if(complete){log(s,`${p.name} סיים שאלון ${quiz.correctCount}/${quiz.total}: ${quiz.earnedSteps}+ צעדי פעולה${quiz.correctCount===3?' ושובר אגרת היתר':''}.`,'trivia');s.quiz=null;}else Object.assign(quiz,question(s,p,quiz.results.map(r=>r.id)));missions(s,id);checkWinner(s);return s;}
 ensure(!s.quiz,'ענו על השאלה הפתוחה לפני פעולה אחרת');
 if(cmd==='end'){next(s);return s;}
 if(cmd==='claimCityMission'){const mission=cityMissionBoard(s,id).find(m=>m.id===arg);ensure(mission&&!mission.complete&&mission.progress>=mission.target,'המשימה אינה מוכנה לאיסוף או שכבר נאספה');rewardCityMissions(s,id,log,arg);checkWinner(s);return s;}
 if(exchangeAction(s,id,cmd,arg,{spend,log})){}
 else if(adventureAction(s,id,cmd,arg,{random,spend,log,TRIVIA})){}
 else if(warfareAction(s,id,cmd,arg,{spend,log})){}
 else if(cmd==='buy'){ensure(Number.isInteger(arg)&&s.assets[arg],'בחרו מגרש');const a=s.assets[arg];ensure(a.owner===null,'המגרש כבר בבעלות שחקן');spend(p,a.price);a.owner=id;p.xp+=35;p.points+=15;log(s,`${p.name} רכש מגרש ב${a.street}, ${a.city}.`,'buy');}
 else if(cmd==='permit'){const a=requireAsset(s,id,arg?.asset),mode=arg?.mode;ensure(a.level<5&&a.permit==='none','כבר יש היתר או שהנכס הושלם');ensure(['regular','express','shady'].includes(mode),'בחרו מסלול היתר');const base=mode==='regular'?350:mode==='express'?750:1000,cost=Math.round(base*(mode!=='shady'&&p.skills.planning>=2?.85:1));spend(p,p.permitVoucher>0&&mode!=='shady'?0:cost);if(p.permitVoucher>0&&mode!=='shady')p.permitVoucher--;
 if(mode==='shady'){p.heat=Math.min(85,p.heat+30);p.rep=Math.max(0,p.rep-7);const success=random(s,1,100)<=65;if(success){a.permit='approved';log(s,`${p.name}: המעטפה האפורה קיצרה את ההליך. הסיכון לביקורת עלה והמוניטין נפגע.`,'risk');}else{charge(s,id,650);p.heat=Math.min(85,p.heat+10);log(s,`${p.name}: המסלול המפוקפק נכשל. קנס 650, ללא היתר.`,'risk');}}
 else{a.permit='pending';a.due=s.round+(mode==='express'||p.skills.planning>0?1:2);p.rep=Math.min(100,p.rep+2);log(s,`${p.name} הגיש בקשת היתר ${mode==='express'?'מזורזת':'רגילה'}: צפי לרבעון ${a.due}.`,'permit');}}
 else if(cmd==='build'){const a=requireAsset(s,id,arg?.asset),type=a.level?a.type:arg?.type;ensure(Object.hasOwn(BUILDINGS,type),'בחרו סוג נכס');ensure(a.permit==='approved','נדרש היתר פיתוח מאושר');ensure(a.level<5,'הנכס כבר ברמה 5');ensure(level(p)>=BUILDINGS[type].unlock,`סוג הנכס נפתח ברמה ${BUILDINGS[type].unlock}`);const supply=materialPlan(s,id,a,type),cost=buildingCost(a,type,p.skills.planning)+supply.cost;checkQuotedPrice(cost,arg?.maxCost);spend(p,cost,2);applyMaterialPlan(s,id,a,supply);a.type=type;a.level++;a.permit='none';a.due=0;if(a.level===1)initBusiness(a,type);p.points+=35+a.level*10;p.xp+=35;log(s,`${p.name} פיתח ${BUILDINGS[type].name} ברמה ${a.level}: ${stageName(type,a.level)}. ההכנסה החדשה פעילה מיד.`,'build');}
 else if(cmd==='businessBuy'){const a=s.assets[arg?.asset],type=arg?.type;ensure(a&&Object.hasOwn(BUILDINGS,type),'בחרו נכס וסוג עסק');ensure(a.owner===null||a.owner===id,'הנכס בבעלות שחקן אחר');ensure(a.level===0,'בחרו קרקע פנויה לפיתוח');ensure(level(p)>=BUILDINGS[type].unlock,'נדרשת רמת יזם גבוהה יותר');const supply=materialPlan(s,id,a,type),cost=businessCost(s,id,a.id,type);checkQuotedPrice(cost,arg?.maxCost);spend(p,cost,2);applyMaterialPlan(s,id,a,supply);a.owner=id;a.type=type;a.level=1;a.permit='none';a.due=0;initBusiness(a,type);p.points+=60;p.xp+=50;log(s,`${p.name} רכש ${BUILDINGS[type].name} פעיל ברמה 1 ב${a.street}. המחיר כולל קרקע לפי הצורך ואגרת רישוי.`,'business');}
 else if(['materials','negotiate','supplierAccept','supplierDecline'].includes(cmd)){throw Error('שוק הספקים הוחלף במפעלי ייצור. עברו למסך ״מפעלים ומסחר״.');}
 else if(cmd==='factoryBuy'){const a=s.assets[arg?.asset],n=arg?.quantity,k=BUILDINGS[a?.type]?.produces;ensure(a&&a.owner!==null&&k&&!s.players[a.owner].out,'בחרו מפעל פעיל');ensure(Number.isInteger(n)&&n>0&&n<=100&&a.outputStock>=n,'אין מספיק מלאי או שהכמות אינה תקינה');const seller=s.players[a.owner],total=seller.id===id?0:a.materialPrice*n;ensure(Number.isSafeInteger(total)&&total>=0,'מחיר לא תקין');spend(p,total);a.outputStock-=n;p.materials[k]+=n;if(seller.id!==id){seller.cash+=total;seller.tradeEarned+=total;a.factorySales+=n;a.factoryRevenue+=total;}log(s,`${p.name} ${seller.id===id?'העביר למחסן שלו':'רכש מ'+seller.name} ${n} יחידות ${MATERIALS[k].name}${total?' תמורת '+total+' קרדיטים':''}.`,'industry');}
 else if(cmd==='factoryPrice'){const a=requireAsset(s,id,arg?.asset),k=BUILDINGS[a.type]?.produces,value=arg?.price;ensure(k&&Number.isInteger(value)&&value>=Math.ceil(MATERIALS[k].price*.4)&&value<=MATERIALS[k].price*2,'מחיר היחידה חורג מהטווח המותר');spend(p,0,0);a.materialPrice=value;}
 else if(cmd==='fare'){const v=p.fleet.find(v=>v.id===arg?.vehicle),price=arg?.price;ensure(v&&Number.isInteger(price)&&price>=5&&price<=baseFare(v.kind)*3,'בחרו תעריף תקין');spend(p,0,0);v.fare=price;}
 else if(cmd==='ride'){const owner=arg?.owner;ensure(Number.isInteger(owner)&&s.players[owner]&&!s.players[owner].out,'בחרו חברת תחבורה פעילה');const seller=s.players[owner],v=seller.fleet.find(v=>v.id===arg?.vehicle);ensure(v,'הרכב אינו פעיל');ensure(p.rideTurn!==s.turn,'אפשר לבצע נסיעה אחת בכל תור');const fare=owner===id?0:v.fare;spend(p,fare);if(owner!==id){seller.cash+=fare;seller.fareEarned+=fare;}p.rideTurn=s.turn;p.location=v.district;p.wellness=Math.min(100,p.wellness+5);p.lastTrip={kind:'ride',district:v.district,round:s.round};log(s,`${p.name} נסע ב${VEHICLES[v.kind].name} של ${seller.name} אל ${DISTRICTS[v.district].city} · ${fare} קרדיטים, רווחה 5+.`,'transport');}
 else if(cmd==='vacation'){const a=s.assets[arg?.airport],pack=VACATIONS[arg?.package];ensure(a&&a.type==='airport'&&a.level&&a.owner!==null&&!s.players[a.owner].out&&pack,'בחרו שדה תעופה וחופשה');ensure(s.round>=p.vacationReady,'אפשר להזמין חופשה חדשה מרבעון '+p.vacationReady);const price=vacationPrice(s,id,a,arg.package);spend(p,price);if(a.owner!==id){s.players[a.owner].cash+=price;s.players[a.owner].flightEarned+=price;}p.wellness=Math.min(100,p.wellness+pack.wellness+(a.level-1)*2);p.vacationUntil=s.round+pack.duration-1;p.vacationReady=s.round+2;p.location=a.district;p.lastTrip={kind:'vacation',district:a.district,round:s.round};p.points+=15;log(s,`${p.name} יצא ל${pack.name} דרך ${a.city}. רווחה ${p.wellness}/100 ובונוס הכנסה 10% עד רבעון ${p.vacationUntil}.`,'travel');}
 else if(cmd==='flightPrice'){const a=requireAsset(s,id,arg?.asset),value=arg?.price;ensure(a.type==='airport'&&a.level&&Number.isInteger(value)&&value>=100&&value<=1200,'תעריף בסיס 100–1,200');spend(p,0,0);a.flightPrice=value;}
 else if(cmd==='vehicle'){const k=arg?.kind,d=arg?.district;ensure(VEHICLES[k]&&Number.isInteger(d)&&DISTRICTS[d],'בחרו רכב ורובע');ensure(p.fleet.length<20,'הצי מוגבל ל־20 רכבים');spend(p,VEHICLES[k].price);p.fleet.push({id:String(++s.vehicleSerial),kind:k,district:d,level:1,fare:baseFare(k)});p.points+=30;log(s,`${p.name} רכש ${VEHICLES[k].name} ופועל ב${DISTRICTS[d].name}.`,'business');}
 else if(cmd==='vehicleUpgrade'){const v=p.fleet.find(v=>v.id===arg);ensure(v&&v.level<5,'בחרו רכב שניתן לשדרג');spend(p,600*v.level);v.level++;p.points+=15;}
 else if(cmd==='vehicleRoute'){const v=p.fleet.find(v=>v.id===arg?.id);ensure(v&&Number.isInteger(arg.district)&&DISTRICTS[arg.district],'בחרו רכב ורובע');spend(p,100);v.district=arg.district;}
 else if(cmd==='vehicleSell'){const i=p.fleet.findIndex(v=>v.id===arg);ensure(i>=0,'רכב לא נמצא');spend(p,0);p.cash+=Math.floor(VEHICLES[p.fleet[i].kind].price*.55);p.fleet.splice(i,1);}
 else if(cmd==='restock'){const a=requireAsset(s,id,arg?.asset),n=arg?.quantity;ensure(isRetail(a)&&a.level>0&&Number.isInteger(n)&&n>0&&n<=200,'בחרו חנות בנויה וכמות 1–200');spend(p,n*22);a.stock+=n;log(s,`${a.street}: התקבלו ${n} מוצרים במחסן החנות.`,'business');}
 else if(cmd==='price'){const a=requireAsset(s,id,arg?.asset);ensure(isRetail(a)&&Number.isInteger(arg.price)&&arg.price>=30&&arg.price<=100,'מחיר מוצר בין 30 ל־100');spend(p,0);a.salePrice=arg.price;}
 else if(cmd==='offer'){const a=s.assets[arg?.asset],price=arg?.price;ensure(a&&a.owner!==null&&a.owner!==id,'בחרו נכס של מתחרה ללא עבודות');ensure(Number.isSafeInteger(price)&&price>=400&&price<=p.cash,'ההצעה חורגת מהתקציב');ensure(!s.offers.some(o=>o.from===id&&o.asset===a.id),'כבר קיימת הצעה שלכם לנכס');spend(p,0);p.cash-=price;s.offers.push({id:String(++s.offerSerial),from:id,to:a.owner,asset:a.id,price,expires:s.round+3});log(s,`${p.name} הציע ${price} עבור ${a.street}. הכסף נשמר עד למענה או לפקיעה.`,'auction');}
 else if(cmd==='offerAccept'||cmd==='offerDecline'||cmd==='offerCancel'){const i=s.offers.findIndex(o=>o.id===arg);ensure(i>=0,'ההצעה כבר נסגרה');const o=s.offers[i],a=s.assets[o.asset];ensure(cmd==='offerCancel'?o.from===id:o.to===id,'אין הרשאה להצעה');if(cmd==='offerAccept'){ensure(a.owner===id,'הבעלות השתנתה או שמתבצעת בנייה');p.cash+=o.price;a.owner=o.from;a.permit='none';log(s,`העסקה נסגרה: ${a.street} עבר ל${s.players[o.from].name}.`,'auction');}else s.players[o.from].cash+=o.price;s.offers.splice(i,1);if(cmd==='offerAccept')for(const other of [...s.offers])if(other.asset===a.id){s.players[other.from].cash+=other.price;s.offers.splice(s.offers.indexOf(other),1);}}
 else if(cmd==='manager'){const a=requireAsset(s,id,arg);ensure(a.level>0&&!a.manager,'נדרש עסק בנוי ללא מנהל');spend(p,650);a.manager=true;p.points+=15;log(s,`מנהל חדש ב${a.street}: הכנסה גבוהה ב־20%.`,'build');}
 else if(cmd==='green'){const a=requireAsset(s,id,arg);ensure(a.level>0&&!a.green,'בחרו מבנה שטרם הוסב');spend(p,700);a.green=true;p.rep=Math.min(100,p.rep+4);p.points+=20;log(s,`${a.street} הוסב לבנייה ירוקה.`,'green');}
 else if(cmd==='marketing'){const a=requireAsset(s,id,arg);ensure(a.level>0&&a.marketing<s.round,'קמפיין כבר פעיל או שאין מבנה');spend(p,400);a.marketing=s.round+1;log(s,`קמפיין ב${a.street}: הכנסה נוספת לשני רבעונים.`,'business');}
 else if(cmd==='project'){const d=arg?.district,kind=arg?.kind;ensure(Number.isInteger(d)&&DISTRICTS[d]&&Object.hasOwn(PROJECTS,kind),'בחרו שירות ורובע');ensure(s.assets.filter(a=>a.owner===id&&a.district===d).length>=2,'נדרשים שני נכסים ברובע');const project=p.projects.find(q=>q.district===d&&q.kind===kind),current=project?.level??0;ensure(current<5,'השירות כבר ברמה 5');spend(p,Math.round(PROJECTS[kind].cost*(1+current*.5)),2);if(project)project.level++;else p.projects.push({district:d,kind,level:1});p.rep=Math.min(100,p.rep+(kind==='park'?6:3));p.points+=60;log(s,`${p.name} ${current?'שדרג':'הקים'} ${PROJECTS[kind].name} ברמה ${current+1} ב${DISTRICTS[d].name}. רווחת התושבים ${wellbeing(s,d)}/100.`,'green');}
 else if(cmd==='neighborhood'){ensure(Number.isInteger(arg)&&DISTRICTS[arg],'בחרו רובע');const aa=s.assets.filter(a=>a.owner===id&&a.district===arg);ensure(aa.length>=3&&aa.filter(a=>a.type==='home'&&a.level>0).length>=2,'נדרשים שלושה מגרשים ברובע, מתוכם שני בתי מגורים בנויים');const current=p.neighborhoods[arg]??0;ensure(current<3,'השכונה כבר ברמה 3');spend(p,1200+current*700,2);p.neighborhoods[arg]=current+1;p.rep=Math.min(100,p.rep+5);p.points+=75;p.xp+=45;log(s,`${p.name} ${current?'הרחיב':'ייסד'} שכונה ב${DISTRICTS[arg].name} · רמה ${current+1}.`,'district');}
 else if(cmd==='skill'){ensure(SKILLS[arg]&&p.skills[arg]<3,'תחום המחקר אינו זמין');spend(p,900*(p.skills[arg]+1));p.skills[arg]++;p.xp+=25;p.points+=25;log(s,`${p.name} השקיע ב${SKILLS[arg].name}.`,'research');}
 else if(cmd==='rig'){ensure(p.rigs<5,'כל חמש המכונות מותקנות');spend(p,1000+p.rigs*350);p.rigs++;p.xp+=20;log(s,`${p.name} הוסיף מכונת כרייה מדומה.`,'mine');}
 else if(cmd==='coins'){ensure(p.coins>0,'אין מטבעות למכירה');spend(p,0);const v=p.coins*s.rate;p.cash+=v;p.coins=0;log(s,`${p.name} המיר מטבעות BE ל־${v} קרדיטים.`,'mine');}
 else if(cmd==='avatar'){ensure(p.avatar<4&&level(p)>=p.avatar,'נדרשת רמת יזם גבוהה יותר');spend(p,700*p.avatar);p.avatar++;p.rep=Math.min(100,p.rep+3);p.points+=30;log(s,`${p.name} שדרג את הדמות. בדרגה 3 מקבלים פעולה נוספת לתור.`,'research');}
 else if(cmd==='loan'){ensure(p.loan<9000,'מסגרת החוב מלאה');spend(p,0);p.cash+=3000;p.loan+=3000;log(s,`${p.name} לקח הלוואת משחק של 3,000 קרדיטים. הריבית מחושבת בכל רבעון.`,'finance');}
 else if(cmd==='repay'){ensure(p.loan>0,'אין חוב');const value=Math.min(3000,p.loan);spend(p,value);p.loan-=value;p.rep=Math.min(100,p.rep+2);log(s,`${p.name} פרע ${value} קרדיטים מהחוב.`,'finance');}
 else if(cmd==='reputation'){ensure(p.rep<100||p.heat>0,'המוניטין מלא ואין סיכון לביקורת');spend(p,600);p.rep=Math.min(100,p.rep+8);p.heat=Math.max(0,p.heat-15);log(s,`${p.name} השקיע בשקיפות ובקהילה: מוניטין 8+, סיכון 15−.`,'green');}
 else if(cmd==='survey'){ensure(p.surveyTurn!==s.turn,'סקר השוק כבר נוצל בתור הזה');spend(p,100);p.surveyTurn=s.turn;s.dice=[random(s,1,6),random(s,1,6)];const sum=s.dice[0]+s.dice[1],reward=sum>=10?650:sum>=7?300:0;p.cash+=reward;p.xp+=15;if(s.dice[0]===s.dice[1])p.points+=25;log(s,`${p.name} ביצע סקר שוק: קוביות ${s.dice.join(' + ')} · ${reward?reward+'+ קרדיטים':'15+ XP'}${s.dice[0]===s.dice[1]?' ובונוס דאבל':''}.`,'event');}
 else if(cmd==='auction'){const a=requireAsset(s,id,arg);spend(p,0);p.auctionTurn=s.turn;s.auction={asset:a.id,seller:id,minimum:Math.max(400,Math.floor((a.price+(BUILDINGS[a.type]?.cost??0)*a.level*.65)*.6)),bid:0,bidder:null,endsAt:now+16000};s.phase='auction';log(s,`${p.name} הציע את ${a.street} למכרז מקומי.`,'auction');}
 else throw Error('פעולה לא מוכרת');
 missions(s,id);checkWinner(s);if(p.out&&s.phase!=='finished')next(s);return s;
}
function tryAction(s,p,cmd,arg){try{action(s,p.id,cmd,arg);return true;}catch{return false;}}
export function botStep(s,now=Date.now()){
 if(s.phase==='auction'){if(settleAuction(s,now))return true;const t=s.auction,a=s.assets[t.asset],min=t.bidder===null?t.minimum:t.bid+100,value=a.price+(BUILDINGS[a.type]?.cost??0)*a.level*.65;for(const p of s.players)if(p.bot&&!p.out&&p.id!==t.seller&&p.id!==t.bidder&&p.cash>min+1800&&min<=value*(s.difficulty==='competitive'?1.3:1.05)&&random(s,0,2)>0){action(s,p.id,'bid',min,now);return true;}return false;}
 const p=s.players[s.active];if(s.phase==='finished'||!p.bot||p.out)return false;
 if(p.adventure.challenge){const c=p.adventure.challenge,chance=s.difficulty==='competitive'?85:s.difficulty==='easy'?45:70;action(s,p.id,'routeAnswer',random(s,1,100)<=chance?c.answer:(c.answer+1)%4);return true;}
 if(p.quizTurn!==s.turn){action(s,p.id,'quiz');return true;}
 if(s.quiz?.player===p.id){const q=s.quiz,chance=s.difficulty==='competitive'?85:s.difficulty==='easy'?40:65,answer=random(s,1,100)<=chance?q.order.indexOf(TRIVIA[q.id].answer):(q.order.indexOf(TRIVIA[q.id].answer)+1)%4;action(s,p.id,'answer',answer);return true;}
 if(p.ap<=0){action(s,p.id,'end');return true;}
 const owned=s.assets.filter(a=>a.owner===p.id),f=forecast(s,p.id),reserve=s.difficulty==='easy'?2500:1300;
 const investment=botInvestment(s,p);if(investment&&tryAction(s,p,investment.cmd,investment.arg))return true;
 const damaged=owned.find(a=>a.level&&a.health<80);if(damaged&&p.cash>3000&&tryAction(s,p,'repair',damaged.id))return true;
 if(s.difficulty!=='easy'&&s.round>=4){
 if(p.guards<Math.min(3,Math.floor(s.round/5))&&p.cash>6000&&tryAction(s,p,'guards'))return true;
 if(p.vault<2&&p.cash>14000&&tryAction(s,p,'vault'))return true;
 if(p.opRound!==s.round&&p.cash>7000&&p.ap>=2){const targets=s.assets.filter(a=>a.owner!==null&&a.owner!==p.id&&a.level).sort((a,b)=>s.players[b.owner].cash-s.players[a.owner].cash);for(const target of targets){const kind=s.round%4===0?'recon':s.round%3===0?'raid':'heist';if(operationPreview(s,p.id,kind,target.id).allowed&&tryAction(s,p,'operation',{kind,asset:target.id}))return true;}}
 }
 if(p.adventure.movedTurn!==s.turn&&p.ap>=2&&(p.cash<9000||s.round%3===0)&&tryAction(s,p,'routeMove'))return true;
 const incoming=s.offers.find(o=>o.to===p.id&&o.price>=(s.assets[o.asset].price+(BUILDINGS[s.assets[o.asset].type]?.cost??0)*s.assets[o.asset].level*.65)*1.1);if(incoming&&tryAction(s,p,'offerAccept',incoming.id))return true;
 if(p.coins&&tryAction(s,p,'coins'))return true;
 if(energy(s,p.id).shortage&&p.ap>=2){const d=DISTRICTS.find(d=>owned.filter(a=>a.district===d.id).length>=2&&!p.projects.some(q=>q.kind==='solar'&&q.district===d.id));if(d&&tryAction(s,p,'project',{district:d.id,kind:'solar'}))return true;}
 const ready=owned.find(a=>a.permit==='approved'&&a.level<5);if(ready&&p.ap>=2){const type=ready.level?ready.type:owned.filter(a=>a.type==='home'&&a.level).length<2?'home':['supermarket','cafe','restaurant','pharmacy','clinic','horsefarm','daycare','garage','station','bitcoinfarm'][((ready.id+p.id)%10)];if(p.cash>developmentCost(s,p.id,ready,type)+reserve&&tryAction(s,p,'build',{asset:ready.id,type}))return true;}
 // Industrial businesses still earn income from automatic purchases by other players.
 const missingFactory=Object.keys(MATERIALS).find(k=>!s.assets.some(a=>a.owner!==null&&BUILDINGS[a.type]?.produces===k));if(missingFactory&&owned.filter(a=>BUILDINGS[a.type]?.produces).length<2&&p.cash>9000&&p.ap>=2){const type=factoryType(missingFactory),lot=s.assets.find(a=>a.owner===p.id&&!a.level&&a.id!==ready?.id)??s.assets.find(a=>a.owner===null);if(lot&&tryAction(s,p,'businessBuy',{asset:lot.id,type}))return true;}
 const n=DISTRICTS.find(d=>!p.neighborhoods[d.id]&&owned.filter(a=>a.district===d.id).length>=3&&owned.filter(a=>a.district===d.id&&a.type==='home'&&a.level>0).length>=2);if(n&&p.ap>=2&&tryAction(s,p,'neighborhood',n.id))return true;
 const request=owned.find(a=>a.permit==='none'&&a.level<5);if(request&&p.cash>2000&&tryAction(s,p,'permit',{asset:request.id,mode:p.skills.planning?'regular':'express'}))return true;
 if(owned.length<14&&p.cash>2500){const free=s.assets.filter(a=>a.owner===null).sort((a,b)=>{const value=q=>owned.filter(o=>o.district===q.district).length*400+(DISTRICTS[q.district].special==='home'?150:0)-q.price*.1;return value(b)-value(a);});if(free.length&&p.cash>free[0].price+reserve&&tryAction(s,p,'buy',free[0].id))return true;}
 if(!p.skills.planning&&p.cash>3000&&tryAction(s,p,'skill','planning'))return true;
 const shop=owned.find(a=>isRetail(a)&&a.level&&a.stock<10);if(shop&&p.cash>2200&&tryAction(s,p,'restock',{asset:shop.id,quantity:60}))return true;
 if(p.fleet.length<2&&p.cash>8000&&tryAction(s,p,'vehicle',{kind:'taxi',district:owned[0]?.district??0}))return true;
 const welfare=DISTRICTS.find(d=>owned.filter(a=>a.district===d.id).length>=2&&!p.projects.some(q=>q.district===d.id&&q.kind==='park'));if(welfare&&p.cash>7000&&p.ap>=2&&tryAction(s,p,'project',{district:welfare.id,kind:'park'}))return true;
 const airport=s.assets.find(a=>a.owner!==null&&a.type==='airport'&&a.level);if(airport&&p.cash>6000&&p.wellness<70&&s.round>=p.vacationReady&&tryAction(s,p,'vacation',{airport:airport.id,package:'weekend'}))return true;
 const bus=s.players.filter(q=>q.id!==p.id&&!q.out).flatMap(q=>q.fleet.map(v=>({owner:q.id,vehicle:v.id}))).find(Boolean);if(bus&&p.rideTurn!==s.turn&&p.wellness<65&&p.cash>4000&&tryAction(s,p,'ride',bus))return true;
 const unmanaged=owned.find(a=>a.level&&!a.manager);if(unmanaged&&p.cash>2500&&tryAction(s,p,'manager',unmanaged.id))return true;
 if(p.rigs<2&&p.cash>3500&&!energy(s,p.id).shortage&&tryAction(s,p,'rig'))return true;
 if(p.heat>25&&p.cash>1500&&tryAction(s,p,'reputation'))return true;
 if(p.avatar<3&&p.cash>5000&&level(p)>=p.avatar&&tryAction(s,p,'avatar'))return true;
 if(p.loan&&p.cash>5500&&tryAction(s,p,'repay'))return true;
 if(p.cash<1000&&p.loan<6000&&f.net>0&&tryAction(s,p,'loan'))return true;
 if(owned.length>=4&&s.round%3===0&&p.auctionTurn!==s.turn&&p.ap>0&&random(s,0,2)>0){const sell=[...owned].sort((a,b)=>a.level-b.level)[0];if(sell){action(s,p.id,'auction',sell.id,now);return true;}}
 action(s,p.id,'end');return true;
}
