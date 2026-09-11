import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = fs.readFileSync('src/lib/admin-route-policy.ts','utf8');
const ast=ts.createSourceFile('routes.ts',source,ts.ScriptTarget.Latest,true);
let routes;
for(const stmt of ast.statements) if(ts.isVariableStatement(stmt)) for(const d of stmt.declarationList.declarations) if(d.name.getText(ast)==='ADMIN_ROUTE_POLICIES') routes=d.initializer.getText(ast);
if(!routes) throw Error('Route registry not found');
// Trusted repository literal evaluated with an identity route helper, not application execution.
const policies=vm.runInNewContext(routes,{route:x=>x},{timeout:1000});
const roles=JSON.parse(fs.readFileSync('src/server/auth/policy-data.json','utf8'));
const roleNames=Object.keys(roles.rolePermissions);
function allowed(role,p){
 if(!roles.staffRoles.includes(role) || (p.exactRole && role!==p.exactRole)) return false;
 const has=key=>role===roles.roles.superAdmin || roles.rolePermissions[role].includes('*') || roles.rolePermissions[role].includes(key);
 const any=p.requiredAnyPermissions||[], all=p.requiredAllPermissions||[];
 return all.every(has) && ((any.length||all.length) ? (!any.length||any.some(has)) : Boolean(p.staffFallback));
}
const rows=policies.map(p=>({...p,defaultRoleAccess:Object.fromEntries(roleNames.map(r=>[r,allowed(r,p)]))}));
const dir='docs/reviews/2026-09-11/batch3';
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(`${dir}/permission-matrix.json`,JSON.stringify({source:['src/lib/admin-route-policy.ts','src/server/auth/policy-data.json','src/server/auth/policy.ts'],scope:'Declared route entry permissions and seeded role defaults. Live role assignments can differ. Not a proof of every HTTP operation.',rows},null,2)+'\n');
const staff=roleNames.filter(r=>roles.staffRoles.includes(r));
let md='# Office tool entry permissions\n\nGenerated from the current route registry and default role policy by `node scripts/review-permission-matrix.mjs`. Actual session resolution uses persisted role permissions; this table describes defaults. Page entry does not grant every mutation API. `any` means one permission; `all` means all listed.\n\n| Group / route | Permission requirement | '+staff.join(' | ')+' |\n|'+['---','---',...staff.map(()=> '---')].join('|')+'|\n';
for(const r of rows) md+=`| ${r.group} / ${r.href} | ${r.requiredAnyPermissions.length?'any: '+r.requiredAnyPermissions.join(', '):''}${r.requiredAllPermissions?.length?' all: '+r.requiredAllPermissions.join(', '):''}${r.exactRole?' exact role: '+r.exactRole:''}${r.staffFallback?' staff fallback':''} | ${staff.map(role=>r.defaultRoleAccess[role]?'yes':'no').join(' | ')} |\n`;
md+='\nGuest and Client are denied entry to every listed admin route. File download adds per-document ownership/assignment checks in `src/server/storage/document-service.ts`; see BATCH-3.md for the real HTTP matrix.\n';
fs.writeFileSync(`${dir}/PERMISSIONS.md`,md);
console.log(`Generated ${rows.length} route policies across ${new Set(rows.map(r=>r.group)).size} tool groups`);
