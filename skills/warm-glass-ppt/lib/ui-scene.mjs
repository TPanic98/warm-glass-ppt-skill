import {Painter,theme,header,pageTitle,footer,draw,componentCatalog,wrap} from './ui-components.mjs';

// A small recording surface shared by the portable exporters. The component
// definitions also accept a real Artifact Tool presentation in a host workflow.
class TextValue{
 constructor(value=''){this.value=value;this.style={};}
 toJSON(){return {value:this.value,style:this.style,...(this.fill?{fill:this.fill}:{})};}
 get(){throw Error('Partial-run styling needs a separate text object');}
}
function shapeRecord(config,id){
 const o={...structuredClone(config),id};let text;
 Object.defineProperty(o,'text',{enumerable:true,get(){return text;},set(value){text=new TextValue(String(value));}});
 return o;
}
export class ScenePresentation{
 constructor(){this.slides={items:[],add:()=>this.addSlide()};}
 addSlide(){
  const s={background:{fill:theme.colors.canvas},speakerNotes:{text:''},objects:[]};let n=0;
  s.shapes={add:config=>{const o=shapeRecord(config,`o${++n}`);o.kind='shape';s.objects.push(o);return o;},connect:(from,to,config)=>{const o={...structuredClone(config),kind:'connector',kindConnector:config.kind,id:`o${++n}`,name:`connector-${n}`,from:from.id,to:to.id};s.objects.push(o);return o;}};
  s.charts={add:(type,config)=>{const o={kind:'chart',id:`o${++n}`,name:`chart-${n}`,chartType:type,...structuredClone(config)};for(const key of ['legend','dataLabels','xAxis','yAxis']){o[key]??={};o[key].textStyle??={};}s.objects.push(o);return o;}};
  s.tables={add:config=>{const o={kind:'table',id:`o${++n}`,name:`table-${n}`,...structuredClone(config),cells:Array.from({length:config.rows},()=>Array.from({length:config.columns},()=>({text:new TextValue()}))),rows:Array.from({length:config.rows},()=>({}))};o.borders={assign:v=>{o.border=structuredClone(v);}};o.getCell=(r,c)=>o.cells[r][c];s.objects.push(o);return o;}};
  this.slides.items.push(s);return s;
 }
}
const own=(v,keys,at)=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error(`${at}: expected object`);for(const k of Object.keys(v))if(!keys.includes(k))throw Error(`${at}: unsupported field ${k}`);};
const itemFields={C04:['kind','label'],C05:['value','title','body'],C07:['title','body'],C08:['date','title','body'],C09:['title','body'],C13:['title','body'],C16:['title','body','focus'],C17:['title','body'],C22:['question','answer']};
function textField(v,at){if(typeof v!=='string'||!v.trim())throw Error(`${at}: expected non-empty text`);}
function validateProps(code,p){
 const scalar={C01:['title'],C02:['text'],C11:['claim','basis','source'],C16:['xLabel','yLabel'],C21:['context','action','observation','limitation'],C23:['number','title'],C24:['title']}[code]||[];for(const key of scalar)textField(p[key],code+'.'+key);
 if(code==='C03'&&!p.title&&!p.body)throw Error('C03 requires title or body');
 const listKey=code==='C16'?'quadrants':'items';if(itemFields[code]){if(!Array.isArray(p[listKey]))throw Error(`${code}.${listKey}: expected array`);for(const row of p[listKey]){own(row,itemFields[code],code+'.'+listKey);for(const key of itemFields[code].filter(k=>k!=='focus'))if(row[key]!==undefined)textField(row[key],code+'.'+key);}}
 if(code==='C05'&&p.trend)own(p.trend,['title','categories','values','max','seriesName'],'trend');
 for(const [c,field,keys]of [['C06','columns',['title','items']],['C10','rows',['title','items']],['C18','steps',['lane','title']],['C14','series',['name','values']]])if(code===c){if(!Array.isArray(p[field]))throw Error(`${code}.${field}: expected array`);for(const row of p[field]){own(row,keys,code+'.'+field);textField(row[keys.includes('name')?'name':'title'],code+'.title');if(['C06','C10'].includes(code)&&(!Array.isArray(row.items)||row.items.some(v=>typeof v!=='string')))throw Error(code+'.items: expected text array');}}
 if(code==='C19')for(const field of ['input','work','output']){own(p[field],['title','body'],field);textField(p[field].title,field+'.title');textField(p[field].body,field+'.body');}
 if(code==='C18'&&(!Array.isArray(p.lanes)||p.lanes.some(v=>typeof v!=='string')))throw Error('lanes: expected text array');
 if(['C12','C20'].includes(code)){if(!Array.isArray(p.headers)||p.headers.some(v=>typeof v!=='string')||!Array.isArray(p.rows)||p.rows.some(r=>!Array.isArray(r)||r.some(v=>!['string','number'].includes(typeof v))))throw Error('Table headers/rows must contain text or numeric cells');}
 if(p.demonstration!==undefined&&typeof p.demonstration!=='boolean')throw Error('demonstration must be boolean');
 if(code==='C03'&&p.focus!==undefined&&typeof p.focus!=='boolean')throw Error('focus must be boolean');
 const variants={C02:['quiet','focus'],C04:['pin','ring'],C24:['cover','closing']}[code];if(variants&&p.variant!==undefined&&!variants.includes(p.variant))throw Error('Unsupported component variant');
 const max=p.max??p.trend?.max,values=code==='C14'?p.series?.flatMap(s=>s.values):code==='C15'?[...p.target,...p.actual]:p.trend?.values;if(max!==undefined&&(!Number.isFinite(max)||max<=0||(values&&max<Math.max(...values))))throw Error('Chart maximum must cover all values');
}
export function validateUiBrief(b){
 own(b,['schema','title','mode','font','brand','slides'],'brief');
 if(b.schema!=='warm-glass-ui/v2')throw Error('schema must be warm-glass-ui/v2');
 if(typeof b.title!=='string'||!b.title.trim())throw Error('title must be non-empty');
 if(b.mode&&!['components','report','talk','training','product'].includes(b.mode))throw Error('Unsupported mode');
 if(b.font!==undefined&&(typeof b.font!=='string'||!/^[\p{L}\p{N} _.-]{1,100}$/u.test(b.font)))throw Error('font: plain font-family name required');
 if(b.brand!==undefined){own(b.brand,['name','sloganEn','sloganCn'],'brand');textField(b.brand.name,'brand.name');for(const key of ['sloganEn','sloganCn'])if(b.brand[key]!==undefined)textField(b.brand[key],'brand.'+key);}
 if(!Array.isArray(b.slides)||b.slides.length<1||b.slides.length>100)throw Error('slides: expected 1–100');
 for(const [i,s]of b.slides.entries()){
  own(s,['title','subtitle','accent','category','footer','notes','code','components'],`slide ${i+1}`);
  for(const k of ['title','subtitle','accent','category','footer','notes','code'])if(s[k]!==undefined&&typeof s[k]!=='string')throw Error(`${k}: expected text`);
  if(!s.title?.trim())throw Error(`slide ${i+1}: missing title`);
  if(!Array.isArray(s.components)||!s.components.length||s.components.length>12)throw Error('components: expected 1–12 instances');
  for(const c of s.components){own(c,['code','props'],'component');if(!componentCatalog.some(x=>x.id===c.code))throw Error(`Unknown component ${c.code}`);own(c.props,['x','y','w','h',...componentCatalog.find(x=>x.id===c.code).parameters],'props');validateProps(c.code,c.props);}
 }
 return b;
}
export function makeUiScene(brief){
 validateUiBrief(brief);const p=new ScenePresentation();const pages=[];
 for(const s of brief.slides){const slide=p.slides.add(),a=new Painter(p,slide);header(a,brief.brand);const hero=brief.mode!=='components'&&s.components.some(c=>['C23','C24'].includes(c.code));if(!hero)pageTitle(a,s.title,{subtitle:s.subtitle,accent:s.accent,category:s.category});for(const c of s.components)draw(a,c.code,c.props);const data=s.components.filter(c=>['C05','C14','C15'].includes(c.code)),demo=data.some(c=>c.props.demonstration===true);let foot=s.footer||'';if(demo&&!/演示|虚构|示例/.test(foot))foot='演示数据，非实际业务成果。'+foot;if(!foot&&data.some(c=>c.props.source))foot='来源：'+data.filter(c=>c.props.source).map(c=>c.props.source).join('、');if(foot)footer(a,foot);slide.speakerNotes.text=[s.notes||'',...data.map(c=>c.props.demonstration===true?'Demonstration data only.':'Source: '+c.props.source)].filter(Boolean).join('\n');pages.push({painter:a,slide,title:s.title,kind:brief.mode==='components'?'component':'scenario',purpose:brief.mode,code:s.code});}
 return sceneFromPages(brief,pages);
}
export function sceneFromPages(brief,pages){
 const font=brief.font||theme.font;
 const scene={schema:'warm-glass-ui-scene/v2',title:brief.title,mode:brief.mode,font,width:theme.canvas.width,height:theme.canvas.height,slides:pages.map(page=>{
  const objects=JSON.parse(JSON.stringify(page.slide.objects));
  for(const o of objects){if(o.text)o.text.style.typeface=font;if(o.kind==='chart')for(const k of ['legend','dataLabels','xAxis','yAxis'])o[k].textStyle.typeface=font;if(o.kind==='table')for(const row of o.cells)for(const cell of row)cell.text.style.typeface=font;}
  return {title:page.title,code:page.code,kind:page.kind,purpose:page.purpose,background:page.slide.background.fill,notes:page.slide.speakerNotes.text,objects,instances:page.painter.instances.map(({names,...item})=>({...item,names})),charts:page.painter.charts,tables:page.painter.tables};
 })};
 for(const s of scene.slides)for(const o of s.objects){const b=o.kind==='table'?{left:o.left,top:o.top,width:o.width,height:o.height}:o.position;if(!b)continue;if(![b.left,b.top,b.width,b.height].every(Number.isFinite)||b.left<0||b.top<0||b.width<0||b.height<0||b.left+b.width>scene.width+.5||b.top+b.height>scene.height+.5)throw Error('Invalid native object bounds: '+o.name);if(o.kind==='table'){const widths=o.columnWidths||Array(o.columns).fill(o.width/o.columns);if(widths.length!==o.columns||widths.some(w=>!Number.isFinite(w)||w<=0)||Math.abs(widths.reduce((n,w)=>n+w,0)-o.width)>1)throw Error('Table widths must fill the frame');for(const [r,row]of o.values.entries())for(const [c,value]of row.entries()){const st=o.cells[r][c].text.style,ins=st.insets;const lines=wrap(String(value),widths[c]-ins.left-ins.right,st.fontSize,st.bold).split('\n');if(lines.length*st.fontSize*1.23>o.rows[r].height-ins.top-ins.bottom+2)throw Error(`Table text does not fit row ${r+1}, column ${c+1}`);}}}
 return scene;
}
export function briefFromPages(title,mode,pages){return {schema:'warm-glass-ui/v2',title,mode,slides:pages.map(page=>({title:page.title,code:page.code,category:page.category||`${mode==='components'?page.code:({report:'汇报',talk:'演讲',training:'培训',product:'产品介绍'}[mode])} / ${page.title}`,subtitle:page.subtitle,accent:page.accent,footer:page.footer,notes:page.slide.speakerNotes.text,components:page.painter.instances.map(item=>({code:item.code,props:item.props}))}))};}
