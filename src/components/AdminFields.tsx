export const fieldClass = "min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm disabled:bg-mist";
export function Field({label,name,value,type="text",required=false,...props}:{label:string;name:string;value?:string|number|null;type?:string;required?:boolean;min?:string|number;max?:string|number;step?:string;placeholder?:string;maxLength?:number;autoComplete?:string;disabled?:boolean}) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input className={fieldClass} name={name} type={type} defaultValue={value??""} required={required} {...props}/></label>;
}
export function Select({label,name,value,options,empty="Non renseigné",required=false}:{label:string;name:string;value?:string|null;options:readonly (string|{value:string;label:string})[];empty?:string;required?:boolean}) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<select className={fieldClass} name={name} defaultValue={value??""} required={required}><option value="">{empty}</option>{options.map((o)=>{const v=typeof o==="string"?o:o.value;return <option key={v} value={v}>{typeof o==="string"?o:o.label}</option>})}</select></label>;
}
export function TextArea({label,name,value,rows=3}:{label:string;name:string;value?:string|null;rows?:number}) { return <label className="grid gap-1.5 text-sm font-medium">{label}<textarea className={fieldClass} name={name} defaultValue={value??""} rows={rows}/></label>; }
