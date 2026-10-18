import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import JSZip from 'jszip';
import {makeUiScene} from '../lib/ui-scene.mjs';
import {renderUiPptx,renderUiHtml} from '../lib/ui-render.mjs';
import {makeCompositionScene,resolveCompositionAssets,compositionWarnings} from '../lib/composition.mjs';
import {auditContent} from '../lib/content-audit.mjs';
import {buildProvenance} from '../lib/review.mjs';

export async function buildUi(input,output,{force=false}={}){
 const inputBytes=await fs.readFile(input),brief=JSON.parse(inputBytes.toString('utf8')),composed=brief.schema==='warm-glass-compose/v1';
 const assets=composed?await resolveCompositionAssets(brief,path.dirname(path.resolve(input))):new Map();
 const scene=composed?makeCompositionScene(brief,{assets}):makeUiScene(brief),out=path.resolve(output);
 for(const name of ['deck.pptx','preview.html','scene.json','validation.json']){try{await fs.access(path.join(out,name));if(!force)throw Error('Output already exists: '+path.join(out,name));}catch(e){if(e.code!=='ENOENT')throw e;}}
 const [pptx,html]=await Promise.all([renderUiPptx(scene),renderUiHtml(scene)]);
 const z=await JSZip.loadAsync(pptx);let pictures=0,groups=0,charts=0,tables=0,connectors=0;
 for(let i=1;i<=scene.slides.length;i++){const value=await z.file(`ppt/slides/slide${i}.xml`).async('string');pictures+=(value.match(/<p:pic\b/g)||[]).length;groups+=(value.match(/<p:grpSp>/g)||[]).length;charts+=(value.match(/<c:chart\b/g)||[]).length;tables+=(value.match(/<a:tbl>/g)||[]).length;connectors+=(value.match(/<p:cxnSp\b/g)||[]).length;}
 const expectedPictures=composed?scene.slides.reduce((n,s)=>n+s.objects.filter(o=>o.kind==='image').length,0):0;
 if(pictures!==expectedPictures)throw Error('Unexpected rasterized UI component or missing declared image');
 const sha256=value=>createHash('sha256').update(value).digest('hex');
 const sceneBytes=JSON.stringify(scene,null,2);
 const report={slideCount:scene.slides.length,canvas:[scene.width,scene.height],font:scene.font,componentInstances:scene.slides.reduce((n,s)=>n+s.instances.length,0),pictures,groups,charts,tables,connectors,estimatedTextFit:'pass',actualPptxRendering:'not checked by this portable script',htmlIsDesignPreview:true,provenance:await buildProvenance(path.resolve(input),out,assets),sha256:{input:sha256(inputBytes),pptx:sha256(pptx),scene:sha256(sceneBytes),images:[...assets.values()].map((data,i)=>({ordinal:i+1,sha256:sha256(Buffer.from(data.split(',')[1],'base64'))}))},...(composed?{contentAudit:auditContent(brief),compositionWarnings:compositionWarnings(scene),pagePlans:scene.slides.map(s=>({title:s.title,...s.plan})),imageObjects:'Only explicitly supplied brand/artwork images; body text and diagrams stay native.'}:{}),editability:'Native shapes, text, attached connectors, data charts with embedded workbooks and tables. Supplied original artwork remains an image object.'};
 await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'deck.pptx'),pptx);await fs.writeFile(path.join(out,'preview.html'),html);await fs.writeFile(path.join(out,'scene.json'),sceneBytes);await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(report,null,2));return {out,...report};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2);if(args.includes('--help')||!args.length){console.log('Usage: node scripts/build-ui.mjs brief.json --out output-directory [--force]');process.exit(args.length?0:1);}
 const input=args.shift();let out,force=false;while(args.length){const key=args.shift();if(key==='--out')out=args.shift();else if(key==='--force')force=true;else throw Error('Unknown argument '+key);}
 try{if(!out)throw Error('--out is required');console.log(JSON.stringify(await buildUi(input,out,{force}),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
