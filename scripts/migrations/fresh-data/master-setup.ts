import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const material = z.object({ Id: z.string(), Code: z.string().nullable(), Name: z.string().nullable(), Kind: z.number(), DeletedAt: z.string().nullable() });
const refs = z.object({ materials: z.array(material), links: z.array(z.object({ MaterialId: z.string(), DepartmentId: z.string(), UoMId: z.string() })), units: z.array(z.object({ Id: z.string(), Symbol: z.string() })), categories: z.array(z.object({ Id: z.string(), Name: z.string(), MaterialKind: z.number() })) });
const source = z.object({ rows: z.array(z.object({ file: z.string(), row: z.number(), code: z.string(), name: z.string(), quantity: z.number().nullable(), kind: z.number().optional(), tag: z.string(), unit: z.string().optional(), section: z.string() })) });
const [refFile, dataFile, output] = process.argv.slice(2);
if (!refFile || !dataFile || !output) throw new Error("Usage: bun master-setup.ts references.json prepared.json output.sql");
const ref = refs.parse(JSON.parse(await readFile(refFile, "utf8")));
const data = source.parse(JSON.parse(await readFile(dataFile, "utf8")));
const normal = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const live = ref.materials.filter((m) => !m.DeletedAt);
const sq = (v: string) => `'${v.replaceAll("'", "''")}'`;
const used = new Set(ref.materials.map((m) => (m.Code ?? "").toUpperCase()));
const next = (prefix: string) => {
  let number = Math.max(0, ...[...used].filter((s) => new RegExp(`^${prefix}[0-9]+$`).test(s)).map((s) => Number(s.slice(prefix.length)))) + 1;
  while (used.has(`${prefix}${String(number).padStart(3,"0")}`)) number++;
  const code = `${prefix}${String(number).padStart(3,"0")}`; used.add(code); return code;
};
const find = (name: string) => { const matches = live.filter((m) => normal(m.Name ?? "") === normal(name)); if (matches.length !== 1) throw new Error(`Expected one material named ${name}`); return matches[0]; };
const codeChanges: {id:string;name:string;before:string;after:string}[] = [];
for (const [name, target] of [["Glibenclamide (100% pass through 100 mesh)",next("RMG")],["Griseofulvin","RMG001"],["Glucose",next("RMG")]] as const) {
  const m=find(name); if (!m) throw new Error(name);
  codeChanges.push({id:m.Id,name,before:m.Code??"",after:target});m.Code=target;
}
const created: {id:string;code:string;name:string;kind:number;categoryId:string|null}[]=[];
const newByName = new Map<string, z.infer<typeof material>>();
const create = (name:string,kind:number,prefix:string,category:string|null) => {
  const key=`${kind}:${normal(name)}`;const exists=newByName.get(key);if(exists)return exists;
  const id=randomUUID();const code=next(prefix);
  const categoryId=category?ref.categories.find((c)=>normal(c.Name)===category&&c.MaterialKind===kind)?.Id??null:null;
  const record={Id:id,Code:code,Name:name,Kind:kind,DeletedAt:null};
  created.push({id,code,name,kind,categoryId});live.push(record);newByName.set(key,record);return record;
};
const packagingFixes = new Map<number,string>([[57,"PMC499"],[60,"PMC514"],[71,"PMC172"],[122,"PML277"],[130,"PML302"],[133,"PML041"],[249,"PML376"]]);
const departments:Record<string,string>={Syrup:"01994fb8-2a6d-7e43-8c9b-58971da9b247",Tablet:"01994fb8-2b57-7b23-a5b9-5b5c68aa9abc",Ointment:"01994fb8-2b51-7c50-9f4b-31c7afec0ee2"};
const mappings: {file:string;row:number;materialId:string;code:string;name:string;departmentId:string;unit:string}[]=[];
const links = new Map<string,{materialId:string;departmentId:string;unitId:string;symbol:string;code:string;name:string}>();
for (const row of data.rows.filter((r)=>(r.quantity??0)>0)) {
  if(row.file==='tablet raw material.xlsx'&&row.row===292)continue;
  let code=row.code;
  let picked: z.infer<typeof material>|undefined;
  if(row.file==='syrup packaging materials.xlsx')code=packagingFixes.get(row.row)??code;
  if(code==='RMG001'&&/griseofulvin/i.test(row.name))picked=find('Griseofulvin');
  else if(code==='RMG039'&&/green tea/i.test(row.name))picked=find('Green Tea Extract 50%');
  else if(code==='RMA000'&&normal(row.name)==='artemether')picked=find('Artemether');
  else if(row.file==='syrup packaging materials.xlsx'&&row.row===208)picked=live.find((m)=>m.Code==='PML250');
  else {
    const matches=live.filter((m)=>normal(m.Code??'')===normal(code));
    if(matches.length===1)picked=matches[0];
    if(matches.length>1)picked=matches.find((m)=>normal(m.Name??'')===normal(row.name));
  }
  if(!picked){
    if(!row.name)throw new Error(`Unidentified material ${row.file}:${row.row}`);
    const exact=live.filter((m)=>m.Kind===row.kind&&normal(m.Name??'')===normal(row.name));
    if(exact.length===1)picked=exact[0];
    else {
      const packageKind=row.kind===1;
      const label=packageKind&&row.section==='SHIPPER LABEL';
      const name=label?`Shipper Labels ${row.name.replace(/\s+PML$/,'')}`:row.name;
      const first=normal(name).charAt(0).toUpperCase()||'X';
      const prefix=packageKind?(label?'PML':'PMS'):`RM${/[A-Z]/.test(first)?first:'X'}`;
      picked=create(name,row.kind??0,prefix,packageKind?(label?'label':'shipper'):null);
    }
  }
  if(!picked?.Code)throw new Error(`No material resolved ${row.file}:${row.row}`);
  const departmentId=departments[row.tag];if(!departmentId)throw new Error(row.tag);
  const symbol=row.file==='tablet raw material.xlsx'&&[219,222].includes(row.row)?'mg':row.unit??'';
  const unit=ref.units.find((u)=>normal(u.Symbol)===normal(symbol));if(!unit)throw new Error(`Missing unit ${symbol}`);
  mappings.push({file:row.file,row:row.row,materialId:picked.Id,code:picked.Code,name:picked.Name??row.name,departmentId,unit:symbol});
  const key=`${picked.Id}:${departmentId}`;const previous=links.get(key);
  if(previous&&previous.unitId!==unit.Id)throw new Error(`Source UOM conflict within one department: ${picked.Code}`);
  links.set(key,{materialId:picked.Id,departmentId,unitId:unit.Id,symbol,code:picked.Code,name:picked.Name??row.name});
}
const sql=["\\set ON_ERROR_STOP on","BEGIN;","SET LOCAL lock_timeout='10s';",`DO $$ BEGIN IF current_database() NOT IN ('oryx_client_20261030','oryx_rehearsal_20261101_203716') THEN RAISE EXCEPTION 'Unauthorized database'; END IF; IF EXISTS(SELECT 1 FROM "MaterialBatches") OR EXISTS(SELECT 1 FROM "ShelfMaterialBatches") THEN RAISE EXCEPTION 'Master setup requires the verified empty-stock baseline'; END IF; END $$;`,
 'LOCK TABLE "Materials","MaterialDepartments" IN SHARE ROW EXCLUSIVE MODE;'];
