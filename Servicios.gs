/** Casos de uso. Se ejecutan sobre un snapshot dentro del ScriptLock. */
function nuevaMedida_(db,c,p,u,config) {
 const descripcion=texto_(p.descripcion||'',500);exigir_(descripcion,'Describa la medida.');
 const organismo=texto_(p.organismo||'',200);exigir_(organismo,'Indique organismo.');
 const fecha=fecha_(p.fechaSolicitud||hoy_());exigir_(fecha<=hoy_(),'La solicitud no puede ser futura.');
 const plazo=Number(p.plazo);exigir_(Number.isInteger(plazo)&&plazo>=0&&plazo<=3650,'Plazo inválido.');
 const tipo=texto_(p.tipo||'PERSONALIZADA',80);
 const m={id:id_(),causaId:c.id,tipo,descripcion,organismo,estado:'Solicitada',fechaSolicitud:fecha,plazo,primeraAlerta:sumarDias_(fecha,plazo),fechaReiteracion:'',segundaAlerta:'',fechaRecepcion:'',principal:p.principal===true,ultimaUsuaria:u,version:1};
 db.MEDIDAS.push(m);registrar_(db,u,c,m.id,'Medida solicitada',descripcion);
 if(['FECHA_MEDICA','FECHA_ACCIDENTOLOGICA'].includes(tipo)) c.periciaEstado='Fecha solicitada';
 return m;
}
function nuevaTarea_(db,c,p,u,config) {
 const t={id:id_(),causaId:c.id,tipo:p.tipo,descripcion:texto_(p.descripcion,500),estado:'Pendiente',fechaCreacion:p.fechaCreacion||hoy_(),fechaAudiencia:fecha_(p.fechaAudiencia,true),primeraAlerta:p.tipo==='Evaluación 308 / Desestimación'?sumarDias_(p.fechaCreacion||hoy_(),config.EVALUACION):'',fechaReiteracion:'',segundaAlerta:p.tipo==='Evaluación 308 / Desestimación'?sumarDias_(sumarDias_(p.fechaCreacion||hoy_(),config.EVALUACION),config.SEGUNDA_ALERTA):'',fechaCumplida:'',ultimaUsuaria:u,version:1};
 db.TAREAS.push(t);registrar_(db,u,c,t.id,'Alta de tarea',t.descripcion);return t;
}
function asegurarEvaluacion_(db,c,u,config,fecha) {
 if(!db.TAREAS.some(t=>t.causaId===c.id&&t.tipo==='Evaluación 308 / Desestimación'&&t.estado==='Pendiente')) nuevaTarea_(db,c,{tipo:'Evaluación 308 / Desestimación',descripcion:'Pendiente de evaluación para 308 / Desestimación',fechaCreacion:fecha||hoy_()},u,config);
 c.principalRecibida=true;c.evaluacionPendiente=true;c.estado='Evaluación 308 / Desestimación';
 registrar_(db,u,c,'','Evaluación','Prueba principal recibida; evaluación pendiente.');
}
function ficha_(db,id,config) {
 const c=obtener_(db.CAUSAS,id),h=hoy_();
 return {causa:Object.assign({},c,{oracAlerta:alerta_(c,'orac',h,config)}),medidas:db.MEDIDAS.filter(m=>m.causaId===id).map(m=>Object.assign({},m,{alerta:alerta_(m,'medida',h,config)})),tareas:db.TAREAS.filter(t=>t.causaId===id).map(t=>Object.assign({},t,{alerta:alerta_(t,'tarea',h,config)})),bitacora:db.BITACORA.filter(b=>b.causaId===id).reverse()};
}
function confirmar_(db,p,u,config) {
 const limpio=validarCausa_(p.causa);
 exigir_(!db.CAUSAS.some(c=>c.ipp===limpio.ipp),'Ya existe una causa con esa IPP. No se duplicó el despacho.');
 const c=Object.assign(limpio,{id:id_(),potencial:potencial_(limpio),principalRecibida:false,evaluacionPendiente:false,estado:'En seguimiento',fechaAlta:hoy_(),usuariaAlta:u,periciaEstado:limpio.tipo==='Otros'?'No aplica':'Sin iniciar',periciaFecha:'',oracEstado:'',oracFecha:'',oracReiteracion:'',oracSegunda:'',oracDevolucion:'',oracPrimera:'',version:1,ultimaUsuaria:u});
 exigir_(Array.isArray(p.claves)&&p.claves.length<=150,'Selección inválida.');
 const sugeridas=sugerencias_(c,config);exigir_(p.claves.every(k=>sugeridas.some(s=>s.clave===k)),'Las sugerencias cambiaron. Revise nuevamente.');
 const fecha=fecha_(p.fechaSolicitud);exigir_(fecha<=hoy_(),'Fecha de solicitud futura.');
 db.CAUSAS.push(c);registrar_(db,u,c,'','Alta','Confirmación de despacho y activación del seguimiento.');
 sugeridas.filter(s=>p.claves.includes(s.clave)).forEach(s=>{
  if(s.clase==='tarea') nuevaTarea_(db,c,s,u,config);
  else nuevaMedida_(db,c,Object.assign({},s,{fechaSolicitud:fecha}),u,config);
 });
 exigir_(Array.isArray(p.manuales)&&p.manuales.length<=50,'Medidas manuales inválidas.');
 p.manuales.forEach(m=>nuevaMedida_(db,c,Object.assign({},m,{tipo:'PERSONALIZADA'}),u,config));
 return ficha_(db,c.id,config);
}
function editar_(db,p,u,config) {
 const c=obtener_(db.CAUSAS,p.id);version_(c,p.version);const nuevo=validarCausa_(p.causa);
 exigir_(c.tipo===nuevo.tipo,'El tipo de investigación no puede cambiar luego de activar seguimiento.');
 exigir_(!db.CAUSAS.some(x=>x.id!==c.id&&x.ipp===nuevo.ipp),'Ya existe otra causa con esa IPP.');
 const cambios=Object.keys(nuevo).filter(k=>JSON.stringify(c[k])!==JSON.stringify(nuevo[k]));
 Object.assign(c,nuevo,{potencial:potencial_(nuevo)});tocar_(c,u);
 registrar_(db,u,c,'','Edición','Campos modificados: '+(cambios.join(', ')||'sin cambios'));
 if(c.tipo==='Mala praxis' && c.datos.documentacionReunida && c.periciaEstado==='Sin iniciar') registrar_(db,u,c,'','Cambio de estado','Documentación reunida; disponible solicitar fecha de pericia médica.');
 // Las nuevas alternativas médicas se incorporan como medidas rastreables; no cierran la evaluación.
 if(c.tipo==='Mala praxis') ['ampliacion','especialista'].forEach(k=>{
  const tipo=k==='ampliacion'?'AMPLIACION_MEDICA':'ESPECIALISTA', estado=c.datos[k];
  if(['Pendiente','Solicitada'].includes(estado) && !db.MEDIDAS.some(m=>m.causaId===c.id&&m.tipo===tipo&&!['No corresponde','Dejada sin efecto'].includes(m.estado))) {
   nuevaMedida_(db,c,{tipo,descripcion:k==='ampliacion'?'Requerir ampliación de pericia médica.':'Requerir pericia por especialista.',organismo:'Asesoría Pericial',plazo:config.GENERAL,principal:true},u,config);
  }
  const m=db.MEDIDAS.filter(m=>m.causaId===c.id&&m.tipo===tipo&&!TERMINALES_.includes(m.estado));
  m.forEach(m=>{
   if(estado==='Recibida') {m.estado='Recibida';m.fechaRecepcion=hoy_();tocar_(m,u);registrar_(db,u,c,m.id,'Recepción',m.descripcion);asegurarEvaluacion_(db,c,u,config);}
   if(estado==='No corresponde') {m.estado=estado;tocar_(m,u);registrar_(db,u,c,m.id,'Cambio de estado',estado);}
  });
 });
 return ficha_(db,c.id,config);
}
function estadoMedida_(db,p,u,config) {
 const m=obtener_(db.MEDIDAS,p.id);version_(m,p.version);const c=obtener_(db.CAUSAS,m.causaId);
 exigir_(MED_ESTADOS_.includes(p.estado),'Estado de medida inválido.');
 const fecha=fecha_(p.fecha||hoy_());exigir_(fecha<=hoy_(),'La gestión no puede ser futura.');
 exigir_(fecha>=m.fechaSolicitud,'La gestión no puede ser anterior a la solicitud.');
 if(p.estado==='Reiterada') {exigir_(!TERMINALES_.includes(m.estado),'La medida ya está cerrada.');exigir_(!m.fechaReiteracion||fecha>=m.fechaReiteracion,'Reiteración anterior a la última gestión.');m.fechaReiteracion=fecha;m.segundaAlerta=sumarDias_(fecha,config.SEGUNDA_ALERTA);}
 if(p.estado==='Recibida') {
  if(['FECHA_MEDICA','FECHA_ACCIDENTOLOGICA'].includes(m.tipo)) {c.periciaFecha=fecha_(p.fechaPericia);c.periciaEstado='Fecha otorgada';}
  m.fechaRecepcion=fecha;
  if(['DICTAMEN_MEDICO','DICTAMEN_ACCIDENTOLOGICO'].includes(m.tipo)) c.periciaEstado='Dictamen recibido';
  if(m.principal && m.estado!=='Recibida') asegurarEvaluacion_(db,c,u,config,fecha);
  if(m.tipo==='AMPLIACION_MEDICA') c.datos.ampliacion='Recibida';
  if(m.tipo==='ESPECIALISTA') c.datos.especialista='Recibida';
 } else if(m.estado==='Recibida') {m.fechaRecepcion='';if(['DICTAMEN_MEDICO','DICTAMEN_ACCIDENTOLOGICO'].includes(m.tipo)&&!TERMINALES_.includes(p.estado))c.periciaEstado='Pericia realizada / dictamen pendiente';}
 if(TERMINALES_.includes(m.estado)&&!TERMINALES_.includes(p.estado)){m.fechaReiteracion='';m.segundaAlerta='';}
 m.estado=p.estado;
 c.principalRecibida=db.MEDIDAS.some(x=>x.causaId===c.id&&x.principal&&x.estado==='Recibida');
 tocar_(m,u);tocar_(c,u);registrar_(db,u,c,m.id,p.estado==='Recibida'?'Recepción':p.estado==='Reiterada'?'Reiteración':'Cambio de estado',m.descripcion+' → '+p.estado);
 return ficha_(db,c.id,config);
}
function tarea_(db,p,u,config) {
 const t=obtener_(db.TAREAS,p.id);version_(t,p.version);const c=obtener_(db.CAUSAS,t.causaId);
 if(p.operacion==='reiterar') {
  exigir_(t.estado==='Pendiente'&&t.tipo==='Evaluación 308 / Desestimación','La tarea no admite reiteración.');
  const fecha=fecha_(p.fecha||hoy_());exigir_(fecha<=hoy_()&&fecha>=t.fechaCreacion&&(!t.fechaReiteracion||fecha>=t.fechaReiteracion),'Fecha de gestión inválida.');
  t.fechaReiteracion=fecha;t.segundaAlerta=sumarDias_(fecha,config.SEGUNDA_ALERTA);registrar_(db,u,c,t.id,'Reiteración','Control de evaluación.');
 } else if(p.operacion==='fecha') {exigir_(t.tipo==='Audiencia testimonial','No es una audiencia.');t.fechaAudiencia=fecha_(p.fecha);registrar_(db,u,c,t.id,'Edición','Fecha de audiencia: '+t.fechaAudiencia);}
 else {
  exigir_(['Pendiente','Cumplida'].includes(p.estado),'Estado de tarea inválido.');
  if(t.tipo==='Evaluación 308 / Desestimación') {
   if(p.estado==='Cumplida') {
    exigir_(!db.MEDIDAS.some(m=>m.causaId===c.id&&m.principal&&!TERMINALES_.includes(m.estado)),'Hay prueba principal / complementaria pendiente. Continúe el seguimiento antes de cerrar la evaluación.');
    if(c.tipo==='Mala praxis') exigir_(c.periciaEstado==='Dictamen recibido'&&!['Pendiente','Solicitada'].includes(c.datos.ampliacion)&&!['Pendiente','Solicitada'].includes(c.datos.especialista),'La pericia médica o sus ampliaciones aún están pendientes.');
    exigir_(['En seguimiento','Cerrada'].includes(p.estadoCausa),'Seleccione estado posterior de la causa.');
    if(p.estadoCausa==='Cerrada') exigir_(!db.MEDIDAS.some(m=>m.causaId===c.id&&!TERMINALES_.includes(m.estado))&&!db.TAREAS.some(x=>x.causaId===c.id&&x.id!==t.id&&x.estado==='Pendiente')&&(!c.oracEstado||c.oracEstado==='Devuelta'),'Hay medidas, tareas u ORAC pendientes. Mantenga la causa en seguimiento.');
    c.evaluacionPendiente=false;c.estado=p.estadoCausa;
   } else {c.evaluacionPendiente=true;c.estado='Evaluación 308 / Desestimación';}
  }
  t.estado=p.estado;t.fechaCumplida=p.estado==='Cumplida'?hoy_():'';registrar_(db,u,c,t.id,'Evaluación / tarea',t.tipo+' → '+p.estado);
 }
 tocar_(t,u);tocar_(c,u);return ficha_(db,c.id,config);
}
function pericia_(db,p,u,config) {
 const c=obtener_(db.CAUSAS,p.id);version_(c,p.version);exigir_(c.tipo!=='Otros','En Otros seleccione una medida principal.');
 const medica=c.tipo==='Mala praxis', tipoFecha=medica?'FECHA_MEDICA':'FECHA_ACCIDENTOLOGICA',tipoDictamen=medica?'DICTAMEN_MEDICO':'DICTAMEN_ACCIDENTOLOGICO';
 if(p.paso==='solicitar') {
  exigir_(c.periciaEstado==='Sin iniciar','La pericia ya fue iniciada.');
  if(medica) exigir_(c.datos.documentacionReunida&&documentacionLista_(c.datos),'Complete la documentación y marque documentación reunida en Editar causa.');
  nuevaMedida_(db,c,{tipo:tipoFecha,descripcion:'Solicitar fecha de pericia '+(medica?'médica.':'accidentológica.'),organismo:medica?'Asesoría Pericial':'Policía Científica',plazo:config[tipoFecha]},u,config);
 } else if(p.paso==='fecha') {
  exigir_(['Fecha solicitada','Fecha otorgada'].includes(c.periciaEstado),'Solicite fecha primero.');c.periciaFecha=fecha_(p.fecha);c.periciaEstado='Fecha otorgada';
  db.MEDIDAS.filter(m=>m.causaId===c.id&&m.tipo===tipoFecha&&!TERMINALES_.includes(m.estado)).forEach(m=>{m.estado='Recibida';m.fechaRecepcion=hoy_();tocar_(m,u);registrar_(db,u,c,m.id,'Recepción','Fecha de pericia otorgada: '+c.periciaFecha);});
 } else if(p.paso==='designar') {exigir_(c.periciaEstado==='Fecha otorgada','Registre fecha otorgada.');c.periciaEstado='Pericia designada';}
 else if(p.paso==='realizada') {
  exigir_(c.periciaEstado==='Pericia designada','Designe pericia primero.');const fecha=fecha_(p.fecha||hoy_());exigir_(fecha<=hoy_(),'La pericia realizada no puede ser futura.');
  c.periciaEstado='Pericia realizada / dictamen pendiente';
  nuevaMedida_(db,c,{tipo:tipoDictamen,descripcion:'Requerir dictamen '+(medica?'médico.':'accidentológico.'),organismo:medica?'Asesoría Pericial':'Policía Científica',plazo:config[tipoDictamen],fechaSolicitud:fecha,principal:true},u,config);
 } else throw new Error('Paso de pericia inválido.');
 tocar_(c,u);registrar_(db,u,c,'','Cambio de estado','Pericia: '+c.periciaEstado);return ficha_(db,c.id,config);
}
function orac_(db,p,u,config) {
 const c=obtener_(db.CAUSAS,p.id);version_(c,p.version);
 exigir_(c.tipo==='Tránsito','ORAC disponible en Tránsito.');
 const fecha=fecha_(p.fecha||hoy_());exigir_(fecha<=hoy_(),'Fecha futura no permitida.');
 if(p.operacion==='remitir') {
  exigir_(c.potencial==='Identificado','La remisión requiere potencial investigativo identificado.');exigir_(p.consentimiento===true,'Confirme consentimiento de la/s víctima/s.');exigir_(!c.oracEstado||c.oracEstado==='Devuelta','La causa ya está en ORAC.');
  c.oracEstado='Remitida';c.oracFecha=fecha;c.oracPrimera=sumarDias_(fecha,config.ORAC);c.oracReiteracion='';c.oracSegunda='';c.oracDevolucion='';
 } else {
  exigir_(c.oracEstado&&c.oracEstado!=='Devuelta','La causa no está pendiente en ORAC.');exigir_(fecha>=c.oracFecha,'Fecha anterior a la remisión.');
  if(p.operacion==='reiterar') {exigir_(!c.oracReiteracion||fecha>=c.oracReiteracion,'Fecha anterior a la última gestión.');c.oracReiteracion=fecha;c.oracSegunda=sumarDias_(fecha,config.SEGUNDA_ALERTA);}
  else if(p.operacion==='tramite') c.oracEstado='En trámite';
  else if(p.operacion==='devolver') {c.oracEstado='Devuelta';c.oracDevolucion=fecha;}
  else throw new Error('Acción ORAC inválida.');
 }
 tocar_(c,u);registrar_(db,u,c,'','ORAC',p.operacion+' · '+fecha+(p.operacion==='remitir'?' · consentimiento confirmado':''));return ficha_(db,c.id,config);
}
function eliminar_(db,p,u) {
 const c=obtener_(db.CAUSAS,p.id);version_(c,p.version);
 exigir_(p.confirmacion===c.ipp,'La IPP de confirmación no coincide.');
 registrar_(db,u,c,'','Eliminación','Eliminación definitiva confirmada.');
 // Se cumple la eliminación de toda la bitácora asociada solicitada. No queda auditoría residual.
 ['CAUSAS','MEDIDAS','TAREAS','BITACORA'].forEach(n=>{db[n]=db[n].filter(x=>n==='CAUSAS'?x.id!==c.id:x.causaId!==c.id);});
 return {eliminada:true};
}
