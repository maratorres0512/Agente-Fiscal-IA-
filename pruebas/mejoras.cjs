'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{performance}=require('node:perf_hooks');
const {runtime}=require('./entorno.cjs');let total=0;
const test=(nombre,fn)=>{fn();total++;console.log('✓ '+nombre);};
const u='Rocío Albarracín';
function setup(){const r=runtime();r.ctx.inicializar_();r.call=(accion,p={})=>r.ctx.api({...p,accion,usuaria:u});return r;}
function causa(tipo='Tránsito',extra={}){
 const datos=tipo==='Mala praxis'?{victima:'Insta',historia:'No incorporada',autopsia:'No corresponde',anatomia:'No corresponde',complementaria:'Pendiente de requerir',profesionales:'No identificados',declaracion:'Pendiente',ampliacion:'No corresponde',especialista:'No corresponde',documentacionReunida:false}:tipo==='Otros'?{victima:'Insta',camaras:'No hay',cientifica:'No intervino',testigos:'No',rml:'No corresponde',inspeccion:'No corresponde',tecnica:'No corresponde'}:{victima:'Insta',fuga:'No',camaras:'No hay / no se localizaron',cientifica:'No intervino',testigos:'No',rml:'Incorporado',historia:'No corresponde'};
 return {ipp:'FICTICIA-ESPEC-'+tipo,fechaHecho:'2026-10-05',fechaSumario:'2026-10-25',instructora:u,resultado:'Lesiones culposas',tipo,principalTipo:tipo==='Otros'?'Informe técnico':'',dato:'Prueba ficticia',...extra,datos:{...datos,...extra.datos}};
}
function crear(r,c,tipos){const a=r.call('analizar',{causa:c});return r.call('confirmar',{causa:c,claves:a.sugerencias.filter(s=>!tipos||tipos.includes(s.tipo)).map(s=>s.clave),manuales:[],fechaSolicitud:'2026-11-03'});}
function editar(r,f,datos){return r.call('editar',{id:f.causa.id,version:f.causa.version,causa:{...f.causa,datos:{...f.causa.datos,...datos}}});}
function confirmar(r,f,tipos){return r.call('confirmarNuevas',{id:f.causa.id,version:f.causa.version,claves:f.sugerencias.filter(s=>!tipos||tipos.includes(s.tipo)).map(s=>s.clave),fechaSolicitud:r.ctx.hoy_()});}
function recibir(r,f,m,fecha){return r.call('estadoMedida',{id:m.id,version:m.version,estado:'Recibida',fecha:fecha||r.ctx.hoy_()});}
function medico(r){let f=crear(r,causa('Mala praxis',{datos:{historia:'Incorporada completa',complementaria:'Completa',profesionales:'Identificados',declaracion:'Recibida',documentacionReunida:true}}));for(const p of [{paso:'fecha',fecha:'2026-11-03'},{paso:'designar'},{paso:'realizada',fecha:'2026-11-03'}])f=r.call('pericia',{id:f.causa.id,version:f.causa.version,...p});return f;}
const evaluacion=f=>f.tareas.find(t=>t.tipo==='Evaluación 308 / Desestimación');

