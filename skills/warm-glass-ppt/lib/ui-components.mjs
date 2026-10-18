import {tokens} from './model.mjs';

// One set of design values serves both the legacy layouts and the approved UI.
export const theme={name:'Warm Glass',canvas:tokens.referenceCanvas,font:tokens.type.font,colors:tokens.colors,gradients:tokens.gradients,material:{...tokens.material,shadow:`0px ${tokens.material.shadowOffset}px ${tokens.material.shadowBlur}px ${tokens.material.shadowColor}/10`}};
const C=theme.colors;
export const componentCatalog=[
  {id:'C01',name:'标题与章节引导',relation:'主题与重点',parameters:['title','accent','subtitle','size'],capacity:'标题 1–2 行，关键词 2–8 字'},
  {id:'C02',name:'结论强调',relation:'结论与支撑',parameters:['text','label','variant'],capacity:'主句约 18–32 字，可选短标签'},
  {id:'C03',name:'玻璃信息容器',relation:'内容分组',parameters:['title','body','focus','tag'],capacity:'标题 1 行，说明 2–4 行'},
  {id:'C04',name:'图标与定位节点',relation:'对象与标识',parameters:['items','variant'],capacity:'6 种原生线性符号，短标签 2–6 字'},
  {id:'C05',name:'指标摘要',relation:'数值与口径',parameters:['items','trend','demonstration','source'],capacity:'2–4 个指标，可选原生数据图表'},
  {id:'C06',name:'双栏比较',relation:'同口径比较',parameters:['columns','emphasize'],capacity:'两组同口径内容，各 2–4 条'},
  {id:'C07',name:'步骤流程',relation:'先后顺序',parameters:['items','current'],capacity:'3–6 个步骤，原生连接线附着节点'},
  {id:'C08',name:'阶段路线图',relation:'阶段与里程碑',parameters:['items','focus'],capacity:'3–5 个阶段，日期与阶段状态分开填写'},
  {id:'C09',name:'嵌套层级',relation:'包含关系',parameters:['items'],capacity:'2–4 层，每层 1 个名称和短说明'},
  {id:'C10',name:'分层架构',relation:'分层与职责',parameters:['rows'],capacity:'3–4 层，每层 2–4 个模块'},
  {id:'C11',name:'证据与来源标注',relation:'判断与依据',parameters:['claim','basis','source','number'],capacity:'事实、口径与来源独立填写'},
  {id:'C12',name:'行动与责任表',relation:'行动、责任与验收',parameters:['headers','rows','widths'],capacity:'3–5 列、2–4 条行动，原生表格'},
  {id:'C13',name:'内容目录',relation:'主题与阅读顺序',parameters:['items','current'],capacity:'3–6 个主题，编号与说明分开'},
  {id:'C14',name:'时间趋势',relation:'同口径时间序列',parameters:['title','categories','series','unit','max','demonstration','source'],capacity:'3–8 个时点、1–2 条序列，原生折线图'},
  {id:'C15',name:'目标与实际',relation:'计划和实绩比较',parameters:['title','categories','target','actual','unit','max','demonstration','source'],capacity:'2–5 个同口径分类，原生簇状柱形图'},
  {id:'C16',name:'二维判断矩阵',relation:'两个维度的定性分类',parameters:['xLabel','yLabel','quadrants'],capacity:'4 个象限，含义由两个轴共同定义'},
  {id:'C17',name:'反馈闭环',relation:'回流与迭代',parameters:['items','center'],capacity:'4 个阶段，原生连接线附着节点'},
  {id:'C18',name:'跨角色泳道',relation:'职责与交接',parameters:['lanes','steps'],capacity:'2–3 个角色、3–5 个交接节点'},
  {id:'C19',name:'输入与输出',relation:'任务边界与交付物',parameters:['input','work','output'],capacity:'输入、处理、输出各 1 个主题与短说明'},
  {id:'C20',name:'能力覆盖表',relation:'能力与范围映射',parameters:['headers','rows','widths'],capacity:'3–5 列、2–5 行，原生表格'},
  {id:'C21',name:'情境案例',relation:'情境、行动与观察',parameters:['context','action','observation','limitation'],capacity:'3 个案例要素与 1 项适用边界'},
  {id:'C22',name:'问题与答疑',relation:'问题与解释',parameters:['items'],capacity:'2–3 组问题与回答'},
  {id:'C23',name:'章节转场',relation:'主题切换',parameters:['number','title','subtitle'],capacity:'章节号、主题和一句引导'},
  {id:'C24',name:'封面与收束',relation:'主题、主张与下一步',parameters:['title','accent','subtitle','action','variant'],capacity:'1 个主标题、短说明，可选下一步动作'}
];

