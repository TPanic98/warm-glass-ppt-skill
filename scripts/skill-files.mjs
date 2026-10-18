// Shared by the ZIP packager and local installer. Generated decks, previews,
// artwork, caches and development docs belong outside the installed skill.
const directories=new Set(['agents','assets','examples','examples/compose','examples/ui','lib','references','scripts']);
export const MAX_SKILL_BYTES=1024*1024;
export const MAX_SKILL_ZIP_BYTES=256*1024;
const normalize=relative=>relative.replaceAll('\\','/');
export function isSkillFile(relative){
 return /^(?:SKILL\.md|LICENSE|package(?:-lock)?\.json|agents\/[^/]+\.ya?ml|assets\/[^/]+\.json|lib\/[^/]+\.mjs|scripts\/[^/]+\.mjs|references\/[^/]+\.md|examples\/(?:compose|ui)\/[^/]+\.json)$/.test(normalize(relative));
}
export function isSkillPath(relative){
 const name=normalize(relative);return name===''||directories.has(name)||isSkillFile(name);
}
