import {getBuildingModel,drawBuildingModel} from './building-models.mjs?v=14';
import {factoryIsWorking,smokeParticles,trainLayout} from './rail-effects.mjs?v=14';
import {visualAsset,districtOrigin,routePosition,routePoint,loopPoint,convexHull} from './map-layout.mjs?v=10';
import {ROUTE_STOPS} from './adventures.mjs?v=10';
import{anchoredZoom,wheelFactor}from'./camera.mjs?v=8';
import {DISTRICTS,BUILDINGS,salesForecast,isRetail,PROJECTS} from './game.mjs?v=13';
export function createCity(canvas,getState,onPick,onZoom=()=>{},onRoutePick=()=>{}){
 const ctx=canvas.getContext('2d');let w=800,h=505,zoom=1,rotation=0,night=false,hover=-1,hits=[],last=0,panX=0,panY=0,drag=null,moved=false,focus=null,animationTime=0,factoryActivity=new Set();const routeAnimations=new Map();const reducedMotion=globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches??false;
 const observer=new ResizeObserver(()=>{const r=canvas.getBoundingClientRect();w=r.width;h=r.height;canvas.width=Math.round(w*devicePixelRatio);canvas.height=Math.round(h*devicePixelRatio);ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);});observer.observe(canvas);
 const scale=()=>Math.min(w/58,h/34)*zoom;
 function proj(x,y,z=0){x-=focus?.x??9.75;y-=focus?.y??12.75;const a=rotation*Math.PI/2,xx=x*Math.cos(a)-y*Math.sin(a),yy=x*Math.sin(a)+y*Math.cos(a);return[w*.51+panX+(xx-yy)*scale(),h*.54+panY+(xx+yy)*scale()*.46-z*scale()];}
 function zoomAt(px,py,factor){const next=anchoredZoom({zoom,panX,panY},{x:px,y:py},factor,{x:w*.51,y:h*.54});zoom=next.zoom;panX=next.panX;panY=next.panY;onZoom(zoom);}
 function poly(pts,fill,stroke){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=1;ctx.strokeStyle=stroke;ctx.stroke();}}
 function shade(hex,f){return 'rgb('+hex.replace('#','').match(/../g).map(v=>Math.min(255,Math.round(parseInt(v,16)*f))).join(',')+')';}
 function box(x,y,z,sx,sy,sz,c,stroke){const a=proj(x-sx/2,y-sy/2,z),b=proj(x+sx/2,y-sy/2,z),c0=proj(x+sx/2,y+sy/2,z),d=proj(x-sx/2,y+sy/2,z),A=proj(x-sx/2,y-sy/2,z+sz),B=proj(x+sx/2,y-sy/2,z+sz),C=proj(x+sx/2,y+sy/2,z+sz),D=proj(x-sx/2,y+sy/2,z+sz);poly([b,c0,C,B],shade(c,.64));poly([c0,d,D,C],shade(c,.8));poly([A,B,C,D],c,stroke);return[A,B,C,D];}
 function tree(x,y,z=0,large=1){const p=proj(x,y,z),t=proj(x,y,z+.55*large),sc=scale();ctx.lineWidth=Math.max(1.5,sc*.055);ctx.strokeStyle='#516c48';ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...t);ctx.stroke();ctx.fillStyle=night?'#315448':'#689369';ctx.beginPath();ctx.ellipse(t[0],t[1],sc*.16*large,sc*.24*large,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=night?'#467b5e':'#8db47a';ctx.beginPath();ctx.ellipse(t[0]-sc*.04,t[1]-sc*.07,sc*.11*large,sc*.15*large,0,0,Math.PI*2);ctx.fill();}

 function propertyModel(a){return getBuildingModel(a.type,a.level,{green:!!a.green});}
 function house(a){const model=propertyModel(a);drawBuildingModel(ctx,model,(x,y,z)=>proj(a.x+x,a.y+y,z),scale(),night);
 if(a.owner!==null){const label=proj(a.x,a.y,-.09);ctx.textAlign='center';ctx.font=`bold ${Math.max(7,scale()*.16)}px Arial`;ctx.fillStyle='#e3f4dd';ctx.fillText('Lv.'+a.level,...label);for(let i=0;i<5;i++){ctx.fillStyle=i<a.level?'#9de7b9':'#405b52';ctx.fillRect(label[0]-12+i*5,label[1]+3,3.5,2);}}
 if(factoryActivity.has(a.id))factorySmoke(a);
 if(a.manager){const pt=proj(a.x-.23,a.y-.27,.27);ctx.fillStyle='#f8d185';ctx.beginPath();ctx.arc(...pt,Math.max(2,scale()*.055),0,7);ctx.fill();}
 }
 function person(x,y,color,avatar,walking=true,phase=0){const sc=scale(),swing=walking&&!reducedMotion?Math.sin(animationTime/135+phase)*.065:0,bob=walking&&!reducedMotion?Math.abs(Math.sin(animationTime/135+phase))*.012:0;const shadow=proj(x,y,.10);ctx.fillStyle='#142c3050';ctx.beginPath();ctx.ellipse(...shadow,Math.max(2,sc*.10),Math.max(1,sc*.045),0,0,7);ctx.fill();
 box(x-.035,y+swing,.12,.045,.06,.15,'#344d60');box(x+.035,y-swing,.12,.045,.06,.15,'#344d60');box(x,y,.25+bob,.13,.11,.19+avatar*.012,color);
 for(const side of[-1,1]){const a=proj(x+side*.085,y,.39+bob),b=proj(x+side*.09,y-side*swing,.24+bob);ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.6,sc*.047);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
 const p=proj(x,y,.50+avatar*.012+bob);ctx.fillStyle='#eac6a3';ctx.beginPath();ctx.arc(...p,Math.max(2,sc*.056),0,7);ctx.fill();ctx.fillStyle=avatar>=2?color:'#4a4039';ctx.fillRect(p[0]-Math.max(2,sc*.06),p[1]-Math.max(2,sc*.065),Math.max(4,sc*.12),Math.max(1.5,sc*.035));}
 function vehicle(x,y,v,color,angle=0){const long=v.kind==='bus'?.65:.37,across=.23,vertical=Math.abs(Math.sin(angle))>.5,sx=vertical?across:long,sy=vertical?long:across,body=v.kind==='taxi'?'#e7c15e':color;
 box(x,y,.14,sx,sy,.18,body);box(x,y,.33,sx*.65,sy*.68,.09,'#a7cbd1');box(x,y,.43,sx*.58,sy*.64,.025,body);
 for(const dir of[-1,1]){const xx=x+(vertical?.14:long*.30)*dir,yy=y+(vertical?long*.30:.14);const pt=proj(xx,yy,.15);ctx.fillStyle='#223039';ctx.beginPath();ctx.ellipse(...pt,Math.max(1.3,scale()*.045),Math.max(1.4,scale()*.065),0,0,7);ctx.fill();}
 const head=proj(x+(vertical?0:long*.47),y+(vertical?long*.47:0),.25);ctx.fillStyle=night?'#ffecaf':'#e9eddc';ctx.fillRect(head[0]-1.5,head[1]-1,3,2);if(v.kind==='taxi')box(x,y,.47,.10,.07,.035,'#f7dd78');
 }
 function factorySmoke(a){ctx.save();for(const puff of smokeParticles(a,animationTime,reducedMotion)){const p=proj(puff.x,puff.y,puff.z),r=Math.max(.7,scale()*puff.radius);ctx.globalAlpha=puff.alpha;ctx.fillStyle=night?'#bac5cc':'#d6dad6';ctx.beginPath();ctx.ellipse(p[0],p[1],r,r*.78,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=puff.alpha*.45;ctx.fillStyle=night?'#d1d8d8':'#f0f0e5';ctx.beginPath();ctx.ellipse(p[0]-r*.22,p[1]-r*.15,r*.68,r*.56,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
 function railway(left,right,y){box((left+right)/2,y,.065,right-left,.62,.025,night?'#414d53':'#7b8480');for(let x=left+.12;x<right;x+=.23)box(x,y,.095,.075,.58,.025,'#6d6559');for(const off of[-.145,.145]){box((left+right)/2,y+off,.125,right-left,.028,.028,'#9dabb0');box((left+right)/2,y+off,.154,right-left,.018,.008,'#d5dfd7');}for(const x of[left+.4,right-.4]){box(x,y-.34,.10,.04,.04,1.02,'#8b9da0');box(x,y-.12,1.12,.04,.48,.035,'#b6c5bd');}const A=proj(left+.4,y,1.14),B=proj(right-.4,y,1.14);ctx.strokeStyle=night?'#7e9299':'#7d959b';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(...A);ctx.lineTo(...B);ctx.stroke();}
 function railUnit(unit,y,color,direction){const x=unit.x,locomotive=unit.locomotive,len=locomotive?.96:.98;
 // Bogies, four axles and an exposed underframe make the silhouette distinct from cars.
 box(x,y,.19,len,.34,.075,'#35464e');for(const offset of[-.30,.30]){box(x+offset,y,.11,.23,.30,.09,'#3d5056');for(const axle of[-.065,.065])for(const side of[-1,1]){const p=proj(x+offset+axle,y+side*.18,.135),r=Math.max(1.5,scale()*.055);ctx.fillStyle='#202c35';ctx.beginPath();ctx.ellipse(...p,r*.8,r,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#acb7b4';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(p[0],p[1]-r*.6);ctx.lineTo(p[0],p[1]+r*.6);ctx.stroke();}}
 if(locomotive){box(x-.04,y,.27,.80,.33,.25,color);box(x+.18,y,.52,.34,.33,.22,color);box(x+.18,y,.75,.39,.36,.045,'#d5dfd7');box(x+.42,y,.27,.13,.33,.17,'#d8dfce');
 const glass=[proj(x+.354,y-.12,.58),proj(x+.354,y+.12,.58),proj(x+.354,y+.12,.71),proj(x+.354,y-.12,.71)];poly(glass,night?'#f5dc9e':'#405e6c','#c7ded6');for(const side of[-1,1]){poly([proj(x+.07,y+side*.171,.58),proj(x+.27,y+side*.171,.58),proj(x+.27,y+side*.171,.71),proj(x+.07,y+side*.171,.71)],'#88b5bf','#d1ded3');const lamp=proj(x+.49,y+side*.105,.39);ctx.fillStyle=direction>0?'#ffe3a1':'#d38172';ctx.beginPath();ctx.arc(...lamp,Math.max(1,scale()*.025),0,7);ctx.fill();}
 for(const vent of[-.28,-.16,-.04])box(x+vent,y,.53,.065,.22,.025,'#4b656a');const panto=[proj(x-.20,y,.56),proj(x-.31,y,.80),proj(x-.20,y,1.00),proj(x-.09,y,.80)];poly(panto,null,'#c1cecb');
 }else{box(x,y,.27,.98,.34,.37,'#d6dfd8');box(x,y,.645,1.02,.36,.045,'#859b9c');box(x,y,.69,.90,.28,.025,'#bccbc3');for(const side of[-1,1]){for(let n=0;n<5;n++){const xx=x-.34+n*.145;poly([proj(xx-.045,y+side*.176,.44),proj(xx+.045,y+side*.176,.44),proj(xx+.045,y+side*.176,.60),proj(xx-.045,y+side*.176,.60)],night?'#efd99f':'#547c8b','#b5cecd');}box(x,y+side*.178,.36,.94,.014,.055,color);for(const dx of[-.42,.42])poly([proj(x+dx-.035,y+side*.181,.29),proj(x+dx+.035,y+side*.181,.29),proj(x+dx+.035,y+side*.181,.60),proj(x+dx-.035,y+side*.181,.60)],'#8fa9aa','#e4e5d6');}}
 // Visible couplings bridge the gap between the locomotive and the passenger coaches.
 box(x-.54,y,.23,.14,.065,.04,'#374a50');
 }
 function drawTrain(dx,y,v,color,progress,drawTrack){const layout=trainLayout(v.level,progress,dx);if(drawTrack)railway(layout.left,layout.right,y);layout.units.sort((a,b)=>proj(a.x,y)[1]-proj(b.x,y)[1]).forEach(unit=>railUnit(unit,y,color,layout.direction));}
 function frame(time){requestAnimationFrame(frame);if(time-last<40||!w||!canvas.offsetWidth)return;last=time;animationTime=reducedMotion?0:time;ctx.clearRect(0,0,w,h);const {s:raw,selected,filter,me=0}=getState();const s={...raw,assets:raw.assets.map(visualAsset)};hits=[];factoryActivity=new Set(s.assets.filter(a=>factoryIsWorking(s,a)).map(a=>a.id));const water=night?'#183744':'#294e59';const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,night?'#102531':'#234a52');bg.addColorStop(1,night?'#0a1b27':'#102c3a');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 box(9.75,12.75,-.4,32,33,.2,water);box(9.75,12.75,-.20,25,30,.18,night?'#3b5554':'#7a987f');box(9.75,12.75,-.015,24.8,29.8,.025,night?'#354d4b':'#9caf91');
 for(const y of[-1.275,3.975,6.225,11.475,13.725,18.975,21.225,26.475]){box(9.25,y,.02,23.1,.48,.016,night?'#354650':'#657578');for(let x=-1.8;x<21;x+=.75){const pt=proj(x,y,.055);ctx.fillStyle='#d2ccaf99';ctx.fillRect(...pt,3,1);}for(const off of[-.33,.33])box(9.25,y+off,.04,23.1,.13,.025,night?'#6b7a73':'#d1d1b9');}
 for(const x of[-2.025,5.475,12.975,20.475]){box(x,12.6,.022,.48,28,.018,night?'#354650':'#657578');for(const off of[-.33,.33])box(x+off,12.6,.044,.13,28,.024,night?'#6b7a73':'#d1d1b9');}
 for(const x of[5.475,12.975])for(const y of[3.975,11.475,18.975,26.475]){for(let i=0;i<5;i++)box(x-.27+i*.135,y,.06,.065,.50,.006,'#e4e2cb');}
 // Two outer promenades, joined at their ends: a separate, playable mission route.
 const path=ROUTE_STOPS.map(stop=>routePosition(stop.id));ctx.strokeStyle=night?'#b2a57b':'#d2c095';ctx.lineWidth=Math.max(3,scale()*.28);ctx.lineJoin='round';ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(...proj(p.x,p.y,.1)):ctx.moveTo(...proj(p.x,p.y,.1)));ctx.closePath();ctx.stroke();
 for(const stop of ROUTE_STOPS){const p=routePosition(stop.id),current=s.players[me].adventure?.position===stop.id,points=box(p.x,p.y,.12,.90,.90,.10,current?'#c4a264':stop.kind==='math'?'#748fa5':'#849b75',current?'#f9dea3':'#b2c5b0');hits.push({id:-2-stop.id,points});const pt=proj(p.x,p.y,.33);ctx.fillStyle='#f4eed5';ctx.font=`bold ${Math.max(10,scale()*.32)}px Arial`;ctx.textAlign='center';ctx.fillText(stop.icon,...pt);const num=proj(p.x,p.y+.49,.14);ctx.font=`${Math.max(8,scale()*.20)}px Arial`;ctx.fillStyle='#f2e2bb';ctx.fillText(String(stop.id+1).padStart(2,'0'),...num);if(zoom>=1.5||current){const label=proj(p.x+(p.x<0?-.8:.8),p.y,.3);ctx.font=`${Math.max(9,Math.min(12,scale()*.25))}px Arial`;ctx.textAlign=p.x<0?'right':'left';ctx.fillStyle='#e9e7d0';ctx.fillText(stop.name,...label);}}
 const items=[];

 for(const d of DISTRICTS){const {x:dx,y:dy}=districtOrigin(d.id);box(dx+2.25,dy+1.5,.03,5.8,4.45,.035,night?'#416454':'#93ac87');const nh=s.players.flatMap(p=>p.neighborhoods[d.id]?[{p,l:p.neighborhoods[d.id]}]:[]);if(nh.length)box(dx+2.25,dy+1.5,.07,5.75,4.40,.01,shade(nh[0].p.color,.55));
 for(let t=0;t<5;t++)items.push({depth:proj(dx-.3+t*1.15,dy+4.6)[1],draw:()=>tree(dx-.3+t*1.15,dy+4.6,.03,.8)});
 const label=proj(dx+2.25,dy-.85,.05);ctx.textAlign='center';ctx.font=`${Math.max(8,Math.min(11,scale()*.28))}px Arial`;ctx.fillStyle=night?'#bed3bd':'#cbd9c4';ctx.fillText(d.name,...label);ctx.font='7px Arial';ctx.fillStyle='#83aaa0';ctx.fillText(d.city,label[0],label[1]+11);
 for(const project of s.players.flatMap(p=>p.projects).filter(p=>p.district===d.id)){const index=Object.keys(PROJECTS).indexOf(project.kind),xx=dx+6.15,yy=dy-.2+index*.54,lv=project.level??1;items.push({depth:proj(xx,yy)[1],draw:()=>{const model=getBuildingModel('project:'+project.kind,lv);drawBuildingModel(ctx,model,(x,y,z)=>proj(xx+x*.52,yy+y*.52,z*.52),scale()*.52,night);const label=proj(xx,yy,model.bounds.maxZ*.52+.13);ctx.fillStyle='#d9eacb';ctx.font='7px Arial';ctx.textAlign='center';ctx.fillText(PROJECTS[project.kind].icon+' '+lv,...label);}});}


 }
 // Neutral skyline: civic background, never counted as player assets.
 for(const [x,type,l]of[[.4,'home',1],[2.1,'office',2],[4.9,'shop',1],[6.7,'hotel',2],[9.6,'office',3],[11.9,'home',2]]){const y=-2.45;items.push({depth:proj(x,y)[1],draw:()=>house({x,y,type,level:l,owner:null,green:false,manager:false})});}
 const lots=[...s.assets].sort((a,b)=>proj(a.x,a.y)[1]-proj(b.x,b.y)[1]);
 for(const a of lots){const dim=filter!==null&&filter!==a.district;ctx.globalAlpha=dim?.35:1;const owner=a.owner===null?null:s.players[a.owner],col=owner?shade(owner.color,night?.46:.64):night?'#637867':'#b7c0a0';const pts=box(a.x,a.y,.09,.92,.92,.05,col,owner?shade(owner.color,.9):'#c1cbb04a');hits.push({id:a.id,points:pts});if(a.level){const shadow=proj(a.x+.10,a.y+.12,.1);ctx.fillStyle='#09201d25';ctx.beginPath();ctx.ellipse(shadow[0],shadow[1],scale()*.43,scale()*.18,0,0,7);ctx.fill();}if(a.id===selected||a.id===hover)poly(pts,a.id===selected?'#7bffc51a':'#ffffff15',a.id===selected?'#d6ffe0':'#d5e1ca');ctx.globalAlpha=1;
 items.push({depth:proj(a.x,a.y)[1]+2,draw:()=>{ctx.globalAlpha=dim?.3:1;if(a.level)house(a);if(!a.level){for(const [xx,yy]of[[-.32,-.32],[.32,.32]])box(a.x+xx,a.y+yy,.15,.025,.025,.10,owner?owner.color:'#c0c5a5');if(!owner){const p=proj(a.x,a.y,.15);ctx.font=`${Math.max(7,scale()*.21)}px Arial`;ctx.textAlign='center';ctx.fillStyle='#e4e9d8';ctx.fillText('+',p[0],p[1]+2);}else{const p=proj(a.x,a.y,.17);ctx.font='7px Arial';ctx.textAlign='center';ctx.fillStyle='#d2e6cb';ctx.fillText('OWNED',...p);}}
 if(a.permit!=='none'){const p=proj(a.x-.3,a.y-.25,a.level?.8:.45);ctx.strokeStyle='#d6bd81';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(p[0],p[1]-13);ctx.stroke();poly([[p[0],p[1]-13],[p[0]+9,p[1]-10],[p[0],p[1]-7]],a.permit==='approved'?'#78e4ad':'#f2c980');}
 if(a.level){const hull=convexHull(propertyModel(a).vertices.map(([x,y,z])=>proj(a.x+x,a.y+y,z)));hits.push({id:a.id,points:hull});if(a.id===hover||a.id===selected){ctx.save();ctx.lineWidth=2;ctx.strokeStyle=a.id===selected?'#ffe0a3':'#d6ffe5';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=8;ctx.beginPath();hull.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.stroke();ctx.restore();}}ctx.globalAlpha=1;}});
 }
 // Civic buildings at the waterfront, distinguishable from player properties.
 items.push({depth:proj(9.5,28.3)[1],draw:()=>{const model=getBuildingModel('civic:cityhall',1);drawBuildingModel(ctx,model,(x,y,z)=>proj(9.5+x*1.3,28.3+y*1.3,z*1.3),scale()*1.3,night);const p=proj(9.5,28.3,1.55);ctx.fillStyle='#dbc589';ctx.textAlign='center';ctx.font='9px Arial';ctx.fillText('CITY HALL',...p);}});
 for(const p of s.players.filter(p=>!p.out)){
 const a=s.assets.find(a=>a.owner===p.id),r=p.adventure;if(!r?.lastMove)routeAnimations.delete(p.id);
 if(r?.lastMove){let anim=routeAnimations.get(p.id);if(!anim||anim.turn!==r.lastMove.turn){anim={turn:r.lastMove.turn,start:time};routeAnimations.set(p.id,anim);}const progress=reducedMotion?1:Math.min(1,(time-anim.start)/1700),eased=progress*progress*(3-2*progress),pos=routePoint(r.lastMove.from+r.lastMove.steps*eased);pos.x+=(p.id-1.5)*.12;items.push({depth:proj(pos.x,pos.y)[1]+4,draw:()=>{person(pos.x,pos.y,p.color,p.avatar,progress<1,p.id);const name=proj(pos.x,pos.y,.85);ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillStyle=p.color;ctx.fillText(p.id===me?'אתם':p.name.slice(0,10),...name);}});}
 else if(a){items.push({depth:proj(a.x+.5,a.y+.5)[1]+4,draw:()=>person(a.x+.5,a.y+.5,p.color,p.avatar,false)});}
 }
 for(const d of DISTRICTS){const {x:dx,y:dy}=districtOrigin(d.id);for(let i=0;i<2;i++){const t=reducedMotion?.35:(time/13000+i*.45+d.id*.17)%1,point=loopPoint([{x:dx-.75,y:dy+4.35},{x:dx+4.7,y:dy+4.35},{x:dx+4.7,y:dy+4.65},{x:dx-.75,y:dy+4.65}],t);items.push({depth:proj(point.x,point.y)[1]+3,draw:()=>person(point.x,point.y,['#b9c7d7','#d9b396'][i],0,true,i+d.id)});}}
 items.sort((a,b)=>a.depth-b.depth).forEach(i=>i.draw());
 for(const d of DISTRICTS){const {x:dx,y:dy}=districtOrigin(d.id),p=proj(dx+2.25,dy+5.35,.1),text=d.city+' / '+d.name;ctx.font=`${Math.max(8,Math.min(12,scale()*.30))}px Arial`;ctx.textAlign='center';const tw=ctx.measureText(text).width;ctx.fillStyle='#193138d9';ctx.fillRect(p[0]-tw/2-8,p[1]-10,tw+16,16);ctx.fillStyle='#dce6c9';ctx.fillText(text,p[0],p[1]+1);}

 // Property condition and defenses are public; mission paths are visible only to their owner.
 for(const a of lots.filter(a=>a.level)){
 const pt=proj(a.x,a.y,propertyModel(a).bounds.maxZ+.16),ww=Math.max(15,scale()*.6);
 if(a.health<100){ctx.fillStyle='#1b222be6';ctx.fillRect(pt[0]-ww/2,pt[1]-7,ww,5);ctx.fillStyle=a.health<60?'#f48676':'#e1bb79';ctx.fillRect(pt[0]-ww/2+1,pt[1]-6,(ww-2)*a.health/100,3);ctx.font=`${Math.max(8,scale()*.20)}px Arial`;ctx.textAlign='center';ctx.fillStyle='#ffb0a3';ctx.fillText('⚡ '+a.health+'%',pt[0],pt[1]-11);}
 const owner=s.players[a.owner];if(owner&&owner.shieldUntil>=s.round){const ring=proj(a.x,a.y,.13);ctx.strokeStyle='#83c8efb0';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(ring[0],ring[1],scale()*.65,scale()*.28,0,0,Math.PI*2);ctx.stroke();}
 if(a.owner===me&&a.security>0){const mark=proj(a.x+.34,a.y-.27,.25);ctx.fillStyle='#b5ddca';ctx.font=`${Math.max(9,scale()*.24)}px Arial`;ctx.textAlign='center';ctx.fillText('⬡',...mark);}
 }
 for(const op of (s.operations??[]).filter(op=>op.from===me)){
 const dest=s.assets[op.asset],origin=s.assets.find(a=>a.owner===me&&a.level);if(!dest||!origin)continue;const start=proj(origin.x,origin.y,.8),end=proj(dest.x,dest.y,.9),bend=[(start[0]+end[0])/2,Math.min(start[1],end[1])-45*zoom];
 ctx.save();ctx.strokeStyle=op.kind==='recon'?'#b5a6e7bc':'#e6b976c0';ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.lineDashOffset=-time/100;ctx.beginPath();ctx.moveTo(...start);ctx.quadraticCurveTo(...bend,...end);ctx.stroke();ctx.restore();ctx.font='15px Arial';ctx.textAlign='center';ctx.fillStyle='#f5d5a3';ctx.fillText(op.kind==='recon'?'◉':'⚔',end[0],end[1]-12);
 }

 // Fleet animation follows continuous closed street loops, with bodies turning at corners.
 const drawnRailways=new Set();
 for(const p of s.players)for(const [i,v] of p.fleet.entries()){const {x:dx,y:dy}=districtOrigin(v.district),t=reducedMotion?.4:(time/(v.kind==='train'?19000:v.kind==='bus'?25000:18000)+i*.21+p.id*.11)%1,points=[{x:dx-2.025,y:dy-1.275},{x:dx+5.475,y:dy-1.275},{x:dx+5.475,y:dy+3.975},{x:dx-2.025,y:dy+3.975}];
 if(v.kind==='train'){drawTrain(dx,dy+6.23,v,p.color,t,!drawnRailways.has(v.district));drawnRailways.add(v.district);}
 else{const point=loopPoint(points,t);vehicle(point.x,point.y,v,p.color,point.angle);}}
 for(const a of s.assets.filter(a=>isRetail(a)&&a.owner!==null&&a.level&&salesForecast(s,a)>0)){const count=Math.min(4,Math.ceil(salesForecast(s,a)/10));for(let i=0;i<count;i++){const t=reducedMotion?.4:(time/7000+i/count+a.id*.13)%1,travel=(1-Math.cos(t*Math.PI*2))/2;person(a.x+.30,a.y+1.02-travel*.63,['#f2c18f','#b3cbeb','#a7c59a','#d6adcc'][i%4],0,true,i);}}
 for(const p of s.players.filter(p=>p.lastTrip?.kind==='vacation'&&p.lastTrip.round===s.round)){const d=p.location,{x:dx,y:dy}=districtOrigin(d),t=reducedMotion?.5:(time/18000+p.id*.13)%1,pt=proj(dx-1+t*7,dy-1.7,1.5+Math.sin(t*Math.PI)*.8);ctx.textAlign='center';ctx.fillStyle='#edf5dc';ctx.font=`${Math.max(13,scale()*.45)}px Arial`;ctx.fillText('✈',...pt);}
 const identified=lots.find(a=>a.id===(hover>=0?hover:selected));if(identified?.level){const top=propertyModel(identified).bounds.maxZ,pt=proj(identified.x,identified.y,top+.32),name=BUILDINGS[identified.type].name+' · רמה '+identified.level;if(pt[0]>-80&&pt[0]<w+80&&pt[1]>-80&&pt[1]<h+80){ctx.save();ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.textBaseline='middle';const ww=Math.min(w-20,ctx.measureText(name).width+28),xx=Math.max(ww/2+8,Math.min(w-ww/2-8,pt[0])),yy=Math.max(19,Math.min(h-20,pt[1]));ctx.fillStyle='#142d35ed';ctx.fillRect(xx-ww/2,yy-14,ww,28);ctx.strokeStyle='#d4bb80';ctx.lineWidth=1;ctx.strokeRect(xx-ww/2,yy-14,ww,28);ctx.fillStyle='#f4e0b0';ctx.fillText(name,xx,yy,ww-12);ctx.restore();}}
 const selectedAsset=s.assets[selected];if(selectedAsset&&!selectedAsset.level){const p=proj(selectedAsset.x,selectedAsset.y,selectedAsset.level?propertyModel(selectedAsset).bounds.maxZ+.24:.45);ctx.fillStyle='#f5dfad';ctx.beginPath();ctx.moveTo(p[0],p[1]-6);ctx.lineTo(p[0]-4,p[1]-13);ctx.lineTo(p[0]+4,p[1]-13);ctx.fill();}
 }
 function inside(p,pts){let yes=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
 function pick(e){const b=canvas.getBoundingClientRect(),p=[e.clientX-b.left,e.clientY-b.top];return[...hits].reverse().find(a=>inside(p,a.points))?.id??-1;}
 const pointers=new Map();
 const pinch=()=>{const [first,second]=[...pointers.values()];return {x:(first.x+second.x)/2,y:(first.y+second.y)/2,distance:Math.hypot(first.x-second.x,first.y-second.y)};};
 let gesture=null;
 canvas.addEventListener('pointerdown',event=>{
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(pointers.size===1){drag={x:event.clientX,y:event.clientY,px:panX,py:panY};moved=false;}
  else {gesture=pinch();drag=null;moved=true;}
  canvas.setPointerCapture(event.pointerId);
 });
 const releasePointer=event=>{
  pointers.delete(event.pointerId);gesture=null;drag=null;
  if(pointers.size>=2)gesture=pinch();
  else if(pointers.size===1){const point=[...pointers.values()][0];drag={x:point.x,y:point.y,px:panX,py:panY};}
 };
 canvas.addEventListener('pointerup',releasePointer);
 canvas.addEventListener('pointercancel',event=>{moved=true;releasePointer(event);});
 canvas.addEventListener('pointermove',event=>{
  if(pointers.has(event.pointerId))pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(gesture&&pointers.size>=2){
   const next=pinch(),rect=canvas.getBoundingClientRect();
   if(gesture.distance>0)zoomAt(gesture.x-rect.left,gesture.y-rect.top,next.distance/gesture.distance);
   panX+=next.x-gesture.x;panY+=next.y-gesture.y;gesture=next;
  }else if(drag){
   const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
   if(Math.abs(dx)+Math.abs(dy)>6)moved=true;
   if(moved){panX=drag.px+dx;panY=drag.py+dy;}
  }
  hover=pick(event);canvas.style.cursor=hover===-1?'default':'pointer';
 });
 canvas.addEventListener('pointerleave',()=>hover=-1);canvas.addEventListener('click',e=>{const n=pick(e);if(!moved){if(n>=0)onPick(n);else if(n<=-2)onRoutePick(-n-2);}});const viewport=canvas.parentElement??canvas;viewport.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,wheelFactor(e.deltaY,e.deltaMode,h));},{passive:false});requestAnimationFrame(frame);onZoom(zoom);
 return{focusAsset:id=>{const a=visualAsset(getState().s.assets[id]);focus={x:a.x,y:a.y};zoom=4;panX=0;panY=0;onZoom(zoom);},focusRoute:id=>{focus=routePosition(id);zoom=2.7;panX=0;panY=0;onZoom(zoom);},focus:d=>{focus=d===null?null:{x:d%3*7.5+2.25,y:Math.floor(d/3)*7.5+1.5};zoom=d===null?1:3.1;panX=0;panY=0;onZoom(zoom);},zoom:v=>zoomAt(w*.5,h*.5,(Math.max(.4,Math.min(6,zoom+v)))/zoom),rotate:()=>rotation=(rotation+1)%4,toggleNight:()=>{night=!night;return night;}};
}
