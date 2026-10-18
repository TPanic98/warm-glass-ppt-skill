import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import JSZip from 'jszip';
import {build} from '../skills/warm-glass-ppt/scripts/build.mjs';
import {validateBrief,makeScene,resolveAsset,wrapText,narrativeModes,tokens} from '../skills/warm-glass-ppt/lib/model.mjs';
import {readPptx} from '../skills/warm-glass-ppt/lib/pptx-assets.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const example=path.join(root,'examples/legacy/showcase.json');
test('reference showcase covers all 11 layouts with native objects and gradients',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'warm-glass-test-'));const out=path.join(tmp,'deck');const report=await build(example,out);assert.equal(report.slideCount,11);
 const ppt=await JSZip.loadAsync(await fs.readFile(path.join(out,'deck.pptx')));const first=await ppt.file('ppt/slides/slide1.xml').async('string');assert.match(first,/<a:t>/);assert.match(first,/<p:pic>/);
 const types=await ppt.file('[Content_Types].xml').async('string');for(const m of types.matchAll(/<Override\b[^>]*\bPartName="([^"]+)"/g))assert.ok(ppt.file(m[1].replace(/^\//,'')),`missing declared part ${m[1]}`);
 const roadmap=await ppt.file('ppt/slides/slide6.xml').async('string');assert.ok(roadmap.includes('<a:gradFill'),'native gradient missing');assert.ok(roadmap.includes('阶段一'));
 for(const opacity of [90000,64000,48000])assert.ok(roadmap.includes(`<a:alpha val="${opacity}"/>`),`missing glass stop opacity ${opacity}`);
 const metric=await ppt.file('ppt/slides/slide9.xml').async('string');assert.match(metric,/演示数据/);
 const inspected=await readPptx(path.join(out,'deck.pptx'));assert.equal(inspected.report.slides.filter(s=>s.imageOnly).length,0);assert.ok(inspected.report.slides.every(s=>s.textRuns>0));
 const html=await fs.readFile(path.join(out,'preview.html'),'utf8');assert.match(html,/data:image\/png;base64,/);assert.doesNotMatch(html,/<script[^>]+src=/);
 assert.ok(html.includes('rgba(255,255,255,0.9) 0%'));assert.ok(html.includes('rgba(246,243,240,0.64) 55%'));assert.ok(html.includes('rgba(255,247,237,0.48) 100%'));
 const scene=JSON.parse(await fs.readFile(path.join(out,'scene.json'),'utf8'));assert.equal(scene.mode,'report');
 assert.ok(scene.slides.every(s=>!s.elements.some(e=>e.kind==='text'&&e.x>1400&&e.y<100)),'the source header leaves the upper-right corner clear');
 await assert.rejects(build(example,out),/already exists/);
});
test('all four narrative examples build, with the legacy talk alias preserved',async()=>{
 assert.deepEqual(narrativeModes,['report','talk','training','product']);
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'warm-glass-modes-'));
 for(const mode of narrativeModes){
  const input=path.join(root,'examples/legacy',`${mode}.json`);
  const brief=JSON.parse(await fs.readFile(input,'utf8'));assert.equal(brief.mode,mode);
  const result=await build(input,path.join(tmp,mode));assert.equal(result.slideCount,brief.slides.length);
  const scene=JSON.parse(await fs.readFile(path.join(tmp,mode,'scene.json'),'utf8'));assert.equal(scene.mode,mode);
 }
 const base={title:'Example',slides:[{layout:'cover',title:'Example'}]};
 const old={...base,mode:'executive'};assert.equal(makeScene(old).mode,'talk');assert.equal(old.mode,'executive');
 assert.equal(makeScene(base).mode,undefined);
 assert.throws(()=>validateBrief({...base,mode:'marketing'}),/mode: choose report, talk, training or product/);
 assert.equal(Object.keys(tokens.gradients).length,6);assert.deepEqual(tokens.gradients.glass.stops.map(s=>s[2]),[.9,.64,.48]);
});
test('typos, missing metric evidence, text overflow and invalid asset protocols fail',async()=>{
 assert.throws(()=>validateBrief({title:'X',slides:[{layout:'proces',title:'X'}]}),/unsupported layout/);
 assert.throws(()=>validateBrief({title:'X',slides:[{layout:'cover',title:'X',subttle:'typo'}]}),/unsupported field/);
 assert.throws(()=>validateBrief({title:'X',font:"bad';background:url(example)",slides:[{layout:'cover',title:'X'}]}),/font-family/);
 assert.throws(()=>validateBrief({title:'X',slides:[{layout:'metrics',title:'X',items:[{title:'A',value:'20%'},{title:'B',value:'30%'}]}]}),/source/);
 assert.throws(()=>makeScene({title:'X',slides:[{layout:'cover',title:'长标题'.repeat(200)}]}),/does not fit/);
 await assert.rejects(resolveAsset('https://example.com/x.png',root),/local path/);
 await assert.rejects(resolveAsset('@assets/../../secrets.png',root),/escapes/);
 assert.ok(wrapText('Chinese 中文 supports wrapping',140,23).includes('\n'));
});
test('image-only extraction reports raster source and rejects out-of-range crops',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'warm-glass-extract-'));const out=path.join(tmp,'source');
 await build(example,out);const z=await JSZip.loadAsync(await fs.readFile(path.join(out,'deck.pptx')));
 const p='ppt/slides/slide1.xml';let xml=await z.file(p).async('string');xml=xml.replace(/<p:sp>.*?<\/p:sp>/gs,'');z.file(p,xml);const fixture=path.join(tmp,'fixture.pptx');await fs.writeFile(fixture,await z.generateAsync({type:'nodebuffer'}));
 const r=await readPptx(fixture);assert.equal(r.report.slides[0].imageOnly,true);assert.ok(r.report.slides[0].pictures[0].width>0);
 const script=path.join(root,'skills/warm-glass-ppt/scripts/extract-assets.mjs');const extracted=path.join(tmp,'assets');const cmd=spawnSync(process.execPath,[script,fixture,'--out',extracted],{encoding:'utf8'});assert.equal(cmd.status,0,cmd.stderr);const manifest=JSON.parse(await fs.readFile(path.join(extracted,'manifest.json'),'utf8'));assert.ok(manifest.assets.length>0);
 const bounds=path.join(tmp,'regions.json');await fs.writeFile(bounds,JSON.stringify([{name:'out-of-range',slide:1,rect:[0,0,999999,999999]}]));const bad=spawnSync(process.execPath,[script,fixture,'--out',path.join(tmp,'bad'),'--regions',bounds,'--crops-only'],{encoding:'utf8'});assert.notEqual(bad.status,0);assert.match(bad.stderr,/Invalid crop bounds|optional dependency/);await assert.rejects(fs.access(path.join(tmp,'bad')));
});