export function gradient(name){const g=theme.gradients[name];if(!g)throw Error('Unknown gradient '+name);return {type:'gradient',gradientKind:'linear',angleDeg:g.angle,stops:g.stops.map(([p,c,a])=>({offset:p*1000,color:a===undefined?c:{type:'rgb',value:c,transform:{opacity:a}}}))};}
// Conservative portable metrics; no platform-specific canvas installation.
export function measure(text,size=26,bold=false){return [...text].reduce((n,ch)=>n+size*(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\u3000-\u303f\uff00-\uffef\u2018-\u201f]/u.test(ch)?1.02:/\s/u.test(ch)?.3:/[ilI.,:;'!|]/u.test(ch)?.3:/[MW@%]/u.test(ch)?.9:/[A-Z0-9]/u.test(ch)?.67:.58)*(bold?1.005:1),0);}
export function wrap(text,width,size=26,bold=false){
 const lines=[];for(const paragraph of String(text).split('\n')){let line='';const words=paragraph.match(/[A-Za-z0-9_./:+%\-]+|\s+|[^\s]/gu)||[''];for(const word of words){if(measure(word,size,bold)>width+1)throw Error('Text token exceeds width: '+word);if(line&&measure(line+word,size,bold)>width){if(/^[，。；：、？！）】]$/u.test(word)){line+=word;}else{lines.push(line.trimEnd());line=word.trimStart();}}else line+=word;}lines.push(line.trimEnd());}return lines.join('\n');
}

export class Painter{
 constructor(presentation,slide){this.p=presentation;this.s=slide;this.serial=0;this.scope=null;this.instances=[];this.textBoxes=[];this.charts=[];this.tables=[];this.bounds=[];}
 name(part){return `${this.scope?.id||'chrome'}--${part}--${++this.serial}`;}
 own(name,box,type='shape'){this.scope?.names.push(name);this.bounds.push({name,...box,type});}
 shape(part,x,y,w,h,fill='none',radius=0,stroke='none',extra={}){
  const name=this.name(part),box={left:x,top:y,width:w,height:h};
  const o=this.s.shapes.add({geometry:radius?'roundRect':'rect',name,position:box,fill,line:{style:'solid',fill:stroke,width:stroke==='none'?0:1},...(radius?{borderRadius:radius}:{}),...extra});this.own(name,box);return o;
 }
 glass(part,x,y,w,h,{focus=false,radius=24,shadow=true}={}){return this.shape(part,x,y,w,h,gradient(focus?'focus':'glass'),radius,'#FFFFFF/90',shadow?{shadow:theme.material.shadow}:{});}
 text(part,value,x,y,w,h,size=26,{bold=false,color=C.body,align='left',accent,fill,wrapText=true}={}){
  const str=wrapText?wrap(value,w-2,size,bold):String(value);const lines=str.split('\n').length;
  if(lines*size*1.23>h+2)throw Error(`${this.scope?.id||'slide'} ${part}: text does not fit (${lines} lines at ${size}px in ${h}px): ${value}`);
  const name=this.name(part),box={left:x,top:y,width:w,height:h};
  const o=this.s.shapes.add({geometry:'textbox',name,position:box,fill:'none',line:{fill:'none',width:0}});o.text=str;o.text.style={typeface:theme.font,fontSize:size,bold,color,alignment:align,verticalAlignment:'top',insets:0,wrap:'none',autoFit:'none'};
  if(fill)o.text.fill=fill;
  if(accent&&str.includes(accent))o.text.get(accent).fill=gradient('accent');
  this.own(name,box);this.textBoxes.push({name,text:str,size,lines,box});return o;
 }
 ellipse(part,x,y,w,h,fill='none',stroke='none',lineWidth=1){const name=this.name(part),box={left:x,top:y,width:w,height:h};const o=this.s.shapes.add({geometry:'ellipse',name,position:box,fill,line:{style:'solid',fill:stroke,width:stroke==='none'?0:lineWidth}});this.own(name,box);return o;}
 line(part,x1,y1,x2,y2,color=C.border,width=1,{dash=false}={}){
  const name=this.name(part),box={left:Math.min(x1,x2),top:Math.min(y1,y2),width:Math.abs(x2-x1),height:Math.abs(y2-y1)};
  const o=this.s.shapes.add({geometry:'line',name,position:{...box,horizontalFlip:x2<x1,verticalFlip:y2<y1},fill:'none',line:{style:dash?'dashed':'solid',fill:color,width}});this.own(name,box,'line');return o;
 }
 path(part,x,y,w,h,commands,color=C.body,width=2,fill='none'){
  const name=this.name(part),box={left:x,top:y,width:w,height:h};const o=this.s.shapes.add({geometry:'custom',name,position:box,fill,line:{style:'solid',fill:color,width},customPaths:[{width:w,height:h,commands}]});this.own(name,box);return o;
 }
 connect(from,to,{color=C.vermillion,fromSide='right',toSide='left',kind='straight',dash=false}={}){const o=this.s.shapes.connect(from,to,{kind,fromSide,toSide,line:{style:dash?'dashed':'solid',fill:color,width:2.5},tail:{type:'triangle',width:'med',length:'med'}});return o;}
 group(code,box,props,draw){
  const previous=this.scope;const item={id:`${code}-${this.instances.filter(x=>x.code===code).length+1}`,code,box,names:[],props};this.scope=item;this.instances.push(item);const result=draw();this.scope=previous;return result;
 }
}

export function header(a,brand){
 if(!brand)return;
 a.text('brand',brand.name,48,38,240,43,28,{bold:true,color:C.header,wrapText:false});
 a.line('header-divider',305,42,305,87,'#FF3D12/68',1);
 if(brand.sloganEn)a.text('slogan-en',brand.sloganEn,333,39,430,29,20,{color:C.header,wrapText:false});
 if(brand.sloganCn)a.text('slogan-cn',brand.sloganCn,333,69,430,25,17,{color:C.header,wrapText:false});
}
function headline(a,part,title,accent,x,y,w,h,size){
 if(accent&&title.includes(accent)&&!title.includes('\n')){
  const at=title.indexOf(accent),before=title.slice(0,at),after=title.slice(at+accent.length);let xx=x;
  for(const [s,em]of [[before,false],[accent,true],[after,false]]){if(!s)continue;const ww=measure(s,size,true)+5;if(xx+ww>x+w+2)throw Error('Headline exceeds its available width');a.text(part,s,xx,y,ww,h,size,{bold:true,color:C.title,fill:em?gradient('accent'):undefined,wrapText:false});xx+=ww-4;}
 }else a.text(part,title,x,y,w,h,size,{bold:true,color:C.title});
}
export function pageTitle(a,title,{subtitle,accent,code,category}={}){
 const label=code||category;if(label)a.text('page-label',label,50,132,1560,30,19,{bold:true,color:C.accentText});
 headline(a,'page-title',title,accent,48,176,1576,91,62);
 if(subtitle)a.text('page-subtitle',subtitle,50,278,1555,48,24,{color:C.muted});
}
export function footer(a,text){a.line('footer-rule',48,868,1624,868,C.border,1);a.text('footer',text,49,886,1560,29,18,{color:C.muted});}
export function note(a,text){a.text('visible-disclosure',text,50,904,1560,25,16,{color:C.muted});}

function icon(a,kind,x,y,size,color=C.vermillion){
 const u=size/48,ln=(p,q,r,s)=>a.line('icon-line',x+p*u,y+q*u,x+r*u,y+s*u,color,2.4*u);
 if(kind==='target'){a.ellipse('target-outer',x+5*u,y+5*u,38*u,38*u,'none',color,2.4*u);a.ellipse('target-inner',x+14*u,y+14*u,20*u,20*u,'none',color,2.4*u);ln(24,24,43,5);ln(34,5,43,5);ln(43,5,43,14);}
 else if(kind==='document'){a.shape('document',x+10*u,y+4*u,29*u,40*u,'none',4*u,color);ln(17,16,31,16);ln(17,24,31,24);ln(17,32,27,32);}
 else if(kind==='person'){a.ellipse('person-head',x+17*u,y+4*u,15*u,15*u,'none',color,2.3*u);a.path('person-body',x+7*u,y+23*u,34*u,21*u,[{moveTo:{x:0,y:20*u}},{cubicBezTo:{x1:0,y1:-6*u,x2:34*u,y2:-6*u,x:34*u,y:20*u}},{lineTo:{x:0,y:20*u}}],color,2.3*u);}
 else if(kind==='check'){a.ellipse('check-ring',x+4*u,y+4*u,40*u,40*u,'none',color,2.4*u);ln(13,24,21,32);ln(21,32,36,16);}
 else if(kind==='layers'){for(const yy of [7,18,29]){a.path('layer',x+4*u,y+yy*u,40*u,13*u,[{moveTo:{x:0,y:6*u}},{lineTo:{x:20*u,y:0}},{lineTo:{x:40*u,y:6*u}},{lineTo:{x:20*u,y:13*u}},{close:{}}],color,2*u);}}
 else if(kind==='code'){ln(17,12,6,24);ln(6,24,17,36);ln(31,12,42,24);ln(42,24,31,36);ln(27,7,21,41);}
 else throw Error('Unknown icon '+kind);
}

export const components={
 C01(a,p){const {x,y,w,h,title,accent,subtitle,size=76}=p;return a.group('C01',{x,y,w,h},p,()=>{
  headline(a,'heading-part',title,accent,x,y,w,h-(subtitle?90:0),size);
  if(subtitle)a.text('heading-support',subtitle,x,y+h-74,w,70,28,{color:C.muted});
 });},
 C02(a,p){const {x,y,w,h,text,label,variant='quiet'}=p;return a.group('C02',{x,y,w,h},p,()=>{
  a.glass('conclusion',x,y,w,h,{focus:variant==='focus',radius:Math.min(24,h/4)});
  if(variant!=='focus')a.shape('accent-edge',x,y,6,h,gradient('accent'),3);
  const xx=x+30;let yy=y+Math.max(18,(h-(label?96:42))/2);
  if(label){a.text('conclusion-label',label,xx,yy,w-60,30,18,{bold:true,color:variant==='focus'?C.title:C.accentText});yy+=38;}
  a.text('conclusion-text',text,xx,yy,w-60,h-(yy-y)-12,h>120?36:28,{bold:true,color:C.title});
 });},
 C03(a,p){const {x,y,w,h,title,body,focus=false,tag}=p;return a.group('C03',{x,y,w,h},p,()=>{
  a.glass('surface',x,y,w,h,{focus});
  if(tag){a.shape('small-tag',x+26,y+24,112,34,gradient('tag'),17,'#FFFFFF/85');a.text('small-tag-text',tag,x+32,y+30,100,27,17,{bold:true,color:C.white,align:'center'});}
  const titleY=y+(tag?80:30);if(title)a.text('surface-title',title,x+28,titleY,w-56,63,31,{bold:true,color:C.title});
  if(body)a.text('surface-body',body,x+28,titleY+(title?85:8),w-56,h-(titleY-y)-(title?112:32),25,{color:C.body});
 });},
 C04(a,p){const {x,y,w,h,items,variant='pin'}=p;if(items.length<1||items.length>6)throw Error('C04 expects 1–6 nodes');return a.group('C04',{x,y,w,h},p,()=>{
  const step=w/items.length;items.forEach((it,i)=>{const cx=x+step*(i+.5),cy=y+58;
   if(variant==='pin'){
    a.ellipse('node-halo',cx-51,cy-51,102,102,'#FFF6EC/70','#FFFFFF/90',1);
    a.ellipse('node-face',cx-41,cy-41,82,82,{type:'gradient',gradientKind:'linear',angleDeg:55,stops:[{offset:0,color:'#333333'},{offset:55000,color:'#131313'},{offset:100000,color:'#050505'}]},'#FFFFFF/70',1);
    icon(a,it.kind,cx-25,cy-25,50,C.white);a.line('pin-stem',cx,cy+44,cx,cy+79,C.pin,2);
    a.ellipse('pin-base',cx-23,cy+73,46,12,'#FFF6EC','#FF7800/45',1.5);a.ellipse('pin-center',cx-7,cy+76,14,6,C.vermillion);
    a.text('node-label',it.label,cx-step/2+5,cy+106,step-10,64,25,{bold:true,color:C.title,align:'center'});
   }else{
    a.ellipse('node-ring',cx-48,cy-48,96,96,gradient('glass'),'#FF3D12/25',1.5);icon(a,it.kind,cx-26,cy-26,52);
    a.text('node-label',it.label,cx-step/2+5,cy+74,step-10,62,25,{bold:true,color:C.title,align:'center'});
   }
  });
 });},
 C05(a,p){const {x,y,w,h,items,trend,demonstration=false}=p;if(items.length<2||items.length>4)throw Error('C05 expects 2–4 metrics');return a.group('C05',{x,y,w,h},p,()=>{
  const gap=22,cw=(w-gap*(items.length-1))/items.length,hh=trend?190:h;
  items.forEach((it,i)=>{const xx=x+i*(cw+gap);a.glass('metric-surface',xx,y,cw,hh);a.text('metric-value',it.value,xx+26,y+22,cw-52,83,62,{bold:true,color:C.accentText});a.text('metric-title',it.title,xx+28,y+112,cw-56,44,27,{bold:true,color:C.title});if(it.body)a.text('metric-definition',it.body,xx+28,y+(trend?156:185),cw-56,trend?28:hh-210,trend?17:22,{color:C.muted});});
  if(trend){
   const yy=y+228;a.text('trend-heading',trend.title,x+2,yy,w,35,23,{bold:true,color:C.title});
   const chart=a.s.charts.add('bar',{position:{left:x+2,top:yy+46,width:w-12,height:h-284},categories:trend.categories,series:[{name:trend.seriesName||'数量',values:trend.values,fill:gradient('accent')}],barOptions:{direction:'column',grouping:'clustered',gapWidth:165},hasLegend:false,chartFill:'none',chartLine:{fill:'none',width:0},plotAreaFill:'none',plotAreaLine:{fill:'none',width:0},xAxis:{visible:true,textStyle:{typeface:theme.font,fontSize:21,fill:C.muted},line:{fill:C.border,width:1},majorGridlines:null},yAxis:{visible:true,min:0,max:trend.max||Math.max(1,Math.ceil(Math.max(...trend.values)*1.35)),majorGridlines:{style:'solid',fill:'#E5DDD6/70',width:1},line:{fill:'none',width:0},textStyle:{typeface:theme.font,fontSize:18,fill:C.muted}},dataLabels:{showValue:true,position:'outEnd',textStyle:{typeface:theme.font,fontSize:24,bold:true,fill:C.accentText}}});
   chart.legend.textStyle.typeface=theme.font;chart.dataLabels.textStyle.typeface=theme.font;chart.xAxis.textStyle.typeface=theme.font;chart.yAxis.textStyle.typeface=theme.font;a.charts.push({id:chart.id,code:'C05',demonstration,categories:trend.categories,values:trend.values});
  }
 });},
 C06(a,p){const {x,y,w,h,columns,emphasize=1}=p;if(columns.length!==2)throw Error('C06 expects two columns');return a.group('C06',{x,y,w,h},p,()=>{
  const gap=48,cw=(w-gap)/2;columns.forEach((it,i)=>{const xx=x+i*(cw+gap);a.glass('compare-surface',xx,y,cw,h);a.shape('compare-top',xx+28,y+27,44,4,i===emphasize?gradient('accent'):C.border,2);a.text('compare-heading',it.title,xx+28,y+52,cw-56,62,32,{bold:true,color:i===emphasize?C.accentText:C.title});a.line('compare-divider',xx+28,y+127,xx+cw-28,y+127,C.border,1);let yy=y+155;for(const [j,row]of it.items.entries()){a.text('compare-index',String(j+1).padStart(2,'0'),xx+29,yy,cw-58,28,17,{color:C.accentText,bold:true});const lines=wrap(row,cw-65,26).split('\n').length;a.text('compare-item',row,xx+28,yy+34,cw-56,lines*34+4,26);yy+=lines*34+65;}if(yy>y+h+10)throw Error('C06 content exceeds panel');});
 });},
 C07(a,p){const {x,y,w,h,items,current=-1}=p;if(items.length<3||items.length>6)throw Error('C07 expects 3–6 steps');return a.group('C07',{x,y,w,h},p,()=>{
  const step=w/items.length,centers=[];items.forEach((it,i)=>{const cx=x+step*(i+.5);const face=a.ellipse('step-node',cx-38,y+16,76,76,i===current?gradient('focus'):C.pin,'#FFFFFF/80',1);centers.push(face);a.text('step-number',String(i+1).padStart(2,'0'),cx-33,y+35,66,41,27,{bold:true,color:i===current?C.title:C.white,align:'center'});a.text('step-title',it.title,cx-step/2+10,y+124,step-20,80,28,{bold:true,color:C.title,align:'center'});if(it.body)a.text('step-body',it.body,cx-step/2+17,y+217,step-34,h-225,23,{color:C.muted,align:'center'});});for(let i=0;i<centers.length-1;i++)a.connect(centers[i],centers[i+1]);
 });},
 C08(a,p){const {x,y,w,h,items,focus=0}=p;if(items.length<3||items.length>5)throw Error('C08 expects 3–5 milestones');return a.group('C08',{x,y,w,h},p,()=>{
  const step=w/items.length,gap=28,cw=step-gap;const cy=y+40;
  a.line('roadmap-route',x+step/2,cy,x+w-step/2,cy,gradient('route'),4);
  items.forEach((it,i)=>{const xx=x+step*i+gap/2,cx=xx+cw/2;a.ellipse('milestone-halo',cx-29,cy-29,58,58,gradient('glass'),'#FF7800/35',1.5);a.ellipse('milestone-node',cx-14,cy-14,28,28,i===focus?gradient('accent'):C.pin);a.line('milestone-stem',cx,cy+30,cx,y+105,'#FF7800/55',2);a.glass('milestone-surface',xx,y+106,cw,h-106);a.text('milestone-date',it.date,xx+24,y+132,cw-48,34,22,{bold:true,color:C.accentText});a.text('milestone-title',it.title,xx+24,y+186,cw-48,76,31,{bold:true,color:C.title});a.text('milestone-body',it.body,xx+24,y+284,cw-48,h-312,24,{color:C.body});});
 });},
 C09(a,p){const {x,y,w,h,items}=p;if(items.length<2||items.length>4)throw Error('C09 expects 2–4 layers');return a.group('C09',{x,y,w,h},p,()=>{
  const step=(h-122)/(items.length-1)-22;items.forEach((it,i)=>{const xx=x+i*26,yy=y+i*step,ww=w-i*52,hh=h-i*step-i*22;const last=i===items.length-1;a.glass('nested-layer',xx,yy,ww,hh,{focus:last});const titleW=measure(it.title,last?33:29,true)+8;a.text('nested-title',it.title,xx+26,yy+22,last?ww-52:titleW,48,last?33:29,{bold:true,color:C.title});if(it.body){if(last)a.text('nested-body',it.body,xx+26,yy+73,ww-52,38,21,{color:C.body});else a.text('nested-body',it.body,xx+titleW+46,yy+30,ww-titleW-74,30,20,{color:C.muted});}});
 });},
 C10(a,p){const {x,y,w,h,rows}=p;if(rows.length<3||rows.length>4)throw Error('C10 expects 3–4 rows');return a.group('C10',{x,y,w,h},p,()=>{
  const gap=18,rh=(h-gap*(rows.length-1))/rows.length;rows.forEach((it,i)=>{const yy=y+i*(rh+gap);a.glass('architecture-layer',x,yy,w,rh,{radius:20});a.shape('architecture-label',x,yy,230,rh,i===rows.length-1?gradient('accent'):'#FFFFFF/65',20);a.text('architecture-layer-title',it.title,x+24,yy+Math.max(20,(rh-42)/2),182,48,27,{bold:true,color:i===rows.length-1?C.white:C.accentText});const n=it.items.length,g=18,cw=(w-274-g*(n-1))/n;it.items.forEach((label,j)=>{const xx=x+254+j*(cw+g);a.shape('architecture-module',xx,yy+18,cw,rh-36,'#FFFFFF/65',14,C.border);a.text('architecture-module-text',label,xx+16,yy+Math.max(26,(rh-36)/2),cw-32,70,24,{bold:true,color:C.body,align:'center'});});});
 });},
 C11(a,p){const {x,y,w,h,claim,basis,source,number='01'}=p;return a.group('C11',{x,y,w,h},p,()=>{
  a.glass('evidence-surface',x,y,w,h);a.ellipse('evidence-anchor',x+25,y+29,46,46,C.pin);a.text('evidence-number',number,x+29,y+39,38,29,19,{bold:true,color:C.white,align:'center'});
  a.text('evidence-claim',claim,x+91,y+28,w-120,76,29,{bold:true,color:C.title});a.line('evidence-separator',x+29,y+123,x+w-29,y+123,C.border,1);
  a.text('evidence-basis-label','口径',x+29,y+146,64,30,19,{bold:true,color:C.accentText});a.text('evidence-basis',basis,x+110,y+142,w-140,h-230,23,{color:C.body});
  a.text('evidence-source','来源：'+source,x+29,y+h-64,w-58,43,18,{color:C.muted});
 });},
 C12(a,p){const {x,y,w,h,headers,rows,widths}=p;if(headers.length<3||headers.length>5||rows.length<2||rows.length>4)throw Error('C12 table capacity exceeded');if(rows.some(r=>r.length!==headers.length))throw Error('C12 row length differs from headers');return a.group('C12',{x,y,w,h},p,()=>{
  a.glass('action-table-surface',x,y,w,h);
  const table=a.s.tables.add({rows:rows.length+1,columns:headers.length,left:x+18,top:y+18,width:w-36,height:h-36,columnWidths:widths,values:[headers,...rows]});
  table.styleOptions={headerRow:false,bandedRows:false};table.borders.assign({style:'solid',fill:C.border,width:0.8});
  for(let r=0;r<=rows.length;r++)for(let col=0;col<headers.length;col++){
   const cell=table.getCell(r,col);cell.fill=r===0?'#FFF6EC/90':(r%2?'#FFFFFF/60':'#F5F2F1/35');cell.text.style={typeface:theme.font,fontSize:r===0?22:23,bold:r===0,color:r===0?C.accentText:C.body,verticalAlignment:'middle',insets:{top:16,bottom:14,left:18,right:16}};
  }
  table.rows[0].height=62;for(let r=1;r<=rows.length;r++)table.rows[r].height=(h-98)/rows.length;
  a.tables.push({id:table.id,code:'C12',rows:rows.length+1,columns:headers.length});return table;
 });},
 C13(a,p){const {x,y,w,h,items,current=-1}=p;if(items.length<3||items.length>6)throw Error('C13 expects 3–6 topics');return a.group('C13',{x,y,w,h},p,()=>{
  const gap=12,rh=(h-gap*(items.length-1))/items.length;
  items.forEach((it,i)=>{const yy=y+i*(rh+gap);a.glass('agenda-row',x,yy,w,rh,{radius:16});a.text('agenda-index',String(i+1).padStart(2,'0'),x+24,yy+16,70,rh-20,30,{bold:true,color:i===current?C.accentText:C.muted});a.text('agenda-title',it.title,x+112,yy+17,w*.32,rh-20,27,{bold:true,color:C.title});if(it.body)a.text('agenda-description',it.body,x+w*.44,yy+20,w*.53,rh-23,22,{color:C.muted});});
 });},
 C14(a,p){const {x,y,w,h,title,categories,series,unit='数量',max,demonstration=false,source}=p;checkData(categories,series,3,8);if(series.length>2)throw Error('C14 expects 1–2 series');evidence(demonstration,source);return a.group('C14',{x,y,w,h},p,()=>{
  a.glass('trend-surface',x,y,w,h);a.text('trend-title',title||'时间趋势',x+28,y+22,w-56,42,29,{bold:true,color:C.title});a.text('trend-unit','单位：'+unit,x+29,y+74,w-58,30,18,{color:C.muted});
  const chart=a.s.charts.add('line',chartConfig(x+26,y+118,w-52,h-176,categories,series.map((s,i)=>({...s,line:{fill:i?C.muted:C.vermillion,width:3,style:'solid'},marker:{symbol:'circle',size:8,fill:i?C.muted:C.vermillion}})),{max,legend:series.length>1,labels:true}));
  a.charts.push({id:chart.id,code:'C14',demonstration,categories,series});a.text('trend-source',demonstration?'演示数据，非实际业务成果':'来源：'+source,x+29,y+h-41,w-58,28,17,{color:C.muted});
 });},
 C15(a,p){const {x,y,w,h,title,categories,target,actual,unit='数量',max,demonstration=false,source}=p;const series=[{name:'目标',values:target,fill:'#D2C4B5'},{name:'实际',values:actual,fill:gradient('accent')}];checkData(categories,series,2,5);evidence(demonstration,source);return a.group('C15',{x,y,w,h},p,()=>{
  a.glass('target-surface',x,y,w,h);a.text('target-title',title||'目标与实际',x+28,y+22,w-56,42,29,{bold:true,color:C.title});a.text('target-unit','单位：'+unit,x+29,y+74,w-58,30,18,{color:C.muted});
  const chart=a.s.charts.add('bar',{...chartConfig(x+26,y+112,w-52,h-170,categories,series,{max,legend:true,labels:true}),barOptions:{direction:'column',grouping:'clustered',gapWidth:150}});a.charts.push({id:chart.id,code:'C15',demonstration,categories,series});a.text('target-source',demonstration?'演示数据，目标和实际采用相同口径':'来源：'+source,x+29,y+h-41,w-58,28,17,{color:C.muted});
 });},
 C16(a,p){const {x,y,w,h,xLabel,yLabel,quadrants}=p;if(quadrants.length!==4)throw Error('C16 expects four quadrants');return a.group('C16',{x,y,w,h},p,()=>{
  const xx=x+66,yy=y+34,ww=w-86,hh=h-93,cw=ww/2,ch=hh/2;
  quadrants.forEach((it,i)=>{const col=i%2,row=Math.floor(i/2),qx=xx+col*cw+9,qy=yy+row*ch+9;a.glass('matrix-quadrant',qx,qy,cw-18,ch-18,{focus:it.focus,radius:18});a.text('quadrant-title',it.title,qx+22,qy+19,cw-62,44,28,{bold:true,color:C.title});a.text('quadrant-body',it.body,qx+22,qy+75,cw-62,ch-110,22,{color:C.body});});
  a.line('matrix-x',xx,yy+hh+8,xx+ww,yy+hh+8,C.pin,2);a.line('matrix-y',xx-10,yy+hh,xx-10,yy,C.pin,2);a.text('matrix-x-label','低  '+xLabel+'  高',xx,yy+hh+25,ww,31,21,{color:C.muted,align:'center'});a.text('matrix-y-label',yLabel+'（上高下低）',x+6,y,w-12,30,20,{color:C.muted});
 });},
 C17(a,p){const {x,y,w,h,items,center='反馈与修订'}=p;if(items.length!==4)throw Error('C17 expects four stages');return a.group('C17',{x,y,w,h},p,()=>{
  const nw=Math.min(430,w*.36),nh=142,points=[[x,y],[x+w-nw,y],[x+w-nw,y+h-nh],[x,y+h-nh]],nodes=[];
  items.forEach((it,i)=>{const [xx,yy]=points[i];nodes.push(a.glass('cycle-node',xx,yy,nw,nh,{focus:i===0}));a.text('cycle-title',it.title,xx+24,yy+19,nw-48,42,29,{bold:true,color:C.title});a.text('cycle-body',it.body,xx+24,yy+76,nw-48,54,21,{color:C.body});});
  a.connect(nodes[0],nodes[1]);a.connect(nodes[1],nodes[2],{fromSide:'bottom',toSide:'top'});a.connect(nodes[2],nodes[3],{fromSide:'left',toSide:'right'});a.connect(nodes[3],nodes[0],{fromSide:'top',toSide:'bottom'});
  a.text('cycle-center',center,x+w*.28,y+h/2-28,w*.44,75,32,{bold:true,color:C.title,align:'center'});
 });},
 C18(a,p){const {x,y,w,h,lanes,steps}=p;if(lanes.length<2||lanes.length>3||steps.length<3||steps.length>5)throw Error('C18 capacity: 2–3 lanes, 3–5 steps');return a.group('C18',{x,y,w,h},p,()=>{
  const rh=h/lanes.length,stepW=(w-220)/steps.length,nodes=[];
  lanes.forEach((label,i)=>{const yy=y+i*rh;a.glass('swimlane',x,yy,w,rh-12,{radius:16});a.text('lane-role',label,x+24,yy+rh/2-22,170,65,26,{bold:true,color:C.accentText});});
  steps.forEach((it,i)=>{if(!Number.isInteger(it.lane)||it.lane<0||it.lane>=lanes.length)throw Error('C18 invalid lane index');const xx=x+220+i*stepW+8,yy=y+it.lane*rh+(rh-86)/2;nodes.push(a.glass('lane-task',xx,yy,stepW-16,74,{focus:i===0,radius:16}));a.text('lane-task-title',it.title,xx+12,yy+21,stepW-40,45,23,{bold:true,color:C.title,align:'center'});});
  for(let i=0;i<nodes.length-1;i++)a.connect(nodes[i],nodes[i+1],{kind:'elbow'});
 });},
 C19(a,p){const {x,y,w,h,input,work,output}=p;return a.group('C19',{x,y,w,h},p,()=>{
  const gap=84,cw=(w-gap*2)/3,nodes=[];[input,work,output].forEach((it,i)=>{const xx=x+i*(cw+gap);nodes.push(a.glass('io-surface',xx,y,cw,h,{focus:i===1}));a.text('io-type',['输入','处理','输出'][i],xx+24,y+24,cw-48,34,20,{bold:true,color:i===1?C.title:C.accentText});a.text('io-title',it.title,xx+24,y+87,cw-48,82,32,{bold:true,color:C.title});a.text('io-body',it.body,xx+24,y+198,cw-48,h-224,24,{color:C.body});});a.connect(nodes[0],nodes[1]);a.connect(nodes[1],nodes[2]);
 });},
 C20(a,p){const {x,y,w,h,headers,rows,widths}=p;if(headers.length<3||headers.length>5||rows.length<2||rows.length>5||rows.some(r=>r.length!==headers.length))throw Error('C20 table capacity or row length invalid');return a.group('C20',{x,y,w,h},p,()=>{
  a.glass('coverage-surface',x,y,w,h);const table=a.s.tables.add({rows:rows.length+1,columns:headers.length,left:x+18,top:y+18,width:w-36,height:h-36,columnWidths:widths,values:[headers,...rows]});table.styleOptions={headerRow:false,bandedRows:false};table.borders.assign({style:'solid',fill:C.border,width:.8});
  for(let r=0;r<=rows.length;r++)for(let c=0;c<headers.length;c++){const cell=table.getCell(r,c);cell.fill=r===0?'#FFF6EC/90':r%2?'#FFFFFF/60':'#F5F2F1/35';cell.text.style={typeface:theme.font,fontSize:r===0?22:23,bold:r===0,color:r===0?C.accentText:C.body,verticalAlignment:'middle',insets:{top:14,bottom:14,left:18,right:16}};}table.rows[0].height=62;for(let r=1;r<=rows.length;r++)table.rows[r].height=(h-98)/rows.length;a.tables.push({id:table.id,code:'C20',rows:rows.length+1,columns:headers.length});
 });},
 C21(a,p){const {x,y,w,h,context,action,observation,limitation}=p;return a.group('C21',{x,y,w,h},p,()=>{
  a.glass('case-context',x,y,w,112);a.text('case-context-label','情境',x+24,y+23,100,36,22,{bold:true,color:C.accentText});a.text('case-context-body',context,x+134,y+22,w-165,76,28,{bold:true,color:C.title});
  const gap=30,cw=(w-gap)/2;[action,observation].forEach((value,i)=>{const xx=x+i*(cw+gap);a.glass('case-detail',xx,y+136,cw,h-214);a.text('case-detail-label',i?'观察与结果':'采取的行动',xx+24,y+159,cw-48,39,25,{bold:true,color:C.accentText});a.text('case-detail-body',value,xx+24,y+222,cw-48,h-320,25,{color:C.body});});a.text('case-limit','适用边界：'+limitation,x+2,y+h-48,w-4,60,20,{color:C.muted});
 });},
 C22(a,p){const {x,y,w,h,items}=p;if(items.length<2||items.length>3)throw Error('C22 expects 2–3 questions');return a.group('C22',{x,y,w,h},p,()=>{
  const gap=18,rh=(h-gap*(items.length-1))/items.length;items.forEach((it,i)=>{const yy=y+i*(rh+gap);a.glass('faq-row',x,yy,w,rh);a.text('faq-question',it.question,x+26,yy+24,w*.32,rh-35,29,{bold:true,color:C.title});a.line('faq-divider',x+w*.37,yy+24,x+w*.37,yy+rh-24,C.border,1);a.text('faq-answer',it.answer,x+w*.4,yy+27,w*.56,rh-40,25,{color:C.body});});
 });},
 C23(a,p){const {x,y,w,h,number,title,subtitle}=p;return a.group('C23',{x,y,w,h},p,()=>{
  a.text('chapter-number',number,x,y,170,105,80,{bold:true,color:C.accentText});a.line('chapter-rule',x+204,y+38,x+w,y+38,gradient('route'),3);a.text('chapter-title',title,x,y+159,w,136,76,{bold:true,color:C.title});if(subtitle)a.text('chapter-subtitle',subtitle,x+2,y+329,w-4,h-335,29,{color:C.muted});
 });},
 C24(a,p){const {x,y,w,h,title,accent,subtitle,action,variant='cover'}=p;return a.group('C24',{x,y,w,h},p,()=>{
  headline(a,'hero-title',title,accent,x,y+28,w,200,variant==='cover'?86:76);if(subtitle)a.text('hero-subtitle',subtitle,x+2,y+256,w-4,110,30,{color:C.muted});if(action){a.glass('hero-action',x,y+h-93,w,93);a.text('hero-action-text',action,x+28,y+h-67,w-56,52,28,{bold:true,color:C.accentText});}
 });}
};

function evidence(demonstration,source){if(!demonstration&&(typeof source!=='string'||!source.trim()))throw Error('Chart source is required unless demonstration=true');}
function checkData(categories,series,lo,hi){if(!Array.isArray(categories)||categories.length<lo||categories.length>hi||categories.some(c=>typeof c!=='string'))throw Error('Chart category capacity invalid');if(!Array.isArray(series)||!series.length||series.some(s=>!Array.isArray(s.values)||s.values.length!==categories.length||s.values.some(v=>!Number.isFinite(v)||v<0)))throw Error('Chart values must be non-negative, finite and match categories');}
function chartConfig(x,y,w,h,categories,series,{max,legend=false,labels=false}={}){return {position:{left:x,top:y,width:w,height:h},categories,series,hasLegend:legend,legend:{position:'bottom',textStyle:{typeface:theme.font,fontSize:20,fill:C.muted}},chartFill:'none',chartLine:{fill:'none',width:0},plotAreaFill:'none',plotAreaLine:{fill:'none',width:0},xAxis:{visible:true,line:{fill:C.border,width:1},majorGridlines:null,textStyle:{typeface:theme.font,fontSize:21,fill:C.muted}},yAxis:{visible:true,min:0,...(max?{max}:{}),majorGridlines:{style:'solid',fill:C.border,width:1},line:{fill:'none',width:0},textStyle:{typeface:theme.font,fontSize:18,fill:C.muted}},dataLabels:{showValue:labels,position:'outEnd',textStyle:{typeface:theme.font,fontSize:22,bold:true,fill:C.accentText}}};}
export function draw(a,code,props){if(!components[code])throw Error('Unknown component '+code);for(const key of ['x','y','w','h'])if(!Number.isFinite(props[key])||props[key]<0||(['w','h'].includes(key)&&props[key]===0))throw Error(`${code}: invalid ${key}`);if(props.x+props.w>theme.canvas.width||props.y+props.h>theme.canvas.height)throw Error(code+' exceeds slide bounds');if(code==='C05'){evidence(props.demonstration===true,props.source);if(props.trend)checkData(props.trend.categories,[{values:props.trend.values}],2,8);}if(code==='C10'&&props.rows.some(r=>r.items.length<2||r.items.length>4))throw Error('C10 expects 2–4 modules per row');return components[code](a,props);}
