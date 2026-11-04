# AGENTE DE TRIAJE Y GESTIÓN DE PRUEBA — UFIJ N.º 22 QUILMES

Aplicación interna existente, actualizada para el seguimiento durante toda la investigación. Conserva Google Apps Script, una Google Sheet compartida, HTML/CSS/JavaScript nativos, las tres plantillas y la interfaz original. No utiliza frameworks, CDNs, bibliotecas externas, servicios de IA ni almacenamiento local de causas.

Las sugerencias asisten al equipo. La selección de diligencias, el despacho y las decisiones procesales corresponden exclusivamente a las integrantes de la Fiscalía.

## Actualizar una instalación existente

**Se necesita implementar una nueva versión de la Web App. No crear otra base ni volver a cargar datos ficticios.**

1. Coordinar una ventana breve sin operaciones del equipo. En la Sheet elegir **Archivo → Hacer una copia**, con fecha y permisos institucionales restringidos. Conservar también la versión anterior del código.
2. Reemplazar los archivos del mismo proyecto Apps Script por los de esta rama/versión. Conservar `SPREADSHEET_ID`, la Sheet vinculada y sus registros.
3. Configurar `USUARIAS_EMAILS` en **Configuración del proyecto → Propiedades de la secuencia de comandos**, según el apartado de identidad. El mecanismo anterior `ALLOWED_EMAILS` ya no habilita acceso por sí solo.
4. Desde el editor ejecutar **`migrar_`**. Agrega las columnas faltantes al final y las claves nuevas de configuración. No borra hojas, causas, medidas, tareas ni bitácora. Es repetible. Detalles en [MIGRACION.md](MIGRACION.md).
5. Revisar el resultado y las evaluaciones que hayan quedado suspendidas por prueba necesaria pendiente. La migración corrige indicadores de madurez y deja constancia de los cambios, preservando informes e historial.
6. En **Implementar → Administrar implementaciones → Editar → Nueva versión**, implementar como **usuario que accede a la aplicación web**. Mantener la misma implementación y URL `/exec`.
7. Pedir al equipo que recargue la página y comprobar identidad, acceso, una ficha y filtros. Seguir [VALIDACION.md](VALIDACION.md) en una copia de demostración antes de habilitar uso productivo.

Si Google no entrega la identidad o la configuración falta, la API rechaza el acceso con un mensaje de configuración. No hay un modo de producción que confíe únicamente en seleccionar un nombre.

## Archivos e instalación nueva

| Archivo | Tipo en el editor de Apps Script | Responsabilidad |
|---|---|---|
| `Code.gs` | Secuencia de comandos | Web App y API autorizada |
| `Modelo.gs` | Secuencia de comandos | Campos, validaciones, identidad y fechas |
| `Reglas.gs` | Secuencia de comandos | Sugerencias, deduplicación, madurez, alertas y filtros |
| `Servicios.gs` | Secuencia de comandos | Altas, edición, confirmaciones y transiciones |
| `Repositorio.gs` | Secuencia de comandos | Lecturas, escrituras por fila, bloqueo, migración y bitácora |
| `DatosPrueba.gs` | Secuencia de comandos | Cinco causas ficticias para una base vacía |
| `PruebasGoogle.gs` | Secuencia de comandos | Comprobaciones puras para ejecutar en Google |
| `Index.html` | HTML | Pantalla de ingreso y estructura original |
| `Estilos.html` | HTML | Diseño y estilos responsive |
| `Cliente.html` | HTML | Formularios, tablero y ficha |
| `Despacho.html` | HTML | Párrafos jurídicos modulares y generación local |
| `appsscript.json` | Manifiesto | V8, permisos y zona horaria |

Para una instalación nueva:

1. Crear una Google Sheet vacía con la cuenta institucional administradora.
2. Desde ella abrir **Extensiones → Apps Script**. El proyecto debe quedar vinculado a esa Sheet.
3. Crear los archivos `.gs` con **+ → Secuencia de comandos** y los `.html` con **+ → HTML**. Copiar su contenido; el editor agrega la extensión, no repetirla en el nombre.
4. En Configuración del proyecto activar **Mostrar appsscript.json en el editor** y copiar el manifiesto del repositorio.
5. Guardar y ejecutar **`inicializar_`**, que utiliza la misma migración segura. Autorizar Sheets. Se crean `CAUSAS`, `MEDIDAS`, `TAREAS`, `BITACORA` y `CONFIGURACION`, y se guarda automáticamente `SPREADSHEET_ID`.
6. Configurar las cuentas autorizadas como se detalla abajo y compartir la Sheet con esas cuentas, con permiso de Editor.
7. Para demostración, en una base vacía separada ejecutar **`datosFicticios_`**. Se rechaza si hay registros. No ejecutarlo en producción.
8. Elegir **Implementar → Nueva implementación → Aplicación web**. Ejecutar como **usuario que accede** y restringir el acceso al dominio institucional, cuando esté disponible. Si se habilita acceso a cuentas Google, la correspondencia privada de identidad seguirá limitando la API al equipo.
9. Compartir la URL terminada en **`/exec`**, no `/dev`. Cada integrante concede permisos con su propia cuenta y elige su nombre.

