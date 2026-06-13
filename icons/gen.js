// Pure-Node PNG icon generator (no deps). Draws the app tile.
// Usage: node icons/gen.js  -> writes icon-192.png and icon-512.png
const zlib = require('zlib');
const fs = require('fs');

function crc32(buf){
  let c=~0;
  for(let i=0;i<buf.length;i++){
    c^=buf[i];
    for(let k=0;k<8;k++) c = (c>>>1) ^ (0xEDB88320 & -(c&1));
  }
  return (~c)>>>0;
}
function chunk(type, data){
  const len=Buffer.alloc(4); len.writeUInt32BE(data.length,0);
  const t=Buffer.from(type,'ascii');
  const crc=Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t,data])),0);
  return Buffer.concat([len,t,data,crc]);
}
function png(W,H,draw){
  const px=Buffer.alloc(W*H*4);
  const set=(x,y,r,g,b,a=255)=>{
    if(x<0||y<0||x>=W||y>=H)return;
    const o=(y*W+x)*4; px[o]=r;px[o+1]=g;px[o+2]=b;px[o+3]=a;
  };
  draw(set,W,H);
  const raw=Buffer.alloc(H*(W*4+1));
  for(let y=0;y<H;y++){
    raw[y*(W*4+1)]=0;
    px.copy(raw, y*(W*4+1)+1, y*W*4, (y+1)*W*4);
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(W,0); ihdr.writeUInt32BE(H,4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',zlib.deflateSync(raw)), chunk('IEND',Buffer.alloc(0))]);
}
const inRR=(x,y,rx,ry,rw,rh,r)=>{
  if(x<rx||y<ry||x>=rx+rw||y>=ry+rh)return false;
  const cx=Math.min(Math.max(x,rx+r),rx+rw-r);
  const cy=Math.min(Math.max(y,ry+r),ry+rh-r);
  const dx=x-cx, dy=y-cy;
  return dx*dx+dy*dy <= r*r || (x>=rx+r&&x<rx+rw-r) || (y>=ry+r&&y<ry+rh-r);
};
function render(S){
  const k=S/512;
  return (set)=>{
    for(let y=0;y<S;y++) for(let x=0;x<S;x++){
      const t=(x+y)/(2*S);
      let r=Math.round(18+(11-18)*t), g=Math.round(26+(15-26)*t), b=Math.round(46+(26-46)*t);
      if(!inRR(x,y,0,0,S,S,112*k)){ set(x,y,0,0,0,0); continue; }
      set(x,y,r,g,b,255);
      const px0=56*k, py0=200*k, pw=400*k, ph=150*k;
      if(inRR(x,y,px0,py0,pw,ph,22*k)){
        set(x,y,247,247,245,255);
        if(inRR(x,y,px0+8*k,py0+8*k,86*k,ph-16*k,14*k)) set(x,y,0,51,153,255);
      }
    }
    const cx=378*k, cy=150*k, rad=52*k;
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){
      const dx=x-cx, dy=y-cy;
      if(dx*dx+dy*dy<=rad*rad){ set(x,y,255,206,0,255);
        if(dx*dx+dy*dy<=(20*k)*(20*k)) set(x,y,11,15,26,255);
      }
    }
  };
}
[[192,'icon-192.png'],[512,'icon-512.png']].forEach(([s,name])=>{
  fs.writeFileSync(__dirname+'/'+name, png(s,s,render(s)));
  console.log('wrote',name);
});
