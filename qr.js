// QR Model 2, version 6-L, byte mode. The matrix includes the standard quiet zone.
window.stockQR = function (text) {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > 134) return '';
  const size = 41, bits = [], data = [];
  function write(value,count) { for (let i=count-1;i>=0;i--) bits.push((value >>> i)&1); }
  write(4,4); write(bytes.length,8);
  for (const b of bytes) write(b,8);
  write(0,4);
  while (bits.length%8) bits.push(0);
  for (let i=0;i<bits.length;i+=8) data.push(bits.slice(i,i+8).reduce((n,b)=>n*2+b,0));
  for (let pad=0;data.length<136;pad++) data.push(pad%2?17:236);
  function mul(a,b) {
    let z=0;
    while(b){ if(b&1) z^=a; a=(a<<1)^((a&128)?285:0); b>>=1; }
    return z;
  }
  let generator=[1], root=1;
  for(let k=0;k<18;k++){
    const next=Array(generator.length+1).fill(0);
    generator.forEach((v,i)=>{next[i]^=v; next[i+1]^=mul(v,root);});
    generator=next; root=mul(root,2);
  }
  const blocks=[data.slice(0,68),data.slice(68)];
  const ecc=blocks.map(block=>{
    const rem=block.concat(Array(18).fill(0));
    for(let i=0;i<68;i++){const factor=rem[i];generator.forEach((g,j)=>rem[i+j]^=mul(g,factor));}
    return rem.slice(68);
  });
  const stream=[];
  for(const pair of [blocks,ecc]) for(let i=0;i<pair[0].length;i++) stream.push(pair[0][i],pair[1][i]);
  const matrix=Array.from({length:size},()=>Array(size).fill(null));
  const set=(x,y,on)=>{if(x>=0&&y>=0&&x<size&&y<size)matrix[y][x]=on;};
  for(let i=0;i<size;i++){set(6,i,i%2===0);set(i,6,i%2===0);}
  for(const [cx,cy] of [[3,3],[37,3],[3,37]]) for(let y=-4;y<=4;y++) for(let x=-4;x<=4;x++){
    const d=Math.max(Math.abs(x),Math.abs(y)); set(cx+x,cy+y,d!==2&&d!==4);
  }
  for(let y=-2;y<=2;y++) for(let x=-2;x<=2;x++) set(34+x,34+y,Math.max(Math.abs(x),Math.abs(y))!==1);
  const format=0x77c4;
  const f=i=>Boolean((format>>>i)&1);
  for(let i=0;i<6;i++)set(8,i,f(i));
  set(8,7,f(6));set(8,8,f(7));set(7,8,f(8));
  for(let i=9;i<15;i++)set(14-i,8,f(i));
  for(let i=0;i<8;i++)set(size-1-i,8,f(i));
  for(let i=8;i<15;i++)set(8,size-15+i,f(i));
  set(8,size-8,true);
  let cursor=0, upward=true;
  for(let right=size-1;right>=1;right-=2){
    if(right===6)right=5;
    for(let v=0;v<size;v++)for(let dx=0;dx<2;dx++){
      const x=right-dx,y=upward?size-1-v:v;
      if(matrix[y][x]!==null)continue;
      const bit=(stream[cursor>>3]>>>(7-(cursor&7)))&1;
      set(x,y,Boolean(bit^((x+y)%2===0)));
      cursor++;
    }
    upward=!upward;
  }
  let path='';
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(matrix[y][x])path+='M'+(x+4)+' '+(y+4)+'h1v1h-1z';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 49 49" role="img" aria-label="元件仓访问二维码" shape-rendering="crispEdges"><rect width="49" height="49" fill="white"/><path fill="#13263e" d="'+path+'"/></svg>';
};
