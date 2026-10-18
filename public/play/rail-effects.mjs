import {stackLayout} from './building-models.mjs?v=14';
import {BUILDINGS,factoryOutput,assetIncome} from './game.mjs?v=13';
export function factoryIsWorking(s,a){if(a.owner===null||!a.level||!s.players[a.owner]||s.players[a.owner].out)return false;return BUILDINGS[a.type]?.produces?factoryOutput(s,a)>0:a.type==='factory'&&assetIncome(s,a)>0;}
export function factoryStacks(a){return stackLayout(a.type,a.level??1).map(stack=>({...stack,x:a.x+stack.x,y:a.y+stack.y}));}
// Deterministic visual particles: no game RNG, timers, inventory or money mutation.
export function smokeParticles(a,time,reducedMotion=false){if(reducedMotion)return[];return factoryStacks(a).flatMap((stack,index)=>Array.from({length:7},(_,n)=>{const age=((time/2700+n/7+(a.id??0)*.173+index*.37)%1+1)%1;return{x:stack.x+age*.28+Math.sin(age*5+index)*.025,y:stack.y+age*.10,z:stack.z+.04+age*(.78+(a.level??1)*.04),radius:.045+age*.17,alpha:Math.sin(Math.min(1,age*5)*Math.PI/2)*(1-age)**1.5*.42};}));}
export function trainLayout(level,progress,originX=0){const coaches=Math.min(3,Math.max(1,Math.ceil(level/2))),pitch=1.04,left=originX-1.5,right=originX+5.5,t=((progress%1)+1)%1,ping=(1-Math.cos(t*Math.PI*2))/2,head=left+.64+coaches*pitch+ping*(right-left-1.28-coaches*pitch);return{left,right,direction:t<.5?1:-1,units:Array.from({length:coaches+1},(_,i)=>({x:head-i*pitch,locomotive:i===0,index:i}))};}
