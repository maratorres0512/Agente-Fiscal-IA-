/** Persistencia compartida. Todas las lecturas/escrituras pasan por el mismo ScriptLock. */
function libro_() {
 const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
 exigir_(id,'Ejecute inicializar_ desde el editor del proyecto vinculado a la Sheet.');
 return SpreadsheetApp.openById(id);
}
function conBloqueo_(fn) {
 const lock=LockService.getScriptLock();
 exigir_(lock.tryLock(30000),'La base está ocupada. Actualice e intente nuevamente.');
 try { return fn(); } finally { lock.releaseLock(); }
}
function leerDb_() {
 const ss=libro_(), db={};
 Object.keys(ESQUEMA_).forEach(n=>{
  const sh=ss.getSheetByName(n);exigir_(sh,'Falta hoja '+n+'. Ejecute inicializar_.');
  const rows=sh.getDataRange().getValues(), h=ESQUEMA_[n];
  exigir_(JSON.stringify(rows[0])===JSON.stringify(h),'Encabezados modificados en '+n+'. Restaure la estructura.');
  db[n]=rows.slice(1).filter(r=>r[0]!=='').map(r=>{
   const x={};h.forEach((k,i)=>{let v=r[i]; if(v instanceof Date) v=Utilities.formatDate(v,TZ_,'yyyy-MM-dd'); if(typeof v==='string' && v.startsWith("'")) v=v.slice(1); x[k]=v;});
   if(n==='CAUSAS') x.datos=JSON.parse(x.datos||'{}'); return x;
  });
 });return db;
}
function celda_(v) {
 if(v===null||v===undefined) return '';
 if(typeof v==='object') return JSON.stringify(v);
 // El apóstrofe impide fórmulas introducidas por descripciones, IPP o teléfonos.
 if(typeof v==='string' && /^[=+@\-']/.test(v)) return "'"+v;
 return v;
}
function escribirTabla_(n,rows) {
 const sh=libro_().getSheetByName(n), h=ESQUEMA_[n], count=Math.max(sh.getLastRow(),rows.length+1);
 if(sh.getMaxRows()<count) sh.insertRowsAfter(sh.getMaxRows(),count-sh.getMaxRows());
 if(count>1) sh.getRange(2,1,count-1,h.length).clearContent();
 if(rows.length) sh.getRange(2,1,rows.length,h.length).setValues(rows.map(x=>h.map(k=>celda_(x[k]))));
}
function guardarDb_(prev,db) {
 const dirty=Object.keys(ESQUEMA_).filter(n=>JSON.stringify(prev[n])!==JSON.stringify(db[n]));
 try {dirty.forEach(n=>escribirTabla_(n,db[n]));SpreadsheetApp.flush();}
 catch(e) {
  // Sheets no ofrece transacciones entre hojas: restauración compensatoria ante error ordinario.
  try {dirty.forEach(n=>escribirTabla_(n,prev[n]));SpreadsheetApp.flush();} catch(restore) {throw new Error('Error de escritura y restauración. Detenga el uso y restaure una copia de seguridad.');}
  throw new Error('No se guardó la operación. Se restauró el estado previo. Intente nuevamente.');
 }
}
function config_(db) {
 const c=Object.assign({},PLAZOS_);
 db.CONFIGURACION.forEach(r=>{exigir_(Object.prototype.hasOwnProperty.call(c,r.clave),'Clave de configuración desconocida: '+r.clave);const n=Number(r.dias);exigir_(Number.isInteger(n)&&n>=0&&n<=3650,'Plazo inválido en Configuración: '+r.clave);c[r.clave]=n;});return c;
}
function id_() {return Utilities.getUuid();}
function registrar_(db,u,c,ref,accion,detalle) {
 db.BITACORA.push({id:id_(),fechaHora:ahora_(),usuaria:u,causaId:c.id,ipp:c.ipp,referenciaId:ref||'',accion,detalle:detalle||''});
}
function obtener_(rows,id) {const r=rows.find(x=>x.id===id);exigir_(r,'El registro ya no existe. Actualice el tablero.');return r;}
function version_(r,v) {exigir_(r.version===v,'Otra usuaria modificó este registro. Actualice la ficha antes de guardar.');}
function tocar_(r,u) {r.version=Number(r.version||0)+1;r.ultimaUsuaria=u;}
/** Ejecutar una vez desde Extensiones > Apps Script. No borra datos existentes. */
function inicializar_() {
 return conBloqueo_(()=>{
  const ss=SpreadsheetApp.getActiveSpreadsheet();exigir_(ss,'Vincule este proyecto a una Google Sheet.');
  const props=PropertiesService.getScriptProperties(), previo=props.getProperty('SPREADSHEET_ID');
  exigir_(!previo||previo===ss.getId(),'Este proyecto ya está asociado a otra base.');
  ss.setSpreadsheetTimeZone(TZ_);props.setProperty('SPREADSHEET_ID',ss.getId());
  Object.keys(ESQUEMA_).forEach(n=>{
   let sh=ss.getSheetByName(n);if(!sh) sh=ss.insertSheet(n);
   const h=ESQUEMA_[n];if(!sh.getLastRow()) sh.getRange(1,1,1,h.length).setValues([h]);
   exigir_(JSON.stringify(sh.getRange(1,1,1,h.length).getValues()[0])===JSON.stringify(h),'Encabezados incompatibles en '+n);
   sh.setFrozenRows(1);sh.getRange(1,1,1,h.length).setBackground('#17384d').setFontColor('#ffffff').setFontWeight('bold');
   // Fechas ISO como texto: no dependen de la configuración regional de la Sheet.
   if(n!=='CONFIGURACION') ESQUEMA_[n].forEach((k,i)=>{if(/fecha|Alerta|oracPrimera|oracSegunda|oracDevolucion|oracReiteracion|oracFecha/i.test(k)) sh.getRange(2,i+1,Math.max(1,sh.getMaxRows()-1),1).setNumberFormat('@');});
  });
  const db=leerDb_();Object.keys(PLAZOS_).forEach(k=>{if(!db.CONFIGURACION.some(r=>r.clave===k)) db.CONFIGURACION.push({clave:k,dias:PLAZOS_[k],descripcion:k==='SEGUNDA_ALERTA'?'Desde cada reiteración / gestión; días corridos':k==='PROXIMA'?'Anticipación visual de vencimiento':'Días corridos'});});
  escribirTabla_('CONFIGURACION',db.CONFIGURACION);SpreadsheetApp.flush();
  return 'Base inicializada. '+ss.getUrl();
 });
}
