import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ScenePresentation,briefFromPages,makeUiScene} from '../lib/ui-scene.mjs';
import {makeExpandedComponentPages,makeExpandedScenarioPages} from '../lib/ui-presets.mjs';
import {componentCatalog,theme} from '../lib/ui-components.mjs';

export function presetBriefs(){
 const all=makeExpandedScenarioPages(new ScenePresentation());
 return Object.fromEntries([['components',makeExpandedComponentPages(new ScenePresentation())],...['report','talk','training','product'].map(mode=>[mode,all.filter(p=>p.purpose===mode)])].map(([mode,pages])=>[mode,briefFromPages(mode==='components'?'24 个通用组件':({report:'汇报',talk:'演讲',training:'培训',product:'产品介绍'}[mode])+'用途样例',mode,pages)]));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--out'){console.log('Usage: node scripts/refresh-ui-catalog.mjs --out new-directory');process.exit(1);}
 const out=path.resolve(args[1]);try{await fs.mkdir(out);}catch(e){if(e.code==='EEXIST')throw Error('Choose a new directory; catalog refresh does not overwrite files');throw e;}
 for(const [mode,brief]of Object.entries(presetBriefs())){makeUiScene(brief);await fs.writeFile(path.join(out,mode+'.json'),JSON.stringify(brief,null,2)+'\n');}
 const version=JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8')).version;
 await fs.writeFile(path.join(out,'catalog.json'),JSON.stringify({version,coordinateSystem:{...theme.canvas,unit:'px at 96 dpi'},families:componentCatalog},null,2)+'\n');console.log('Wrote catalog and five validated UI briefs to '+out);
}
