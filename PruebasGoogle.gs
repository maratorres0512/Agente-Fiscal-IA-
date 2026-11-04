/** Verificación pura en el runtime real de Google. No modifica ninguna hoja. */
function pruebasReglas_() {
 const checks=[],ok=(v,s)=>{exigir_(v,'FALLÓ: '+s);checks.push(s);},c=Object.assign({},PLAZOS_);
 ok(sumarDias_('2026-12-30',5)==='2027-01-04','Cruce de año en días corridos');
 ok(sumarDias_('2028-02-28',2)==='2028-03-01','Año bisiesto');
 ok(sumarDias_('2026-11-06',5)==='2026-11-11','Cuenta sábado y domingo');
 const m={estado:'Reiterada',primeraAlerta:'2026-11-01',fechaReiteracion:'2026-11-03',segundaAlerta:sumarDias_('2026-11-03',c.SEGUNDA_ALERTA)};
 ok(m.segundaAlerta==='2026-11-08','Segunda alerta cinco días desde reiteración');
 ok(alerta_(m,'medida','2026-11-08',c).nivel==='rojo','Segunda alerta activa');
 m.estado='Recibida';ok(alerta_(m,'medida','2027-01-01',c).nivel==='sin','Recepción elimina alerta');
 ok(potencial_({tipo:'Tránsito',datos:{cientifica:'Intervino'}})==='Identificado','Tránsito con fuente útil');
 ok(potencial_({tipo:'Tránsito',datos:{camaras:'Solicitadas / pendientes'}})==='Requiere información','Tránsito pendiente');
 ok(potencial_({tipo:'Otros',datos:{camaras:'No hay',cientifica:'No intervino',testigos:'No'}})==='Limitado','Otros limitado');
 ok(potencial_({tipo:'Mala praxis',datos:{}})==='','Mala praxis sin potencial');
 console.log(checks.join('\n'));return checks.length+' verificaciones aprobadas.';
}
