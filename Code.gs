/** Única entrada RPC del cliente. No acepta ni persiste texto de despacho. */
function doGet() {
 return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('UFIJ N.º 22 · Triaje y prueba').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function incluir_(nombre) {return HtmlService.createHtmlOutputFromFile(nombre).getContent();}
function api(p) {
 exigir_(p&&typeof p==='object','Solicitud inválida.');
 exigir_(USUARIAS_.includes(p.usuaria),'Seleccione una usuaria para continuar.');
 const permitidos=PropertiesService.getScriptProperties().getProperty('ALLOWED_EMAILS');
 if(permitidos) {const email=Session.getActiveUser().getEmail().toLowerCase();exigir_(email&&permitidos.toLowerCase().split(',').map(s=>s.trim()).includes(email),'La cuenta Google no está autorizada.');}
 return conBloqueo_(()=>{
  const db=leerDb_(),config=config_(db),u=p.usuaria;
  if(p.accion==='inicio') return {usuarias:USUARIAS_,campos:CAMPOS_,estados:ESTADOS_,estadosMedida:MED_ESTADOS_,config,hoy:hoy_(),tablero:tablero_(db,{},hoy_(),config)};
  if(p.accion==='tablero') return tablero_(db,p.filtros,hoy_(),config);
  if(p.accion==='ficha') return ficha_(db,p.id,config);
  if(p.accion==='analizar') {const c=validarCausa_(p.causa);return {potencial:potencial_(c),sugerencias:sugerencias_(c,config)};}
  const prev=JSON.parse(JSON.stringify(db));let r;
  switch(p.accion) {
   case 'confirmar':r=confirmar_(db,p,u,config);break;
   case 'editar':r=editar_(db,p,u,config);break;
   case 'agregarMedida': {const c=obtener_(db.CAUSAS,p.id);version_(c,p.version);nuevaMedida_(db,c,Object.assign({},p.medida,{tipo:'PERSONALIZADA'}),u,config);tocar_(c,u);r=ficha_(db,c.id,config);break;}
   case 'estadoMedida':r=estadoMedida_(db,p,u,config);break;
   case 'tarea':r=tarea_(db,p,u,config);break;
   case 'agregarTarea': {const c=obtener_(db.CAUSAS,p.id);version_(c,p.version);exigir_(['Acta de apertura','Audiencia testimonial','Otra'].includes(p.tarea.tipo),'Tipo de tarea inválido.');nuevaTarea_(db,c,p.tarea,u,config);tocar_(c,u);r=ficha_(db,c.id,config);break;}
   case 'pericia':r=pericia_(db,p,u,config);break;
   case 'orac':r=orac_(db,p,u,config);break;
   case 'estadoCausa': {const c=obtener_(db.CAUSAS,p.id);version_(c,p.version);exigir_(['En seguimiento','Cerrada'].includes(p.estado),'Estado inválido.');exigir_(!c.evaluacionPendiente,'Cierre la tarea de evaluación desde la ficha.');if(p.estado==='Cerrada'&&c.tipo==='Mala praxis') exigir_(c.periciaEstado==='Dictamen recibido'&&!['Pendiente','Solicitada'].includes(c.datos.ampliacion)&&!['Pendiente','Solicitada'].includes(c.datos.especialista),'La investigación por mala praxis requiere dictamen médico y complementarias recibidas antes del cierre.');if(p.estado==='Cerrada') exigir_(!db.MEDIDAS.some(m=>m.causaId===c.id&&!TERMINALES_.includes(m.estado))&&!db.TAREAS.some(t=>t.causaId===c.id&&t.estado==='Pendiente')&&(!c.oracEstado||c.oracEstado==='Devuelta'),'Hay medidas, tareas u ORAC pendientes.');c.estado=p.estado;tocar_(c,u);registrar_(db,u,c,'','Cambio de estado',p.estado);r=ficha_(db,c.id,config);break;}
   case 'eliminar':r=eliminar_(db,p,u);break;
   default:throw new Error('Operación no permitida.');
  }
  guardarDb_(prev,db);return r;
 });
}
