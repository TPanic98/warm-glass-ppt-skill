const object=(value,keys,at)=>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${at}: expected object`);
 for(const key of Object.keys(value))if(!keys.includes(key))throw Error(`${at}: unsupported field ${key}`);
};
const text=(value,at)=>{if(typeof value!=='string'||!value.trim())throw Error(`${at}: expected non-empty text`);};
const list=(value,at)=>{if(!Array.isArray(value)||!value.length)throw Error(`${at}: expected non-empty array`);};
const ids=(values,at)=>{list(values,at);for(const v of values)text(v,at);if(new Set(values).size!==values.length)throw Error(`${at}: duplicate references`);};

// These are checkable author assertions, not automatic fact checking or design scoring.
export function auditContent(brief){
 if(brief.context!==undefined){
  object(brief.context,['audience','goal','durationMinutes','constraints'],'context');
  text(brief.context.audience,'context.audience');text(brief.context.goal,'context.goal');
  if(brief.context.durationMinutes!==undefined&&(!Number.isFinite(brief.context.durationMinutes)||brief.context.durationMinutes<=0))throw Error('durationMinutes must be positive');
  if(brief.context.constraints!==undefined){ids(brief.context.constraints,'context.constraints');}
 }
 const sources=new Map();
 if(brief.sources!==undefined){
  if(!Array.isArray(brief.sources))throw Error('sources: expected array');
  for(const s of brief.sources){
   object(s,['id','title','kind','locator'],'source');text(s.id,'source.id');text(s.title,'source.title');
   if(sources.has(s.id))throw Error('Duplicate source id '+s.id);
   if(!['user','public','example'].includes(s.kind))throw Error('source.kind must be user, public or example');
   if(s.locator!==undefined)text(s.locator,'source.locator');sources.set(s.id,s);
  }
 }
 const pages=[];
 for(const [i,page]of brief.slides.entries()){
  const at=`slide ${i+1}`,elements=new Map(page.elements.map(e=>[e.id,e]));
  const get=id=>{const e=elements.get(id);if(!e)throw Error(`${at}: unknown content element ${id}`);return e;};
  const checks=[],claimIds=new Set();
  const claims=page.plan.claims??[];if(!Array.isArray(claims))throw Error(at+'.claims: expected array');
  for(const claim of claims){
   object(claim,['id','text','status','sourceRefs','elements','statusElement'],'claim');
   text(claim.id,'claim.id');text(claim.text,'claim.text');
   if(claimIds.has(claim.id))throw Error(at+': duplicate claim id');claimIds.add(claim.id);
   if(!['observed','planned','example','assumption','unverified'].includes(claim.status))throw Error('Invalid claim status');
   if(!Array.isArray(claim.sourceRefs)||claim.sourceRefs.some(id=>!sources.has(id)))throw Error('Claim has unknown source reference');
   if(new Set(claim.sourceRefs).size!==claim.sourceRefs.length)throw Error('Claim has duplicate source reference');
   ids(claim.elements,'claim.elements');for(const id of claim.elements)get(id);
   if(claim.status==='observed'&&(!claim.sourceRefs.length||claim.sourceRefs.every(id=>sources.get(id).kind==='example')))throw Error('Observed claims need a non-example source; evidence still requires human review');
   if(claim.status!=='observed'||claim.statusElement!==undefined){
    if(get(claim.statusElement)?.type!=='text')throw Error('Claim status must reference visible native text');
   }
  }
  const relations=page.plan.relations??[];if(!Array.isArray(relations))throw Error(at+'.relations: expected array');
  for(const r of relations){
   if(!r||typeof r!=='object'||Array.isArray(r))throw Error('relation: expected object');
   if(r.type==='directed'){
    object(r,['type','from','to','via'],'directed relation');
    const from=get(r.from),to=get(r.to),via=get(r.via);
    if(from.type!=='shape'||to.type!=='shape'||via.type!=='connector'||via.from!==r.from||via.to!==r.to||via.arrowEnd===false)throw Error(at+': directed relation contradicts its native connector');
   }else if(r.type==='containment'){
    object(r,['type','container','children'],'containment relation');const c=get(r.container);
    if(c.type!=='shape')throw Error('Containment requires a native region');ids(r.children,'containment.children');
    for(const id of r.children){const e=get(id);if(id===r.container||!Number.isFinite(e.w)||e.x<c.x-.5||e.y<c.y-.5||e.x+e.w>c.x+c.w+.5||e.y+e.h>c.y+c.h+.5)throw Error(at+': child outside declared containment region');}
   }else if(r.type==='aligned'){
    object(r,['type','axis','anchor','elements'],'aligned relation');ids(r.elements,'aligned.elements');
    if(r.elements.length<2||!['x','y'].includes(r.axis)||!['start','center','end'].includes(r.anchor))throw Error('Alignment requires an axis, anchor and at least two elements');
    const values=r.elements.map(id=>{const e=get(id),extent=e[r.axis==='x'?'w':'h'];if(!Number.isFinite(extent))throw Error('Alignment requires framed elements');return e[r.axis]+({start:0,center:.5,end:1}[r.anchor])*extent;});
    if(Math.max(...values)-Math.min(...values)>2)throw Error(at+': declared shared axis is misaligned');
   }else throw Error('Unsupported content relation '+r.type);
   checks.push({type:r.type,status:'pass'});
  }
  if(page.plan.reviewQuestions!==undefined)ids(page.plan.reviewQuestions,at+'.reviewQuestions');
  pages.push({slide:i+1,claimCount:claims.length,relationChecks:checks,reviewQuestions:page.plan.reviewQuestions??[],structured:claims.length+relations.length>0});
 }
 return {scope:'Declared source references, status anchors and native geometry only; not source truth or visual judgment.',context:brief.context??null,sourceCount:sources.size,pages};
}
