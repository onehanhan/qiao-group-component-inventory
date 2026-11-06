(() => {
'use strict';
const $ = id => document.getElementById(id);
const safe = value => String(value ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const icons = {
 layers:'<path d="m3 8 9-5 9 5-9 5-9-5Zm0 4 9 5 9-5M3 16l9 5 9-5"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 box:'<path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4m-9 4v10m-4-16 8 4"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 qr:'<path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6zm6-1v1M13 12h2M4 12h4M12 4v4"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 right:'<path d="m9 5 7 7-7 7"/>',
 locate:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'
};
const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">'+icons[name]+'</svg>';
const types = {
 C:{name:'电容',label:'电容值',units:['pF','nF','µF','mF','F'],def:'nF',rating:'耐压值',rUnits:['V'],rDef:'V',placeholder:'如 100'},
 R:{name:'电阻',label:'电阻值',units:['Ω','kΩ','MΩ'],def:'kΩ',rating:'功率上限',rUnits:['mW','W'],rDef:'mW',placeholder:'如 10'},
 L:{name:'电感',label:'感值',units:['nH','µH','mH','H'],def:'µH',rating:'电流上限',rUnits:['mA','A'],rDef:'mA',placeholder:'如 4.7'}
};
const avatars = ['🧑‍🔬','👩‍💻','🦊','🐱','🐼','🤖','🐸','🐧'];
const scales = {F:1,mF:1e-3,'µF':1e-6,nF:1e-9,pF:1e-12,'Ω':1,'kΩ':1e3,'MΩ':1e6,H:1,mH:1e-3,'µH':1e-6,nH:1e-9,V:1,W:1,mW:1e-3,A:1,mA:1e-3};
const normalized = text => String(text ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const validNumber = text => /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d{1,3})?$/i.test(text) && +text <= 1e15 && (+text === 0 || +text >= 1e-15);
function fingerprint(spec){
 const numeric = (value,unit) => Number((+value*scales[unit]).toPrecision(12));
 const tol = normalized(spec.tolerance).replace(/^±\s*/,'').replace(/\s*%$/,'');
 return JSON.stringify([spec.type,numeric(spec.value,spec.unit),validNumber(tol)?Number(tol):tol,normalized(spec.footprint),numeric(spec.rating,spec.ratingUnit),normalized(spec.notes)]);
}
const loc = (board,slot) => pad(board)+' · '+code(slot);
const pad = n => String(n).padStart(2,'0');
const code = slot => 'ABCDE'[Math.floor(slot/10)]+pad(slot%10+1);
const displayValue = part => part.value+part.unit;
const details = part => [part.footprint,part.tolerance,part.rating+part.ratingUnit].filter(Boolean).join(' · ');
const demo = [
 [1,1,'C','100','nF','±10%','0603','50','V',125],[1,3,'C','10','µF','±20%','0805','25','V',65],
 [1,6,'C','22','pF','±5%','0603','50','V',48],[1,12,'C','1','µF','±10%','0603','16','V',102],
 [1,16,'C','47','µF','±20%','1210','16','V',26],[1,23,'C','220','nF','±10%','0805','50','V',82],
 [1,34,'C','4.7','µF','±10%','0805','25','V',35],[1,41,'C','10','nF','±10%','0603','50','V',58],
 [2,4,'R','10','kΩ','±1%','0603','100','mW',175],[2,7,'R','220','Ω','±1%','0603','100','mW',92],
 [2,13,'R','1','kΩ','±1%','0805','125','mW',104],[2,15,'R','4.7','kΩ','±1%','0603','100','mW',77],
 [2,24,'R','100','Ω','±1%','0805','125','mW',65],[2,31,'R','0','Ω','±1%','0603','100','mW',48],
 [3,1,'L','4.7','µH','','4 × 4 mm','2','A',41],[3,8,'L','10','µH','','5 × 5 mm','1.8','A',28],
 [3,17,'L','22','µH','','6 × 6 mm','1.5','A',20],[3,23,'L','1','µH','','3 × 3 mm','2.5','A',25],
 [4,5,'C','33','pF','±5%','0402','25','V',60],[4,11,'R','47','kΩ','±1%','0402','63','mW',35],
 [4,24,'L','100','nH','','0603','350','mA',21],[4,37,'R','1','MΩ','±1%','0603','100','mW',36]
].map(([board,slot,type,value,unit,tolerance,footprint,rating,ratingUnit,quantity])=>{
 const spec={board,slot,type,value,unit,tolerance,footprint,rating,ratingUnit,quantity,notes:''};
 return {...spec,key:fingerprint(spec)};
});
const apiBase = String(window.CIRCUIT_STOCK_API || '').replace(/\/$/,'');
let token = '';
try { token=sessionStorage.getItem('stock-session') || ''; } catch {}
function saveToken(value) {
 token=value;
 try { if(value)sessionStorage.setItem('stock-session',value);else sessionStorage.removeItem('stock-session'); } catch {}
}
let user=null, parts=demo, selected=null, target=null, currentBoard=0, mode='search', filter='all', query='', formType='C', online=false;
let lastMatch='', pendingId='', pendingPayload='', submitting=false;
let requestVersion=0, toastTimer;
const partAt = (board,slot) => parts.find(part=>part.board===board && part.slot===slot);
const locationMatches = (position,board,slot) => position?.board===board && position?.slot===slot;
async function api(path, data) {
 const headers={};
 if(token)headers.Authorization='Bearer '+token;
 if(data)headers['Content-Type']='application/json';
 let response;
 try { response=await fetch(apiBase+'/api/'+path,{method:data?'POST':'GET',headers,body:data?JSON.stringify(data):undefined,cache:'no-store'}); }
 catch { throw Error('无法连接共享服务，请检查网络后重试。'); }
 let result;
 try{ result=await response.json(); } catch { throw Error('共享服务未能返回数据，请稍后重试。'); }
 if(!response.ok)throw Object.assign(Error(result.error || '操作暂时无法完成。'),{status:response.status,duplicate:result.duplicate});
 return result;
}
function toast(message) {
 $('toast').textContent=message;clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>$('toast').textContent='',3100);
}
function renderHeader(){
 const button=$('profile'), status=$('connection');
 button.hidden=false;
 button.classList.toggle('primary',!user);
 button.innerHTML=user?avatar(user.avatar)+'<span class="name">'+safe(user.name)+'</span>':icon('lock')+'进入共享库';
 status.className='connection '+(!user?'demo':online?'':'offline');
 status.innerHTML='<i></i> '+(!user?'演示模式':online?'共享库已连接':'连接中断 · 已显示上次同步');
}
function avatar(value,big=false){
 const cls='avatar'+(big?' big':'');
 return /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
 ? '<img class="'+cls+'" src="'+value+'" alt="">'
 : '<span class="'+cls+'" aria-hidden="true">'+safe(value)+'</span>';
}
function renderMetrics(){
 const slots=parts.length;
 const count=parts.reduce((total,part)=>total+part.quantity,0);
 $('metrics').innerHTML=[['grid','总格位','200','格'],['box','已使用',slots,'/ 200'],['layers','在库总量',count.toLocaleString('zh-CN'),'件']]
  .map(([glyph,label,value,unit])=>'<div class="metric"><span class="label">'+icon(glyph)+label+'</span><strong>'+value+'<small>'+unit+'</small></strong></div>').join('');
}
function stackMarkup(){
 const polygon=(points,attrs)=>'<polygon points="'+points.map(p=>p.join(',')).join(' ')+'" '+attrs+'/>';
 const line=(from,to,attrs)=>'<path d="M'+from.join(' ')+'L'+to.join(' ')+'" '+attrs+'/>';
 const drawTray=board=>{
  const y0=94+(board-1)*65;
  const at=(x,y,z=0)=>[Math.round((73+36*x+18*y)*10)/10,Math.round((y0-6.3*x+11.5*y+z)*10)/10];
  const quad=(x,y,inset,z,attrs)=>polygon([at(x+inset,y+inset,z),at(x+1-inset,y+inset,z),at(x+1-inset,y+1-inset,z),at(x+inset,y+1-inset,z)],attrs);
  const front=(x1,x2,z1,z2,attrs)=>polygon([at(x1,5,z1),at(x2,5,z1),at(x2,5,z2),at(x1,5,z2)],attrs);
  const left=(y1,y2,z1,z2,attrs)=>polygon([at(0,y1,z1),at(0,y2,z1),at(0,y2,z2),at(0,y1,z2)],attrs);
  const count=parts.filter(part=>part.board===board).length;
  let body=left(0,5,0,30,'fill="url(#tray-side)" stroke="#597ea5" stroke-width="1"')+
   front(0,10,0,30,'fill="url(#tray-front)" stroke="#6389b2" stroke-width="1"');
  for(let y=0;y<5;y++){
   body+=left(y+.06,y+.94,4,28,'fill="url(#case-side)" stroke="#7e9dbb" stroke-width=".65"')+
    left(y+.38,y+.63,9,23,'fill="#6889ab" opacity=".7"')+
    left(y+.44,y+.58,8,18,'fill="#9fbad5"')+
    line(at(0,y+.1,7),at(0,y+.1,25),'stroke="#dbeafa" opacity=".66"');
  }
  for(let x=0;x<10;x++){
   body+=front(x+.035,x+.965,4,28,'fill="url(#case-front)" stroke="#85a6c7" stroke-width=".68"')+
    front(x+.31,x+.69,9,24,'fill="#6185aa" stroke="#89a9c7" stroke-width=".55"')+
    polygon([at(x+.37,5,8),at(x+.63,5,8),at(x+.62,5,17),at(x+.58,5,20),at(x+.42,5,20),at(x+.38,5,17)],'fill="url(#case-tab)" stroke="#84a9ca" stroke-width=".55"')+
    line(at(x+.08,5,6.6),at(x+.29,5,6.6),'stroke="#f1f8ff" opacity=".85"')+
    line(at(x+.73,5,6.6),at(x+.92,5,6.6),'stroke="#f1f8ff" opacity=".85"');
  }
  body+=front(0,10,27.5,30,'fill="#7497bb" opacity=".68"')+
   line(at(0,5,27),at(10,5,27),'stroke="#d3e5f7" opacity=".56"')+
   polygon([at(0,0),at(10,0),at(10,5),at(0,5)],'fill="#a3c0db" stroke="#7599be" stroke-width="1.1" class="tray-outline"');
  for(let y=0;y<5;y++)for(let x=0;x<10;x++){
   const part=partAt(board,y*10+x);
   const lid=part?'lid-'+part.type:'lid-empty';
   body+=quad(x,y,.027,0,'fill="url(#tray-rim)" stroke="#7c9fbe" stroke-width=".45"')+
    quad(x,y,.105,-3,'fill="url(#'+lid+')" stroke="#e5f3f9" stroke-width=".77"')+
    polygon([at(x+.105,y+.895,-3),at(x+.895,y+.895,-3),at(x+.895,y+.895,0),at(x+.105,y+.895,0)],'fill="#7eacae" opacity=".63"')+
    polygon([at(x+.17,y+.17,-3.1),at(x+.76,y+.17,-3.1),at(x+.28,y+.66,-3.1),at(x+.17,y+.66,-3.1)],'fill="#f3fbff" opacity=".20"')+
    line(at(x+.19,y+.77,-3.15),at(x+.81,y+.77,-3.15),'stroke="#587c89" stroke-width=".56" opacity=".31"')+
    polygon([at(x+.35,y+.86,-3.2),at(x+.65,y+.86,-3.2),at(x+.65,y+.98,-3.2),at(x+.35,y+.98,-3.2)],'fill="#d6e9eb" stroke="#9bc2c7" stroke-width=".46"');
  }
  const [edgeX,edgeY]=at(10,5,11);
  const labelY=edgeY+2;
  return '<g class="tray" data-board="'+board+'" tabindex="0" role="button" aria-label="'+board+' 号板，'+count+' 个已占用格位"><g filter="url(#tray-shadow)">'+body+'</g>'+
   '<path d="M'+(edgeX+3)+' '+edgeY+'H552l7 2h12" fill="none" stroke="#7798c0" stroke-dasharray="3 3"/><circle cx="'+(edgeX+3)+'" cy="'+edgeY+'" r="2.4" fill="#417cd4"/><rect class="tray-label" x="571" y="'+(labelY-12)+'" width="76" height="25" rx="7" fill="#f8fbff" stroke="#c5d9f1"/><text x="583" y="'+(labelY+4)+'" fill="#2b5486" font-family="monospace" font-size="11" font-weight="bold">板 '+pad(board)+'  ›</text></g>';
 };
 const gradient=(id,colors,x='0',y='1')=>'<linearGradient id="'+id+'" x2="'+x+'" y2="'+y+'">'+colors.map(([offset,color])=>'<stop offset="'+offset+'" stop-color="'+color+'"/>').join('')+'</linearGradient>';
 const defs=gradient('tray-front',[[0,'#dfedfa'],[.52,'#b7d2ec'],[1,'#8dacce']])+
  gradient('tray-side',[[0,'#b7cfe6'],[1,'#7498be']])+
  gradient('case-front',[[0,'#d4e9f8'],[.46,'#b3d0ec'],[1,'#92b3d5']])+
  gradient('case-side',[[0,'#b9d1e9'],[1,'#8caaca']])+
  gradient('case-tab',[[0,'#e7f6ff'],[.76,'#c6e1f4'],[1,'#9bbdd8']])+
  gradient('tray-rim',[[0,'#e0effb'],[.55,'#c0d9ef'],[1,'#9bbbd7']],'1')+
  gradient('lid-empty',[[0,'#e3f2ef'],[.45,'#c8dede'],[1,'#a0bfc6']],'1')+
  gradient('lid-C',[[0,'#d3e9ff'],[1,'#83b2eb']],'1')+
  gradient('lid-R',[[0,'#d2f1e8'],[1,'#72bdae']],'1')+
  gradient('lid-L',[[0,'#e9e0fc'],[1,'#ad94db']],'1')+
  '<filter id="tray-shadow" x="-12%" y="-15%" width="126%" height="150%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="9" stdDeviation="5" flood-color="#345985" flood-opacity=".28"/></filter>';
 return '<div class="map-surface overview"><span class="map-hint">ISOMETRIC / 堆叠侧视</span><svg class="stack" viewBox="27 10 650 407" role="group" aria-label="四块收纳板堆叠侧视图"><defs>'+defs+'</defs><ellipse cx="306" cy="369" rx="219" ry="26" fill="#c3d6ec" opacity=".62"/>'+[4,3,2,1].map(drawTray).join('')+'</svg><span class="map-scale">5 × 10 &nbsp;·&nbsp; 50 格 / 板</span></div>';
}
function gridMarkup(){
 const placing=mode==='add'&&!matching();
 let html='<div class="map-surface grid-scroll"><div class="grid" aria-label="'+currentBoard+' 号板格位"><span></span>';
 for(let c=1;c<=10;c++)html+='<span class="axis">'+pad(c)+'</span>';
 for(let r=0;r<5;r++){
  html+='<span class="axis">'+'ABCDE'[r]+'</span>';
  for(let c=0;c<10;c++){
   const slot=r*10+c, part=partAt(currentBoard,slot);
   const active=locationMatches(selected,currentBoard,slot)||locationMatches(target,currentBoard,slot);
   const label=code(slot)+' · '+(part?types[part.type].name+' '+displayValue(part)+' · '+part.quantity+' 件':'空格');
   html+='<button type="button" class="cell '+(part?part.type:'empty')+(active?' selected':'')+(!part&&placing?' candidate':'')+'" data-slot="'+slot+'" aria-pressed="'+active+'" aria-label="'+safe(label)+'" title="'+safe(label)+'"><small>'+code(slot)+'</small><b>'+safe(part?displayValue(part):'·')+'</b></button>';
  }
 }
 return html+'</div></div>';
}
function renderBoard(){
 $('boards').innerHTML=[0,1,2,3,4].map(b=>'<button class="board-button" type="button" data-board="'+b+'" aria-pressed="'+(currentBoard===b)+'">'+(b?'板 '+pad(b):icon('layers')+'总览')+'</button>').join('');
 $('map-mode').innerHTML=icon(currentBoard?'grid':'layers')+(currentBoard?'板 '+pad(currentBoard)+' · 正视图':'四板 · 堆叠侧视');
 const occupied=parts.filter(p=>p.board===currentBoard).length;
 $('visual').innerHTML=currentBoard?gridMarkup():stackMarkup();
 $('board-footer').innerHTML='<div class="legend"><span><i class="dot C"></i>电容</span><span><i class="dot R"></i>电阻</span><span><i class="dot L"></i>电感</span><span><i class="dot"></i>空格</span></div><span>'+(currentBoard?'使用 '+occupied+' / 50 格':'点击任一收纳板查看格位')+'</span>';
}
function focusCell(board,slot,scroll=false){
 currentBoard=board;selected={board,slot};renderBoard();
 const cell=$('visual').querySelector('[data-slot="'+slot+'"]');
 if(cell && scroll){
  if(matchMedia('(max-width:840px)').matches)$('board-title').scrollIntoView({block:'start'});
  const scroller=cell.closest('.grid-scroll');
  scroller.scrollLeft=Math.max(0,cell.offsetLeft-scroller.clientWidth/2);
 }
}
function searchMatches(part){
 const s = normalized([types[part.type].name,displayValue(part),part.value,part.unit,details(part),part.notes,loc(part.board,part.slot),code(part.slot)].join(' ')).replace(/[μµ]/g,'u');
 return (filter==='all'||part.type===filter)&&normalized(query).replace(/[μµ]/g,'u').split(/\s+/).every(t=>s.includes(t));
}
function renderResults(){
 if(!$('results'))return;
 const found=parts.filter(searchMatches);
 $('result-count').textContent=found.length+' 项';
 $('results').innerHTML=found.length?found.map(part=>'<button type="button" class="result" data-result="'+part.board+':'+part.slot+'" aria-pressed="'+locationMatches(selected,part.board,part.slot)+'"><span class="part '+part.type+'">'+part.type+'</span><span><b>'+safe(displayValue(part))+' '+types[part.type].name+'</b><small>'+safe(details(part))+' · '+part.quantity+' 件</small></span><code>'+loc(part.board,part.slot)+'</code></button>').join('')
 :'<div class="empty-state">'+icon('search')+'<strong>'+(parts.length?'未找到匹配的元器件':'共享库存为空')+'</strong><span>'+(parts.length?'试试数值、封装或格位编号。':'切换到入库，录入第一种元件。')+'</span></div>';
}
function renderFilters(){
 $('filters').innerHTML=[['all','全部'],...Object.entries(types).map(([key,t])=>[key,t.name])].map(([key,label])=>'<button class="filter" type="button" data-filter="'+key+'" aria-pressed="'+(filter===key)+'">'+(key==='all'?'':'<i class="dot '+key+'"></i>')+label+'</button>').join('');
}
function renderSearch(){
 $('desk').innerHTML='<label for="query">搜索元器件</label><div class="search-box">'+icon('search')+'<input id="query" type="search" placeholder="搜索数值、封装或格位…" autocomplete="off"></div><div class="filters" id="filters"></div><div class="result-heading"><span>可定位的元件</span><span id="result-count"></span></div><div class="results" id="results"></div>'+(user?'':'<div class="help" style="margin-top:10px">当前显示示例数据。进入共享库可查看真实库存。</div>');
 $('query').value=query;
 renderFilters();renderResults();
}
function field(name,label,opts={}){
 const {type='text',placeholder='',units,def,maxlength=40,required=true}=opts;
 const options=units?'<select class="field" name="'+name+'Unit" aria-label="'+label+'单位">'+units.map(u=>'<option'+(u===def?' selected':'')+'>'+u+'</option>').join('')+'</select>':'';
 return '<div'+(name==='notes'?' class="wide"':'')+'><label for="f-'+name+'">'+label+'</label><div'+(units?' class="unit-field"':'')+'><input class="field" id="f-'+name+'" name="'+name+'" type="'+type+'" placeholder="'+placeholder+'" '+(required?'required ':'')+(type==='number'?'step="1" min="1" max="1000000"':'maxlength="'+maxlength+'"'+(units?' inputmode="decimal"':''))+' autocomplete="off">'+options+'</div></div>';
}
function renderAdd(){
 const t=types[formType];
 $('desk').innerHTML='<span class="field-label">元器件类别</span><div class="types">'+Object.entries(types).map(([key,o])=>'<button class="type-button" type="button" data-type="'+key+'" aria-pressed="'+(formType===key)+'"><i class="dot '+key+'"></i>'+o.name+'</button>').join('')+'</div><form id="deposit"><div class="form-grid">'+
 field('value',t.label,{units:t.units,def:t.def,placeholder:t.placeholder,maxlength:24})+
 (formType==='L'?'':field('tolerance','精度',{placeholder:'如 ±1%',maxlength:24}))+
 field('footprint','规格 / 封装',{placeholder:'如 0603'})+
 field('rating',t.rating,{units:t.rUnits,def:t.rDef,placeholder:formType==='C'?'如 50':'如 100',maxlength:24})+
 field('quantity','入库数量',{type:'number',placeholder:'件'})+
 field('notes','其他（选填）',{placeholder:'如 介质、型号或备注',required:false,maxlength:180})+
 '</div><div id="placement"></div><p class="error" id="deposit-error"></p><button id="submit-deposit" class="button primary full" type="submit">'+icon('plus')+'确认入库</button></form>';
 $('deposit').elements.namedItem('valueUnit').name='unit';
 updatePlacement();
}
function getSpec(){
 const form=$('deposit');
 if(!form)return null;
 const data=Object.fromEntries(new FormData(form));
 for(const k of Object.keys(data))data[k]=data[k].trim();
 const {value,rating,footprint,tolerance}=data;
 if(!validNumber(value)||!validNumber(rating)||+rating<=0||(formType!=='R'&&+value<=0)||!footprint||(formType!=='L'&&!tolerance))return null;
 return {...data,tolerance:tolerance||'',quantity:+data.quantity,type:formType};
}
function matching(){
 const spec=getSpec();
 return spec?parts.find(p=>p.key===fingerprint(spec)):null;
}
function updatePlacement(){
 if(!$('placement'))return;
 const spec=getSpec(), match=matching();
 const previous=lastMatch;
 lastMatch=match?match.board+':'+match.slot:'';
 if(match && lastMatch!==previous){target=null;focusCell(match.board,match.slot);}
 else if(previous&&!match){selected=null;renderBoard();}
 const conflict=target&&partAt(target.board,target.slot)&&!match;
 const msg=match?'发现相同规格 · <b>'+loc(match.board,match.slot)+'</b>。确认后将加入该格库存。'
 :conflict?'该格位刚被占用，请重新选择空格。'
 :target?'已选择空格 <b>'+loc(target.board,target.slot)+'</b>。'
 :spec?'未发现相同规格。请在左侧选择任意收纳板中的空格。':'填写规格后，将自动检查重复元件。';
 $('placement').innerHTML='<div class="notice'+(conflict?' warn':'')+'">'+msg+(match?'<br><button type="button" class="button quiet" data-locate="'+match.board+':'+match.slot+'">'+icon('locate')+'查看已入库位置</button>':'')+'</div>';
 $('submit-deposit').disabled=submitting || !spec || (!match&&(!target||conflict));
}
function renderDesk(){
 $('tabs').innerHTML=[['search','search','查找元件'],['add','plus','录入入库']].map(([key,glyph,label])=>'<button class="mode-tab" type="button" data-mode="'+key+'" aria-pressed="'+(mode===key)+'">'+icon(glyph)+label+'</button>').join('');
 if(mode==='search')renderSearch();else renderAdd();
}
function renderAll(){renderHeader();renderMetrics();renderDesk();renderBoard();}
async function sync(){
 if(!token||!user)return;
 const generation=++requestVersion;
 try{
  const data=await api('state');
  if(generation!==requestVersion)return;
  const changed=JSON.stringify(parts)!==JSON.stringify(data.parts);
  parts=data.parts;user=data.user;online=true;renderHeader();
  if(changed){renderMetrics();renderBoard();renderResults();updatePlacement();}
 }catch(e){
  if(generation!==requestVersion)return;
  if(e.status===401||e.status===403){leave();toast('访问已过期，请重新进入共享库。');}
  else {online=false;renderHeader();}
 }
}
function leave(){
 requestVersion++;saveToken('');user=null;parts=demo;target=null;selected=null;currentBoard=0;mode='search';lastMatch='';renderAll();
}
async function enter(){
 const data=await api('state');
 user=data.user;parts=data.parts;online=true;target=null;selected=null;currentBoard=0;mode='search';lastMatch='';
 close();renderAll();toast('已进入共享库');
}
function dialog(kicker,title,body){
 const modal=$('dialog');
 modal.innerHTML='<div class="dialog-head"><div><div class="eyebrow accent">'+kicker+'</div><h2 id="dialog-title">'+title+'</h2></div><button type="button" data-close class="button close" aria-label="关闭">'+icon('close')+'</button></div><div class="dialog-body">'+body+'</div>';
 if(!modal.open)modal.showModal();
}
function close(){if($('dialog').open)$('dialog').close();}
async function profiles(){
 try{
  const data=await api('profiles');
  dialog('IDENTITY / 成员','选择用户',
   '<p class="help">选择你的用户名，入库记录将以此名称登记。</p><div class="profile-list">'+data.profiles.map(p=>'<button type="button" class="button profile-item" data-user="'+safe(p.id)+'">'+avatar(p.avatar)+safe(p.name)+'<span class="end">'+icon('right')+'</span></button>').join('')+'</div><p class="error" id="modal-error"></p><button class="button primary full" type="button" data-new>'+icon('plus')+'创建新用户</button>');
  if(!data.profiles.length)editProfile(false);
 }catch(e){if(e.status===401){saveToken('');unlock();}else toast(e.message);}
}
function unlock(){
 dialog('ACCESS / 共享库存','进入共享库',
  '<p class="help">输入实验室入口口令，随后选择已有用户或创建个人头像与用户名。</p><form id="unlock-form"><div><label for="password">入口口令</label><input class="field" id="password" name="password" type="password" required maxlength="160" autocomplete="current-password" autofocus></div><p class="error" id="modal-error"></p><button class="button primary full" type="submit">'+icon('lock')+'验证并继续</button></form>');
}
let profileAvatar=avatars[0];
function editProfile(edit){
 profileAvatar=edit?user.avatar:avatars[0];
 dialog('IDENTITY / 成员',edit?'编辑个人资料':'创建你的用户',
  '<form id="profile-form" data-edit="'+edit+'"><div><label for="name">用户名</label><input class="field" id="name" name="name" type="text" required maxlength="22" value="'+safe(edit?user.name:'')+'" placeholder="输入你的显示名称" autocomplete="nickname"></div><div><span class="field-label">头像</span><div id="avatar-preview"></div><div class="avatar-options" id="avatar-options"></div></div><div><label for="avatar-file">或上传自定义图片</label><input id="avatar-file" type="file" accept="image/*"></div><p class="error" id="modal-error"></p><button class="button primary full" type="submit">'+(edit?'保存资料':'创建并进入')+'</button></form><button type="button" class="button quiet full" data-members>返回用户列表</button>');
 drawAvatars();
}
function drawAvatars(){
 $('avatar-preview').innerHTML=avatar(profileAvatar,true);
 $('avatar-options').innerHTML=avatars.map((a,i)=>'<button type="button" class="button avatar-choice" data-avatar="'+i+'" aria-label="头像 '+(i+1)+'" aria-pressed="'+(a===profileAvatar)+'">'+avatar(a)+'</button>').join('');
}
async function upload(file){
 if(!file)return;
 if(file.size>12000000)throw Error('请选择 12 MB 以下的图片。');
 const bitmap=await createImageBitmap(file);
 try{
  const size=Math.min(bitmap.width,bitmap.height);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#eaf2ff';ctx.fillRect(0,0,96,96);
  ctx.drawImage(bitmap,(bitmap.width-size)/2,(bitmap.height-size)/2,size,size,0,0,96,96);
  return canvas.toDataURL('image/jpeg',.8);
 }finally{bitmap.close();}
}
function account(){
 dialog('IDENTITY / 成员',safe(user.name),'<div>'+avatar(user.avatar,true)+'</div><button class="button full" type="button" data-edit-user>'+icon('user')+'编辑头像与用户名</button><button class="button full" type="button" data-members>'+icon('right')+'切换用户</button><button class="button quiet full" type="button" data-logout>退出共享库</button><p class="error" id="modal-error"></p>');
}
async function history(part){
 dialog('SLOT HISTORY / 格位记录','板 '+pad(part.board)+' · '+code(part.slot),
 '<div class="notice"><b>'+safe(displayValue(part))+' '+types[part.type].name+'</b> · '+safe(details(part))+'<br>在库 '+part.quantity+' 件'+(part.notes?'<br>'+safe(part.notes):'')+'</div><div id="history-items" class="history"><p class="help">正在加载入库记录…</p></div>');
 const container=$('history-items');
 const date=new Intl.DateTimeFormat('zh-CN',{dateStyle:'medium',timeStyle:'short'});
 try{
  const events=user?(await api('history?board='+part.board+'&slot='+part.slot)).events:
   [{author:'示例成员',avatar:avatars[0],quantity:part.quantity,time:Date.UTC(2026,9,28,2,15),spec:part}];
  container.innerHTML=events.map(e=>'<div class="event">'+avatar(e.avatar)+'<div><b>'+safe(e.author)+'</b><small>'+safe(date.format(e.time))+'</small><small>'+safe(displayValue(e.spec))+' '+types[e.spec.type].name+' · '+safe(details(e.spec))+(e.spec.notes?' · '+safe(e.spec.notes):'')+'</small></div><strong>+'+e.quantity+' 件</strong></div>').join('')||'<p class="help">该格暂时没有入库记录。</p>';
 }catch(e){container.innerHTML='<p class="error">'+safe(e.message)+'</p>';}
}
function share(){
 const url=new URL('./',location.href).href;
 const qr=window.stockQR(url);
 dialog('SHARE / 扫码访问','分享元器件仓库',
  '<p class="help">扫描二维码打开同一个元件库。进入共享库存时需要入口口令。</p>'+(qr?'<div class="qr-box">'+qr+'</div>':'')+'<div><label for="share-link">访问链接</label><input id="share-link" class="field" readonly value="'+safe(url)+'"></div><button type="button" class="button primary full" data-copy>'+icon('copy')+'复制链接</button>');
}
async function submitDeposit(){
 if(submitting)return;
 const spec=getSpec();
 if(!spec)return;
 const match=matching(), position=match||target;
 if(!position || !Number.isInteger(spec.quantity) || spec.quantity<1 || spec.quantity>1000000){$('deposit-error').textContent='请选择格位并输入有效的入库数量。';return;}
 const payload={...spec,board:position.board,slot:position.slot};
 const serialized=JSON.stringify(payload);
 if(serialized!==pendingPayload){pendingPayload=serialized;pendingId=crypto.randomUUID();}
 submitting=true;updatePlacement();
 try{
  if(!user){unlock();return;}
  await api('deposit',{...payload,requestId:pendingId});
  pendingId='';pendingPayload='';
  await sync();
  if(!user)return;
  target=null;lastMatch='';renderAdd();focusCell(position.board,position.slot,true);
  toast('已入库 '+spec.quantity+' 件 · '+loc(position.board,position.slot));
 }catch(e){
  if(e.status===409){pendingId='';pendingPayload='';await sync();}
  if($('deposit-error'))$('deposit-error').textContent=e.message;
 }finally{submitting=false;updatePlacement();}
}
$('share').innerHTML=icon('qr')+'<span>扫码访问</span>';
$('share').setAttribute('aria-label','扫码访问');
$('share').onclick=share;
$('profile').onclick=()=>user?account():token?profiles():unlock();
document.addEventListener('click',async event=>{
 const control=event.target.closest('button, .tray');
 if(!control)return;
 const d=control.dataset;
 if(d.board!==undefined){currentBoard=+d.board;renderBoard();($('boards').querySelector('[data-board="'+d.board+'"]'))?.focus({preventScroll:true});return;}
 if(d.slot!==undefined){
  const slot=+d.slot, part=partAt(currentBoard,slot);
  focusCell(currentBoard,slot);
  $('visual').querySelector('[data-slot="'+slot+'"]')?.focus({preventScroll:true});
  if(part){renderResults();history(part);}
  else if(mode==='add'){
   if(matching()){toast('相同规格请加入已有格位。');return;}
   target={board:currentBoard,slot};renderBoard();updatePlacement();
   if(matchMedia('(max-width:840px)').matches)$('desk').scrollIntoView({block:'start'});
  }else toast('板 '+pad(currentBoard)+' · '+code(slot)+' 为空格');
  return;
 }
 if(d.mode){if(d.mode!==mode){mode=d.mode;target=null;selected=null;lastMatch='';renderDesk();renderBoard();$('tabs').querySelector('[data-mode="'+mode+'"]')?.focus();}return;}
 if(d.filter){filter=d.filter;renderFilters();renderResults();$('filters').querySelector('[data-filter="'+filter+'"]')?.focus();return;}
 if(d.type){if(formType!==d.type){formType=d.type;selected=null;lastMatch='';renderAdd();renderBoard();$('desk').querySelector('[data-type="'+formType+'"]')?.focus();}return;}
 if(d.result||d.locate){const [board,slot]=(d.result||d.locate).split(':').map(Number);focusCell(board,slot,true);if(d.result){renderResults();$('results').querySelector('[data-result="'+d.result+'"]')?.focus({preventScroll:true});}return;}
 if('close' in d){close();return;}
 if('new' in d){editProfile(false);return;}
 if('members' in d){await profiles();return;}
 if('editUser' in d){editProfile(true);return;}
 if('avatar' in d){profileAvatar=avatars[+d.avatar];drawAvatars();$('avatar-options').querySelector('[data-avatar="'+d.avatar+'"]')?.focus();return;}
 if('copy' in d){
  try{await navigator.clipboard.writeText($('share-link').value);toast('已复制访问链接');}
  catch{$('share-link').select();toast('请复制选中的链接。');}return;
 }
 if('logout' in d){
  try {await api('logout',{});leave();close();}
  catch(e){if(e.status===401){leave();close();}else if($('modal-error'))$('modal-error').textContent=e.message;}
  return;
 }
 if(d.user){
  control.disabled=true;
  try{await api('select',{id:d.user});await enter();}
  catch(e){if($('modal-error'))$('modal-error').textContent=e.message;}
  finally{control.disabled=false;}
 }
});
document.addEventListener('keydown',event=>{
 if(event.target.classList?.contains('tray')&&['Enter',' '].includes(event.key)){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
});
document.addEventListener('input',event=>{
 if(event.target.id==='query'){query=event.target.value;renderResults();}
 if(event.target.form?.id==='deposit'){$('deposit-error').textContent='';updatePlacement();}
});
document.addEventListener('change',async event=>{
 if(event.target.id!=='avatar-file')return;
 try{const image=await upload(event.target.files[0]);if(image&&$('avatar-preview')){profileAvatar=image;drawAvatars();$('modal-error').textContent='';}}
 catch{$('modal-error').textContent='无法读取图片，请使用常见的图片格式。';}
});
document.addEventListener('submit',async event=>{
 const form=event.target;
 if(!['unlock-form','profile-form','deposit'].includes(form.id))return;
 event.preventDefault();
 if(form.id==='deposit'){await submitDeposit();return;}
 const button=form.querySelector('[type="submit"]');button.disabled=true;
 try{
  const fields=Object.fromEntries(new FormData(form));
  if(form.id==='unlock-form'){
   const result=await api('unlock',fields);saveToken(result.token);await profiles();
  }else{
   const edit=form.dataset.edit==='true';
   const result=await api('profile',{name:fields.name,avatar:profileAvatar,edit});
   if(edit){user=result.user;renderHeader();close();toast('已保存个人资料');}
   else await enter();
  }
 }catch(e){if($('modal-error'))$('modal-error').textContent=e.message;}
 finally{button.disabled=false;}
});
renderAll();
if(token)enter().catch(e=>{if(e.status===401)saveToken('');else if(e.status===403)profiles();});
setInterval(()=>{if(document.visibilityState==='visible')sync();},5000);
window.addEventListener('focus',sync);
})();
