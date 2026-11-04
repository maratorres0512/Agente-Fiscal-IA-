/** Modelo, validaciones y fechas. V8; sin dependencias externas. */
const TZ_ = 'America/Argentina/Buenos_Aires';
const USUARIAS_ = ['Rocío Albarracín','Laura Sánchez','Cecilia Attolini','Andrea Ramat','Mara Torres'];
const ESTADOS_ = ['En seguimiento','Evaluación 308 / Desestimación','Cerrada'];
const MED_ESTADOS_ = ['Pendiente','Solicitada','Reiterada','Recibida','No corresponde','Dejada sin efecto'];
const TERMINALES_ = ['Recibida','No corresponde','Dejada sin efecto'];
const ESQUEMA_ = {
 CAUSAS: ['id','ipp','fechaHecho','fechaSumario','instructora','resultado','tipo','potencial','dato','principalTipo','principalRecibida','evaluacionPendiente','estado','fechaAlta','usuariaAlta','datos','periciaEstado','periciaFecha','oracEstado','oracFecha','oracReiteracion','oracSegunda','oracDevolucion','oracPrimera','version','ultimaUsuaria'],
 MEDIDAS: ['id','causaId','tipo','descripcion','organismo','estado','fechaSolicitud','plazo','primeraAlerta','fechaReiteracion','segundaAlerta','fechaRecepcion','principal','ultimaUsuaria','version','sugerenciaClave','necesariaEvaluacion','naturaleza'],
 TAREAS: ['id','causaId','tipo','descripcion','estado','fechaCreacion','fechaAudiencia','primeraAlerta','fechaReiteracion','segundaAlerta','fechaCumplida','ultimaUsuaria','version','sugerenciaClave','evaluacionSuspendida','fechaIngresoEvaluacion','horaAudiencia','testigoId'],
 BITACORA: ['id','fechaHora','usuaria','causaId','ipp','referenciaId','accion','detalle'],
 CONFIGURACION: ['clave','dias','descripcion']
};
const PLAZOS_ = {
 RML:10, CRIP:15, INFORME_TRANSITO:15, FECHA_ACCIDENTOLOGICA:10, DICTAMEN_ACCIDENTOLOGICO:20,
 HISTORIA_CLINICA:10, FECHA_MEDICA:15, DICTAMEN_MEDICO:30, ORAC:30, EVALUACION:15, SEGUNDA_ALERTA:5,
 GENERAL:15, PROXIMA:3, CAMARAS_CONSERVACION:30, CAMARAS_PREVENTIVA_1:10, CAMARAS_PREVENTIVA_2:5,
 AMPLIACION_MEDICA:30, ESPECIALISTA:30
};
// [clave, etiqueta, opciones, condición opcional]. Primer opción vacía obligatoria en cliente.
const CAMPOS_ = {
 'Tránsito': [
 ['victima','Víctima',['Insta','No insta']],['fuga','Fuga del conductor',['Sí','No','No surge']],
 ['camaras','Cámaras',['No hay / no se localizaron','Solicitadas / pendientes','Recibidas']],
 ['utilidad','Contenido de cámaras',['Muestran el hecho','No muestran el hecho','No permiten determinar claramente la mecánica'],'camaras'],
 ['preservacion','Preservación de videofilmaciones',['No consta solicitud de preservación','Preservación solicitada, sin confirmación','Preservación confirmada','Videofilmaciones recibidas']],
 ['cientifica','Policía Científica',['Intervino','No intervino','No surge del sumario']],
 ['testigos','Testigos',['Sí','No','Pendientes de individualización']],
 ['rml','RML',['Incorporado','No incorporado','No corresponde']],
 ['historia','Historia clínica hospitalaria',['Incorporada','Solicitar','No corresponde']],
 ['defuncion','Certificado de defunción',['Incorporado','Pendiente','No corresponde'],'homicidio']],
 'Mala praxis': [
 ['victima','Víctima',['Insta','No insta']],
 ['historia','Historia clínica',['Incorporada completa','Incorporada incompleta','No incorporada','Requiere allanamiento','Requiere secuestro','Ya secuestrada']],
 ['allanamiento','Allanamiento',['No corresponde','Solicitar','Autorizado','Cumplido'],'allanamiento'],
 ['autopsia','Autopsia',['Incorporada','Pendiente','No corresponde'],'medicoContextual'],
 ['anatomia','Pericia anatomopatológica',['Incorporada','Pendiente','No corresponde'],'medicoContextual'],
 ['defuncion','Certificado de defunción',['Incorporado','Pendiente','No corresponde'],'homicidio'],
 ['complementaria','Documentación médica complementaria',['Completa','Incompleta','Pendiente de requerir','No corresponde']],
 ['profesionales','Profesionales intervinientes',['Identificados','Parcialmente identificados','No identificados']],
 ['declaracion','Declaración de víctima / denunciante',['Recibida','Pendiente','No corresponde']],
 ['ampliacion','Ampliación de pericia médica',['No corresponde','Pendiente','Solicitada','Recibida']],
 ['especialista','Pericia por especialista',['No corresponde','Pendiente','Solicitada','Recibida']]],
 'Otros': [
 ['victima','Víctima',['Insta','No insta']],['camaras','Cámaras',['No hay','Solicitadas','Recibidas']],
 ['utilidad','Contenido de cámaras',['Muestran el hecho','No muestran el hecho','No permiten determinar claramente la mecánica'],'camaras'],
 ['preservacion','Preservación de videofilmaciones',['No consta solicitud de preservación','Preservación solicitada, sin confirmación','Preservación confirmada','Videofilmaciones recibidas']],
 ['cientifica','Policía Científica',['Intervino','No intervino','No surge']],['testigos','Testigos',['Sí','No','Pendientes de individualización']],
 ['rml','RML',['Incorporado','No incorporado','No corresponde']],
 ['defuncion','Certificado de defunción',['Incorporado','Pendiente','No corresponde'],'homicidio'],
 ['inspeccion','Inspección técnica / condiciones de seguridad',['Realizada','Pendiente','No corresponde']],
 ['tecnica','Documentación técnica / administrativa',['Incorporada','Solicitar','No corresponde']]]
};
function exigir_(ok,msg) { if(!ok) throw new Error(msg); }
function texto_(v,max) { exigir_(typeof v==='string' && v.length<=max,'Texto inválido o demasiado extenso.'); return v.trim(); }
function hoy_() { return Utilities.formatDate(new Date(),TZ_,'yyyy-MM-dd'); }
function ahora_() { return Utilities.formatDate(new Date(),TZ_,"yyyy-MM-dd'T'HH:mm:ssXXX"); }
function fecha_(s,opcional) {
 if(opcional && !s) return '';
 exigir_(typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s),'Seleccione una fecha válida.');
 const d=new Date(s+'T12:00:00Z');
 exigir_(!isNaN(d.getTime()) && d.toISOString().slice(0,10)===s,'Fecha inexistente.'); return s;
}
function sumarDias_(s,n) {
 fecha_(s); exigir_(Number.isInteger(n) && n>=0 && n<=3650,'Plazo inválido (0 a 3650 días).');
 const d=new Date(s+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10);
}
function visible_(f,c) {
 if(!f[3]) return true;
 if(f[3]==='medicoContextual') return c.resultado==='Homicidio culposo'||c.datos.estudiosExcepcionales===true;
 if(f[3]==='homicidio') return c.resultado==='Homicidio culposo';
 if(f[3]==='camaras') return c.datos.camaras==='Recibidas';
 if(f[3]==='allanamiento') return ['Requiere allanamiento','Requiere secuestro','Ya secuestrada'].includes(c.datos.historia);
 return false;
}
function validarCausa_(p) {
 exigir_(p && typeof p==='object','Causa inválida.');
 const c={ipp:texto_(p.ipp,100).toUpperCase(),fechaHecho:fecha_(p.fechaHecho),fechaSumario:fecha_(p.fechaSumario),instructora:p.instructora,resultado:p.resultado,tipo:p.tipo,dato:texto_(p.dato||'',500),datos:{}};
 exigir_(c.ipp,'Ingrese la IPP.'); exigir_(USUARIAS_.includes(c.instructora),'Seleccione instructora.');
 exigir_(['Lesiones culposas','Homicidio culposo'].includes(c.resultado),'Seleccione resultado.');
 exigir_(Object.keys(CAMPOS_).includes(c.tipo),'Seleccione investigación.');
 exigir_(c.fechaHecho<=c.fechaSumario && c.fechaSumario<=hoy_(),'Las fechas deben respetar hecho ≤ recepción ≤ hoy.');
 c.datos=Object.assign({},p.datos && typeof p.datos==='object'?p.datos:{});
 if(c.tipo==='Mala praxis'&&c.datos.estudiosExcepcionales===undefined)c.datos.estudiosExcepcionales=['autopsia','anatomia'].some(k=>c.datos[k]&&c.datos[k]!=='No corresponde');
 const limpios={estudiosExcepcionales:c.datos.estudiosExcepcionales===true}; CAMPOS_[c.tipo].forEach(f=>{if(visible_(f,c)) {let valor=c.datos[f[0]];if(f[0]==='preservacion'&&!valor) valor=c.datos.camaras==='Recibidas'?'Videofilmaciones recibidas':'No consta solicitud de preservación';exigir_(f[2].includes(valor),'Complete: '+f[1]);limpios[f[0]]=valor;}});
 if(c.datos.testigos==='Sí') {
  const ts=c.datos.listaTestigos||[];
  exigir_(Array.isArray(ts)&&ts.length<=30,'Máximo 30 testigos por causa.');
  const ids=new Set();
  limpios.listaTestigos=ts.map((t,i)=>{
   const id=texto_(t.id||('testigo-'+(i+1)),100);exigir_(!ids.has(id),'Identificador de testigo duplicado.');ids.add(id);
   const nombre=texto_(t.nombre||'',150),fecha=fecha_(t.fecha,true),hora=hora_(t.hora||'');
   const estado=t.estado||((fecha)?'Audiencia designada':nombre?'Individualizado':'Individualización pendiente');
   exigir_(['Individualización pendiente','Individualizado','Audiencia designada','Declaración recibida'].includes(estado),'Estado de testigo inválido.');
   if(estado!=='Individualización pendiente') exigir_(nombre,'Individualice al testigo antes de designar o recibir su declaración.');
   if(estado==='Audiencia designada') exigir_(fecha,'Seleccione la fecha de audiencia.');
   return {id,nombre,telefono:texto_(t.telefono||'',60),fecha,hora,estado};
  }).filter(t=>t.nombre||t.telefono||t.fecha||t.estado!=='Individualización pendiente');
 }
 if(c.tipo!=='Mala praxis') {
  exigir_((limpios.preservacion==='Videofilmaciones recibidas')===(limpios.camaras==='Recibidas'),'La recepción de cámaras y el estado Videofilmaciones recibidas deben coincidir.');
 }
 if(c.tipo==='Mala praxis') {
  if(!limpios.autopsia)limpios.autopsia='No corresponde';if(!limpios.anatomia)limpios.anatomia='No corresponde';
  limpios.documentacionReunida=c.datos.documentacionReunida===true;
  if(limpios.documentacionReunida) exigir_(documentacionLista_(limpios),'La documentación aún presenta pendientes. Complete los estados antes de declarar documentación reunida.');
 }
 c.datos=limpios;
 if(c.tipo==='Otros'&&String(p.principalTipo||'').startsWith('Otra: ')){p=Object.assign({},p,{principalOtra:p.principalTipo.slice(6),principalTipo:'Otra'});}
 c.principalTipo=c.tipo==='Tránsito'?'Dictamen accidentológico':c.tipo==='Mala praxis'?'Dictamen médico':texto_(p.principalTipo||'',150);
 if(c.tipo==='Otros') {
  exigir_(['Pericia de seguridad e higiene','Pericia mecánica','Informe técnico','Otra'].includes(p.principalTipo),'Seleccione prueba principal.');
  if(p.principalTipo==='Otra') { const detalle=texto_(p.principalOtra||'',120);exigir_(detalle,'Describa la prueba principal.');c.principalTipo='Otra: '+detalle; }
 }
 return c;
}
function documentacionLista_(d) {
 return ['Incorporada completa','Ya secuestrada'].includes(d.historia) && ['Completa','No corresponde'].includes(d.complementaria) && ['Incorporada','No corresponde'].includes(d.autopsia) && ['Incorporada','No corresponde'].includes(d.anatomia) && (!d.defuncion||['Incorporado','No corresponde'].includes(d.defuncion)) && d.profesionales==='Identificados' && ['Recibida','No corresponde'].includes(d.declaracion) && (!d.allanamiento||['No corresponde','Cumplido'].includes(d.allanamiento));
}

