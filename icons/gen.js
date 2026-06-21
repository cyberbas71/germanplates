// Pure-Node PNG icon generator (no deps). Draws the app tile:
// blue squircle, EU gold star-dot ring, white "D" monogram.
// Usage: node icons/gen.js  -> writes icon-192.png and icon-512.png
const zlib = require('zlib');
const fs = require('fs');

function crc32(buf){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=(c>>>1)^(0xEDB88320&-(c&1));}return(~c)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length,0);const t=Buffer.from(type,'ascii');const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,data])),0);return Buffer.concat([len,t,data,crc]);}
function png(W,H,draw){
  const px=Buffer.alloc(W*H*4);
  const set=(x,y,r,g,b,a=255)=>{x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return;const o=(y*W+x)*4;
    const ia=a/255, ib=1-ia;
    px[o]=r*ia+px[o]*ib; px[o+1]=g*ia+px[o+1]*ib; px[o+2]=b*ia+px[o+2]*ib; px[o+3]=Math.max(px[o+3],a);};
  draw(set,W,H);
  const raw=Buffer.alloc(H*(W*4+1));
  for(let y=0;y<H;y++){raw[y*(W*4+1)]=0;px.copy(raw,y*(W*4+1)+1,y*W*4,(y+1)*W*4);}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
const inRR=(x,y,rx,ry,rw,rh,r)=>{if(x<rx||y<ry||x>=rx+rw||y>=ry+rh)return false;const cx=Math.min(Math.max(x,rx+r),rx+rw-r),cy=Math.min(Math.max(y,ry+r),ry+rh-r),dx=x-cx,dy=y-cy;return dx*dx+dy*dy<=r*r||(x>=rx+r&&x<rx+rw-r)||(y>=ry+r&&y<ry+rh-r);};

// "D" silhouette in 512-space
const Ty=170,By=342,Cy=256,Lx=198,Cx=236,Rx=322,a=Rx-Cx,b=(By-Ty)/2,t=34;
function inSil(x,y,ax,bx){ // ax,bx = ellipse radii
  if(y<Cy-bx||y>Cy+bx) return false;
  if(x>=Lx && x<=Cx) return true;
  if(x>Cx){const dx=(x-Cx)/ax, dy=(y-Cy)/bx; return dx*dx+dy*dy<=1;}
  return false;
}
const isD=(x,y)=>{
  const outer = inSil(x,y,a,b) && x>=Lx;
  if(!outer) return false;
  // counter (hole)
  const inner = (y>Ty+t && y<By-t) && ((x>=Lx+t && x<=Cx) || (x>Cx && ((x-Cx)/(a-t))**2+((y-Cy)/(b-t))**2<=1));
  return !inner;
};
// 12 gold dots (512-space) from favicon
const DOTS=[[256,106],[331,126.1],[385.9,181],[406,256],[385.9,331],[331,385.9],[256,406],[181,385.9],[126.1,331],[106,256],[126.1,181],[181,126.1]];

function render(S){
  const k=S/512;
  return (set)=>{
    for(let y=0;y<S;y++) for(let x=0;x<S;x++){
      if(!inRR(x,y,0,0,S,S,116*k)){ set(x,y,0,0,0,0); continue; }
      // vertical blue gradient #0a84ff -> #006fe6
      const f=y/S;
      set(x,y, Math.round(10+(0-10)*f), Math.round(132+(111-132)*f), Math.round(255+(230-255)*f), 255);
    }
    // gold dots
    const dr=12*k;
    for(const [dx,dy] of DOTS){
      const cx=dx*k, cy=dy*k;
      for(let y=Math.floor(cy-dr-1);y<=cy+dr+1;y++) for(let x=Math.floor(cx-dr-1);x<=cx+dr+1;x++){
        const d=Math.hypot(x-cx,y-cy); if(d<=dr) set(x,y,255,204,0,255);
        else if(d<=dr+1) set(x,y,255,204,0,Math.round(255*(dr+1-d)));
      }
    }
    // white D (supersample 2x for smooth edges)
    for(let y=0;y<S;y++) for(let x=0;x<S;x++){
      let hit=0;
      for(let sy=0;sy<2;sy++) for(let sx=0;sx<2;sx++){
        const X=((x+(sx+.5)/2)/k), Y=((y+(sy+.5)/2)/k);
        if(isD(X,Y)) hit++;
      }
      if(hit) set(x,y,255,255,255,Math.round(255*hit/4));
    }
  };
}
[[192,'icon-192.png'],[512,'icon-512.png']].forEach(([s,name])=>{
  fs.writeFileSync(__dirname+'/'+name, png(s,s,render(s)));
  console.log('wrote',name);
});