test('A — cámaras posteriores: reclasificación, propuesta y confirmación sin duplicar',()=>{
 const r=setup();let f=crear(r,causa());assert.equal(f.causa.potencial,'Limitado');const antes=JSON.stringify(f.medidas);
 f=editar(r,f,{camaras:'Recibidas',preservacion:'Videofilmaciones recibidas',utilidad:'Muestran el hecho'});
 assert.equal(f.causa.potencial,'Identificado');assert.equal(JSON.stringify(f.medidas),antes);
 for(const tipo of ['Acta de apertura','INFORME_TRANSITO','FECHA_ACCIDENTOLOGICA'])assert(f.sugerencias.some(s=>s.tipo===tipo));
 const viejo=f;f=confirmar(r,f);const actuales=f.medidas.length;assert.throws(()=>confirmar(r,viejo),/Otra usuaria/);
 f=editar(r,f,{victima:'No insta'});assert.equal(f.medidas.length,actuales);assert(!f.sugerencias.some(s=>['Acta de apertura','INFORME_TRANSITO','FECHA_ACCIDENTOLOGICA'].includes(s.tipo)));
});
test('B — preservación independiente: +30 desde hecho, advertencia y recepción pendiente',()=>{
 const r=setup();let f=crear(r,causa('Tránsito',{datos:{camaras:'Solicitadas / pendientes',preservacion:'Preservación solicitada, sin confirmación'}}));
 assert.equal(f.causa.camarasAlerta.nivel,'rojo');assert.equal(f.causa.camarasAlerta.fecha,'2026-11-04');const m=f.medidas.find(m=>m.tipo==='CAMARAS');assert.equal(m.fechaSolicitud,'2026-11-03');
 f=editar(r,f,{preservacion:'Preservación confirmada'});assert.equal(f.causa.camarasAlerta.riesgo,false);assert.match(f.causa.camarasAlerta.texto,/recepción pendiente/);assert.equal(f.medidas.find(x=>x.id===m.id).estado,'Solicitada');assert.equal(f.medidas.find(x=>x.id===m.id).primeraAlerta,m.primeraAlerta);
 f=recibir(r,f,f.medidas.find(x=>x.id===m.id));assert.equal(f.causa.camarasAlerta.texto,'Imágenes recibidas');assert(f.sugerencias.some(s=>s.tipo==='Acta de apertura'));
});
test('B — referencia superada no supone destrucción; umbrales configurables',()=>{
 const r=setup(),c=causa('Otros',{fechaHecho:'2026-09-01'});const a=r.call('analizar',{causa:c}).camarasAlerta;assert.equal(a.nivel,'rojo');assert.match(a.texto,/sin presumir destrucción/);
 const prev=r.db(),db=JSON.parse(JSON.stringify(prev));db.CONFIGURACION.find(x=>x.clave==='CAMARAS_CONSERVACION').dias=90;r.ctx.guardarDb_(prev,db);assert.equal(r.call('analizar',{causa:c}).camarasAlerta.nivel,'verde');
});
test('C — no se saltea documentación médica por API o por medida manual',()=>{
 const r=setup();let f=crear(r,causa('Mala praxis'));assert.equal(f.causa.potencial,'');assert(!f.sugerencias.some(s=>s.tipo==='FECHA_MEDICA'));assert.throws(()=>r.call('pericia',{id:f.causa.id,version:f.causa.version,paso:'solicitar'}),/documentación/);
 assert.throws(()=>r.call('agregarMedida',{id:f.causa.id,version:f.causa.version,medida:{tipo:'FECHA_MEDICA',descripcion:'Intento de salto',organismo:'Ficticio',plazo:15}}),/documentación/);
 const prev=JSON.stringify(r.raw());f=editar(r,f,{historia:'Incorporada completa',complementaria:'Completa',profesionales:'Identificados',declaracion:'Recibida',documentacionReunida:true});assert(f.sugerencias.some(s=>s.tipo==='FECHA_MEDICA'));assert(!f.medidas.some(m=>m.tipo==='FECHA_MEDICA'));f=confirmar(r,f,['FECHA_MEDICA']);assert.equal(f.causa.periciaEstado,'Fecha solicitada');assert.notEqual(JSON.stringify(r.raw()),prev);
});
test('D — ampliación suspende y reactiva la misma evaluación con nuevo plazo',()=>{
 const r=setup();let f=medico(r);f=recibir(r,f,f.medidas.find(m=>m.tipo==='DICTAMEN_MEDICO'));const original=evaluacion(f);assert(original);assert.equal(original.primeraAlerta,'2026-11-18');
 f=editar(r,f,{ampliacion:'Pendiente'});assert.equal(f.causa.evaluacionPendiente,false);assert(evaluacion(f).evaluacionSuspendida);assert.equal(evaluacion(f).alerta.nivel,'sin');assert(!f.medidas.some(m=>m.tipo==='AMPLIACION_MEDICA'));
 assert.throws(()=>r.call('tarea',{id:original.id,version:evaluacion(f).version,estado:'Cumplida',estadoCausa:'En seguimiento'}),/pendiente/);
 f=confirmar(r,f,['AMPLIACION_MEDICA']);const amp=f.medidas.find(m=>m.tipo==='AMPLIACION_MEDICA');assert.equal(amp.plazo,30);assert(amp.necesariaEvaluacion);assert.equal(amp.principal,false);
 r.setToday('2026-11-08');f=recibir(r,f,amp);assert.equal(evaluacion(f).id,original.id);assert.equal(evaluacion(f).fechaIngresoEvaluacion,'2026-11-08');assert.equal(evaluacion(f).primeraAlerta,'2026-11-23');assert.equal(evaluacion(f).segundaAlerta,'2026-11-28');assert(f.causa.evaluacionPendiente);assert(f.bitacora.some(b=>b.accion==='Evaluación reactivada'));
 f=editar(r,f,{ampliacion:'Pendiente'});assert(f.sugerencias.some(s=>s.tipo==='AMPLIACION_MEDICA'));f=confirmar(r,f,['AMPLIACION_MEDICA']);assert.equal(f.medidas.filter(m=>m.tipo==='AMPLIACION_MEDICA').length,2);assert.equal(f.medidas.find(m=>m.id===amp.id).fechaRecepcion,'2026-11-08');assert(evaluacion(f).evaluacionSuspendida);
});
test('E — especialista antes del dictamen original no crea evaluación',()=>{
 const r=setup();let f=medico(r);f=r.call('agregarMedida',{id:f.causa.id,version:f.causa.version,medida:{tipo:'ESPECIALISTA',naturaleza:'Nueva pericia',descripcion:'Especialista ficticio',organismo:'Asesoría Pericial',plazo:30,principal:true}});
 f=recibir(r,f,f.medidas.find(m=>m.tipo==='ESPECIALISTA'));assert.equal(f.causa.principalRecibida,false);assert.equal(f.causa.evaluacionPendiente,false);assert(!evaluacion(f));
 f=recibir(r,f,f.medidas.find(m=>m.tipo==='DICTAMEN_MEDICO'));assert(evaluacion(f));assert.equal(f.tareas.filter(t=>t.tipo==='Evaluación 308 / Desestimación').length,1);
});
test('F — 15/20 días, control reprogramable, vencimiento persistente hasta cumplimiento',()=>{
 const r=setup();let f=crear(r,causa('Otros'));f=recibir(r,f,f.medidas.find(m=>m.principal));let t=evaluacion(f);const config=r.call('inicio').config;
 assert.equal(r.ctx.alerta_(t,'tarea','2026-11-18',config).nivel,'naranja');assert.equal(r.ctx.alerta_(t,'tarea','2026-11-23',config).nivel,'rojo');assert.equal(r.ctx.alerta_(t,'tarea','2027-02-01',config).nivel,'rojo');
 r.setToday('2026-11-19');f=r.call('tarea',{id:t.id,version:t.version,operacion:'reiterar',fecha:'2026-11-19'});t=evaluacion(f);assert.equal(t.segundaAlerta,'2026-11-24');
 f=r.call('tarea',{id:t.id,version:t.version,estado:'Cumplida',estadoCausa:'En seguimiento'});assert.equal(evaluacion(f).alerta.nivel,'sin');assert(!f.causa.evaluacionPendiente);
 f=editar(r,f,{victima:'No insta'});assert.equal(evaluacion(f).estado,'Cumplida');assert.equal(f.tareas.filter(t=>t.tipo==='Evaluación 308 / Desestimación').length,1);
});
test('G — varios requisitos: recibir solo uno no activa y reabrirlo suspende',()=>{
 const r=setup();let f=crear(r,causa('Otros'));f=r.call('agregarMedida',{id:f.causa.id,version:f.causa.version,medida:{descripcion:'Segundo informe necesario',organismo:'Ficticio',plazo:10,necesariaEvaluacion:true}});
 f=recibir(r,f,f.medidas.find(m=>m.principal));assert(!f.causa.evaluacionPendiente);assert(!evaluacion(f));
 const segundo=f.medidas.find(m=>!m.principal&&m.necesariaEvaluacion);f=recibir(r,f,segundo);assert(f.causa.evaluacionPendiente);assert(evaluacion(f));
 const actualizado=f.medidas.find(m=>m.id===segundo.id);f=r.call('estadoMedida',{id:actualizado.id,version:actualizado.version,estado:'Solicitada',fecha:'2026-11-03'});assert(evaluacion(f).evaluacionSuspendida);assert(!f.causa.evaluacionPendiente);
});
test('G — edición no altera ni recibe medidas previas; nueva categoría repetida es explícita',()=>{
 const r=setup();let f=crear(r,causa('Mala praxis',{datos:{ampliacion:'Pendiente'}}));const amp=f.medidas.find(m=>m.tipo==='AMPLIACION_MEDICA'),before=JSON.stringify(f.medidas);
 f=editar(r,f,{ampliacion:'Recibida'});assert.equal(JSON.stringify(f.medidas),before);assert.equal(f.medidas.find(m=>m.id===amp.id).estado,'Solicitada');
 f=r.call('agregarMedida',{id:f.causa.id,version:f.causa.version,medida:{tipo:'AMPLIACION_MEDICA',naturaleza:'Ampliación',descripcion:'Segunda cuestión específica',organismo:'Asesoría Pericial',plazo:30}});assert.equal(f.medidas.filter(m=>m.tipo==='AMPLIACION_MEDICA').length,2);
});
test('Rol en evaluación de una medida existente: suspensión explícita y versión protegida',()=>{
 const r=setup();let f=crear(r,causa('Otros'));f=r.call('agregarMedida',{id:f.causa.id,version:f.causa.version,medida:{descripcion:'Antecedente ficticio adicional',organismo:'Organismo ficticio',plazo:15}});f=recibir(r,f,f.medidas.find(m=>m.principal));const t=evaluacion(f),m=f.medidas.find(m=>!m.principal);
 f=r.call('rolMedida',{id:m.id,version:m.version,principal:false,necesariaEvaluacion:true});assert(evaluacion(f).evaluacionSuspendida);assert(!f.causa.evaluacionPendiente);assert(f.bitacora.some(b=>b.accion==='Rol probatorio'));assert.throws(()=>r.call('rolMedida',{id:m.id,version:m.version,necesariaEvaluacion:false}),/Otra usuaria/);
 f=recibir(r,f,f.medidas.find(x=>x.id===m.id));assert(f.causa.evaluacionPendiente);assert.equal(evaluacion(f).id,t.id);
});
test('Carga ágil: testigos sin datos, individualización, audiencia y declaración separadas',()=>{
 const r=setup();let f=crear(r,causa('Tránsito',{datos:{testigos:'Sí',listaTestigos:[]}}));assert.equal(f.causa.potencial,'Requiere información');assert(!f.tareas.some(t=>t.tipo==='Audiencia testimonial'));
 f=editar(r,f,{listaTestigos:[{nombre:'Testigo Ficticio Beta',telefono:'',estado:'Individualizado'}]});assert.equal(f.causa.potencial,'Identificado');const testigo=f.causa.datos.listaTestigos[0];f=confirmar(r,f,['Audiencia testimonial']);let t=f.tareas.find(t=>t.testigoId===testigo.id);assert(t);
 f=r.call('tarea',{id:t.id,version:t.version,operacion:'fecha',fecha:'2026-11-10',hora:'10:30'});t=f.tareas.find(x=>x.id===t.id);assert.equal(t.horaAudiencia,'10:30');assert.equal(f.causa.datos.listaTestigos[0].estado,'Audiencia designada');
 f=r.call('tarea',{id:t.id,version:t.version,estado:'Cumplida'});assert.equal(f.causa.datos.listaTestigos[0].estado,'Declaración recibida');assert(!f.sugerencias.some(s=>s.testigoId===testigo.id));
});
test('H — identidad segura: nombre ajeno, cuenta desconocida, identidad vacía y configuración ausente',()=>{
 const r=setup(),props=r.ctx.PropertiesService.getScriptProperties();assert.throws(()=>r.ctx.api({accion:'tablero',usuaria:'Mara Torres'}),/no está autorizada/);
 r.setEmail('persona-ajena@example.invalid');assert.throws(()=>r.call('inicio'),/no está autorizada/);r.setEmail('');assert.throws(()=>r.call('tablero'),/Google no informó/);
 r.setEmail('demo@example.invalid');props.deleteProperty('USUARIAS_EMAILS');assert.throws(()=>r.call('tablero'),/falta USUARIAS_EMAILS/);props.setProperty('USUARIAS_EMAILS','{}');assert.throws(()=>r.call('tablero'),/no está autorizada/);
 props.setProperty('USUARIAS_EMAILS',JSON.stringify({[u]:'demo@example.invalid','Mara Torres':'demo@example.invalid'}));assert.throws(()=>r.call('tablero'),/varias usuarias/);
});
test('Migración desde v1: aditiva, conserva datos y plazos; repetición no cambia registros',()=>{
 const r=setup();let f=crear(r,causa());const raw=r.raw();
 for(const [n,count] of [['MEDIDAS',15],['TAREAS',13]])raw[n]=raw[n].map(row=>row.slice(0,count));
 raw.CONFIGURACION=raw.CONFIGURACION.filter((row,i)=>i===0||!['CAMARAS_CONSERVACION','CAMARAS_PREVENTIVA_1','CAMARAS_PREVENTIVA_2','AMPLIACION_MEDICA','ESPECIALISTA'].includes(row[0]));
 raw.CONFIGURACION.find(x=>x[0]==='RML')[1]=8;r.replaceRaw(raw);const original=JSON.stringify(raw.MEDIDAS);
 r.ctx.migrar_();assert.equal(JSON.stringify(r.raw().MEDIDAS.map(row=>row.slice(0,15))),original);assert.equal(r.call('inicio').config.RML,8);assert.equal(r.db().CAUSAS[0].id,f.causa.id);
 const once=JSON.stringify(r.raw());r.ctx.migrar_();assert.equal(JSON.stringify(r.raw()),once);
});
test('Migración rechaza encabezado desconocido antes de tocar ninguna hoja',()=>{
 const r=setup(),raw=r.raw();raw.TAREAS[0][0]='id_alterado';r.replaceRaw(raw);const before=JSON.stringify(r.raw());assert.throws(()=>r.ctx.migrar_(),/No se migró/);assert.equal(JSON.stringify(r.raw()),before);
});
test('Migración no recrea una hoja faltante de una base inicializada',()=>{
 const r=setup(),raw=r.raw();delete raw.MEDIDAS;r.replaceRaw(raw);const before=JSON.stringify(r.raw());assert.throws(()=>r.ctx.migrar_(),/no se recreó/);assert.equal(JSON.stringify(r.raw()),before);
});
test('Varias complementarias médicas: solo el último informe pendiente reactiva',()=>{
 const r=setup();let f=medico(r);f=recibir(r,f,f.medidas.find(m=>m.tipo==='DICTAMEN_MEDICO'));const id=evaluacion(f).id;
 for(const tipo of ['AMPLIACION_MEDICA','ESPECIALISTA'])f=r.call('agregarMedida',{id:f.causa.id,version:f.causa.version,medida:{tipo,descripcion:'Complementaria ficticia '+tipo,organismo:'Asesoría Pericial',plazo:30}});
 f=recibir(r,f,f.medidas.find(m=>m.tipo==='AMPLIACION_MEDICA'));assert(!f.causa.evaluacionPendiente);assert(evaluacion(f).evaluacionSuspendida);
 r.setToday('2026-11-10');f=recibir(r,f,f.medidas.find(m=>m.tipo==='ESPECIALISTA'));assert(f.causa.evaluacionPendiente);assert.equal(evaluacion(f).id,id);assert.equal(evaluacion(f).primeraAlerta,'2026-11-25');assert.equal(f.tareas.filter(t=>t.tipo==='Evaluación 308 / Desestimación').length,1);
});
test('Migración interrumpida: completa valores nuevos faltantes sin tocar datos anteriores',()=>{
 const r=setup();crear(r,causa('Otros'));const raw=r.raw(),original=JSON.stringify(raw.MEDIDAS.map(row=>row.slice(0,15)));raw.MEDIDAS=raw.MEDIDAS.map((row,i)=>i?row.slice(0,15):row);r.replaceRaw(raw);r.ctx.migrar_();assert.equal(JSON.stringify(r.raw().MEDIDAS.map(row=>row.slice(0,15))),original);assert(r.db().MEDIDAS.find(m=>m.principal).necesariaEvaluacion);
});
test('Migración suspende una evaluación v1 prematura originada por complementaria',()=>{
 const r=setup();let f=medico(r);const db=r.db(),prev=JSON.parse(JSON.stringify(db)),c=db.CAUSAS.find(c=>c.id===f.causa.id);r.ctx.nuevaTarea_(db,c,{tipo:'Evaluación 308 / Desestimación',descripcion:'Evaluación v1 ficticia'},u,r.run('PLAZOS_'));c.evaluacionPendiente=true;c.principalRecibida=true;c.estado='Evaluación 308 / Desestimación';r.ctx.guardarDb_(prev,db);r.ctx.migrar_();f=r.call('ficha',{id:c.id});assert(!f.causa.evaluacionPendiente);assert(!f.causa.principalRecibida);assert(evaluacion(f).evaluacionSuspendida);assert.equal(evaluacion(f).alerta.nivel,'sin');assert.equal(f.tareas.filter(t=>t.tipo==='Evaluación 308 / Desestimación').length,1);
});
test('Tránsito: otra medida marcada principal no reemplaza el dictamen accidentológico',()=>{
 const r=setup();let f=crear(r,causa());f=r.call('agregarMedida',{id:f.causa.id,version:f.causa.version,medida:{descripcion:'Informe auxiliar ficticio',organismo:'Organismo ficticio',plazo:10,principal:true}});f=recibir(r,f,f.medidas.find(m=>m.principal));assert(!f.causa.evaluacionPendiente);assert(!evaluacion(f));
});
test('Despacho modular: solo selección, testimonio 232 con fecha/hora y texto personalizado',()=>{
 const context=vm.createContext({fmt:v=>v?v.split('-').reverse().join('/'):'—'});vm.runInContext(fs.readFileSync(path.join(__dirname,'../Despacho.html'),'utf8').replace(/^<script>/,'').replace(/<\/script>\s*$/,''),context);
 const c=causa(),s=[{tipo:'Audiencia testimonial',testigoNombre:'Testigo Ficticio',fechaAudiencia:'2026-11-10',horaAudiencia:'10:30'},{tipo:'RML',organismo:'Cuerpo Médico'},{tipo:'PERSONALIZADA',descripcion:'Requerir constancias específicas',organismo:'Organismo ficticio'}];
 const txt=context.textoDespacho_(c,s,'2026-11-03');assert.match(txt,/art\. 232 del CPPBA/);assert.match(txt,/10:30/);assert.match(txt,/1\. Desígnese/);assert.match(txt,/3\. Requerir constancias específicas/);assert(!txt.includes('historia clínica'));assert(!txt.includes('art. 308'));assert.match(txt,/IPP digital/);
});

