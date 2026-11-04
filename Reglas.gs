/** Motores puros. Sugerencias sin escritura. */
function potencial_(c) {
 if(c.tipo==='Mala praxis') return '';
 const d=c.datos;
 if(d.utilidad==='Muestran el hecho' || d.cientifica==='Intervino' || d.testigos==='Sí' || (c.tipo==='Otros' && d.inspeccion==='Realizada')) return 'Identificado';
 if(['Solicitadas / pendientes','Solicitadas'].includes(d.camaras) || ['No surge','No surge del sumario'].includes(d.cientifica) || d.testigos==='Pendientes de individualización' || (c.tipo==='Otros' && (d.inspeccion==='Pendiente'||d.tecnica==='Solicitar'))) return 'Requiere información';
 return 'Limitado';
}
function sugerencias_(c,config) {
 const d=c.datos, s=[];
 const med=(tipo,descripcion,organismo,principal)=>s.push({clave:tipo,tipo,descripcion,organismo,plazo:config[tipo]===undefined?config.GENERAL:config[tipo],principal:!!principal,clase:'medida'});
 const tarea=(tipo,descripcion,fecha)=>s.push({clave:tipo+'_'+s.length,tipo,descripcion,fechaAudiencia:fecha||'',clase:'tarea'});
 if(d.rml==='No incorporado') med('RML','Solicitar reconocimiento médico legal.','Cuerpo Médico');
 if(d.historia==='Solicitar' || (c.tipo==='Mala praxis' && ['Incorporada incompleta','No incorporada'].includes(d.historia))) med('HISTORIA_CLINICA','Requerir historia clínica completa y constancias faltantes.','Establecimiento de salud');
 if(d.defuncion==='Pendiente') med('DEFUNCION','Solicitar certificado de defunción.','Registro / establecimiento de salud');
 if(c.tipo!=='Mala praxis') {
  if(['Solicitadas / pendientes','Solicitadas'].includes(d.camaras)) med('CAMARAS','Requerir remisión y preservación de videofilmaciones solicitadas.','Dependencia policial / titular de cámaras');
  if(d.cientifica==='Intervino') med('CRIP','Solicitar CRIP y actuaciones de Policía Científica.','Policía Científica');
  if(['No surge','No surge del sumario'].includes(d.cientifica)) med('VERIFICAR_CIENTIFICA','Informar si intervino Policía Científica y remitir actuaciones.','Dependencia policial');
  if(d.camaras==='Recibidas') tarea('Acta de apertura','Realizar acta de apertura de videofilmaciones.');
  if(d.testigos==='Sí') (d.listaTestigos||[]).forEach(t=>tarea('Audiencia testimonial','Designar audiencia testimonial de '+t.nombre+(t.telefono?' · Tel. '+t.telefono:''),t.fecha));
  if(d.testigos==='Pendientes de individualización') med('INDIVIDUALIZAR','Individualizar testigos presenciales.','Dependencia policial');
  if(c.tipo==='Tránsito') {
   if(potencial_(c)==='Identificado') med('INFORME_TRANSITO','Solicitar Informe de Tránsito.','Área de Tránsito');
   if(d.cientifica==='Intervino'||d.utilidad==='Muestran el hecho') med('FECHA_ACCIDENTOLOGICA','Solicitar fecha de pericia accidentológica.','Policía Científica');
  } else {
   if(d.inspeccion==='Pendiente') med('INSPECCION','Solicitar inspección técnica y condiciones de seguridad.','Organismo técnico competente');
   if(d.tecnica==='Solicitar') med('DOCUMENTACION_TECNICA','Requerir documentación técnica / administrativa pertinente.','Organismo competente');
   med('PRINCIPAL_OTROS','Solicitar '+c.principalTipo+'.','Organismo técnico competente',true);
  }
 } else {
  if(d.historia==='Requiere allanamiento' && !['Autorizado','Cumplido'].includes(d.allanamiento)) med('ALLANAMIENTO','Solicitar autorización de allanamiento para obtener documentación médica.','Juzgado de Garantías');
  if(d.historia==='Requiere secuestro'||(d.historia==='Requiere allanamiento'&&d.allanamiento==='Autorizado')) med('SECUESTRO','Gestionar secuestro y obtención de documentación médica.','Dependencia policial');
  if(d.autopsia==='Pendiente') med('AUTOPSIA','Requerir protocolo de autopsia.','Cuerpo Médico');
  if(d.anatomia==='Pendiente') med('ANATOMIA','Requerir pericia anatomopatológica.','Servicio de Anatomía Patológica');
  if(['Incompleta','Pendiente de requerir'].includes(d.complementaria)) med('DOCUMENTACION_MEDICA','Requerir documentación médica complementaria.','Establecimiento de salud');
  if(d.profesionales!=='Identificados') med('PROFESIONALES','Individualizar a todos los profesionales intervinientes.','Establecimiento de salud');
  if(d.declaracion==='Pendiente') tarea('Audiencia testimonial','Recibir declaración de víctima / denunciante.');
  if(d.documentacionReunida && documentacionLista_(d)) med('FECHA_MEDICA','Solicitar fecha de pericia médica.','Asesoría Pericial');
  if(['Pendiente','Solicitada'].includes(d.ampliacion)) med('AMPLIACION_MEDICA','Requerir ampliación de pericia médica.','Asesoría Pericial',true);
  if(['Pendiente','Solicitada'].includes(d.especialista)) med('ESPECIALISTA','Requerir pericia por especialista.','Asesoría Pericial',true);
 }
 return s;
}
function alerta_(x,tipo,hoy,config) {
 if(tipo==='medida' && TERMINALES_.includes(x.estado) || tipo==='tarea' && x.estado==='Cumplida' || tipo==='orac' && (!x.oracEstado||x.oracEstado==='Devuelta')) return {nivel:'sin',texto:'Sin alerta'};
 const primera=tipo==='orac'?x.oracPrimera:x.primeraAlerta;
 const segunda=tipo==='orac'?x.oracSegunda:x.segundaAlerta;
 const reiteracion=tipo==='orac'?x.oracReiteracion:x.fechaReiteracion;
 if(!primera) return {nivel:'sin',texto:'Sin plazo'};
 if(segunda && hoy>=segunda) return {nivel:'rojo',texto:'Segunda alerta · vencida',fecha:segunda};
 if(reiteracion) return {nivel:'verde',texto:'Reiterada · control '+segunda,fecha:segunda};
 if(hoy>primera) return {nivel:'rojo',texto:'Vencida · requiere reiteración',fecha:primera};
 if(hoy===primera) return {nivel:'naranja',texto:'Primera alerta · requiere reiteración',fecha:primera};
 if(sumarDias_(hoy,config.PROXIMA)>=primera) return {nivel:'amarillo',texto:'Próxima a vencer',fecha:primera};
 return {nivel:'verde',texto:'Dentro de plazo',fecha:primera};
}
function filtrarCausas_(db,f,hoy,config) {
 f=f||{};
 return db.CAUSAS.filter(c=>{
  const ms=db.MEDIDAS.filter(m=>m.causaId===c.id), activas=ms.filter(m=>!TERMINALES_.includes(m.estado));
  return (!f.ipp||c.ipp.toUpperCase().includes(String(f.ipp).toUpperCase())) && (!f.instructora||c.instructora===f.instructora) && (!f.tipo||c.tipo===f.tipo) && (!f.resultado||c.resultado===f.resultado) && (!f.estado||c.estado===f.estado) && (!f.evaluacion||c.evaluacionPendiente) && (!f.orac||(c.oracEstado && c.oracEstado!=='Devuelta')) && (!f.limitado||c.potencial==='Limitado') && (!f.vencidas||activas.some(m=>alerta_(m,'medida',hoy,config).nivel==='rojo')) && (!f.reiteradas||activas.some(m=>m.estado==='Reiterada')) && (!f.proximas||activas.some(m=>alerta_(m,'medida',hoy,config).nivel==='amarillo'));
 });
}
function tablero_(db,f,hoy,config) {
 const causas=filtrarCausas_(db,f,hoy,config), ids=new Set(causas.map(c=>c.id));
 const medidas=db.MEDIDAS.filter(m=>ids.has(m.causaId)).map(m=>Object.assign({},m,{alerta:alerta_(m,'medida',hoy,config)}));
 const tareas=db.TAREAS.filter(t=>ids.has(t.causaId)).map(t=>Object.assign({},t,{alerta:alerta_(t,'tarea',hoy,config)}));
 const kpi={vencidas:medidas.filter(m=>m.alerta.nivel==='rojo').length,proximas:medidas.filter(m=>m.alerta.nivel==='amarillo').length,reiteradas:medidas.filter(m=>m.estado==='Reiterada').length,evaluacion:causas.filter(c=>c.evaluacionPendiente).length,limitado:causas.filter(c=>c.potencial==='Limitado').length,orac:causas.filter(c=>c.oracEstado&&c.oracEstado!=='Devuelta').length};
 return {hoy,causas:causas.map(c=>Object.assign({},c,{oracAlerta:alerta_(c,'orac',hoy,config)})),medidas,tareas,kpi};
}
