"""Vista funcional de demostración, sin red ni datos persistentes. No integra el despliegue GAS."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Adaptador exclusivo de la demostración. Nunca se copia a Apps Script.
adaptador = r'''
const servidorDemo = (() => {
 let store={}, bloqueado=false, emailActivo='',contador=0;
 const read=()=>store,write=s=>store=s;
 const sheet=n=>({
  getDataRange(){const rows=read()[n]||[];return {getValues:()=>rows.length?rows:[['']]};},
  getLastRow(){return (read()[n]||[]).length;},getMaxRows(){return 100000;},getMaxColumns(){return 50;},
  insertRowsAfter(){},insertColumnsAfter(){},setFrozenRows(){},
  getRange(row,col,nr,nc){return {
   getValues(){const r=read()[n]||[];return Array.from({length:nr},(_,i)=>Array.from({length:nc},(_,j)=>r[row-1+i]?.[col-1+j]??''));},
   setValues(values){const s=read(),r=s[n]||[];values.forEach((line,i)=>{r[row-1+i]??=[];line.forEach((v,j)=>r[row-1+i][col-1+j]=v);});while(r.length&&r[r.length-1].every(v=>v===''))r.pop();s[n]=r;write(s);return this;},
   clearContent(){const s=read(),r=s[n]||[];for(let i=0;i<nr;i++)if(r[row-1+i])for(let j=0;j<nc;j++)r[row-1+i][col-1+j]='';while(r.length&&r[r.length-1].every(v=>v===''))r.pop();s[n]=r;write(s);return this;},
   setBackground(){return this;},setFontColor(){return this;},setFontWeight(){return this;},setNumberFormat(){return this;}
  };}
 });
 const ss={getSheetByName:n=>read()[n]?sheet(n):null,insertSheet(n){const s=read();s[n]=[];write(s);return sheet(n);},setSpreadsheetTimeZone(){},getId:()=> 'demostracion-sin-google',getUrl:()=> 'Base ficticia en memoria'};
 const props={};
 const SpreadsheetApp={openById:()=>ss,getActiveSpreadsheet:()=>ss,flush(){}};
 const PropertiesService={getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>props[k]=v,deleteProperty:k=>delete props[k]})};
 const Session={getActiveUser:()=>({getEmail:()=>emailActivo})};
 const LockService={getScriptLock:()=>({tryLock(){if(bloqueado)return false;bloqueado=true;return true;},releaseLock(){bloqueado=false;}})};
 const Utilities={getUuid:()=> 'demo-'+Date.now().toString(36)+'-'+(++contador).toString(36),formatDate:(fecha,tz,formato)=>{
  const partes=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(fecha),v={};partes.forEach(p=>v[p.type]=p.value);
  const dia=v.year+'-'+v.month+'-'+v.day;return formato==='yyyy-MM-dd'?dia:dia+'T'+v.hour+':'+v.minute+':'+v.second+'-03:00';
 }};
 __SERVIDOR__
 const cuentas={};USUARIAS_.forEach((nombre,i)=>cuentas[nombre]='demo-'+(i+1)+'@example.invalid');
 props.USUARIAS_EMAILS=JSON.stringify(cuentas);
 inicializar_();datosFicticios_();
 return p=>{emailActivo=cuentas[p.usuaria]||'';return JSON.parse(JSON.stringify(api(p)));};
})();
// Este puente simula la llamada a Google solo dentro de este archivo de demostración.
window.google={script:{run:{withSuccessHandler(ok){return {withFailureHandler(fail){return {api(p){setTimeout(()=>{try{ok(servidorDemo(p));}catch(e){fail({message:e.message});}},10);}};}};}}}};
'''
servidor='\n'.join((ROOT/n).read_text() for n in ('Modelo.gs','Reglas.gs','Repositorio.gs','Servicios.gs','Code.gs','DatosPrueba.gs'))
bridge='<script>\n'+adaptador.replace('__SERVIDOR__',servidor).replace('</script','<\\/script')+'\n</script>'
html=(ROOT/'Index.html').read_text()
for nombre in ('Estilos','Despacho','Cliente'):
    html=html.replace("<?!= incluir_('"+nombre+"'); ?>",(ROOT/(nombre+'.html')).read_text())
html=html.replace('<head>','<head>'+bridge).replace('<base target="_top">','')
html=html.replace('<body>','''<body><aside style="padding:12px 4%;background:#fff3d8;color:#594719;border-bottom:1px solid #dfcc9b;font:14px/1.5 Arial,sans-serif"><strong>VISTA PREVIA · SOLO DATOS FICTICIOS</strong><br>Podés recorrer las pantallas y probar operaciones. Los cambios se pierden al recargar. La cuenta Google es simulada; este archivo no accede a Google Sheets ni reemplaza la aplicación institucional.</aside>''')
html=html.replace('ufij22_usuaria','ufij22_demo_usuaria')
(ROOT/'demo').mkdir(exist_ok=True)
(ROOT/'demo/VistaPrevia.html').write_text(html)
print('demo/VistaPrevia.html generada a partir de la aplicación existente. Sin dependencias ni conexión a Google.')
