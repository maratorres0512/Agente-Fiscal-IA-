/** Motores puros. Sugerencias sin escritura. */
function potencial_(c) {
 if(c.tipo==='Mala praxis') return '';
 const d=c.datos;
 if(d.utilidad==='Muestran el hecho' || d.cientifica==='Intervino' || d.testigos==='Sí'&&(d.listaTestigos||[]).some(t=>t.nombre) || (c.tipo==='Otros' && (d.inspeccion==='Realizada'||d.tecnica==='Incorporada'))) return 'Identificado';
 if(['Solicitadas / pendientes','Solicitadas'].includes(d.camaras) || ['No surge','No surge del sumario'].includes(d.cientifica) || (d.testigos==='Pendientes de individualización'||d.testigos==='Sí'&&!(d.listaTestigos||[]).some(t=>t.nombre)) || (c.tipo==='Otros' && (d.inspeccion==='Pendiente'||d.tecnica==='Solicitar'))) return 'Requiere información';
 return 'Limitado';
}
function sugerencias_(c,config) {
 const d=c.datos, s=[];
 const med=(tipo,descripcion,organismo,principal)=>s.push({clave:tipo,tipo,descripcion,organismo,plazo:config[tipo]===undefined?config.GENERAL:config[tipo],principal:!!principal,necesariaEvaluacion:!!principal||['AMPLIACION_MEDICA','ESPECIALISTA'].includes(tipo),clase:'medida'});
 const tarea=(tipo,descripcion,fecha,clave,extra)=>s.push(Object.assign({clave:clave||tipo,tipo,descripcion,fechaAudiencia:fecha||'',clase:'tarea'},extra||{}));
 if(d.rml==='No incorporado') med('RML','Solicitar reconocimiento médico legal.','Cuerpo Médico');
 if(d.historia==='Solicitar' || (c.tipo==='Mala praxis' && ['Incorporada incompleta','No incorporada'].includes(d.historia))) med('HISTORIA_CLINICA','Requerir historia clínica completa y constancias faltantes.','Establecimiento de salud');
 if(d.defuncion==='Pendiente') med('DEFUNCION','Solicitar certificado de defunción.','Registro / establecimiento de salud');
 if(c.tipo!=='Mala praxis') {
  if(!['Preservación confirmada','Videofilmaciones recibidas'].includes(d.preservacion)&&d.camaras!=='Recibidas')med('PRESERVAR_CAMARAS','Requerir urgente preservación de videofilmaciones y confirmación de resguardo.','Centro de Monitoreo / titular de cámaras');
  if(['Solicitadas / pendientes','Solicitadas'].includes(d.camaras)||d.preservacion==='Preservación confirmada') med('CAMARAS','Requerir remisión de videofilmaciones.','Dependencia policial / titular de cámaras');
  if(d.cientifica==='Intervino') med('CRIP','Solicitar CRIP y actuaciones de Policía Científica.','Policía Científica');
  if(['No surge','No surge del sumario'].includes(d.cientifica)) med('VERIFICAR_CIENTIFICA','Informar si intervino Policía Científica y remitir actuaciones.','Dependencia policial');
  if(d.camaras==='Recibidas') tarea('Acta de apertura','Realizar acta de apertura de videofilmaciones.','','ACTA_VIDEOS');
  if(d.testigos==='Sí') (d.listaTestigos||[]).filter(t=>t.nombre&&t.estado!=='Declaración recibida').forEach((t,i)=>tarea('Audiencia testimonial','Designar audiencia testimonial de '+t.nombre+(t.telefono?' · Tel. '+t.telefono:''),t.fecha,'TESTIMONIAL_'+(t.id||'testigo-'+(i+1)),{testigoId:t.id||'testigo-'+(i+1),testigoNombre:t.nombre,horaAudiencia:t.hora||''}));
  if(d.testigos==='Pendientes de individualización'||d.testigos==='Sí'&&(!(d.listaTestigos||[]).length||(d.listaTestigos||[]).some(t=>!t.nombre))) med('INDIVIDUALIZAR','Individualizar testigos presenciales.','Dependencia policial');
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
  if(d.declaracion==='Pendiente') tarea('Audiencia testimonial','Recibir declaración de víctima / denunciante.','','MP_DECLARACION');
  if(d.documentacionReunida && documentacionLista_(d)) med('FECHA_MEDICA','Solicitar fecha de pericia médica.','Asesoría Pericial');
  if(['Pendiente','Solicitada'].includes(d.ampliacion)) med('AMPLIACION_MEDICA','Requerir ampliación de pericia médica.','Asesoría Pericial',false);
  if(['Pendiente','Solicitada'].includes(d.especialista)) med('ESPECIALISTA','Requerir pericia por especialista.','Asesoría Pericial',false);
 }
 return s;
}
function alerta_(x,tipo,hoy,config) {
 if(tipo==='tarea'&&x.tipo==='Evaluación 308 / Desestimación'&&x.evaluacionSuspendida)return {nivel:'sin',texto:'Evaluación suspendida · prueba necesaria pendiente'};
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
/** Índices por causa: consultas O(causas + medidas + tareas), sin filtros anidados. */
function indiceCausas_(rows) {const m=new Map();rows.forEach(x=>{if(!m.has(x.causaId))m.set(x.causaId,[]);m.get(x.causaId).push(x);});return m;}
function filtrarCausas_(db,f,hoy,config,indice) {
 f=f||{};const im=indice||indiceCausas_(db.MEDIDAS);
 return db.CAUSAS.filter(c=>{
  if(f.ipp&&!c.ipp.toUpperCase().includes(String(f.ipp).toUpperCase())||f.instructora&&c.instructora!==f.instructora||f.tipo&&c.tipo!==f.tipo||f.resultado&&c.resultado!==f.resultado||f.estado&&c.estado!==f.estado||f.evaluacion&&!c.evaluacionPendiente||f.orac&&(!c.oracEstado||c.oracEstado==='Devuelta')||f.limitado&&c.potencial!=='Limitado')return false;
  if(f.camaras&&alertaCamaras_(c,hoy,config).nivel!=='rojo')return false;
  const activas=(im.get(c.id)||[]).filter(m=>!TERMINALES_.includes(m.estado));
  return (!f.vencidas||activas.some(m=>alerta_(m,'medida',hoy,config).nivel==='rojo'))&&(!f.reiteradas||activas.some(m=>m.estado==='Reiterada'))&&(!f.proximas||activas.some(m=>alerta_(m,'medida',hoy,config).nivel==='amarillo'));
 });
}
function tablero_(db,f,hoy,config) {
 const im=indiceCausas_(db.MEDIDAS),causas=filtrarCausas_(db,f,hoy,config,im),ids=new Set(causas.map(c=>c.id));
 const medidas=db.MEDIDAS.filter(m=>ids.has(m.causaId)).map(m=>Object.assign({},m,{alerta:alerta_(m,'medida',hoy,config)}));
 const tareas=db.TAREAS.filter(t=>ids.has(t.causaId)).map(t=>Object.assign({},t,{alerta:alerta_(t,'tarea',hoy,config)}));
 const decoradas=causas.map(c=>Object.assign({},c,{datos:undefined,oracAlerta:alerta_(c,'orac',hoy,config),camarasAlerta:alertaCamaras_(c,hoy,config)}));
 const kpi={vencidas:0,proximas:0,reiteradas:0,evaluacion:causas.filter(c=>c.evaluacionPendiente).length,limitado:causas.filter(c=>c.potencial==='Limitado').length,orac:causas.filter(c=>c.oracEstado&&c.oracEstado!=='Devuelta').length,camaras:decoradas.filter(c=>c.camarasAlerta.nivel==='rojo').length};
 medidas.forEach(m=>{if(m.alerta.nivel==='rojo')kpi.vencidas++;if(m.alerta.nivel==='amarillo')kpi.proximas++;if(m.estado==='Reiterada')kpi.reiteradas++;});
 const porId=new Map(causas.map(c=>[c.id,c]));
 const evaluaciones=tareas.filter(t=>t.tipo==='Evaluación 308 / Desestimación'&&t.estado==='Pendiente'&&!t.evaluacionSuspendida).map(t=>Object.assign({},t,{ipp:porId.get(t.causaId).ipp,instructora:porId.get(t.causaId).instructora,diasTranscurridos:diasEntre_(t.fechaIngresoEvaluacion||t.fechaCreacion,hoy)}));
 const activas=medidas.filter(m=>!TERMINALES_.includes(m.estado));
 const rango={rojo:0,naranja:1,amarillo:2,verde:3,sin:4};activas.sort((a,b)=>rango[a.alerta.nivel]-rango[b.alerta.nivel]||String(a.alerta.fecha||'').localeCompare(b.alerta.fecha||''));
 evaluaciones.sort((a,b)=>rango[a.alerta.nivel]-rango[b.alerta.nivel]||a.primeraAlerta.localeCompare(b.primeraAlerta));
 const visibles=activas.filter(m=>(!f||!f.proximas||m.alerta.nivel==='amarillo')&&(!f||!f.vencidas||m.alerta.nivel==='rojo')&&(!f||!f.reiteradas||m.estado==='Reiterada'));
 const cp=pagina_(decoradas,f&&f.paginaCausas),mp=pagina_(visibles,f&&f.paginaMedidas),ep=pagina_(evaluaciones,f&&f.paginaEvaluaciones);
 const resumir=c=>({id:c.id,ipp:c.ipp,instructora:c.instructora,tipo:c.tipo,resultado:c.resultado,estado:c.estado,potencial:c.potencial,fechaSumario:c.fechaSumario,oracEstado:c.oracEstado,oracAlerta:c.oracAlerta,camarasAlerta:c.camarasAlerta,evaluacionPendiente:c.evaluacionPendiente});
 return {hoy,causas:cp.items.map(resumir),medidas:mp.items.map(m=>Object.assign({},m,{ipp:porId.get(m.causaId).ipp,instructora:porId.get(m.causaId).instructora})),tareas:[],evaluaciones:ep.items,kpi,paginas:{causas:cp.info,medidas:mp.info,evaluaciones:ep.info},totalCausas:decoradas.length,camarasCriticas:decoradas.filter(c=>['rojo','naranja'].includes(c.camarasAlerta.nivel)).slice(0,100).map(resumir)};
}
function alertaCamaras_(c,hoy,config) {
 if(!['Tránsito','Otros'].includes(c.tipo))return {nivel:'sin',texto:'No corresponde',riesgo:false};
 const d=c.datos,limite=sumarDias_(c.fechaHecho,config.CAMARAS_CONSERVACION),restan=diasEntre_(hoy,limite);
 if(d.camaras==='Recibidas'||d.preservacion==='Videofilmaciones recibidas')return {nivel:'verde',texto:'Imágenes recibidas',riesgo:false,fecha:limite};
 if(d.preservacion==='Preservación confirmada')return {nivel:'azul',texto:'Preservación confirmada · recepción pendiente',riesgo:false,fecha:limite};
 const estado=d.preservacion==='Preservación solicitada, sin confirmación'?'Preservación solicitada sin confirmación':'Preservación pendiente';
 const nivel=restan<=config.CAMARAS_PREVENTIVA_2?'rojo':restan<=config.CAMARAS_PREVENTIVA_1?'naranja':'verde';
 return {nivel,estado,texto:estado+' · '+(restan<0?'Plazo de referencia superado; verificar disponibilidad, sin presumir destrucción':restan===0?'Hoy se cumple el plazo de conservación de referencia':restan+' días hasta el plazo de referencia'),riesgo:true,fecha:limite,diasRestantes:restan};
}
/** Una sugerencia se propone una sola vez por identidad semántica, aunque ya esté recibida. */
function sugerenciasNuevas_(db,c,config) {
 const medidas=db.MEDIDAS.filter(m=>m.causaId===c.id),tareas=db.TAREAS.filter(t=>t.causaId===c.id);
 return sugerencias_(c,config).filter(s=>{
  if(['FECHA_MEDICA','FECHA_ACCIDENTOLOGICA'].includes(s.tipo)&&c.periciaEstado!=='Sin iniciar')return false;
  if(s.clase==='medida'&&['AMPLIACION_MEDICA','ESPECIALISTA'].includes(s.tipo)){const anteriores=medidas.filter(m=>m.tipo===s.tipo);s.clave=s.tipo+'_N'+(anteriores.length+1);return !anteriores.some(m=>!TERMINALES_.includes(m.estado));}
  if(s.clase==='medida')return !medidas.some(m=>m.sugerenciaClave===s.clave||m.tipo===s.tipo);
  return !tareas.some(t=>t.sugerenciaClave===s.clave||s.testigoId&&t.testigoId===s.testigoId||!t.sugerenciaClave&&t.tipo===s.tipo&&(t.descripcion===s.descripcion||s.tipo==='Acta de apertura'||s.testigoNombre&&t.descripcion.startsWith('Designar audiencia testimonial de '+s.testigoNombre)));
 });
}
/** El dictamen original es insustituible en Tránsito y Mala praxis. */
function madurez_(c,medidas) {
 const principal=c.tipo==='Mala praxis'?'DICTAMEN_MEDICO':c.tipo==='Tránsito'?'DICTAMEN_ACCIDENTOLOGICO':'';
 const originales=medidas.filter(m=>principal?m.tipo===principal:m.principal===true);
 const recibida=originales.some(m=>m.estado==='Recibida');
 const necesarias=medidas.filter(m=>m.principal===true||m.necesariaEvaluacion===true||c.tipo==='Mala praxis'&&['AMPLIACION_MEDICA','ESPECIALISTA'].includes(m.tipo));
 const bloqueantes=necesarias.filter(m=>!TERMINALES_.includes(m.estado));
 const sinOrdenar=c.tipo==='Mala praxis'&&['ampliacion','especialista'].some(k=>['Pendiente','Solicitada'].includes(c.datos[k])&&!medidas.some(m=>m.tipo===(k==='ampliacion'?'AMPLIACION_MEDICA':'ESPECIALISTA')&&!TERMINALES_.includes(m.estado)));
 const fechas=necesarias.filter(m=>m.estado==='Recibida').map(m=>m.fechaRecepcion).filter(Boolean).sort();
 return {recibida,madura:recibida&&(!principal||c.periciaEstado==='Dictamen recibido')&&!bloqueantes.length&&!sinOrdenar,bloqueantes,fecha:fechas[fechas.length-1]||hoy_()};
}

function pagina_(items,n) {n=Number(n||0);exigir_(Number.isInteger(n)&&n>=0,'Página inválida.');const total=items.length,ultima=Math.max(0,Math.ceil(total/100)-1);n=Math.min(n,ultima);return {items:items.slice(n*100,(n+1)*100),info:{pagina:n,total,paginas:ultima+1}};}
