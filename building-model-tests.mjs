import test from 'node:test';
import assert from 'node:assert/strict';
import {getBuildingModel,projectedFaces,buildingSVG,stackLayout,MODEL_TYPES} from './public/play/building-models.mjs';
import {BUILDINGS,PROJECTS,createGame} from './public/play/game.mjs';
import {factoryStacks,smokeParticles} from './public/play/rail-effects.mjs';
const shape=m=>JSON.stringify(m.faces.map(f=>f.points));
const projection=r=>(x,y,z)=>{const a=r*Math.PI/2,xx=x*Math.cos(a)-y*Math.sin(a),yy=x*Math.sin(a)+y*Math.cos(a);return[130+(xx-yy)*100,120+(xx+yy)*46-z*100];};
test('All 25 property types have different geometry, with five distinct completed development stages each',()=>{
 const all=new Set();assert.equal(Object.keys(BUILDINGS).length,25);
 for(const type of Object.keys(BUILDINGS)){const stages=new Set();for(let level=1;level<=5;level++){const model=getBuildingModel(type,level),fingerprint=shape(model);stages.add(fingerprint);all.add(fingerprint);assert.ok(model.vertices.length>=8);assert.ok(model.bounds.minX>=-.56&&model.bounds.maxX<=.56&&model.bounds.minY>=-.56&&model.bounds.maxY<=.56,type+' must fit with space between parcels');for(const f of model.faces){assert.match(f.color,/^#[0-9a-f]{6}$/i);assert.ok(f.points.length>=3);for(const p of f.points)assert.ok(p.length===3&&p.every(Number.isFinite));}}assert.equal(stages.size,5,type+' must change shape through every development level');}
 assert.equal(all.size,125,'Changing only a color must never count as a distinct building');
});
test('Each public facility has its own model and completed development stages',()=>{
 const shapes=new Set();for(const kind of Object.keys(PROJECTS)){const type='project:'+kind;assert.ok(MODEL_TYPES.includes(type));const stages=Array.from({length:5},(_,i)=>shape(getBuildingModel(type,i+1)));assert.equal(new Set(stages).size,5,kind);shapes.add(stages[2]);}assert.equal(shapes.size,7);assert.ok(getBuildingModel('civic:cityhall').vertices.length>20);
});
test('All buildings remain visible from every map rotation, including reduced detail and night lighting',()=>{
 for(const type of Object.keys(BUILDINGS))for(let level=1;level<=5;level++)for(let r=0;r<4;r++){const model=getBuildingModel(type,level),faces=projectedFaces(model,projection(r),100),night=projectedFaces(model,projection(r),100,true),small=projectedFaces(model,projection(r),15,false,false);assert.ok(faces.length>3,type);assert.ok(small.length>3);assert.equal(night.length,faces.length);assert.ok(faces.every(f=>f.points.flat().every(Number.isFinite)));assert.ok(faces.every((f,i)=>i===0||f.depth>=faces[i-1].depth));}
});
test('SVG previews use the same models, fit their frame at every level, and do not duplicate DOM IDs',()=>{
 const previews=new Set();for(const type of Object.keys(BUILDINGS))for(let level=1;level<=5;level++){const svg=buildingSVG(type,level);previews.add(svg);assert.ok(!/NaN|Infinity|\bid=/.test(svg));for(const d of svg.matchAll(/\bd="([^"]+)"/g)){const numbers=d[1].match(/-?\d+(?:\.\d+)?/g).map(Number);for(let i=0;i<numbers.length;i++)assert.ok(numbers[i]>=0&&numbers[i]<=(i%2?190:260),type+' SVG clipping');}}assert.equal(previews.size,125);
});
test('Every animated smoke source starts at the shared factory chimney geometry',()=>{
 for(const type of Object.keys(BUILDINGS))for(let level=1;level<=5;level++){const a={id:3,type,level,x:12,y:7},local=stackLayout(type,level),world=factoryStacks(a),model=getBuildingModel(type,level);assert.equal(local.length,world.length);for(let i=0;i<local.length;i++){const s=local[i];assert.equal(world[i].x,12+s.x);assert.equal(world[i].y,7+s.y);assert.ok(model.vertices.some(([x,y,z])=>Math.abs(x-s.x)<s.width&&Math.abs(y-s.y)<s.width&&Math.abs(z-s.z)<.01));}assert.equal(smokeParticles(a,800).length,local.length*7);assert.equal(smokeParticles(a,800,true).length,0);}
});
test('Property bodies remain selectable for the complete model catalog at all four map rotations',async()=>{
 const original={ResizeObserver:globalThis.ResizeObserver,requestAnimationFrame:globalThis.requestAnimationFrame,devicePixelRatio:globalThis.devicePixelRatio};let frame;const handlers={},chosen=[];globalThis.ResizeObserver=class{constructor(cb){this.cb=cb;}observe(){this.cb();}};globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=fn=>frame=fn;
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*5})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),canvas={offsetWidth:800,parentElement:{addEventListener(){}},getContext:()=>ctx,getBoundingClientRect:()=>({width:800,height:505,left:0,top:0}),addEventListener:(name,fn)=>handlers[name]=fn,style:{}};
 try{const{createCity}=await import('./public/play/city.mjs');const s=createGame('QA','smart',123),city=createCity(canvas,()=>({s,selected:0,filter:null,me:0}),n=>chosen.push(n));city.focusAsset(0);let time=80;for(const type of Object.keys(BUILDINGS))for(const level of[1,5]){Object.assign(s.assets[0],{type,level,owner:0});for(let r=0;r<4;r++){const before=JSON.stringify(s);frame(time+=80);assert.equal(JSON.stringify(s),before,'rendering must not change saved state');handlers.click({clientX:800*.51,clientY:505*.54-10});assert.equal(chosen.at(-1),0,type+' '+level+' rotation '+r);city.rotate();}}}finally{Object.assign(globalThis,original);}
});
