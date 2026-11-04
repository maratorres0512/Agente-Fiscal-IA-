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
function leerDb_(opciones) {
 const ss=libro_(), db={};opciones=opciones||{};
 Object.keys(ESQUEMA_).forEach(n=>{
  if(n==='BITACORA'&&opciones.omitirBitacora){const sh=ss.getSheetByName(n);exigir_(sh,'Falta hoja BITACORA.');cabeceraValida_(sh,n);db[n]=[];db._bitacoraParcial=true;return;}
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
/** Escritura por filas modificadas. La bitácora ordinaria solo se agrega al final. */
function guardarDb_(prev,db) {
 const ss=libro_(),planes=[];
 Object.keys(ESQUEMA_).forEach(n=>{
  const h=ESQUEMA_[n],sh=ss.getSheetByName(n),old=prev[n],actual=db[n];
  if(n==='BITACORA'&&db._bitacoraParcial){
   if(actual.length){const inicio=sh.getLastRow()+1;planes.push({aplicar:()=>escribirRango_(sh,inicio,h,actual),restaurar:()=>sh.getRange(inicio,1,actual.length,h.length).clearContent()});}return;
  }
  if(JSON.stringify(old)===JSON.stringify(actual))return;
  const compactar=actual.length<old.length||old.some((r,i)=>actual[i]&&actual[i][h[0]]!==r[h[0]]);
  if(compactar){planes.push({aplicar:()=>escribirTabla_(n,actual),restaurar:()=>escribirTabla_(n,old)});return;}
  let inicio=-1,grupo=[];
  const agregar=()=>{if(!grupo.length)return;const fila=inicio+2,nuevas=grupo.slice(),anteriores=old.slice(inicio,inicio+grupo.length),extras=grupo.length-anteriores.length;planes.push({aplicar:()=>escribirRango_(sh,fila,h,nuevas),restaurar:()=>{if(anteriores.length)escribirRango_(sh,fila,h,anteriores);if(extras>0)sh.getRange(fila+anteriores.length,1,extras,h.length).clearContent();}});grupo=[];inicio=-1;};
  actual.forEach((r,i)=>{if(JSON.stringify(r)!==JSON.stringify(old[i])){if(inicio<0)inicio=i;grupo.push(r);}else agregar();});agregar();
 });
 try {planes.forEach(p=>p.aplicar());SpreadsheetApp.flush();}
 catch(e) {
  try{planes.slice().reverse().forEach(p=>p.restaurar());SpreadsheetApp.flush();}catch(restore){throw new Error('Error de escritura y restauración. Detenga el uso y restaure una copia de seguridad.');}
  throw new Error('No se guardó la operación. Se restauró el estado previo. Intente nuevamente.');
 }
}
function escribirRango_(sh,fila,h,rows) {
 const ultimo=fila+rows.length-1;if(sh.getMaxRows()<ultimo)sh.insertRowsAfter(sh.getMaxRows(),ultimo-sh.getMaxRows());
 sh.getRange(fila,1,rows.length,h.length).setValues(rows.map(x=>h.map(k=>celda_(x[k]))));
}
/** Lectura de auditoría por bloques desde el final, máximo 100 resultados por página. */
function cabeceraValida_(sh,n){exigir_(JSON.stringify(sh.getRange(1,1,1,ESQUEMA_[n].length).getValues()[0])===JSON.stringify(ESQUEMA_[n]),'Encabezados modificados en '+n+'. Restaure la estructura.');}
function paginaBitacora_(causaId,hasta) {
 const sh=libro_().getSheetByName('BITACORA'),h=ESQUEMA_.BITACORA,ultimo=sh.getLastRow();
 cabeceraValida_(sh,'BITACORA');
 let fin=hasta===undefined?ultimo:Number(hasta);exigir_(Number.isInteger(fin)&&fin>=1&&fin<=ultimo,'Página de bitácora inválida.');
 const items=[];
 while(fin>=2&&items.length<100){const inicio=Math.max(2,fin-499),rows=sh.getRange(inicio,1,fin-inicio+1,h.length).getValues();
  for(let i=rows.length-1;i>=0;i--){fin=inicio+i-1;if(rows[i][3]!==causaId)continue;const x={};h.forEach((k,j)=>x[k]=rows[i][j]);items.push(x);if(items.length===100)break;}
 }
 return {items,siguiente:fin>=2?fin:null};
}
function config_(db) {
 const c=Object.assign({},PLAZOS_);
 db.CONFIGURACION.forEach(r=>{exigir_(Object.prototype.hasOwnProperty.call(c,r.clave),'Clave de configuración desconocida: '+r.clave);const n=Number(r.dias);exigir_(Number.isInteger(n)&&n>=0&&n<=3650,'Plazo inválido en Configuración: '+r.clave);c[r.clave]=n;});exigir_(c.CAMARAS_PREVENTIVA_1>=c.CAMARAS_PREVENTIVA_2&&c.CAMARAS_PREVENTIVA_1<=c.CAMARAS_CONSERVACION,'Revise los umbrales de conservación de cámaras.');return c;
}
function id_() {return Utilities.getUuid();}
function registrar_(db,u,c,ref,accion,detalle) {
 db.BITACORA.push({id:id_(),fechaHora:ahora_(),usuaria:u,causaId:c.id,ipp:c.ipp,referenciaId:ref||'',accion,detalle:detalle||''});
}
function obtener_(rows,id) {const r=rows.find(x=>x.id===id);exigir_(r,'El registro ya no existe. Actualice el tablero.');return r;}
function version_(r,v) {exigir_(r.version===v,'Otra usuaria modificó este registro. Actualice la ficha antes de guardar.');}
function tocar_(r,u) {r.version=Number(r.version||0)+1;r.ultimaUsuaria=u;}
/** Inicialización y migración aditiva, repetibles; nunca se borran hojas o registros. */
function inicializar_() {return migrar_();}
function migrar_() {
 return conBloqueo_(()=>{
  const ss=SpreadsheetApp.getActiveSpreadsheet();exigir_(ss,'Vincule este proyecto a una Google Sheet.');
  const props=PropertiesService.getScriptProperties(),previo=props.getProperty('SPREADSHEET_ID');exigir_(!previo||previo===ss.getId(),'Este proyecto ya está asociado a otra base.');
  // Validar TODAS las cabeceras antes de alterar una sola hoja.
  const existentes={};Object.keys(ESQUEMA_).forEach(n=>{const sh=ss.getSheetByName(n);if(!sh||!sh.getLastRow()){exigir_(!previo,'Falta la hoja '+n+' en una base ya inicializada. Restaure la copia de seguridad; no se recreó la hoja.');return;}const rows=sh.getDataRange().getValues(),h=rows[0];exigir_(h.length<=ESQUEMA_[n].length&&h.every((k,i)=>k===ESQUEMA_[n][i]),'Encabezados incompatibles en '+n+'. No se migró la base.');existentes[n]=rows;});
  props.setProperty('SPREADSHEET_ID',ss.getId());ss.setSpreadsheetTimeZone(TZ_);
  Object.keys(ESQUEMA_).forEach(n=>{
   let sh=ss.getSheetByName(n);if(!sh)sh=ss.insertSheet(n);const h=ESQUEMA_[n],rows=existentes[n]||[],antes=rows.length?rows[0].length:0;
   if(sh.getMaxColumns()<h.length)sh.insertColumnsAfter(sh.getMaxColumns(),h.length-sh.getMaxColumns());
   if(antes<h.length){
    sh.getRange(1,antes+1,1,h.length-antes).setValues([h.slice(antes)]);
    if(rows.length>1)sh.getRange(2,antes+1,rows.length-1,h.length-antes).setValues(rows.slice(1).map(r=>h.slice(antes).map(k=>{
     if(k==='necesariaEvaluacion')return r[h.indexOf('principal')]===true||['AMPLIACION_MEDICA','ESPECIALISTA'].includes(r[h.indexOf('tipo')]);
     if(k==='naturaleza')return r[h.indexOf('tipo')]==='AMPLIACION_MEDICA'?'Ampliación':r[h.indexOf('tipo')]==='ESPECIALISTA'?'Nueva pericia':'Requerimiento';
     if(k==='evaluacionSuspendida')return false;
     if(k==='fechaIngresoEvaluacion'&&r[h.indexOf('tipo')]==='Evaluación 308 / Desestimación')return r[h.indexOf('fechaCreacion')];return '';
    })));
   }
   // Completar una migración interrumpida tras escribir encabezados, sin reemplazar valores presentes.
   const defaults=n==='MEDIDAS'?['necesariaEvaluacion','naturaleza']:n==='TAREAS'?['evaluacionSuspendida','fechaIngresoEvaluacion']:[];
   defaults.forEach(k=>{const idx=h.indexOf(k);if(idx>=antes||rows.length<2)return;let cambio=false;
    const values=rows.slice(1).map(r=>{let v=r[idx];if(v!==''&&v!==undefined)return [v];
     if(k==='necesariaEvaluacion')v=r[h.indexOf('principal')]===true||['AMPLIACION_MEDICA','ESPECIALISTA'].includes(r[h.indexOf('tipo')]);
     if(k==='naturaleza')v=r[h.indexOf('tipo')]==='AMPLIACION_MEDICA'?'Ampliación':r[h.indexOf('tipo')]==='ESPECIALISTA'?'Nueva pericia':'Requerimiento';
     if(k==='evaluacionSuspendida')v=false;
     if(k==='fechaIngresoEvaluacion')v=r[h.indexOf('tipo')]==='Evaluación 308 / Desestimación'?r[h.indexOf('fechaCreacion')]:'';
     if(v!==''&&v!==undefined)cambio=true;return [v===undefined?'':v];
    });if(cambio)sh.getRange(2,idx+1,values.length,1).setValues(values);
   });
   sh.setFrozenRows(1);sh.getRange(1,1,1,h.length).setBackground('#17384d').setFontColor('#ffffff').setFontWeight('bold');
   if(n!=='CONFIGURACION')h.forEach((k,i)=>{if(/fecha|hora|Alerta|oracPrimera|oracSegunda|oracDevolucion|oracReiteracion|oracFecha/i.test(k))sh.getRange(2,i+1,Math.max(1,sh.getMaxRows()-1),1).setNumberFormat('@');});
  });
  const db=leerDb_(),prev=JSON.parse(JSON.stringify(db));
  Object.keys(PLAZOS_).forEach(k=>{if(!db.CONFIGURACION.some(r=>r.clave===k))db.CONFIGURACION.push({clave:k,dias:PLAZOS_[k],descripcion:/PREVENTIVA/.test(k)?'Días de anticipación a la conservación de referencia':'Días corridos'});});
  // Corregir madurez legada conservando dictámenes, fechas válidas e historial.
  const config=config_(db);db.CAUSAS.forEach(c=>{
   const antes=JSON.stringify(c);sincronizarEvaluacion_(db,c,'Sistema · migración',config);
   if(JSON.stringify(c)!==antes){tocar_(c,'Sistema · migración');registrar_(db,'Sistema · migración',c,'','Migración','Revisión de madurez y evaluación; no se eliminaron registros.');}
  });
  guardarDb_(prev,db);return 'Base inicializada / migrada sin borrado. '+ss.getUrl();
 });
}
