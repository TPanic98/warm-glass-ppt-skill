import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import JSZip from 'jszip';
import {makeCompositionScene,resolveCompositionAssets,compositionWarnings} from '../skills/warm-glass-ppt/lib/composition.mjs';
import {makeUiScene} from '../skills/warm-glass-ppt/lib/ui-scene.mjs';
import {renderUiPptx,renderUiHtml} from '../skills/warm-glass-ppt/lib/ui-render.mjs';
import {build} from '../skills/warm-glass-ppt/scripts/build.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const example=path.join(root,'skills/warm-glass-ppt/examples/compose/content-led.json');
const read=async()=>JSON.parse(await fs.readFile(example,'utf8'));
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=';

test('free composition preserves authored geometry, native relationships and one cover title without sample branding',async()=>{
 const b=await read(),s=makeCompositionScene(b);assert.equal(s.slides.length,3);
 for(const [i,page]of s.slides.entries())for(const e of b.slides[i].elements.filter(e=>e.type==='text')){const native=page.objects.find(o=>o.name.includes('--'+e.id+'--'));assert.equal(native.position.top,e.y);assert.equal(native.text.value,e.text);}
 assert.equal(s.slides[0].objects.filter(o=>o.text?.value===b.slides[0].title).length,1);
 assert.equal(s.slides[1].objects.filter(o=>o.kind==='connector').length,2);
 assert.deepEqual(compositionWarnings(s),[]);
 const z=await JSZip.loadAsync(await renderUiPptx(s));
 for(let i=1;i<=3;i++){const xml=await z.file(`ppt/slides/slide${i}.xml`).async('string');assert.doesNotMatch(xml,/WARM GLASS|Clarity by design|让结构帮助理解/);assert.doesNotMatch(xml,/<p:pic\b/);}
 assert.equal((await z.file('ppt/slides/slide2.xml').async('string')).match(/<p:cxnSp>/g).length,2);
});

test('optional original brand asset is byte-preserved, embedded once per visible header and absent by default',async()=>{
 const b=await read();b.brand={src:png,alt:'Original test asset',x:48,y:36,w:60,h:60};b.slides[1].brand=false;
 const s=makeCompositionScene(b,{assets:await resolveCompositionAssets(b,root)}),buffer=await renderUiPptx(s),z=await JSZip.loadAsync(buffer);
 const media=await Promise.all(Object.keys(z.files).filter(n=>/^ppt\/media\/.*\.png$/.test(n)).map(n=>z.file(n).async('nodebuffer')));
 assert.ok(media.some(bytes=>bytes.equals(Buffer.from(png.split(',')[1],'base64'))));
 assert.match(await z.file('ppt/slides/slide1.xml').async('string'),/<p:pic\b/);
 assert.doesNotMatch(await z.file('ppt/slides/slide2.xml').async('string'),/<p:pic\b/);
 assert.match(renderUiHtml(s),/data:image\/png;base64/);
});

test('unknown fields, missing intent, dangling relationships and remote assets fail without creating output',async()=>{
 let b=await read();delete b.slides[0].plan;assert.throws(()=>makeCompositionScene(b),/expected object/);
 b=await read();b.slides[1].elements.find(e=>e.type==='connector').from='missing';assert.throws(()=>makeCompositionScene(b),/endpoint/);
 b=await read();b.slides[0].elements[0].inventedField=true;assert.throws(()=>makeCompositionScene(b),/unsupported field/);
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'warm-compose-invalid-'));
 b=await read();b.brand={src:'https://example.invalid/logo.png',alt:'not fetched',x:48,y:36,w:100,h:40};
 const input=path.join(tmp,'input.json'),out=path.join(tmp,'deliverable');await fs.writeFile(input,JSON.stringify(b));
 await assert.rejects(build(input,out),/local PNG/);await assert.rejects(fs.access(out));
});

test('all four purposes can use free native composition through the same portable entry point',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'warm-compose-purposes-'));
 for(const mode of ['report','talk','training','product']){const b=await read();b.mode=mode;const input=path.join(tmp,mode+'.json');await fs.writeFile(input,JSON.stringify(b));const r=await build(input,path.join(tmp,mode));assert.equal(r.slideCount,3);assert.equal(r.pictures,0);assert.equal(r.connectors,2);assert.equal(r.pagePlans.length,3);assert.equal(r.actualPptxRendering,'not checked by this portable script');}
});

test('legacy cover owns its title and newly generated legacy decks have no default demo logo',()=>{
 const title='一份新的汇报',b={schema:'warm-glass-ui/v2',title,mode:'report',slides:[{title,subtitle:'说明',components:[{code:'C24',props:{x:80,y:344,w:1512,h:490,title,subtitle:'说明',variant:'cover'}}]}]};
 const page=makeUiScene(b).slides[0];assert.equal(page.objects.filter(o=>o.text?.value===title).length,1);assert.ok(!page.objects.some(o=>/WARM GLASS|Clarity by design/.test(o.text?.value||'')));
});

test('changed copy receives a new source/output identity and never inherits actual-rendering approval',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'warm-compose-hashes-')),input=path.join(tmp,'brief.json'),b=await read();
 await fs.writeFile(input,JSON.stringify(b));const first=await build(input,path.join(tmp,'first'));
 b.slides[0].elements[0].text='新的协作方案';await fs.writeFile(input,JSON.stringify(b));const second=await build(input,path.join(tmp,'second'));
 assert.notEqual(first.sha256.input,second.sha256.input);assert.notEqual(first.sha256.pptx,second.sha256.pptx);
 assert.equal(second.actualPptxRendering,'not checked by this portable script');
});
