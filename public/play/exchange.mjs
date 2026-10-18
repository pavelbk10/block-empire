// A fictional exchange denominated only in the city's game credits.
// This module owns a separate RNG; reading quotes never advances either RNG.
export const STOCKS=Object.freeze([
 {symbol:'BLD',name:'אמפייר בנייה',sector:'נדל״ן ותשתיות',price:120,vol:9,dividend:1,color:'#d8b783',types:['home','office','cementworks','hardware']},
 {symbol:'TEC',name:'נובה טכנולוגיות',sector:'טכנולוגיה',price:180,vol:14,dividend:0,color:'#ac9cdd',types:['office','bitcoinfarm']},
 {symbol:'RAIL',name:'מטרו מוביליטי',sector:'רכבות ותחבורה',price:95,vol:10,dividend:1,color:'#86bed1',types:['station']},
 {symbol:'FOOD',name:'גרין מרקט',sector:'מזון וקמעונאות',price:80,vol:7,dividend:1,color:'#8bc69b',types:['supermarket','restaurant','bakery','cafe']},
 {symbol:'AIR',name:'אופק תעופה',sector:'תיירות ותעופה',price:145,vol:13,dividend:0,color:'#a8d5d3',types:['airport','hotel']},
 {symbol:'NRG',name:'סולאריס אנרגיה',sector:'אנרגיה',price:110,vol:11,dividend:1,color:'#e3c879',types:['factory']},
 {symbol:'IND',name:'טיטאן תעשיות',sector:'תעשייה וחומרים',price:160,vol:10,dividend:1,color:'#a8b9c2',types:['steelworks','glassworks','brickworks','sawmill','factory']},
 {symbol:'MED',name:'ויטה בריאות',sector:'בריאות ושירותים',price:135,vol:8,dividend:1,color:'#9bccc0',types:['clinic','pharmacy','gym','daycare']}
]);
export const CALL_TERMS=[4,8];
const stock=symbol=>STOCKS.find(s=>s.symbol===symbol);
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const commission=n=>n>0?Math.max(1,Math.ceil(n*.005)):0;
const book=()=>({shares:{},shorts:[],calls:[],realized:0,dividends:0,fees:0,trades:[],serial:0,lastTradeRound:0,lastStatement:null});
export function initExchange(s){
 if(!s.exchange){const seed=((s.seed??123)^0x6b13ab97)>>>0;s.exchange={seed:seed||73421,round:s.round,quotes:Object.fromEntries(STOCKS.map(c=>[c.symbol,{price:c.price,history:[{q:s.round,price:c.price}]}])),news:{q:s.round,title:'בורסת האימפריה נפתחה',detail:'שמונה חברות בדיוניות. השערים מתעדכנים פעם ברבעון לכל השחקנים יחד.'}};}
 for(const p of s.players)if(!p.exchange)p.exchange=book();s.exchangeVersion=1;return s;
}
export function spot(s,symbol){return s.exchange?.quotes?.[symbol]?.price??stock(symbol)?.price??0;}
export function callValue(s,position){const price=spot(s,position.symbol),remaining=Math.max(0,position.expires-s.round);return Math.max(0,price-position.strike)+(remaining?Math.ceil(price*.10*Math.sqrt(remaining/4)):0);}
export function shortEquity(s,position){return Math.max(0,position.collateral+(position.entry-spot(s,position.symbol))*position.quantity-position.borrowPaid);}
export function investmentValue(s,id){const p=s.players[id],b=p.exchange;if(!b)return p.exchangeSummary?.value??0;return Object.entries(b.shares).reduce((n,[symbol,h])=>n+spot(s,symbol)*h.quantity,0)+b.shorts.reduce((n,x)=>n+shortEquity(s,x),0)+b.calls.reduce((n,x)=>n+callValue(s,x)*x.quantity,0);}
export function investmentSummary(s,id){const b=s.players[id].exchange;if(!b)return s.players[id].exchangeSummary??{value:0,basis:0,unrealized:0,realized:0,dividends:0,collateral:0,count:0};const basis=Object.values(b.shares).reduce((n,h)=>n+h.basis,0)+b.calls.reduce((n,x)=>n+x.premium*x.quantity+x.openFee,0)+b.shorts.reduce((n,x)=>n+x.collateral+x.openFee,0),value=investmentValue(s,id);return{value,basis,unrealized:value-basis,realized:b.realized,dividends:b.dividends,fees:b.fees,collateral:b.shorts.reduce((n,x)=>n+x.collateral,0),count:Object.keys(b.shares).length+b.calls.length+b.shorts.length};}
function quantity(q,max=1000){check(Number.isSafeInteger(q)&&q>=1&&q<=max,'הכמות חייבת להיות מספר שלם בין 1 ל־'+max.toLocaleString('he-IL'));return q;}
export function exchangeQuote(s,id,cmd,arg={}){
 const p=s.players[id],b=p?.exchange;check(b&&s.exchange,'הבורסה אינה זמינה');check(arg&&typeof arg==='object','בחרו הוראת מסחר');let symbol=arg.symbol,position;
 if(cmd==='callSell'){position=b.calls.find(x=>x.id===arg.position);check(position,'האופציה אינה בתיק שלכם');symbol=position.symbol;}
 if(cmd==='shortCover'){position=b.shorts.find(x=>x.id===arg.position);check(position,'פוזיציית השורט אינה בתיק שלכם');symbol=position.symbol;}
 check(stock(symbol),'בחרו מניה מהרשימה');const unit=spot(s,symbol);let q,notional,fee,cost=0,proceeds=0;
 if(['stockBuy','stockSell','shortOpen','callBuy'].includes(cmd)){q=quantity(arg.quantity,cmd==='stockSell'?10000:1000);notional=unit*q;}
 if(cmd==='stockBuy'){check((b.shares[symbol]?.quantity??0)+q<=10000,'אפשר להחזיק עד 10,000 מניות מכל חברה');fee=commission(notional);cost=notional+fee;}
 else if(cmd==='stockSell'){check((b.shares[symbol]?.quantity??0)>=q,'אין מספיק מניות בתיק למכירה');fee=commission(notional);proceeds=notional-fee;}
 else if(cmd==='shortOpen'){check(b.shorts.length+b.calls.length<20,'אפשר להחזיק עד 20 פוזיציות שורט ואופציות יחד');const collateral=Math.ceil(notional*1.5);fee=commission(notional);cost=collateral+fee;return{symbol,quantity:q,unit,notional,fee,cost,proceeds,collateral,round:s.round};}
 else if(cmd==='shortCover'){q=position.quantity;notional=shortEquity(s,position);fee=commission(notional);proceeds=notional-fee;}
 else if(cmd==='callBuy'){check(b.shorts.length+b.calls.length<20,'אפשר להחזיק עד 20 פוזיציות שורט ואופציות יחד');check(CALL_TERMS.includes(arg.term),'בחרו אופציה ל־4 או 8 רבעונים');const expires=s.round+arg.term,strike=Math.ceil(unit*1.05),premium=callValue(s,{symbol,expires,strike});notional=premium*q;fee=commission(notional);cost=notional+fee;return{symbol,quantity:q,unit:premium,spot:unit,notional,fee,cost,proceeds,strike,premium,expires,round:s.round};}
 else if(cmd==='callSell'){q=position.quantity;notional=callValue(s,position)*q;fee=commission(notional);proceeds=notional-fee;return{symbol,quantity:q,unit:callValue(s,position),notional,fee,cost,proceeds,round:s.round};}
 else throw Error('הוראת בורסה לא מוכרת');
 return{symbol,quantity:q,unit,notional,fee,cost,proceeds,round:s.round};
}
function privateLog(s,p,text,log){const before=s.logs?.[0];log(s,text,'exchange');if(s.logs?.[0]&&s.logs[0]!==before)s.logs[0].exchangeOwner=p.id;}
function record(s,p,kind,symbol,quantity,cash,pnl=0){const b=p.exchange;b.trades.unshift({q:s.round,kind,symbol,quantity,cash,pnl});b.trades=b.trades.slice(0,40);}
function closeShort(s,p,pos,kind='shortCover'){const b=p.exchange,gross=shortEquity(s,pos),fee=commission(gross),proceeds=gross-fee,pnl=proceeds-pos.collateral-pos.openFee;p.cash+=proceeds;b.realized+=pnl;b.fees+=fee;b.shorts.splice(b.shorts.indexOf(pos),1);record(s,p,kind,pos.symbol,pos.quantity,proceeds,pnl);return{proceeds,pnl};}
function closeCall(s,p,pos,kind='callSell'){const b=p.exchange,gross=callValue(s,pos)*pos.quantity,fee=kind==='callExpiry'?0:commission(gross),proceeds=gross-fee,pnl=proceeds-pos.premium*pos.quantity-pos.openFee;p.cash+=proceeds;b.realized+=pnl;b.fees+=fee;b.calls.splice(b.calls.indexOf(pos),1);record(s,p,kind,pos.symbol,pos.quantity,proceeds,pnl);return{proceeds,pnl};}
function sellShares(s,p,symbol,q){const b=p.exchange,h=b.shares[symbol],notional=spot(s,symbol)*q,fee=commission(notional),proceeds=notional-fee,basis=q===h.quantity?h.basis:Math.round(h.basis*q/h.quantity),pnl=proceeds-basis;p.cash+=proceeds;b.realized+=pnl;b.fees+=fee;h.quantity-=q;h.basis-=basis;if(!h.quantity)delete b.shares[symbol];record(s,p,'stockSell',symbol,q,proceeds,pnl);return{proceeds,pnl};}
export function exchangeAction(s,id,cmd,arg,{spend,log}){
 if(!['stockBuy','stockSell','shortOpen','shortCover','callBuy','callSell'].includes(cmd))return false;
 const p=s.players[id],b=p.exchange,quote=exchangeQuote(s,id,cmd,arg);
 check(arg.quoteRound===s.round&&arg.unit===quote.unit,'השער או הרבעון השתנו. בדקו את הצעת המחיר המעודכנת');
 check(Number.isSafeInteger(arg.maxCost)&&arg.maxCost>=quote.cost,'העלות השתנתה. בדקו שוב את פרטי העסקה');
 spend(p,quote.cost,1);const {symbol,quantity:q,unit,fee}=quote;
 if(cmd==='stockBuy'){const h=b.shares[symbol]??{quantity:0,basis:0};h.quantity+=q;h.basis+=quote.cost;b.shares[symbol]=h;b.fees+=fee;record(s,p,cmd,symbol,q,-quote.cost);}
 if(cmd==='stockSell')sellShares(s,p,symbol,q);
 if(cmd==='shortOpen'){b.shorts.push({id:++b.serial,symbol,quantity:q,entry:unit,collateral:quote.collateral,borrowPaid:0,openFee:fee,opened:s.round});b.fees+=fee;record(s,p,cmd,symbol,q,-quote.cost);}
 if(cmd==='shortCover')closeShort(s,p,b.shorts.find(x=>x.id===arg.position));
 if(cmd==='callBuy'){b.calls.push({id:++b.serial,symbol,quantity:q,strike:quote.strike,premium:quote.premium,expires:quote.expires,openFee:fee,opened:s.round});b.fees+=fee;record(s,p,cmd,symbol,q,-quote.cost);}
 if(cmd==='callSell')closeCall(s,p,b.calls.find(x=>x.id===arg.position));
 b.lastTradeRound=s.round;
 const labels={stockBuy:'קנה מניות',stockSell:'מכר מניות',shortOpen:'פתח שורט',shortCover:'סגר שורט',callBuy:'קנה אופציות CALL',callSell:'מכר אופציות CALL'};
 privateLog(s,p,`${p.name} ${labels[cmd]}: ${symbol} × ${q} · ${quote.cost?'חיוב '+quote.cost:'תקבול '+quote.proceeds} קרדיטים, עמלה ${fee}.`,log);return true;
}
function randomMarket(m,min,max){let x=m.seed;x^=x<<13;x^=x>>>17;x^=x<<5;m.seed=x>>>0;return min+Math.floor(m.seed/4294967296*(max-min+1));}
export function advanceExchange(s,{log}){
 const m=s.exchange;if(!m||m.round>=s.round)return false;
 const market=randomMarket(m,-5,5),events=['stable','housing','tourism','slow','innovation','power','festival'],event=events[s.event]??'stable';
 for(const c of STOCKS){const quote=m.quotes[c.symbol],demand=Math.min(2,Math.floor(s.assets.filter(a=>a.level&&a.owner!==null&&c.types.includes(a.type)).length/4)),bonus=(event==='housing'&&c.symbol==='BLD'||event==='tourism'&&c.symbol==='AIR'||event==='innovation'&&c.symbol==='TEC'||event==='festival'&&c.symbol==='FOOD')?4:event==='slow'?-4:event==='power'&&['TEC','IND'].includes(c.symbol)?-3:0,change=Math.max(-18,Math.min(18,market+randomMarket(m,-c.vol,c.vol)+demand+bonus));quote.price=Math.max(15,Math.min(1500,Math.round(quote.price*(1+change/100))));quote.history.push({q:s.round,price:quote.price});quote.history=quote.history.slice(-48);}
 m.round=s.round;const mover=[...STOCKS].sort((a,b)=>Math.abs(priceChange(s,b.symbol))-Math.abs(priceChange(s,a.symbol)))[0],change=priceChange(s,mover.symbol);m.news={q:s.round,title:`${mover.symbol} ${change>=0?'מובילה את העליות':'במוקד הירידות'}`,detail:`${mover.name}: ${change>=0?'+':''}${change.toFixed(1)}% ברבעון. אירועי העיר ותנודתיות השוק השפיעו על המסחר.`};
 for(const p of s.players){if(p.out)continue;const b=p.exchange;let dividend=0,borrow=0,settlements=0;
 for(const c of STOCKS){const q=b.shares[c.symbol]?.quantity??0;if(q&&c.dividend)dividend+=Math.floor(spot(s,c.symbol)*q*c.dividend/100);}
 if(dividend){p.cash+=dividend;b.dividends+=dividend;record(s,p,'dividend','ALL',0,dividend);}
 for(const pos of [...b.shorts]){const charge=Math.min(shortEquity(s,pos),Math.ceil(pos.entry*pos.quantity*.01));pos.borrowPaid+=charge;b.fees+=charge;borrow+=charge;const equity=shortEquity(s,pos);if(equity<=spot(s,pos.symbol)*pos.quantity*.30){const result=closeShort(s,p,pos,'marginClose');settlements+=result.proceeds;privateLog(s,p,`${p.name}: שורט ${pos.symbol} נסגר אוטומטית עקב ירידת הביטחונות. הוחזרו ${result.proceeds} קרדיטים.`,log);}}
 for(const pos of [...b.calls])if(pos.expires<=s.round){const result=closeCall(s,p,pos,'callExpiry');settlements+=result.proceeds;privateLog(s,p,`${p.name}: אופציית CALL על ${pos.symbol} פקעה. מימוש אוטומטי במזומן: ${result.proceeds} קרדיטים.`,log);}
 b.lastStatement={q:s.round,dividend,borrow,settlements};
 }
 log(s,`בורסת האימפריה · Q${s.round}: ${m.news.title}.`,'exchange');return true;
}
export function priceChange(s,symbol){const h=s.exchange.quotes[symbol].history;if(h.length<2)return 0;return(h.at(-1).price/h.at(-2).price-1)*100;}
export function liquidateInvestments(s,id,{log}){const p=s.players[id],b=p.exchange;if(!b||!investmentSummary(s,id).count)return;const before=p.cash;for(const pos of [...b.shorts])closeShort(s,p,pos,'marginClose');for(const pos of [...b.calls])closeCall(s,p,pos);for(const[symbol,h]of Object.entries(b.shares))sellShares(s,p,symbol,h.quantity);privateLog(s,p,`${p.name}: תיק ההשקעות מומש אוטומטית ב־${p.cash-before} קרדיטים לכיסוי התחייבויות.`,log);}
export function redactExchange(s,seat){s.logs=s.logs.filter(l=>l.exchangeOwner===undefined||l.exchangeOwner===seat);if(s.exchange)delete s.exchange.seed;for(const p of s.players)if(p.id!==seat){const summary=investmentSummary(s,p.id);p.exchangeSummary={value:summary.value,count:summary.count};delete p.exchange;}}
export function botInvestment(s,p){const b=p.exchange;if(!b||b.lastTradeRound===s.round||s.round<3)return null;const held=Object.entries(b.shares).find(([symbol,h])=>spot(s,symbol)*h.quantity>h.basis*1.18||p.cash<2500);let cmd,arg;
 if(held){cmd='stockSell';arg={symbol:held[0],quantity:held[1].quantity};}
 else if(p.cash>14000&&Object.keys(b.shares).length<3){cmd='stockBuy';const symbol=STOCKS[(s.round+p.id*3)%STOCKS.length].symbol;arg={symbol,quantity:Math.max(1,Math.floor(Math.min(3000,p.cash*.12)/spot(s,symbol)))};}else return null;
 const q=exchangeQuote(s,p.id,cmd,arg);return{cmd,arg:{...arg,quoteRound:s.round,unit:q.unit,maxCost:q.cost}};
}
