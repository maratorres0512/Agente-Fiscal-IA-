/* Adaptador de servicios de Apps Script para pruebas locales. NO se instala en GAS. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
function runtime({file,buffer,today='2026-11-03',email='demo@example.invalid'}={}){
 const metrics={readCells:0,writtenCells:0,readCalls:0,writeCalls:0,tablesRead:[],tableCells:{}};
 let store={};const lock=new Int32Array(buffer||new SharedArrayBuffer(4));
 const read=()=>file?JSON.parse(fs.readFileSync(file,'utf8')):store;
 const write=s=>{if(file)fs.writeFileSync(file,JSON.stringify(s));else store=s;};
 const sheet=n=>({
  getDataRange(){const r=read()[n]||[];return {getValues:()=>{metrics.readCalls++;metrics.readCells+=r.length*(r[0]?.length||0);metrics.tableCells[n]=(metrics.tableCells[n]||0)+r.length*(r[0]?.length||0);metrics.tablesRead.push(n);return r.length?r:[['']];}};},
  getMaxColumns(){return 40;},insertColumnsAfter(){},
  getLastRow(){return(read()[n]||[]).length;},getMaxRows(){return 10000;},insertRowsAfter(){},setFrozenRows(){},
  getRange(row,col,nr,nc){return {
   getValues(){metrics.readCalls++;metrics.readCells+=nr*nc;metrics.tableCells[n]=(metrics.tableCells[n]||0)+nr*nc;metrics.tablesRead.push(n);const r=read()[n]||[];return Array.from({length:nr},(_,i)=>Array.from({length:nc},(_,j)=>r[row-1+i]?.[col-1+j]??''));},
   setValues(values){metrics.writeCalls++;metrics.writtenCells+=values.length*(values[0]?.length||0);const s=read(),r=s[n]||[];values.forEach((line,i)=>{r[row-1+i]??=[];line.forEach((v,j)=>r[row-1+i][col-1+j]=v);});while(r.length&&r[r.length-1].every(v=>v===''))r.pop();s[n]=r;write(s);return this;},
   clearContent(){const s=read(),r=s[n]||[];for(let i=0;i<nr;i++)if(r[row-1+i])for(let j=0;j<nc;j++)r[row-1+i][col-1+j]='';while(r.length&&r[r.length-1].every(v=>v===''))r.pop();s[n]=r;write(s);return this;},
   setBackground(){return this;},setFontColor(){return this;},setFontWeight(){return this;},setNumberFormat(){return this;}
  };}
 });
 const ss={getSheetByName:n=>read()[n]?sheet(n):null,insertSheet(n){const s=read();s[n]=[];write(s);return sheet(n);},setSpreadsheetTimeZone(){},getId:()=> 'ficticia',getUrl:()=> 'https://example.invalid/ficticia'};
 const props={SPREADSHEET_ID:file?'ficticia':null,USUARIAS_EMAILS:JSON.stringify({'Rocío Albarracín':'demo@example.invalid'})};
 const ctx=vm.createContext({console,Date,JSON,Set,Map,Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:(d,tz,fmt)=>fmt==='yyyy-MM-dd'?today:today+'T10:00:00-03:00'},SpreadsheetApp:{openById:()=>ss,getActiveSpreadsheet:()=>ss,flush(){}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>props[k]=v,deleteProperty:k=>delete props[k]})},Session:{getActiveUser:()=>({getEmail:()=>email})},LockService:{getScriptLock:()=>({tryLock(ms){const end=Date.now()+ms;do{if(Atomics.compareExchange(lock,0,0,1)===0)return true;Atomics.wait(lock,0,1,25);}while(Date.now()<end);return false;},releaseLock(){Atomics.store(lock,0,0);Atomics.notify(lock,0);}})}});
 const base=path.join(__dirname,'..');for(const f of ['Modelo.gs','Reglas.gs','Repositorio.gs','Servicios.gs','Code.gs','DatosPrueba.gs','PruebasGoogle.gs'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx,{filename:f});
 return {ctx,run:code=>vm.runInContext(code,ctx),db:()=>ctx.conBloqueo_(()=>ctx.leerDb_()),raw:read,replaceRaw:write,metrics,resetMetrics:()=>{metrics.readCells=metrics.writtenCells=metrics.readCalls=metrics.writeCalls=0;metrics.tablesRead=[];metrics.tableCells={};},setEmail:v=>email=v,setToday:v=>today=v};
}
module.exports={runtime};
