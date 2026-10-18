import {redactExchange} from '../public/play/exchange.mjs';
import {redactAdventures} from '../public/play/adventures.mjs';
import {redactWarfare} from '../public/play/warfare.mjs';
import {createGame,action,botStep,settleAuction,TRIVIA,upgradeGame} from '../public/play/game.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const secret=()=>crypto.randomUUID()+crypto.randomUUID();
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),n=>n.toString(16).padStart(2,'0')).join('');
const name=v=>String(v??'יזם חדש').replace(/[\u0000-\u001f]/g,'').trim().slice(0,24)||'יזם חדש';
function view(room,seat,rev){const s=structuredClone(room.game);delete s.seed;for(const p of s.players)p.organizationUpkeep=((p.crew?.spies??1)+(p.crew?.enforcers??1)-2)*30+(p.guards??0)*40;redactWarfare(s,seat);redactAdventures(s,seat);redactExchange(s,seat);delete s.requests;if(s.quiz){const q=TRIVIA[s.quiz.id];s.quiz={player:s.quiz.player,index:s.quiz.index,total:s.quiz.total,correctCount:s.quiz.correctCount,earnedSteps:s.quiz.earnedSteps,public:{category:q.category,q:q.q,options:s.quiz.order.map(i=>q.options[i])}};}return {state:s,seat,revision:rev,lobby:room.lobby,members:room.members.map(m=>({seat:m.seat,name:m.name})),deadline:room.deadline};}
export async function handleRooms(request,db,now=Date.now()){
 try{
 if(!db)return json({error:'מסד הנתונים עדיין לא זמין. נסו שוב מאוחר יותר.'},503);
 const url=new URL(request.url),segments=url.pathname.split('/').filter(Boolean),id=segments[2];
 if(request.method!=='GET'&&request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return json({error:'מקור בקשה לא תקין'},403);
 let b={};if(request.method==='POST'){if(Number(request.headers.get('content-length')??0)>8192)return json({error:'בקשה גדולה מדי'},413);const raw=await request.text();if(raw.length>8192)return json({error:'בקשה גדולה מדי'},413);b=JSON.parse(raw||'{}');}
 if(!id&&request.method==='POST'){
 const token=secret(),roomId=crypto.randomUUID(),game=createGame(name(b.name),b.difficulty,crypto.getRandomValues(new Uint32Array(1))[0],{rounds:b.rounds,goal:b.goal});
 const room={game,lobby:true,members:[{seat:0,name:game.players[0].name,key:await hash(token)}],deadline:0,nextTick:now,requests:[]};
 await db.prepare('INSERT INTO rooms (id,payload,revision,updated) VALUES (?,?,0,?)').bind(roomId,JSON.stringify(room),now).run();return json({roomId,token,...view(room,0,0)},201);
 }
 if(!/^[0-9a-f-]{36}$/.test(id??''))return json({error:'חדר לא תקין'},404);
 const bearer=request.headers.get('authorization')?.replace(/^Bearer /,'')??'',key=bearer?await hash(bearer):null;
 // Optimistic compare-and-swap serializes concurrent purchases, bids and joins.
 for(let attempt=0;attempt<6;attempt++){
 const row=await db.prepare('SELECT payload,revision FROM rooms WHERE id=?').bind(id).first();if(!row)return json({error:'החדר לא נמצא'},404);const room=JSON.parse(row.payload);let member=room.members.find(m=>m.key===key),newToken=null,changed=false;
 const joining=segments[3]==='join'&&request.method==='POST';
 if(joining&&!member){if(!room.lobby)return json({error:'המשחק התחיל. ניתן לחזור רק מהמכשיר שכבר הצטרף.'},409);if(room.members.length>=4)return json({error:'החדר מלא: עד ארבעה שחקנים'},409);newToken=secret();const seat=room.members.length;member={seat,name:name(b.name),key:await hash(newToken)};room.members.push(member);Object.assign(room.game.players[seat],{name:member.name,bot:false});changed=true;}
 if(!member)return json({error:'הצטרפו לחדר באמצעות קישור ההזמנה'},401);
 const s=room.game;if(s.version<5||!s.warfareVersion||!s.adventureVersion||!s.exchangeVersion||s.players.some(p=>!p.cityMissions)){upgradeGame(s);changed=true;}
 if(!room.lobby&&s.phase!=='finished'&&now>=room.nextTick){
 const oldTurn=s.turn;
 if(s.phase==='auction'){changed=botStep(s,now)||changed;}
 else if(s.players[s.active].bot){changed=botStep(s,now)||changed;}
 else if(now>=room.deadline){s.quiz=null;action(s,s.active,'end',null,now);changed=true;}
 if(s.turn!==oldTurn)room.deadline=now+120000;
 room.nextTick=now+800;changed=true;
 }
 if(request.method==='POST'&&!joining){
 if(typeof b.requestId!=='string'||b.requestId.length>80||b.requestId.length<10)return json({error:'חסר מזהה בקשה'},400);
 const duplicate=room.requests.some(r=>r.id===b.requestId&&r.seat===member.seat);
 if(!duplicate){
 const times=(member.commandTimes??[]).filter(t=>now-t<10000);if(times.length>=30)return json({error:'יותר מדי פעולות ברצף. המתינו כמה שניות ונסו שוב.'},429);member.commandTimes=[...times,now];
 if(b.command==='restart'){if(member.seat!==0)return json({error:'רק מארח החדר יכול לפתוח עיר חדשה בחדר'},403);const fresh=createGame(room.members[0].name,b.arg?.difficulty,crypto.getRandomValues(new Uint32Array(1))[0],{rounds:b.arg?.rounds,goal:b.arg?.goal});for(const m of room.members)Object.assign(fresh.players[m.seat],{name:m.name,bot:false});room.game=fresh;room.lobby=true;room.deadline=0;room.nextTick=now;}
 else if(b.command==='extendSeason'){if(member.seat!==0)return json({error:'רק מארח החדר יכול להאריך את העונה'},403);const finished=s.phase==='finished';action(s,member.seat,'extendSeason',b.arg,now);if(finished&&s.phase!=='finished'){room.deadline=now+120000;room.nextTick=now+800;}}
 else if(b.command==='start'){if(member.seat!==0||!room.lobby)return json({error:'רק מארח החדר יכול להתחיל'},403);room.lobby=false;room.deadline=now+120000;}
 else{if(room.lobby)return json({error:'מחכים לתחילת המשחק'},409);const turnBefore=s.turn;action(s,member.seat,b.command,b.arg,now);if(s.turn!==turnBefore)room.deadline=now+120000;}
 room.requests.push({id:b.requestId,seat:member.seat});room.requests=room.requests.slice(-256);changed=true;
 }
 }
 if(!changed)return json(view(room,member.seat,row.revision));
 const result=await db.prepare('UPDATE rooms SET payload=?,revision=revision+1,updated=? WHERE id=? AND revision=?').bind(JSON.stringify(room),now,id,row.revision).run();
 if(result.meta.changes)return json({...view(room,member.seat,row.revision+1),...(newToken?{token:newToken}:{})});
 }
 return json({error:'החדר מתעדכן. נסו שוב בעוד רגע.'},409);
 }catch(e){return json({error:e instanceof SyntaxError?'בקשה לא תקינה':e.message||'לא ניתן לבצע את הפעולה'},400);}
}
