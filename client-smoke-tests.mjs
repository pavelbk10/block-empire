// Code-level DOM smoke checks; not a substitute for real browser/mobile visual QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from './public/play/game.mjs';
import {TUTORIAL_STEPS,shouldShowTutorial,saveTutorialPreference} from './public/play/tutorial.mjs';
test('Interactive tutorial covers the core loop and remembers whether to show again',()=>{
 const preferences=new Map(),storage={getItem:key=>preferences.get(key)??null,setItem:(key,value)=>preferences.set(key,value)};
 assert.equal(TUTORIAL_STEPS.length,6);
 assert.deepEqual(TUTORIAL_STEPS.map(step=>step.target),['.city-canvas','#inspector-actions','.metric-grid','#tab-view','#trivia','#end-turn']);
 assert.equal(shouldShowTutorial(storage),true);
 assert.equal(saveTutorialPreference(storage,false),true);assert.equal(shouldShowTutorial(storage),false);
 assert.equal(saveTutorialPreference(storage,true),true);assert.equal(shouldShowTutorial(storage),true);
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.equal(shouldShowTutorial(blocked),true);assert.equal(saveTutorialPreference(blocked,false),false);
});
test('Game setup credits Pavel Barak before the play options',()=>{
 const html=readFileSync('./public/play/index.html','utf8');
 const welcome=html.split('<dialog id="welcome">')[1].split('</dialog>')[0];
 assert.ok(welcome.includes('<div class="creator-credit">המשחק נבנה על ידי <bdi dir="ltr">Pavel Barak</bdi></div>'));
 assert.ok(welcome.indexOf('creator-credit')<welcome.indexOf('<label for="name">'));
});
test('Phone layout leaves the desktop document untouched',async()=>{
 const originalDocument=globalThis.document,originalMatchMedia=globalThis.matchMedia;
 let mediaQuery,listener;
 try{
  globalThis.matchMedia=query=>{mediaQuery=query;return {matches:false,addEventListener(event,callback){assert.equal(event,'change');listener=callback;}};};
  globalThis.document={readyState:'complete',querySelector(){assert.fail('Desktop must not move or create interface elements');}};
  await import('./public/play/mobile-ui.mjs?desktop-smoke');
  assert.equal(mediaQuery,'(max-width: 680px)');
  assert.equal(typeof listener,'function');
  listener();
 }finally{
  globalThis.document=originalDocument;
  if(originalMatchMedia===undefined)delete globalThis.matchMedia;
  else globalThis.matchMedia=originalMatchMedia;
 }
});
test('Mobile install assets and offline shell cover every local game module',()=>{
 const html=readFileSync('./public/play/index.html','utf8');
 const manifest=JSON.parse(readFileSync('./public/play/manifest.webmanifest','utf8'));
 assert.equal(manifest.display,'standalone');
 for(const base of ['https://qa.example/play/','https://qa.example/block-empire/play/']){
  assert.equal(new URL(manifest.start_url,base).href,base+'index.html');
  assert.equal(new URL(manifest.scope,base).href,base);
 }
 assert.ok(html.includes('href="mobile.css?v=2"'));
 assert.ok(html.includes('href="manifest.webmanifest"'));
 const worker=readFileSync('./public/play/sw.js','utf8');
 const shell=[...worker.matchAll(/'\.\/([^']+)'/g)].map(match=>match[1].split('?')[0]);
 for(const asset of shell){
  const source=readFileSync('./public/play/'+asset,'utf8');
  if(!asset.endsWith('.mjs'))continue;
  for(const dependency of source.matchAll(/from\s*['"]\.\/([^'"?]+)(?:\?[^'"]*)?['"]/g))assert.ok(shell.includes(dependency[1]),dependency[1]);
 }
 assert.ok(!shell.some(asset=>asset.startsWith('/api/')));
});
test('Client initializes a saved conflict city and renders every navigation panel without missing DOM references',async()=>{
 const html=readFileSync('./public/play/index.html','utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);const missing=[],managementRequests=[];const handlers={},mapHandlers={};let lastSaved=null,mapFrame;
 const node=id=>({id,value:id==='duration'||id==='room-duration'?'80':id==='difficulty'?'smart':'בדיקה',hidden:false,open:false,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;},scrollIntoView(options){this.lastScroll=options;},select(){},innerHTML:'',textContent:'',getBoundingClientRect:()=>({width:800,height:505,left:0,top:0})});
 const nodes=new Map(ids.map(id=>[id,node(id)])),canvas=nodes.get('city');canvas.offsetWidth=800;canvas.setPointerCapture=()=>{};canvas.parentElement={addEventListener(){}};canvas.addEventListener=(event,fn)=>mapHandlers[event]=fn;canvas.getContext=()=>new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*6})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const saved=createGame();saved.round=4;Object.assign(saved.assets[0],{owner:0,type:'home',level:1,health:50,security:2});Object.assign(saved.assets[1],{owner:0,type:'cafe',level:1,stock:40,permit:'approved'});Object.assign(saved.assets[2],{owner:0,type:'cementworks',level:1,outputStock:0});Object.assign(saved.assets[12],{owner:1,type:'cafe',level:1,stock:40});saved.players[0].reports=[{title:'דוח בדיקה',text:'מצב תקין',kind:'success',round:4,asset:0}];saved.players[0].intel=[{target:1,round:3,expires:5,guards:1,vault:1,training:1,crew:{spies:2,enforcers:1},assets:[{id:12,health:100,security:1}]}];
 const originals={document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage,location:globalThis.location,history:globalThis.history,ResizeObserver:globalThis.ResizeObserver,requestAnimationFrame:globalThis.requestAnimationFrame,setInterval:globalThis.setInterval,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,innerWidth:globalThis.innerWidth,devicePixelRatio:globalThis.devicePixelRatio};
 try{Object.assign(globalThis,{document:{getElementById:id=>{if(!nodes.has(id)){missing.push(id);return null;}return nodes.get(id);},querySelectorAll:()=>[],addEventListener:(event,fn)=>(handlers[event]??=[]).push(fn),dispatchEvent(event){managementRequests.push(event.type);for(const handler of handlers[event.type]??[])handler(event);return true;}},window:{addEventListener(){}},localStorage:{getItem:key=>key==='block-empire-v5'?JSON.stringify(saved):null,setItem(key,value){if(key==='block-empire-v5')lastSaved=JSON.parse(value);}},location:{href:'https://qa.example/play/',search:''},history:{replaceState(){}},ResizeObserver:class{constructor(cb){this.cb=cb;}observe(){this.cb();}},requestAnimationFrame(fn){mapFrame=fn;},setInterval(){},setTimeout(){return 0;},clearTimeout(){},innerWidth:1300,devicePixelRatio:1});
 await import('./public/play/app.mjs?client-smoke');assert.equal(missing.length,0);assert.ok(nodes.get('inspector-actions').innerHTML.includes('תיקון מלא'));assert.ok(nodes.get('war-status').innerHTML.includes('מבנים פגועים'));
 mapFrame(100);mapHandlers.click({clientX:449,clientY:127});assert.equal(nodes.get('property-modal').open,false);assert.ok(nodes.get('inspector-actions').innerHTML.includes('היתר פיתוח'));assert.equal(nodes.get('inspector-actions').lastScroll.block,'start');assert.ok(nodes.get('property-kind').innerHTML.includes('רמה 1 מתוך 5'));
 nodes.get('property-illustration').onclick();assert.equal(nodes.get('property-modal').open,true);assert.ok(nodes.get('property-detail').innerHTML.includes('בית מגורים'));assert.ok(nodes.get('property-detail').innerHTML.includes('property-card-art'));
 const firstAngle=nodes.get('property-detail').innerHTML;nodes.get('property-rotate').onclick();assert.notEqual(nodes.get('property-detail').innerHTML,firstAngle);nodes.get('property-light').onclick();assert.ok(nodes.get('property-detail').innerHTML.includes('property-card-art night'));assert.ok(nodes.get('property-light').textContent.includes('יום'));nodes.get('property-manage').onclick();assert.equal(nodes.get('property-modal').open,false);
 globalThis.innerWidth=390;
 for(let attempt=0;attempt<2;attempt++){
  mapHandlers.click({clientX:449,clientY:127});
  assert.equal(nodes.get('property-modal').open,false);
  assert.ok(nodes.get('inspector-actions').innerHTML.includes('היתר פיתוח'));
  assert.equal(nodes.get('inspector-actions').lastScroll.block,'start');
 }
 assert.deepEqual(managementRequests,['property-manage-request','property-manage-request']);
 nodes.get('property-illustration').onclick();assert.equal(nodes.get('property-modal').open,true);nodes.get('property-modal').close();
 globalThis.innerWidth=1300;
 const initialZoom=Number.parseInt(nodes.get('zoom-label').textContent);
 mapHandlers.pointerdown({pointerId:1,clientX:200,clientY:200});
 mapHandlers.pointerdown({pointerId:2,clientX:300,clientY:200});
 mapHandlers.pointermove({pointerId:2,clientX:400,clientY:200});
 assert.ok(Number.parseInt(nodes.get('zoom-label').textContent)>initialZoom);
 mapHandlers.pointerup({pointerId:2});mapHandlers.pointerup({pointerId:1});
 mapHandlers.click({clientX:449,clientY:127});assert.equal(nodes.get('property-modal').open,false);

 for(const tab of [...html.matchAll(/data-tab="([^"]+)"/g)].map(m=>m[1])){const t={dataset:{tab}};const event={target:{closest:selector=>selector==='[data-tab]'?t:null}};for(const fn of handlers.click??[])await fn(event);if(tab!=='city')assert.ok(nodes.get('tab-view').innerHTML.length>100,tab);}
 assert.equal(missing.length,0);const event={target:{closest:sel=>sel==='[data-war-target]'?{dataset:{warTarget:'12'}}:null}};for(const fn of handlers.click)await fn(event);assert.ok(nodes.get('tab-view').innerHTML.includes('שליחת מרגל'));assert.ok(nodes.get('tab-view').innerHTML.includes('דוח בדיקה'));assert.ok(nodes.get('tab-view').innerHTML.includes('בתוקף עד סוף רבעון 5'));
 const click=async(selector,element)=>{const e={target:{closest:q=>q===selector?element:null}};for(const fn of handlers.click)await fn(e);};
 await click('[data-tab]',{dataset:{tab:'adventures'}});assert.ok(nodes.get('tab-view').innerHTML.includes('16 תחנות'));assert.ok(nodes.get('tab-view').innerHTML.includes('extend-goal'));
 await click('[data-cmd]',{dataset:{cmd:'routeMove',arg:'null'},disabled:false});assert.equal(lastSaved.players[0].adventure.visits,1);assert.ok(nodes.get('route-dock').innerHTML.includes('routeAnswer'));const task=lastSaved.players[0].adventure.challenge,balance=lastSaved.players[0].cash;
 await click('[data-cmd]',{dataset:{cmd:'routeAnswer',arg:String(task.answer)},disabled:false});assert.equal(lastSaved.players[0].cash,balance+task.reward);assert.ok(nodes.get('route-dock').innerHTML.includes('פתרון נכון'));
 nodes.set('extend-goal',{...node('extend-goal'),value:'0'});nodes.set('extend-rounds',{...node('extend-rounds'),value:'0'});
 await click('#extend-season',{});assert.equal(lastSaved.goal,0);assert.equal(lastSaved.maxRounds,0);assert.ok(nodes.get('season-limit').textContent.includes('ללא מגבלת רבעונים'));assert.ok(!nodes.get('prestige').textContent.includes('NaN'));
 // Exercise the actual delegated exchange controls and the quoted command button.
 await click('[data-tab]',{dataset:{tab:'exchange'}});assert.ok(nodes.get('tab-view').innerHTML.includes('מדד האימפריה'));
 await click('[data-stock-symbol]',{dataset:{stockSymbol:'TEC'}});
 const preview={innerHTML:''},form={querySelector:()=>preview};
 const input=async value=>{for(const fn of handlers.input??[])await fn({target:{dataset:{exchangeField:'quantity'},value,closest:()=>form}});};
 const quotedClick=async(cmd,html)=>{const m=[...html.matchAll(/data-cmd="([^"]+)" data-arg="([^"]+)"/g)].find(m=>m[1]===cmd);assert.ok(m,cmd);await click('[data-cmd]',{dataset:{cmd,arg:m[2].replaceAll('&quot;','"').replaceAll('&amp;','&')},disabled:false});};
 await click('[data-trade-mode]',{dataset:{tradeMode:'callBuy'}});await input('3');assert.ok(preview.innerHTML.includes('מחיר מימוש'));
 await quotedClick('callBuy',preview.innerHTML);assert.equal(lastSaved.players[0].exchange.calls[0].quantity,3);assert.ok(nodes.get('tab-view').innerHTML.includes('פקיעה Q8'));
 await quotedClick('callSell',nodes.get('tab-view').innerHTML);assert.equal(lastSaved.players[0].exchange.calls.length,0);
 await click('[data-trade-mode]',{dataset:{tradeMode:'shortOpen'}});await input('2');assert.ok(preview.innerHTML.includes('150%'));await quotedClick('shortOpen',preview.innerHTML);assert.equal(lastSaved.players[0].exchange.shorts[0].quantity,2);
 await click('[data-trade-mode]',{dataset:{tradeMode:'stockBuy'}});await input('1');await quotedClick('stockBuy',preview.innerHTML);assert.equal(lastSaved.players[0].exchange.shares.TEC.quantity,1);assert.equal(missing.length,0);
 for(const [asset,command] of [['0','permit'],['1','build'],['3','businessBuy'],['3','buy']]){
  await click('[data-asset]',{dataset:{asset}});assert.equal(nodes.get('property-modal').open,false);assert.ok(nodes.get('inspector-actions').innerHTML.includes(`data-cmd="${command}"`));assert.equal(nodes.get('inspector-actions').lastScroll.block,'start');
 }
 await click('[data-asset]',{dataset:{asset:'12'}});assert.equal(nodes.get('property-modal').open,false);assert.ok(nodes.get('inspector-actions').innerHTML.includes('הצעה ישירה לבעלים'));nodes.get('property-illustration').onclick();assert.equal(nodes.get('property-modal').open,true);assert.ok(nodes.get('property-detail').innerHTML.includes('בית קפה'));assert.ok(nodes.get('property-manage').textContent.includes('הצעת רכישה'));nodes.get('property-on-map').onclick();assert.equal(nodes.get('property-modal').open,false);assert.equal(missing.length,0);
 globalThis.innerWidth=390;
 await click('[data-tab]',{dataset:{tab:'portfolio'}});
 assert.ok(nodes.get('tab-view').innerHTML.includes('מלאי: <b>40</b>'));
 assert.ok(nodes.get('tab-view').innerHTML.includes('מלאי: <b>0</b>'));
 assert.equal([...nodes.get('tab-view').innerHTML.matchAll(/class="property-stock"/g)].length,2);
 await click('[data-asset]',{dataset:{asset:'0'}});
 assert.equal(nodes.get('property-modal').open,false);assert.equal(nodes.get('city-view').hidden,false);assert.ok(nodes.get('inspector-actions').innerHTML.includes('היתר פיתוח'));
 await click('[data-asset]',{dataset:{asset:'1'}});
 assert.equal(nodes.get('property-modal').open,false);assert.ok(nodes.get('inspector-actions').innerHTML.includes('פיתוח לרמה 2'));assert.ok(nodes.get('inspector-actions').innerHTML.includes('חידוש מלאי'));
 await click('[data-asset]',{dataset:{asset:'12'}});
 assert.equal(nodes.get('property-modal').open,false);assert.ok(nodes.get('inspector-actions').innerHTML.includes('הגשת הצעה'));



 }finally{Object.assign(globalThis,originals);}
});
