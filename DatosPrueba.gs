/** Solo datos inventados. Ejecutar desde editor en una base VACÍA de demostración. */
function datosFicticios_() {
 return conBloqueo_(()=>{
  const db=leerDb_(),prev=JSON.parse(JSON.stringify(db)),config=config_(db),u=USUARIAS_[0],h=hoy_(),antes=n=>sumarDias_(new Date(new Date(h+'T12:00:00Z').getTime()-n*86400000).toISOString().slice(0,10),0);
  exigir_(!db.CAUSAS.length&&!db.MEDIDAS.length&&!db.TAREAS.length,'Los datos ficticios solo pueden cargarse en una base vacía.');
  const base={fechaHecho:antes(50),fechaSumario:antes(45),instructora:u,resultado:'Lesiones culposas',dato:'DATOS FICTICIOS — caso de demostración, sin personas reales.'};
  const transito={victima:'Insta',fuga:'No',camaras:'Recibidas',utilidad:'Muestran el hecho',cientifica:'Intervino',testigos:'Sí',listaTestigos:[{nombre:'Testigo Ficticio Alfa',telefono:'',fecha:''}],rml:'No incorporado',historia:'Solicitar'};
  const mp={victima:'Insta',historia:'No incorporada',autopsia:'No corresponde',anatomia:'No corresponde',complementaria:'Pendiente de requerir',profesionales:'No identificados',declaracion:'Pendiente',ampliacion:'No corresponde',especialista:'No corresponde',documentacionReunida:false};
  const otros={victima:'Insta',camaras:'Solicitadas',cientifica:'No surge',testigos:'Pendientes de individualización',rml:'No incorporado',inspeccion:'Pendiente',tecnica:'Solicitar'};
  const casos=[
   Object.assign({},base,{ipp:'FICTICIA-TRANSITO-001',tipo:'Tránsito',datos:transito}),
   Object.assign({},base,{ipp:'FICTICIA-MEDICA-002',instructora:USUARIAS_[1],tipo:'Mala praxis',datos:mp}),
   Object.assign({},base,{ipp:'FICTICIA-OTROS-003',instructora:USUARIAS_[2],tipo:'Otros',principalTipo:'Informe técnico',datos:otros}),
   Object.assign({},base,{ipp:'FICTICIA-LIMITADA-004',instructora:USUARIAS_[3],tipo:'Tránsito',datos:Object.assign({},transito,{camaras:'No hay / no se localizaron',cientifica:'No intervino',testigos:'No',rml:'Incorporado',historia:'No corresponde'})}),
   Object.assign({},base,{ipp:'FICTICIA-ORAC-005',instructora:USUARIAS_[4],tipo:'Tránsito',datos:Object.assign({},transito,{testigos:'No',rml:'Incorporado',historia:'No corresponde'})})
  ];
  const creadas=casos.map(c=>{const limpia=validarCausa_(c);return confirmar_(db,{causa:c,fechaSolicitud:antes(40),claves:sugerencias_(limpia,config).map(s=>s.clave),manuales:[]},u,config).causa;});
  let c=obtener_(db.CAUSAS,creadas[0].id);
  pericia_(db,{id:c.id,version:c.version,paso:'fecha',fecha:antes(25)},u,config);
  pericia_(db,{id:c.id,version:c.version,paso:'designar'},u,config);
  pericia_(db,{id:c.id,version:c.version,paso:'realizada',fecha:antes(24)},u,config);
  const dictamen=db.MEDIDAS.find(m=>m.causaId===c.id&&m.tipo==='DICTAMEN_ACCIDENTOLOGICO');
  estadoMedida_(db,{id:dictamen.id,version:dictamen.version,estado:'Recibida',fecha:antes(20)},u,config);
  const rml=db.MEDIDAS.find(m=>m.causaId===c.id&&m.tipo==='RML');
  estadoMedida_(db,{id:rml.id,version:rml.version,estado:'Reiterada',fecha:antes(6)},u,config);
  c=obtener_(db.CAUSAS,creadas[4].id);
  orac_(db,{id:c.id,version:c.version,operacion:'remitir',fecha:antes(35),consentimiento:true},u,config);
  orac_(db,{id:c.id,version:c.version,operacion:'reiterar',fecha:antes(6)},u,config);
  // Una medida próxima al vencimiento además de las ya vencidas.
  c=obtener_(db.CAUSAS,creadas[2].id);
  nuevaMedida_(db,c,{descripcion:'Medida ficticia próxima a vencer.',organismo:'Organismo de demostración',fechaSolicitud:h,plazo:2},u,config);
  guardarDb_(prev,db);return 'Se cargaron cinco causas FICTICIAS. No contienen datos reales.';
 });
}
