import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {auditContent} from '../skills/warm-glass-ppt/lib/content-audit.mjs';
import {validateComposition} from '../skills/warm-glass-ppt/lib/composition.mjs';
import {digest,inspectBuild,initReview,verifyReview} from '../skills/warm-glass-ppt/lib/review.mjs';
import {buildUi} from '../skills/warm-glass-ppt/scripts/build-ui.mjs';
import {renderPptx,assessFontMatch} from '../skills/warm-glass-ppt/scripts/render-pptx.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixture=name=>path.join(root,'skills/warm-glass-ppt/examples/compose',name+'.json');
const read=async name=>JSON.parse(await fs.readFile(fixture(name),'utf8'));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=','base64');

test('four distinct fictional materials retain purpose-specific structures and authored content contracts',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'warm-content-cases-')),counts=[];
 for(const mode of ['report','talk','training','product']){
  const b=await read(mode);assert.equal(b.mode,mode);assert.ok(b.context.audience);assert.ok(b.context.goal);
  const audit=auditContent(b);assert.equal(audit.pages.length,b.slides.length);
  const result=await buildUi(fixture(mode),path.join(tmp,mode));counts.push(result.slideCount);
  assert.equal(result.pictures,0);assert.deepEqual(result.compositionWarnings,[]);assert.equal(result.contentAudit.sourceCount,1);
 }
 assert.deepEqual(counts,[2,2,2,3]);
 const report=await read('report');assert.equal(report.slides[1].elements.find(e=>e.id==='platform').w,1140);
 const training=await read('training');assert.equal(auditContent(training).pages[1].relationChecks[0].type,'containment');
 const product=await read('product');assert.equal(auditContent(product).pages[1].relationChecks.length,2);
});

test('claims distinguish measured evidence from examples and require visible anchors for plans or unknowns',async()=>{
 let b=await read('report');b.slides[0].plan.claims[0].status='observed';assert.throws(()=>validateComposition(b),/non-example source/);
 b=await read('report');delete b.slides[0].plan.claims[0].statusElement;assert.throws(()=>validateComposition(b),/unknown content element/);
 b=await read('report');b.slides[0].plan.claims[0].sourceRefs=['not-a-source'];assert.throws(()=>validateComposition(b),/unknown source/);
 b=await read('report');b.sources[0].kind='user';b.slides[0].plan.claims[0].status='observed';assert.doesNotThrow(()=>validateComposition(b));
 b=await read('report');b.slides[0].plan.claims[0].elements=['missing'];assert.throws(()=>validateComposition(b),/unknown content element/);
});

test('important arrow direction, real containment and shared-axis assertions are checked against authored geometry',async()=>{
 let b=await read('talk');b.slides[1].elements.find(e=>e.id==='a').arrowEnd=false;assert.throws(()=>validateComposition(b),/contradicts/);
 b=await read('talk');b.slides[1].plan.relations[0].from='decision';assert.throws(()=>validateComposition(b),/contradicts/);
 b=await read('training');b.slides[1].elements.find(e=>e.id==='prompt').x=0;assert.throws(()=>validateComposition(b),/containment/);
 b=await read('report');b.slides[1].elements.find(e=>e.id==='platform').x+=10;assert.throws(()=>validateComposition(b),/misaligned/);
});

// Tiny synthetic PNGs below test receipt freshness only, never visual quality.
async function protocolCase({brand=false,warning=false}={}){
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'warm-review-protocol-')),input=path.join(tmp,'brief.json'),b=await read('content-led');
 if(brand){await fs.writeFile(path.join(tmp,'brand.png'),png);b.brand={src:'brand.png',alt:'Synthetic test pixel',x:48,y:30,w:60,h:60};}
 await fs.writeFile(input,JSON.stringify(b));const out=path.join(tmp,'deck');await buildUi(input,out);
 const validation=path.join(out,'validation.json'),report=JSON.parse(await fs.readFile(validation,'utf8'));
 if(warning){report.compositionWarnings=[{slide:3,code:'repeated-composition',message:'Synthetic review warning'}];await fs.writeFile(validation,JSON.stringify(report));}
 const renders=path.join(tmp,'renders');await fs.mkdir(renders);const pages=[];
 for(let i=1;i<=report.slideCount;i++){const file=`slide-${i}.png`;await fs.writeFile(path.join(renders,file),png);pages.push({slide:i,path:file,sha256:digest(png)});}
 const manifest=path.join(renders,'render.json');await fs.writeFile(manifest,JSON.stringify({schema:'warm-glass-render/v1',pptxSha256:report.sha256.pptx,renderer:{name:'Synthetic protocol fixture, not a renderer',method:'No visual test'},pages}));
 const receipt=path.join(out,'review.json');await initReview(out,manifest,receipt);return {tmp,input,out,manifest,receipt,validation};
}
async function recordProtocolPass(c){
 const r=JSON.parse(await fs.readFile(c.receipt,'utf8'));
 for(const key of ['content','design'])r[key]={...r[key],status:'pass',notes:'Synthetic protocol judgment; not actual slide review.'};
 for(const page of r.pages){page.status='pass';page.notes='Synthetic protocol assertion.';}
 for(const w of r.warnings){w.decision='accepted';w.reason='Synthetic acceptance-path test.';}
 await fs.writeFile(c.receipt,JSON.stringify(r));
}