`Instalador.html` permite consultar y copiar cada archivo y descargar un ZIP autocontenido. Es una ayuda de instalación; no instala automáticamente en Google ni contiene credenciales. No cargarlo en Apps Script. Tampoco cargar `pruebas/`, `herramientas/` ni los archivos de documentación.

## Identidad vinculada a Google

La selección inicial conserva los cinco nombres y permanece en `sessionStorage` durante la sesión de la pestaña. Cada operación verifica en el servidor que la cuenta Google activa corresponda exactamente al nombre seleccionado. La bitácora usa esa identidad validada.

En las propiedades del proyecto agregar **`USUARIAS_EMAILS`** como JSON con el nombre y correo de cada integrante. Este ejemplo usa exclusivamente direcciones ficticias que deben reemplazarse **en las propiedades privadas del proyecto**, nunca en GitHub:

```json
{
  "Rocío Albarracín": "cuenta-ficticia-1@example.invalid",
  "Laura Sánchez": "cuenta-ficticia-2@example.invalid",
  "Cecilia Attolini": "cuenta-ficticia-3@example.invalid",
  "Andrea Ramat": "cuenta-ficticia-4@example.invalid",
  "Mara Torres": "cuenta-ficticia-5@example.invalid"
}
```

Una cuenta solo puede representar a una usuaria. Se rechazan cuentas ajenas, nombres que no coincidan con la cuenta activa, cuentas repetidas en el mapa, correo vacío, JSON inválido y configuración ausente. Se pueden habilitar las integrantes gradualmente; una integrante sin correspondencia no podrá ingresar.

Si aparece **Google no informó la cuenta**, revisar que el despliegue ejecute como la usuaria que accede, que se haya autorizado `userinfo.email` y que las políticas de Workspace permitan obtener esa identidad. Si el dominio institucional no lo permite, debe resolverlo su administrador o ajustarse el despliegue; no desactivar la comprobación ni reemplazarla por `getEffectiveUser()` del propietario.

Permisos: `spreadsheets` para la base por ID y `userinfo.email` para identificación. No se solicitan Gmail, Calendar, contactos, correo saliente ni servicios externos. Los editores del proyecto pueden ver sus propiedades; restringir también quién administra el código y la Sheet. No almacenar contraseñas.

## Primer despacho y triaje posterior

### Alta

1. **NUEVA CAUSA** abre la carga original con IPP, fechas mediante calendario, instructora, resultado y una de las tres plantillas.
2. **REVISAR MEDIDAS Y PROPUESTA** calcula potencial donde corresponde, muestra alertas de conservación y propone diligencias. Todavía no escribe la causa ni las medidas.
3. Aceptar o desmarcar, agregar medidas manuales y revisar el texto. Copiar a SIMP.
4. **CONFIRMAR DESPACHO Y ACTIVAR SEGUIMIENTO** crea exclusivamente lo seleccionado, calcula plazos y registra la gestión. La IPP es única.

### Durante la investigación

**Editar causa** guarda los nuevos datos y recalcula el potencial. La ficha muestra **Nuevas diligencias propuestas**, comparadas con todo lo ya registrado. Ejemplos: cámaras útiles recibidas posteriormente, nuevos testigos, intervención de Policía Científica, documentación y antecedentes médicos completos.

