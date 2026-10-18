export const LOT_SPACING=1.5;
export const districtOrigin=d=>({x:d%3*7.5,y:Math.floor(d/3)*7.5});
export const visualAsset=a=>({...a,x:a.x*LOT_SPACING,y:a.y*LOT_SPACING});
export function routePosition(id){const n=((id%16)+16)%16;return n<8?{x:-4.6,y:-.3+n*3.85}:{x:23.4,y:-.3+(15-n)*3.85};}
export function routePoint(step){const base=Math.floor(step),t=step-base,a=routePosition(base),b=routePosition(base+1);return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
export function loopPoint(points,progress){
 const n=points.length,t=((progress%1)+1)%1*n,i=Math.floor(t),u=t-i,a=points[i],b=points[(i+1)%n],r=.035;
 const corner=(c,prev,next,v)=>{const start={x:c.x+(prev.x-c.x)*r,y:c.y+(prev.y-c.y)*r},end={x:c.x+(next.x-c.x)*r,y:c.y+(next.y-c.y)*r},dx=2*(1-v)*(c.x-start.x)+2*v*(end.x-c.x),dy=2*(1-v)*(c.y-start.y)+2*v*(end.y-c.y);return{x:(1-v)**2*start.x+2*v*(1-v)*c.x+v*v*end.x,y:(1-v)**2*start.y+2*v*(1-v)*c.y+v*v*end.y,angle:Math.atan2(dy,dx)};};
 if(u<r)return corner(a,points[(i+n-1)%n],b,.5+u/(2*r));
 if(u>1-r)return corner(b,a,points[(i+2)%n],(u-1+r)/(2*r));
 return{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,angle:Math.atan2(b.y-a.y,b.x-a.x)};
}
export function convexHull(points){const ps=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],hi=[];for(const p of ps){while(lo.length>=2&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of [...ps].reverse()){while(hi.length>=2&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
