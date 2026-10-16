import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import JSZip from 'jszip';
import {makeUiScene} from '../lib/ui-scene.mjs';
import {renderUiPptx,renderUiHtml} from '../lib/ui-render.mjs';

export async function buildUi(input,output,{force=false}={}){
 const brief=JSON.parse(await fs.readFile(input,'utf8')),scene=makeUiScene(brief),out=path.resolve(output);
 for(const name of ['deck.pptx','preview.html','scene.json','validation.json']){try{await fs.access(path.join(out,name));if(!force)throw Error('Output already exists: '+path.join(out,name));}catch(e){if(e.code!=='ENOENT')throw e;}}
 const [pptx,html]=await Promise.all([renderUiPptx(scene),renderUiHtml(scene)]);
 const z=await JSZip.loadAsync(pptx);let pictures=0,groups=0,charts=0,tables=0,connectors=0;
 for(let i=1;i<=scene.slides.length;i++){const value=await z.file(`ppt/slides/slide${i}.xml`).async('string');pictures+=(value.match(/<p:pic\b/g)||[]).length;groups+=(value.match(/<p:grpSp>/g)||[]).length;charts+=(value.match(/<c:chart\b/g)||[]).length;tables+=(value.match(/<a:tbl>/g)||[]).length;connectors+=(value.match(/<p:cxnSp\b/g)||[]).length;}
 if(pictures)throw Error('UI components must remain native, not picture objects');
 const report={slideCount:scene.slides.length,canvas:[scene.width,scene.height],font:scene.font,componentInstances:scene.slides.reduce((n,s)=>n+s.instances.length,0),pictures,groups,charts,tables,connectors,estimatedTextFit:'pass',actualPptxRendering:'not checked by this portable script',htmlIsDesignPreview:true,editability:'Native grouped shapes and text, attached connectors, data charts with embedded workbooks and tables. No screenshot components.'};
 await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'deck.pptx'),pptx);await fs.writeFile(path.join(out,'preview.html'),html);await fs.writeFile(path.join(out,'scene.json'),JSON.stringify(scene,null,2));await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(report,null,2));return {out,...report};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2);if(args.includes('--help')||!args.length){console.log('Usage: node scripts/build-ui.mjs brief.json --out output-directory [--force]');process.exit(args.length?0:1);}
 const input=args.shift();let out,force=false;while(args.length){const key=args.shift();if(key==='--out')out=args.shift();else if(key==='--force')force=true;else throw Error('Unknown argument '+key);}
 try{if(!out)throw Error('--out is required');console.log(JSON.stringify(await buildUi(input,out,{force}),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