- La edición no crea medidas ni recibe, cancela o altera las que ya fueron ordenadas.
- Desmarcar las propuestas que no se ordenarán en esa revisión.
- **CONFIRMAR NUEVAS DILIGENCIAS Y ACTIVAR SEGUIMIENTO** activa únicamente las seleccionadas. Las no seleccionadas siguen disponibles en próximas revisiones; no se interpretan como una decisión procesal definitiva.
- Las confirmadas desaparecen de la lista, aunque luego se reiteren o reciban. La fecha de solicitud y las alertas de las anteriores se conservan.
- Para una diligencia efectivamente distinta de la misma categoría, usar **AGREGAR MEDIDA**. Elegir categoría, naturaleza (Requerimiento / Ampliación / Nueva pericia), descripción, organismo, fecha y plazo. Se conserva cada registro anterior.
- **Reiterada** corresponde a un requerimiento existente y queda en su misma fila, con la gestión en bitácora. No es un pedido nuevo.
- **Rol en evaluación** permite marcar una medida existente como principal o necesaria para la evaluación final, con auditoría. El dictamen original y las complementarias médicas conservan su carácter necesario.

El tipo de investigación queda fijo después de la confirmación, como en la primera versión. Corregir un tipo erróneo requiere una carga correcta y tratar la equivocada según la política de conservación aplicable; nunca se transforma silenciosamente un flujo en otro.

## Cámaras y conservación urgente

Además de las opciones originales de Cámaras, se registra:

- No consta solicitud de preservación.
- Preservación solicitada, sin confirmación.
- Preservación confirmada.
- Videofilmaciones recibidas.

Solicitar la remisión no acredita preservación. El estado de recepción de Cámaras y Videofilmaciones recibidas deben coincidir; el formulario los vincula al registrar la recepción.

Para Tránsito y Otros, la referencia se calcula desde **la fecha del hecho + 30 días**, configurable. A 10 días del límite hay advertencia preventiva y a 5 días hay alerta crítica. Si el plazo ya pasó, se informa **referencia superada**, sin presumir que las imágenes fueron destruidas. El control se presenta al cargar el triaje y en la base ya cargada; no hay vigilancia previa a la recepción del sumario.

Confirmar preservación elimina el riesgo de borrado del semáforo y mantiene **recepción pendiente**. La remisión se sigue como medida ordinaria separada. Recibir esa medida actualiza la recepción de cámaras; si no se conoce su utilidad, queda como mecánica no determinada hasta que se revise. La ficha propone el acta de apertura sin crearla automáticamente.

La referencia es una herramienta de control: verificar disponibilidad y las condiciones concretas del resguardo. También se muestra cuando aún no se localizaron cámaras, para orientar la averiguación y preservación oportuna; no acredita por sí sola su existencia.

## Mala praxis y evaluación final

No se calcula potencial investigativo en Mala praxis. El circuito conserva: reunir documentación → verificar suficiencia → solicitar fecha → fecha otorgada → designar → pericia realizada → controlar dictamen médico principal → evaluación.

El servidor impide pedir la pericia médica sin documentación suficiente, incluso mediante una medida manual de esa categoría. Historia ya secuestrada requiere confirmar que está completa. En lesiones, Autopsia y Anatomía patológica se muestran mediante la opción de supuesto excepcional; en homicidios están en la plantilla. Los antecedentes legados relevantes continúan disponibles al editar.

La evaluación se activa únicamente cuando:

- Tránsito: se recibió el dictamen accidentológico principal.
- Mala praxis: se recibió el dictamen médico principal.
- Otros: se recibió la prueba principal pertinente.
- En cualquiera de los tres tipos: no hay otras medidas principales o necesarias pendientes.

Una ampliación o un especialista recibido antes del dictamen médico principal **no** habilita la evaluación. Seleccionar Pendiente en una complementaria médica propone su solicitud; no crea el requerimiento. Si se declara necesaria y todavía no se ordenó, también impide considerar madura la causa.

Si la evaluación ya estaba activa y se dispone una complementaria necesaria, se suspende su alerta, manteniendo la tarea y la prueba pendiente visibles. Al recibir todos los informes necesarios se reactiva **la misma tarea**, con ingreso actualizado y un nuevo plazo de 15 días corridos. Se conserva la fecha de creación inicial y las transiciones en bitácora. Se pueden pedir varias ampliaciones o especialistas; cada uno tiene su propia fila y la recepción de uno no cierra los restantes.

Las recepciones de medidas confirmadas se registran en su fila con **Recibida**. Cambiar un dato de la plantilla no constituye recepción ni deja sin efecto una medida anterior.

La vista **CAUSAS PENDIENTES DE EVALUACIÓN 308 / DESESTIMACIÓN** muestra IPP, instructora, ingreso a evaluación, días transcurridos y alerta interna. Permite abrir ficha, registrar control o marcar evaluación cumplida. Se distingue visualmente de los requerimientos probatorios vencidos.

