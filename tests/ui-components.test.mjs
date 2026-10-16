import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import JSZip from 'jszip';
import {build} from '../skills/warm-glass-ppt/scripts/build.mjs';
import {makeUiScene} from '../skills/warm-glass-ppt/lib/ui-scene.mjs';
import {componentCatalog} from '../skills/warm-glass-ppt/lib/ui-components.mjs';
import {renderUiPptx,renderUiHtml} from '../skills/warm-glass-ppt/lib/ui-render.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),examples=path.join(root,'skills/warm-glass-ppt/examples/ui');
const read=async mode=>JSON.parse(await fs.readFile(path.join(examples,mode+'.json'),'utf8'));

test('24 native component families are demonstrated and reused by four six-page purposes',async()=>{
 assert.equal(componentCatalog.length,24);assert.equal(new Set(componentCatalog.map(c=>c.id)).size,24);
 const all=await read('components');assert.equal(all.slides.length,24);assert.deepEqual(all.slides.map(s=>s.code),componentCatalog.map(c=>c.id));
 const used=new Set();for(const mode of ['report','talk','training','product']){const b=await read(mode);assert.equal(b.mode,mode);assert.equal(b.slides.length,6);makeUiScene(b);for(const s of b.slides)for(const c of s.components)used.add(c.code);}
 for(const c of ['C13','C14','C15','C16','C17','C18','C19','C20','C21','C22','C23','C24'])assert.ok(used.has(c),'new family not used: '+c);
});
test('portable UI export retains groups, editable charts/workbooks, native tables and attached connectors',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'warm-glass-ui-'));
 for(const mode of ['components','report','talk','training','product']){
  const report=await build(path.join(examples,mode+'.json'),path.join(tmp,mode));assert.equal(report.slideCount,mode==='components'?24:6);assert.equal(report.pictures,0);assert.ok(report.groups>0);
  const zip=await JSZip.loadAsync(await fs.readFile(path.join(tmp,mode,'deck.pptx'))),names=Object.keys(zip.files);
  for(let i=1;i<=report.slideCount;i++){const value=await zip.file(`ppt/slides/slide${i}.xml`).async('string');const ids=[...value.matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const m of value.matchAll(/<a:(?:stCxn|endCxn)\b[^>]*\bid="(\d+)"/g))assert.ok(ids.includes(m[1]),'dangling connector');assert.doesNotMatch(value,/<p:pic\b/);}
  const types=await zip.file('[Content_Types].xml').async('string');for(const m of types.matchAll(/<Override\b[^>]*\bPartName="([^"]+)"/g))assert.ok(zip.file(m[1].replace(/^\//,'')));
  for(const key of names.filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)))assert.doesNotMatch(await zip.file(key).async('string'),/\banchor="mid"/,'table anchors must use native OOXML values');
  if(report.charts){assert.equal(names.filter(n=>/^ppt\/embeddings\/.*\.xlsx$/.test(n)).length,report.charts);}
  const html=await fs.readFile(path.join(tmp,mode,'preview.html'),'utf8');assert.match(html,/<svg viewBox="0 0 1672 941"/);assert.doesNotMatch(html,/<img|data:image|https?:\/\//);assert.match(html,/PPTX 渲染需另行检查/);
 }
 const z=await JSZip.loadAsync(await fs.readFile(path.join(tmp,'components/deck.pptx'))),glass=await z.file('ppt/slides/slide3.xml').async('string');for(const alpha of [90000,64000,48000])assert.ok(glass.includes(`<a:alpha val="${alpha}"`));
 const custom=await z.file('ppt/slides/slide4.xml').async('string');assert.match(custom,/<a:custGeom>/);
 const gradientText=await z.file('ppt/slides/slide1.xml').async('string');assert.match(gradientText,/<a:rPr[^>]*>[\s\S]*?<a:gradFill/);
 await assert.rejects(build(path.join(examples,'report.json'),path.join(tmp,'report')),/already exists/);
});
test('custom content, font and chart data propagate into native scene objects',async()=>{
 const b=await read('components');b.font='Noto Sans CJK SC';b.slides=[structuredClone(b.slides[13])];b.slides[0].components[0].props.series[0].values=[1,2,3,4,5];b.slides[0].components[0].props.title='自定义趋势';const s=makeUiScene(b);
 const chart=s.slides[0].objects.find(o=>o.kind==='chart');assert.deepEqual(chart.series[0].values,[1,2,3,4,5]);assert.ok(s.slides[0].objects.some(o=>o.text?.value==='自定义趋势'));assert.equal(chart.dataLabels.textStyle.typeface,'Noto Sans CJK SC');assert.ok(s.slides[0].objects.filter(o=>o.text).every(o=>o.text.style.typeface==='Noto Sans CJK SC'));
});
test('invalid data, missing evidence, table overflow and off-canvas components fail before output',async()=>{
 const original=await read('components');const one=i=>({...structuredClone(original),slides:[structuredClone(original.slides[i])]});
 let b=one(13);b.slides[0].components[0].props.series[0].values=[1];assert.throws(()=>makeUiScene(b),/match categories/);
 b=one(13);b.slides[0].components[0].props.series[0].values[0]=-1;assert.throws(()=>makeUiScene(b),/non-negative/);
 b=one(13);b.slides[0].components[0].props.demonstration=false;assert.throws(()=>makeUiScene(b),/source is required/);
 b=one(4);b.slides[0].components[0].props.demonstration=false;assert.throws(()=>makeUiScene(b),/source is required/);
 b=one(0);b.slides[0].components[0].props.typo=true;assert.throws(()=>makeUiScene(b),/unsupported field/);
 b=one(6);b.slides[0].components[0].props.items[0].hiddenClaim='unsupported';assert.throws(()=>makeUiScene(b),/unsupported field/);
 b=one(13);b.slides[0].components[0].props.max=1;assert.throws(()=>makeUiScene(b),/maximum/);
 b=one(0);b.slides[0].components[0].props.x=1600;assert.throws(()=>makeUiScene(b),/bounds/);
 b=one(19);b.slides[0].components[0].props.rows[0][1]='过长的单元格内容'.repeat(30);assert.throws(()=>makeUiScene(b),/does not fit/);
 b=one(17);b.slides[0].components[0].props.steps[0].lane=8;assert.throws(()=>makeUiScene(b),/invalid lane/);
 b=one(0);b.font="bad';url(x)";assert.throws(()=>makeUiScene(b),/font-family/);
});
test('zero-only and fractional chart data retain valid geometry and decimal labels',async()=>{
 const base=await read('components');
 for(const index of [4,13,14]){
  const brief={...base,slides:[structuredClone(base.slides[index])]},p=brief.slides[0].components[0].props;
  if(index===4){p.trend.values=p.trend.values.map(()=>0);delete p.trend.max;}
  if(index===13){p.series.forEach(s=>s.values=s.values.map(()=>0));delete p.max;}
  if(index===14){p.target=p.target.map(()=>0);p.actual=p.actual.map(()=>0);delete p.max;}
  const scene=makeUiScene(brief);assert.doesNotMatch(renderUiHtml(scene),/NaN|Infinity/);
  const chart=scene.slides[0].objects.find(o=>o.kind==='chart');if(chart.yAxis.max!==undefined)assert.ok(chart.yAxis.max>chart.yAxis.min);
  const zip=await JSZip.loadAsync(await renderUiPptx(scene));for(const key of Object.keys(zip.files).filter(n=>/^ppt\/charts\/chart\d+\.xml$/.test(n))){const xml=await zip.file(key).async('string');assert.doesNotMatch(xml,/<c:max val="0"/);assert.doesNotMatch(xml,/NaN|Infinity/);}
 }
 const brief={...base,slides:[structuredClone(base.slides[13])]},p=brief.slides[0].components[0].props;p.series[0].values=p.categories.map((_,i)=>(i+1)/10);p.max=.6;
 const scene=makeUiScene(brief),html=renderUiHtml(scene);assert.match(html,/>0\.2<\/tspan>/);assert.match(html,/>0\.6<\/tspan>/);
 const zip=await JSZip.loadAsync(await renderUiPptx(scene));for(const key of Object.keys(zip.files).filter(n=>/^ppt\/charts\/chart\d+\.xml$/.test(n))){const xml=await zip.file(key).async('string');assert.match(xml,/<c:v>0\.1<\/c:v>/);assert.match(xml,/formatCode="General"/);assert.doesNotMatch(xml,/formatCode="0"/);}
});