for(const c of codeChanges)sql.push(`DO $$ BEGIN IF (SELECT "Code" FROM "Materials" WHERE "Id"=${sq(c.id)}) IS DISTINCT FROM ${sq(c.before)} THEN RAISE EXCEPTION 'Material code changed since planning'; END IF; END $$;`, `UPDATE "Materials" SET "Code"=${sq(c.after)},"UpdatedAt"=now() WHERE "Id"=${sq(c.id)};`);
for(const m of created)sql.push(`INSERT INTO "Materials"("Id","Code","Name","Kind","Status","IsUnlimited","CreatedAt","Description","MaterialCategoryId") VALUES(${sq(m.id)},${sq(m.code)},${sq(m.name)},${m.kind},0,false,now(),'Created for the user-authorized opening balance migration',${m.categoryId?sq(m.categoryId):'NULL'});`);
let updated=0;let added=0;
for(const l of links.values()){
 const existing=ref.links.filter((p)=>p.MaterialId===l.materialId&&p.DepartmentId===l.departmentId);
 if(existing.length){if(existing.some((p)=>p.UoMId!==l.unitId)){updated++;sql.push(`UPDATE "MaterialDepartments" SET "UoMId"=${sq(l.unitId)},"UpdatedAt"=now() WHERE "MaterialId"=${sq(l.materialId)} AND "DepartmentId"=${sq(l.departmentId)} AND "DeletedAt" IS NULL;`);}}
 else {added++;sql.push(`INSERT INTO "MaterialDepartments"("Id","MaterialId","DepartmentId","UoMId","ReOrderLevel","MinimumStockLevel","MaximumStockLevel","Density","CreatedAt") VALUES(${sq(randomUUID())},${sq(l.materialId)},${sq(l.departmentId)},${sq(l.unitId)},0,0,0,0,now());`);}
}
sql.push(`SELECT json_build_object('materialCodesCorrected',${codeChanges.length},'materialsCreated',${created.length},'departmentLinksCreated',${added},'departmentUnitLinksCorrected',${updated},'stockBatches',(SELECT count(*) FROM "MaterialBatches"),'shelfStockRows',(SELECT count(*) FROM "ShelfMaterialBatches"));`,'COMMIT;');
await writeFile(output,sql.join('\n')+'\n');
await writeFile(output.replace(/\.sql$/,'.plan.json'),JSON.stringify({codeChanges,created,links:[...links.values()],mappings,excluded:[{file:'tablet raw material.xlsx',row:292,quantity:125000,unit:'piece',reason:'Removed at the user\'s explicit instruction'}]},null,2));
console.log(JSON.stringify({mappedRows:mappings.length,codeChanges,created,linksAdded:added,linksCorrected:updated,output}));