Primera alerta: día 15. Segunda: día 20, salvo una gestión que reprograme el siguiente control a cinco días de esa gestión. Permanece vencida hasta cumplir la evaluación. No se permite cerrarla con prueba necesaria pendiente. Cerrar toda la causa exige además resolver medidas, tareas y ORAC. En Mala praxis no puede omitirse el dictamen médico principal.

## Testigos, tareas y ORAC

En Tránsito y Otros se puede indicar que existen testigos sin cargar datos personales en el primer despacho. El sistema distingue existencia, individualización, audiencia designada y declaración recibida. Propone individualización si faltan datos y audiencia al disponer de nombre. Cada testigo tiene un identificador estable; corregir un dato no genera otra audiencia por sí solo. Se puede fijar fecha con calendario y hora opcional, y marcar recibida la declaración cumpliendo su tarea.

Las actas de apertura siguen requiriendo únicamente Pendiente/Cumplida. Las tareas personalizadas y audiencias manuales continúan disponibles.

ORAC conserva el circuito exclusivo de Tránsito con potencial Identificado, posterior al triaje inicial y por decisión manual con consentimiento confirmado. Estados Remitida / En trámite / Devuelta; primer control a 30 días, segundo a 5 días desde la gestión/reiteración. Permanece visible hasta devolución. No suspende automáticamente otros requerimientos.

## Despacho editable y sin almacenamiento

`Despacho.html` contiene `MODULOS_DESPACHO`, con párrafos independientes para testimoniales, RML, CRIP, cámaras, preservación, historia clínica, pericias e inspecciones/documentación técnica. Solo se incluyen y enumeran las diligencias seleccionadas; se mantienen medidas personalizadas.

La mención del art. 232 CPPBA se utiliza en el módulo testimonial solicitado. No se agregaron otros artículos ni fundamentos jurídicos supuestos. Ajustar los módulos permite una revisión jurídica posterior sin cambiar la persistencia.

Se genera localmente, se puede editar y copiar a SIMP tanto en el primer despacho como al confirmar diligencias posteriores. El texto no se envía a la API ni se guarda en Sheets, bitácora, propiedades, `localStorage` o `sessionStorage`. No es una decisión automática y debe ser revisado por la instructora y la Fiscal antes de incorporarlo a SIMP.

## Configuración de plazos

Editar solamente **`dias`** en `CONFIGURACION`, manteniendo claves y encabezados. Valores enteros de 0 a 3650. Todos los plazos se cuentan en días corridos; solicitud día cero, sin omitir fines de semana ni feriados.

| Clave | Días iniciales | Referencia |
|---|---:|---|
| RML | 10 | Solicitud |
| CRIP | 15 | Solicitud |
| INFORME_TRANSITO | 15 | Solicitud |
| FECHA_ACCIDENTOLOGICA | 10 | Solicitud |
| DICTAMEN_ACCIDENTOLOGICO | 20 | Realización / solicitud del dictamen |
| HISTORIA_CLINICA | 10 | Solicitud |
| FECHA_MEDICA | 15 | Solicitud |
| DICTAMEN_MEDICO | 30 | Realización / solicitud del dictamen |
| AMPLIACION_MEDICA | 30 | Solicitud complementaria |
| ESPECIALISTA | 30 | Solicitud complementaria |
| ORAC | 30 | Remisión |
| EVALUACION | 15 | Ingreso efectivo o reactivación |
| SEGUNDA_ALERTA | 5 | Reiteración / control; evaluación sin gestión: primera alerta |
| CAMARAS_CONSERVACION | 30 | Fecha del hecho |
| CAMARAS_PREVENTIVA_1 | 10 | Anticipación al límite de conservación |
| CAMARAS_PREVENTIVA_2 | 5 | Anticipación crítica al mismo límite |
| GENERAL | 15 | Medidas sin plazo específico |
| PROXIMA | 3 | Anticipación visual ordinaria |

La primera anticipación de cámaras debe ser mayor o igual a la segunda y no superar el plazo de conservación. Los cambios de plazos ordinarios rigen nuevas solicitudes y nuevas gestiones; no cambian vencimientos históricos. Los controles de conservación se recalculan con la referencia configurada sobre la fecha del hecho.

