'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{Worker,isMainThread,parentPort,workerData}=require('node:worker_threads');
const {runtime}=require('./entorno.cjs');
if(!isMainThread){const r=runtime(workerData);try{parentPort.postMessage({ok:true,value:r.ctx.api(workerData.request)});}catch(e){parentPort.postMessage({ok:false,error:e.message});}}
else main().catch(e=>{console.error(e);process.exitCode=1;});
async function main(){
 const r=runtime(),g=r.ctx,u='Rocío Albarracín';let checks=0;
 const test=(name,fn)=>{fn();checks++;console.log('✓ '+name);};
 const call=(accion,p={})=>g.api({...p,accion,usuaria:u});
 g.inicializar_();
 test('Inicialización idempotente; cinco hojas',()=>{g.inicializar_();assert.equal(Object.keys(r.raw()).length,5);assert.equal(r.db().CONFIGURACION.length,18);});
 test('Reglas en runtime compatible GAS',()=>assert.match(g.pruebasReglas_(),/10 verificaciones/));
 test('Fechas inválidas rechazadas',()=>{assert.throws(()=>g.fecha_('2026-02-30'));assert.throws(()=>g.fecha_('03/11/2026'));assert.throws(()=>g.sumarDias_('2026-11-03',-1));});
 test('Medidas terminales sin alertas',()=>['Recibida','No corresponde','Dejada sin efecto'].forEach(estado=>assert.equal(g.alerta_({estado,primeraAlerta:'2020-01-01',segundaAlerta:'2020-01-02'},'medida','2026-11-03',r.run('PLAZOS_')).nivel,'sin')));
 test('Datos ficticios: tres plantillas y cinco instructoras',()=>{g.datosFicticios_();const db=r.db();assert.equal(db.CAUSAS.length,5);assert.equal(new Set(db.CAUSAS.map(c=>c.tipo)).size,3);assert.equal(new Set(db.CAUSAS.map(c=>c.instructora)).size,5);assert.throws(()=>g.datosFicticios_());});
 test('Cada filtro por instructora devuelve solo sus causas',()=>r.run('USUARIAS_').forEach(instructora=>{const t=call('tablero',{filtros:{instructora}});assert.equal(t.causas.length,1);assert(t.causas.every(c=>c.instructora===instructora));assert(t.medidas.every(m=>m.causaId===t.causas[0].id));}));
 test('Filtros combinados y por IPP, estado, ORAC, evaluación, vencidas y reiteradas',()=>{
  assert.equal(call('tablero',{filtros:{ipp:'OTROS',tipo:'Otros',resultado:'Lesiones culposas'}}).causas.length,1);
  assert.equal(call('tablero',{filtros:{proximas:true}}).causas.length,1);
  for(const filtro of [{orac:true},{evaluacion:true},{vencidas:true},{reiteradas:true},{limitado:true},{estado:'En seguimiento'}])assert(call('tablero',{filtros:filtro}).causas.length>0);
 });
 let c=r.db().CAUSAS.find(c=>c.tipo==='Otros');let m=r.db().MEDIDAS.find(m=>m.causaId===c.id&&m.tipo==='RML');
 test('Acción rápida Reiterada: segunda fecha desde gestión, no desde vencimiento',()=>{call('estadoMedida',{id:m.id,version:m.version,estado:'Reiterada',fecha:'2026-11-03'});m=r.db().MEDIDAS.find(x=>x.id===m.id);assert.equal(m.segundaAlerta,'2026-11-08');assert.equal(m.estado,'Reiterada');});
 test('Otra reiteración reinicia el segundo control; rechaza gestión anterior',()=>{assert.throws(()=>call('estadoMedida',{id:m.id,version:m.version,estado:'Reiterada',fecha:'2026-11-02'}));call('estadoMedida',{id:m.id,version:m.version,estado:'Reiterada',fecha:'2026-11-03'});m=r.db().MEDIDAS.find(x=>x.id===m.id);assert.equal(m.segundaAlerta,'2026-11-08');});
 test('Acción rápida Recibida apaga la alerta',()=>{call('estadoMedida',{id:m.id,version:m.version,estado:'Recibida',fecha:'2026-11-03'});m=r.db().MEDIDAS.find(x=>x.id===m.id);assert.equal(g.alerta_(m,'medida','2026-12-31',r.run('PLAZOS_')).nivel,'sin');});
 let principal=r.db().MEDIDAS.find(m=>m.causaId===c.id&&m.principal);
 test('Prueba principal de Otros genera evaluación única, 15 + 5 días',()=>{
  call('estadoMedida',{id:principal.id,version:principal.version,estado:'Recibida',fecha:'2026-11-03'});
  const db=r.db(),t=db.TAREAS.find(t=>t.causaId===c.id&&t.tipo==='Evaluación 308 / Desestimación');assert(t);assert.equal(t.primeraAlerta,'2026-11-18');assert.equal(t.segundaAlerta,'2026-11-23');assert.equal(db.CAUSAS.find(x=>x.id===c.id).evaluacionPendiente,true);
  principal=db.MEDIDAS.find(x=>x.id===principal.id);call('estadoMedida',{id:principal.id,version:principal.version,estado:'Recibida',fecha:'2026-11-03'});assert.equal(r.db().TAREAS.filter(t=>t.causaId===c.id&&t.tipo==='Evaluación 308 / Desestimación').length,1);
 });
 test('Evaluación persiste vencida luego de segunda alerta y control reprograma cinco días',()=>{
  let t=r.db().TAREAS.find(t=>t.causaId===c.id&&t.tipo==='Evaluación 308 / Desestimación');assert.equal(g.alerta_(t,'tarea','2027-01-01',r.run('PLAZOS_')).nivel,'rojo');
  call('tarea',{id:t.id,version:t.version,operacion:'reiterar',fecha:'2026-11-03'});t=r.db().TAREAS.find(x=>x.id===t.id);assert.equal(t.segundaAlerta,'2026-11-08');
 });
 test('Edición, versión optimista y auditoría',()=>{c=r.db().CAUSAS.find(x=>x.id===c.id);const f=call('editar',{id:c.id,version:c.version,causa:{...c,dato:'Edición ficticia'}});assert.equal(f.causa.dato,'Edición ficticia');assert(f.bitacora.some(b=>b.accion==='Edición'&&b.usuaria===u));assert.throws(()=>call('editar',{id:c.id,version:c.version,causa:c}),/Otra usuaria/);});
 test('Usuario y operaciones desconocidas rechazados',()=>{assert.throws(()=>g.api({accion:'tablero',usuaria:'Ajena'}));assert.throws(()=>call('borrarTodo'));});
 test('Analizar no escribe ni activa seguimiento',()=>{const before=JSON.stringify(r.raw());const x=r.db().CAUSAS.find(c=>c.tipo==='Tránsito');call('analizar',{causa:x});assert.equal(JSON.stringify(r.raw()),before);});
 test('Documentación incompleta bloquea pericia médica',()=>{const mp=r.db().CAUSAS.find(c=>c.tipo==='Mala praxis');assert.equal(mp.potencial,'');assert.throws(()=>call('pericia',{id:mp.id,version:mp.version,paso:'solicitar'}),/documentación/);});
 test('Flujo médico completo y ampliación no cierra prematuramente evaluación',()=>{
  let mp=r.db().CAUSAS.find(c=>c.tipo==='Mala praxis');const causa={...mp,datos:{...mp.datos,historia:'Incorporada completa',complementaria:'Completa',profesionales:'Identificados',declaracion:'Recibida',documentacionReunida:true}};
  let f=call('editar',{id:mp.id,version:mp.version,causa});mp=f.causa;
  for(const p of [{paso:'solicitar'},{paso:'fecha',fecha:'2026-11-03'},{paso:'designar'},{paso:'realizada',fecha:'2026-11-03'}]){f=call('pericia',{...p,id:mp.id,version:mp.version});mp=f.causa;}
  const m=f.medidas.find(m=>m.tipo==='DICTAMEN_MEDICO');f=call('estadoMedida',{id:m.id,version:m.version,estado:'Recibida',fecha:'2026-11-03'});assert.equal(f.causa.periciaEstado,'Dictamen recibido');assert.equal(f.causa.evaluacionPendiente,true);
  f=call('editar',{id:mp.id,version:f.causa.version,causa:{...f.causa,datos:{...f.causa.datos,ampliacion:'Pendiente'}}});f=call('confirmarNuevas',{id:mp.id,version:f.causa.version,claves:f.sugerencias.filter(s=>s.tipo==='AMPLIACION_MEDICA').map(s=>s.clave),fechaSolicitud:'2026-11-03'});let t=f.tareas.find(t=>t.tipo==='Evaluación 308 / Desestimación');assert.throws(()=>call('tarea',{id:t.id,version:t.version,estado:'Cumplida',estadoCausa:'En seguimiento'}),/pendiente/i);
  const amp=f.medidas.find(m=>m.tipo==='AMPLIACION_MEDICA');f=call('estadoMedida',{id:amp.id,version:amp.version,estado:'Recibida',fecha:'2026-11-03'});t=f.tareas.find(t=>t.tipo==='Evaluación 308 / Desestimación');f=call('tarea',{id:t.id,version:t.version,estado:'Cumplida',estadoCausa:'En seguimiento'});assert.equal(f.causa.evaluacionPendiente,false);
 });
 test('Evaluación no permite cerrar toda la causa con otras medidas pendientes',()=>{const x=r.db().CAUSAS.find(c=>c.tipo==='Otros'),t=r.db().TAREAS.find(t=>t.causaId===x.id&&t.tipo==='Evaluación 308 / Desestimación');assert.throws(()=>call('tarea',{id:t.id,version:t.version,estado:'Cumplida',estadoCausa:'Cerrada'}),/pendientes/);});
 test('ORAC: consentimiento, devolución y segunda alerta desde gestión',()=>{let c=r.db().CAUSAS.find(c=>c.ipp==='FICTICIA-ORAC-005');assert.equal(c.oracSegunda,'2026-11-02');let f=call('orac',{id:c.id,version:c.version,operacion:'devolver',fecha:'2026-11-03'});assert.equal(f.causa.oracEstado,'Devuelta');assert.equal(f.causa.oracAlerta.nivel,'sin');assert.throws(()=>call('orac',{id:c.id,version:f.causa.version,operacion:'remitir',fecha:'2026-11-03',consentimiento:false}),/consentimiento/);});
 test('No existe campo ni persistencia de despacho; se descarta incluso si lo envían',()=>{const db=r.db();assert(!Object.values(r.run('ESQUEMA_')).flat().some(k=>/despacho/i.test(k)));const x=db.CAUSAS[0];call('editar',{id:x.id,version:x.version,causa:x,despacho:'TEXTO_SECRETO_NO_GUARDAR'});assert(!JSON.stringify(r.raw()).includes('TEXTO_SECRETO_NO_GUARDAR'));});
 test('Error de escritura ordinario restaura las tablas anteriores',()=>{const before=JSON.stringify(r.raw()),x=r.db().CAUSAS[0];let once=true;g.SpreadsheetApp.flush=()=>{if(once){once=false;throw new Error('Fallo simulado');}};assert.throws(()=>call('agregarTarea',{id:x.id,version:x.version,tarea:{tipo:'Otra',descripcion:'No debe guardarse'}}),/restauró/);assert.equal(JSON.stringify(r.raw()),before);g.SpreadsheetApp.flush=()=>{};});
 test('Lista de acceso de cuentas rechaza correo ajeno y admite autorizado',()=>{const props=g.PropertiesService.getScriptProperties();props.setProperty('USUARIAS_EMAILS',JSON.stringify({[u]:'otra@example.invalid'}));assert.throws(()=>call('tablero'),/no está autorizada/);props.setProperty('USUARIAS_EMAILS',JSON.stringify({[u]:'DEMO@example.invalid'}));assert(call('tablero').causas.length);props.setProperty('USUARIAS_EMAILS',JSON.stringify({[u]:'demo@example.invalid'}));});
 test('Plazos editables sin código; fechas existentes conservadas',()=>{const prev=r.db(),db=JSON.parse(JSON.stringify(prev));db.CONFIGURACION.find(x=>x.clave==='SEGUNDA_ALERTA').dias=7;g.conBloqueo_(()=>g.guardarDb_(prev,db));assert.equal(call('inicio').config.SEGUNDA_ALERTA,7);});
 test('Eliminación exige IPP y elimina todas las asociaciones',()=>{const x=r.db().CAUSAS.find(c=>c.ipp==='FICTICIA-LIMITADA-004');assert.throws(()=>call('eliminar',{id:x.id,version:x.version,confirmacion:'otra'}));call('eliminar',{id:x.id,version:x.version,confirmacion:x.ipp});const db=r.db();assert(!db.CAUSAS.some(c=>c.id===x.id));for(const n of ['MEDIDAS','TAREAS','BITACORA'])assert(!db[n].some(y=>y.causaId===x.id));});
 test('Mala praxis no puede cerrar sin pericia aunque se desmarquen todas las medidas',()=>{const mp=r.db().CAUSAS.find(c=>c.tipo==='Mala praxis');const causa={...mp,ipp:'FICTICIA-SIN-MEDIDAS',datos:{...mp.datos,documentacionReunida:false}};const f=call('confirmar',{causa,claves:[],manuales:[],fechaSolicitud:'2026-11-03'});assert.throws(()=>call('estadoCausa',{id:f.causa.id,version:f.causa.version,estado:'Cerrada'}),/dictamen médico/);});
 test('Cierre de causa bloqueado con pendientes',()=>{const x=r.db().CAUSAS.find(c=>c.tipo==='Otros');assert.throws(()=>call('estadoCausa',{id:x.id,version:x.version,estado:'Cerrada'}));});
 // Dos workers ejecutan las funciones reales de api/repositorio; Sheet y ScriptLock son adaptadores locales.
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ufij22-test-')),file=path.join(dir,'db.json'),buffer=new SharedArrayBuffer(4);fs.writeFileSync(file,JSON.stringify(r.raw()));
 const execute=request=>new Promise((resolve,reject)=>{const w=new Worker(__filename,{workerData:{file,buffer,request}});w.once('message',resolve);w.once('error',reject);});
 let x=r.db().CAUSAS.find(c=>c.tipo==='Otros');const request=n=>({accion:'agregarTarea',usuaria:u,id:x.id,version:x.version,tarea:{tipo:'Otra',descripcion:'Escritura simultánea '+n}});
 const parallel=await Promise.all([execute(request('A')),execute(request('B'))]);
 test('Dos escrituras simultáneas sobre la misma versión: una aceptada, otra en conflicto',()=>{assert.equal(parallel.filter(x=>x.ok).length,1);assert.equal(parallel.filter(x=>!x.ok&&/Otra usuaria/.test(x.error)).length,1);});
 const rt=runtime({file,buffer}),db=rt.db(),different=db.MEDIDAS.filter(m=>m.causaId===x.id&&!['Recibida','No corresponde','Dejada sin efecto'].includes(m.estado)).slice(0,2);
 const writes=await Promise.all(different.map(m=>execute({accion:'estadoMedida',usuaria:u,id:m.id,version:m.version,estado:'Recibida',fecha:'2026-11-03'})));
 test('Dos escrituras simultáneas sobre medidas distintas: ambas conservadas',()=>{assert.equal(writes.length,2);assert(writes.every(x=>x.ok));const final=rt.db();assert(different.every(m=>final.MEDIDAS.find(x=>x.id===m.id).estado==='Recibida'));});
 fs.rmSync(dir,{recursive:true,force:true});console.log('\n'+checks+' pruebas locales aprobadas. ScriptLock y Google Sheets simulados; ejecutar también validación en Google.');
}