test('review draft never auto-approves content, design or rendered pages; writing over a receipt is refused',async()=>{
 const c=await protocolCase(),r=await verifyReview(c.out,c.receipt);assert.equal(r.ready,false);assert.equal(r.status,'needs-review');
 assert.ok(r.issues.some(x=>x.includes('content')));assert.ok(r.issues.some(x=>x.includes('Page 1')));
 await assert.rejects(initReview(c.out,c.manifest,c.receipt),/EEXIST/);
 await recordProtocolPass(c);const done=await verifyReview(c.out,c.receipt);assert.equal(done.ready,true);assert.equal(done.targetApplication.status,'not-tested');
});

test('changed brief, original asset, PPTX, scene and generator invalidate the current review',async()=>{
 for(const target of ['brief','asset','pptx','scene','generator']){
  const c=await protocolCase({brand:true});await recordProtocolPass(c);
  if(target==='brief')await fs.appendFile(c.input,' ');
  if(target==='asset')await fs.appendFile(path.join(c.tmp,'brand.png'),'changed');
  if(target==='pptx')await fs.appendFile(path.join(c.out,'deck.pptx'),'changed');
  if(target==='scene')await fs.appendFile(path.join(c.out,'scene.json'),' ');
  if(target==='generator'){const v=JSON.parse(await fs.readFile(c.validation));v.provenance.generator[0].sha256='0'.repeat(64);await fs.writeFile(c.validation,JSON.stringify(v));}
  const result=await verifyReview(c.out,c.receipt);assert.equal(result.ready,false,target);assert.equal(result.status,'stale',target);
 }
});

test('changes to the transitive visual-token loader invalidate review in an isolated skill copy',async()=>{
 const c=await protocolCase();await recordProtocolPass(c);
 const installed=path.join(c.tmp,'warm-glass-ppt');
 await fs.cp(path.join(root,'skills/warm-glass-ppt'),installed,{recursive:true,filter:file=>!file.split(path.sep).includes('node_modules')});
 const {verifyReview:verifyInstalled}=await import(path.join(installed,'lib/review.mjs'));
 assert.equal((await verifyInstalled(c.out,c.receipt)).ready,true);
 await fs.appendFile(path.join(installed,'lib/model.mjs'),'\n// Isolated generation-recipe change.\n');
 const result=await verifyInstalled(c.out,c.receipt);
 assert.equal(result.ready,false);assert.equal(result.status,'stale');
 assert.ok(result.issues.includes('Generator lib/model.mjs changed'));
});

test('old renders, changed PNGs, incomplete page review and unreviewed warnings cannot complete the record',async()=>{
 let c=await protocolCase();let m=JSON.parse(await fs.readFile(c.manifest));m.pptxSha256='0'.repeat(64);await fs.writeFile(c.manifest,JSON.stringify(m));await assert.rejects(initReview(c.out,c.manifest,path.join(c.tmp,'wrong.json')),/different PPTX/);
 c=await protocolCase();await recordProtocolPass(c);await fs.appendFile(path.join(c.tmp,'renders/slide-1.png'),'changed');assert.equal((await verifyReview(c.out,c.receipt)).status,'stale');
 c=await protocolCase();await recordProtocolPass(c);let r=JSON.parse(await fs.readFile(c.receipt));r.pages.pop();await fs.writeFile(c.receipt,JSON.stringify(r));assert.equal((await verifyReview(c.out,c.receipt)).ready,false);
 c=await protocolCase({warning:true});await recordProtocolPass(c);r=JSON.parse(await fs.readFile(c.receipt));r.warnings[0].decision='pending';await fs.writeFile(c.receipt,JSON.stringify(r));assert.equal((await verifyReview(c.out,c.receipt)).ready,false);
});

test('failed or undocumented target-app assertions are not promoted into passed interaction tests',async()=>{
 const c=await protocolCase();await recordProtocolPass(c);const r=JSON.parse(await fs.readFile(c.receipt));r.targetApplication.status='passed';await fs.writeFile(c.receipt,JSON.stringify(r));assert.equal((await verifyReview(c.out,c.receipt)).ready,false);
 r.targetApplication={status:'failed',application:'Synthetic application',notes:'Synthetic failed test'};await fs.writeFile(c.receipt,JSON.stringify(r));assert.equal((await verifyReview(c.out,c.receipt)).ready,false);
});

test('missing renderer stops without creating render output or declaring visual success',async()=>{
 const c=await protocolCase(),out=path.join(c.tmp,'no-render');await assert.rejects(renderPptx(c.out,out,{soffice:'nonexistent-warm-glass-renderer-for-test'}),/ENOENT/);await assert.rejects(fs.access(out));
 assert.equal((await inspectBuild(c.out)).report.actualPptxRendering,'not checked by this portable script');
});

test('font preflight identifies substitution without claiming glyph coverage or font embedding',()=>{
 assert.equal(assessFontMatch('Heiti SC','Heiti SC,黑体-简').status,'matched');
 assert.equal(assessFontMatch('Microsoft YaHei','Verdana').status,'substituted');
 assert.equal(assessFontMatch('Microsoft YaHei','Microsoft YaHei UI').status,'substituted');
});