// I — datos generados en memoria; nunca se escriben en una Sheet real.
{
 const r=setup(),raw=r.raw(),schema=r.run('ESQUEMA_'),conf=r.run('PLAZOS_');
 const c0=crear(r,causa('Otros')).causa;const store=r.raw();store.CAUSAS=[schema.CAUSAS];store.MEDIDAS=[schema.MEDIDAS];store.TAREAS=[schema.TAREAS];store.BITACORA=[schema.BITACORA];
 const row=(n,x)=>schema[n].map(k=>k==='datos'?JSON.stringify(x[k]):x[k]??'');
 const nombres=r.run('USUARIAS_');
 for(let i=0;i<900;i++){
  const c={...c0,id:'FICTICIA-ID-'+i,ipp:'FICTICIA-VOLUMEN-'+i,instructora:nombres[i%5]};store.CAUSAS.push(row('CAUSAS',c));
  for(let j=0;j<8;j++)store.MEDIDAS.push(row('MEDIDAS',{id:'FICTICIA-M-'+i+'-'+j,causaId:c.id,tipo:'PERSONALIZADA',descripcion:'Informe ficticio '+j,organismo:'Organismo ficticio',estado:j===7?'Recibida':'Solicitada',fechaSolicitud:'2026-10-01',plazo:15,primeraAlerta:'2026-10-16',version:1,principal:false,necesariaEvaluacion:false,naturaleza:'Requerimiento',ultimaUsuaria:u}));
  for(let j=0;j<12;j++)store.BITACORA.push(row('BITACORA',{id:'FICTICIA-B-'+i+'-'+j,fechaHora:'2026-11-03T10:00:00-03:00',usuaria:u,causaId:c.id,ipp:c.ipp,accion:'Prueba de volumen'}));
 }
 r.replaceRaw(store);const tiempos=[];r.resetMetrics();for(let i=0;i<5;i++){const t=performance.now();const b=r.call('tablero',{filtros:{}});tiempos.push(performance.now()-t);assert.equal(b.totalCausas,900);assert.equal(b.medidas.length,100);assert.equal(b.causas.length,100);assert.equal(b.paginas.medidas.total,6300);}
 test('I — 900 causas / 7200 medidas / 10800 movimientos: tablero paginado sin leer bitácora completa',()=>{assert((r.metrics.tableCells.BITACORA||0)<=5*8);assert(Math.max(...tiempos)<5000);});
 const t=performance.now();const f=r.call('tablero',{filtros:{instructora:nombres[1]}}),filtrado=performance.now()-t;assert.equal(f.totalCausas,180);assert.equal(f.paginas.medidas.total,1260);
 r.resetMetrics();const inicio=performance.now();r.call('estadoMedida',{id:'FICTICIA-M-0-0',version:1,estado:'Reiterada',fecha:'2026-11-03'});const escritura=performance.now()-inicio,celdas=r.metrics.writtenCells;
 test('I — escritura puntual conserva registros y evita reescribir tablas',()=>{assert(celdas<200);assert.equal(r.db().MEDIDAS.length,7200);assert.equal(r.db().BITACORA.length,10801);});
 const result={causas:900,medidas:7200,movimientos:10800,tablero_ms:tiempos.map(t=>+t.toFixed(1)),filtro_ms:+filtrado.toFixed(1),escritura_ms:+escritura.toFixed(1),celdas_escritas:celdas,entorno:'Node local; servicios Google simulados, sin latencia remota'};
 console.log('RENDIMIENTO '+JSON.stringify(result));
}
console.log('\n'+total+' pruebas adicionales aprobadas. Ejecutar además verificar.cjs para regresiones y concurrencia.');