function hora_(s) {exigir_(!s||/^([01]\d|2[0-3]):[0-5]\d$/.test(s),'Hora inválida.');return s;}
function diasEntre_(desde,hasta) {return Math.floor((new Date(fecha_(hasta)+'T12:00:00Z')-new Date(fecha_(desde)+'T12:00:00Z'))/86400000);}
/** Cada petición se vincula a una cuenta verificada; nunca hay modo anónimo. */
function identidad_(seleccion) {
 const email=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
 exigir_(email,'Configuración de identidad: Google no informó la cuenta. Despliegue ejecutando como la usuaria que accede y autorice userinfo.email.');
 const raw=PropertiesService.getScriptProperties().getProperty('USUARIAS_EMAILS');
 exigir_(raw,'Configuración de identidad: falta USUARIAS_EMAILS en las propiedades del proyecto.');
 let mapa;try{mapa=JSON.parse(raw);}catch(e){throw new Error('Configuración de identidad: USUARIAS_EMAILS debe ser un objeto JSON válido.');}
 exigir_(mapa&&typeof mapa==='object'&&!Array.isArray(mapa),'Configuración de identidad inválida.');
 const cuentas=new Set();
 Object.keys(mapa).forEach(nombre=>{
  exigir_(USUARIAS_.includes(nombre)&&typeof mapa[nombre]==='string'&&/^[^@\s]+@[^@\s]+$/.test(mapa[nombre]),'Configuración de identidad: correspondencia inválida.');
  const correo=mapa[nombre].trim().toLowerCase();exigir_(!cuentas.has(correo),'Configuración de identidad: una cuenta no puede representar a varias usuarias.');cuentas.add(correo);
 });
 exigir_(USUARIAS_.includes(seleccion)&&typeof mapa[seleccion]==='string'&&mapa[seleccion].trim().toLowerCase()===email,'La cuenta Google no está autorizada para la usuaria seleccionada.');
 return seleccion;
}

const TIPOS_MEDIDA_ = ['PERSONALIZADA','RML','CRIP','HISTORIA_CLINICA','INFORME_TRANSITO','PRESERVAR_CAMARAS','CAMARAS','INDIVIDUALIZAR','INSPECCION','DOCUMENTACION_TECNICA','FECHA_MEDICA','FECHA_ACCIDENTOLOGICA','DICTAMEN_MEDICO','DICTAMEN_ACCIDENTOLOGICO','AMPLIACION_MEDICA','ESPECIALISTA','PRINCIPAL_OTROS'];