Semáforos ordinarios: naranja el día exacto de primera alerta, rojo desde el día siguiente o desde la segunda alerta inclusive, amarillo próximos a vencer, verde dentro de plazo, azul para evaluación/prueba recibida. Una reiteración reinicia el segundo control desde su fecha efectiva. Recibida, No corresponde y Dejada sin efecto eliminan la alerta de la medida. Una evaluación suspendida no muestra alertas de decisión final.

Las alertas se calculan al consultar. El tablero se actualiza cada 60 segundos cuando no hay un formulario o diálogo activo. No requiere activadores y no envía correos ni notificaciones fuera de la aplicación. Una ficha puede reabrirse para consultar cambios de otras integrantes.

## Concurrencia, rendimiento y bitácora

- La Sheet sigue siendo la única base común. Se requiere un solo proyecto Apps Script por base.
- Todas las consultas/escrituras de la API pasan por `ScriptLock`, con espera de hasta 30 segundos, y las filas conservan control de versión.
- La API no lee la bitácora completa para abrir el tablero ni para operaciones ordinarias. Desde la ficha se consulta por páginas de 100, con búsqueda desde los movimientos más recientes.
- Las modificaciones ordinarias escriben solo filas cambiadas o nuevas. La bitácora se agrega al final. Las eliminaciones explícitas compactan las tablas afectadas.
- Los filtros usan índices en memoria por causa, sin recorrer todas las medidas por cada causa. El tablero pagina causas, medidas y evaluaciones de a 100, con indicadores calculados sobre todos los resultados filtrados.
- No se cachean causas compartidas entre peticiones, evitando datos obsoletos al escribir. Se releen bajo bloqueo.
- Ante errores ordinarios se intenta restauración compensatoria. Sheets no ofrece transacciones entre hojas; una interrupción abrupta del runtime todavía puede requerir restaurar una copia de seguridad.
- Las ediciones manuales en Sheets no adquieren el bloqueo. Trabajar desde la Web App; reservar la Sheet para administración y configuración durante una ventana sin operaciones.

La prueba ficticia local incluyó 900 causas, 7.200 medidas y 10.800 movimientos. Los resultados y límites están en `VALIDACION.md`; no equivalen a latencia ni cuotas reales de Google. La lectura de causas/medidas sigue siendo completa por consulta; medir en Google si el volumen o la concurrencia crecen.

La bitácora conserva fecha/hora de Buenos Aires, usuaria verificada, causa/IPP, referencia y transición. Los textos se escapan en HTML y se neutralizan prefijos de fórmulas al escribir en Sheets.

## Eliminación y respaldo

La eliminación definitiva conserva la confirmación expresa con el aviso original y la escritura de IPP. Usarla únicamente cuando la política institucional de conservación lo permita. El servidor verifica identidad y versión. Elimina causa, medidas, tareas y su bitácora, como en la primera versión; no queda auditoría residual de la causa en la base. Las copias y el historial de Google son independientes.

Para respaldo: **Archivo → Hacer una copia**, con fecha y permisos restringidos. También puede nombrarse una versión en **Historial de versiones** y descargarse una copia Excel de las cinco hojas. El Excel no contiene Apps Script: conservar el código por separado. Frecuencia sugerida: diaria durante uso activo y antes de actualizaciones o eliminaciones importantes.

Recuperación en una copia: vincular el código a esa Sheet, verificar que `SPREADSHEET_ID` no siga apuntando a producción y configurar los correos privados. Si una copia de proyecto conserva el ID anterior, quitarlo solo en ese proyecto de recuperación antes de inicializar la copia. Nunca borrar propiedades de producción para resolver un error de encabezados. Restaurar las cinco hojas si faltan; una migración de una base inicializada no recrea silenciosamente hojas perdidas.

## Pruebas y mantenimiento

Con Node.js 18 o superior, sin instalar paquetes:

```sh
node pruebas/verificar.cjs
node pruebas/mejoras.cjs
```

La primera suite conserva regresiones y escrituras concurrentes; la segunda cubre los escenarios nuevos, migración y volumen. Usan servicios Google simulados y datos exclusivamente ficticios. Ejecutar `pruebasReglas_` y la aceptación de `VALIDACION.md` después de instalar en Google. No se afirma que se haya probado allí.

Para regenerar el instalador con los archivos actuales, usar Python 3 y su biblioteca estándar:

```sh
python3 herramientas/generar_instalador.py
```

Las funciones de administración terminadas en `_` son privadas para `google.script.run` y se ejecutan desde el editor. Las futuras extensiones deben mantener validación de identidad, bloqueo, versiones, confirmación de nuevas medidas y ausencia de persistencia del despacho.
