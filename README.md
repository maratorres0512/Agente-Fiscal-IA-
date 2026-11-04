# AGENTE DE TRIAJE Y GESTIÓN DE PRUEBA — UFIJ N.º 22 QUILMES

Primera versión funcional para Google Apps Script y una Google Sheet compartida. Interfaz en español, cinco usuarias, tres plantillas, medidas, tareas internas, seguimiento de pericias, ORAC, alertas y bitácora. No utiliza bibliotecas, frameworks, fuentes externas ni CDNs. No se guarda el texto del despacho.

## 1. Crear la base y vincular Apps Script

1. Ingresar con la cuenta Google institucional que administrará la aplicación.
2. Crear una **Google Sheet vacía** y nombrarla `UFIJ22 — Triaje y prueba`.
3. Abrir **Extensiones → Apps Script** desde esa Sheet. Es importante crear un proyecto vinculado a la planilla.
4. Nombrar el proyecto `UFIJ22 — Gestión de prueba`.
5. Copiar los archivos del paquete al editor con estos nombres. Para archivos `.gs`, elegir **+ → Secuencia de comandos**. Para archivos `.html`, elegir **+ → HTML**. El editor agrega la extensión: no escribirla dos veces.

| Archivo | Tipo en Apps Script | Función |
|---|---|---|
| `Code.gs` | Secuencia de comandos | Web App y entrada RPC |
| `Modelo.gs` | Secuencia de comandos | Modelo, campos, validaciones y fechas |
| `Repositorio.gs` | Secuencia de comandos | Hojas, inicialización, bloqueo, persistencia |
| `Reglas.gs` | Secuencia de comandos | Triaje, sugerencias, alertas, filtros |
| `Servicios.gs` | Secuencia de comandos | CRUD y flujos de trabajo |
| `DatosPrueba.gs` | Secuencia de comandos | Cinco causas completamente ficticias |
| `PruebasGoogle.gs` | Secuencia de comandos | Comprobaciones puras para ejecutar en Google |
| `Index.html` | HTML | Estructura de la aplicación |
| `Estilos.html` | HTML | CSS nativo dentro de `<style>` |
| `Cliente.html` | HTML | JavaScript nativo dentro de `<script>` |
| `Despacho.html` | HTML | Generador de texto en memoria del navegador |

Se puede usar `Instalador.html`, incluido en este repositorio: abrirlo en el navegador permite ver, copiar y descargar cada archivo. No requiere conexión ni sube archivos.

6. En **Configuración del proyecto**, activar **Mostrar el archivo de manifiesto appsscript.json en el editor**.
7. Reemplazar el contenido de `appsscript.json` por el del paquete. Incluye runtime V8, zona `America/Argentina/Buenos_Aires` y permisos de Sheets e identidad de la cuenta.
8. Guardar todos los archivos. No cargar la carpeta `pruebas/`, el README, el instalador ni las capturas en Apps Script.

## 2. Inicializar las hojas

1. En el selector de funciones del editor elegir **`inicializar_`** y pulsar **Ejecutar**.
2. Autorizar el acceso a las hojas de cálculo con la cuenta administradora. Si el dominio institucional exige aprobación administrativa, gestionarla con su administrador Google Workspace.
3. Volver a la Sheet. Deben existir:
   - `CAUSAS`
   - `MEDIDAS`
   - `TAREAS`
   - `BITACORA`
   - `CONFIGURACION`
4. La función guarda automáticamente el ID de la base en **Propiedades de la secuencia de comandos → `SPREADSHEET_ID`**. Así todas las ejecuciones de la Web App usan la misma Sheet.
5. La inicialización puede repetirse: no borra registros ni restablece plazos existentes. Si alguien cambia un encabezado, la aplicación avisa y detiene la operación para evitar guardar columnas equivocadas.

Las funciones terminadas en `_` se ejecutan desde el editor; no son invocables mediante `google.script.run` desde la Web App.

## 3. Validar con datos ficticios

Utilizar una base de demostración separada de la futura base de trabajo.

1. Ejecutar **`datosFicticios_`** desde el editor, después de inicializar.
2. Se cargan cinco causas identificadas con `FICTICIA-`, una por instructora. Incluyen Tránsito, Mala praxis, Otros, potencial limitado, una evaluación vencida, medidas vencidas/reiteradas, una próxima a vencer y una causa pendiente de ORAC.
3. No hay datos reales ni teléfonos reales. Los nombres de testigos son inventados.
4. La carga de demostración se rechaza si ya hay causas, medidas o tareas. Nunca mezcla ejemplos con una base existente.
5. Ejecutar **`pruebasReglas_`**. Debe devolver **10 verificaciones aprobadas**. No modifica hojas.
6. Desplegar y recorrer los casos de prueba indicados en `VALIDACION.md`.

Para iniciar producción, crear otra Sheet vacía y otro proyecto vinculado, repetir la instalación e inicializar sin ejecutar `datosFicticios_`. Esto también separa los despliegues y sus bloqueos.

## 4. Acceso y permisos

Configuración recomendada para el equipo:

1. Compartir la Sheet únicamente con las cinco cuentas institucionales que usarán la aplicación, con permiso de **Editor**. No publicar la Sheet ni habilitar acceso por enlace para cualquier persona.
2. En **Configuración del proyecto → Propiedades de la secuencia de comandos**, agregar `ALLOWED_EMAILS` con los cinco correos autorizados, separados por comas y sin texto adicional. Ejemplo ilustrativo: `persona1@dominio.institucional,persona2@dominio.institucional`.
3. Estos correos son cuentas Google reales que deben completar al instalar; no están incluidos en el código ni se inventaron cuentas para las usuarias.
4. Desplegar para ejecutar **como la usuaria que accede a la aplicación**. De esta manera cada cuenta autoriza Sheets e identificación por correo y debe tener acceso a la base.
5. Restringir el acceso del despliegue al dominio institucional, si Google Workspace ofrece esa opción. Si se permite a usuarios con cuenta Google, mantener obligatoriamente `ALLOWED_EMAILS` para limitar la API al equipo.

Si `ALLOWED_EMAILS` está definido y Google no informa un correo autorizado, la operación se rechaza. Si la propiedad está vacía, la API acepta la selección de una de las cinco usuarias y confía en la restricción del despliegue: solo usar ese modo en una demostración privada.

La pantalla de selección conserva un nombre en `sessionStorage` durante la sesión de la pestaña. No solicita el nombre en cada operación. La bitácora registra ese nombre elegido. La selección no verifica que ese nombre corresponda al titular del correo; esta versión no ofrece firma digital ni autenticación por nombre. El acceso efectivo lo controlan Google y, si se configura, la lista de correos.

Permisos declarados:

- `spreadsheets`: leer y escribir la base central mediante su ID.
- `userinfo.email`: comprobar la cuenta activa frente a la lista de acceso.

No se solicitan permisos de Gmail, Calendar, contactos, servicios externos ni Drive para copias automáticas. Las copias se hacen manualmente desde Sheets.

## 5. Desplegar como Web App

1. En Apps Script elegir **Implementar → Nueva implementación**.
2. Seleccionar tipo **Aplicación web**.
3. Descripción: `UFIJ22 v1 — demostración` o `UFIJ22 v1 — producción` según la base.
4. **Ejecutar como:** usuario que accede a la aplicación web.
5. **Quién tiene acceso:** la opción institucional disponible según lo indicado arriba. No desplegar como acceso anónimo.
6. Pulsar **Implementar**, completar las autorizaciones y copiar la URL que termina en **`/exec`**.
7. Compartir esa misma URL con el equipo. No compartir la URL `/dev`, que es para pruebas de editores.
8. Cada integrante abre la URL con su cuenta autorizada, concede los permisos y selecciona su nombre una sola vez por sesión.

La Web App depende de la conectividad con Google Apps Script y Google Sheets. No realiza peticiones a otros proveedores ni funciona como aplicación sin conexión.

## 6. Uso cotidiano

### Nueva causa y primer despacho

1. Pulsar **NUEVA CAUSA**.
2. Cargar IPP, fechas con calendario, instructora, resultado e investigación.
3. Completar la plantilla. Se abren los campos condicionales de cámaras, testigos, defunción y allanamiento. En Otros elegir prueba principal; en Mala praxis no se calcula potencial.
4. Pulsar **REVISAR MEDIDAS Y PROPUESTA**.
5. Revisar el potencial, cuando corresponde, y aceptar o desmarcar sugerencias. Agregar medidas manuales con organismo, fecha, plazo y marca de principal.
6. Revisar y, si se desea, editar la propuesta textual. Pulsar **Copiar texto** y pegarla en SIMP.
7. Pulsar **CONFIRMAR DESPACHO Y ACTIVAR SEGUIMIENTO** una sola vez. Allí se crean la causa, las medidas seleccionadas y las tareas internas, se calculan alertas y se registran movimientos en bitácora.

Antes de la confirmación no hay escritura de la causa ni de las sugerencias. Si se modifica un campo del formulario, se requiere revisar nuevamente. La IPP es única y evita duplicar una confirmación repetida.

El texto del despacho solo existe en el textarea de la página. No se envía al servidor, no se guarda en Sheets, bitácora, propiedades ni `sessionStorage`. Al salir de la carga se elimina del DOM. El despacho definitivo debe conservarse en SIMP. Confirmar no copia automáticamente el texto: copiarlo antes.

### Tablero y medidas

- Los indicadores, filtros y buscador se aplican sobre la base común. El buscador acepta fragmentos de IPP, sin distinguir mayúsculas.
- Las tarjetas son accesos rápidos a los filtros.
- **Reiterada** y **Recibida** funcionan desde el tablero y la ficha, con calendario para registrar la fecha de la gestión.
- Cada reiteración fija una nueva segunda alerta a cinco días de esa fecha, o al plazo configurado. Una gestión anterior a la última se rechaza.
- La recepción de una solicitud de fecha de pericia pide también la fecha otorgada para la pericia.
- **Cambiar estado** permite los seis estados de medida. Recibida, No corresponde y Dejada sin efecto eliminan sus alertas.
- Cualquier integrante autorizada puede registrar la recepción; no está restringida a la instructora responsable.
- La ficha permite agregar medidas y tareas. Las audiencias guardan fecha mediante calendario; las actas de apertura solo requieren Pendiente/Cumplida.

La edición de la causa actualiza sus datos y deja constancia en bitácora. Mantiene las medidas ya confirmadas, que representan lo efectivamente ordenado. Para nuevos pedidos usar AGREGAR MEDIDA. El tipo de investigación queda fijo después de confirmar para preservar la coherencia del flujo. Una corrección de tipo requiere recrear la carga correcta y eliminar la errónea con confirmación explícita.

### Pericias

Tránsito: solicitud de fecha → fecha otorgada → designación → pericia realizada / dictamen pendiente → dictamen recibido. El dictamen se crea como medida principal con su plazo a partir de la realización de la pericia. La fecha de solicitud inicial puede revisarse en la medida.

Mala praxis: reunir documentación → marcar **documentación reunida y completa** en Editar causa → solicitar fecha → fecha otorgada → designar → realizada / dictamen pendiente → recibido. El servidor verifica que no queden estados documentales pendientes. Si está **Ya secuestrada**, esa confirmación también implica que se verificó que la historia esté completa. Los cambios de estado de los documentos se realizan en Editar causa; recibir una medida no supone automáticamente que la documentación llegó completa.

En Mala praxis, pasar Ampliación o Especialista a Pendiente/Solicitada desde la edición crea el seguimiento correspondiente si falta. La recepción de esas medidas actualiza su campo. No se puede cerrar la evaluación mientras haya prueba principal o ampliaciones pendientes, ni sin dictamen médico recibido. Si se vuelve a necesitar otra ampliación después de una recibida, agregar una nueva medida principal personalizada.

Otros: la prueba seleccionada se sugiere como medida principal; se puede desmarcar o agregar otra medida principal manual. No impone una pericia fija.

### Evaluación 308 / Desestimación

Al recibir una medida marcada como principal, se crea automáticamente una tarea pendiente y la causa pasa a **Evaluación 308 / Desestimación**. No duplica una evaluación ya pendiente.

- Primera alerta: 15 días corridos desde la fecha de recepción registrada.
- Segunda alerta automática: 5 días corridos después de la primera, incluso si no hubo gestión.
- **Registrar control** reprograma la segunda alerta a 5 días de esa gestión.
- Permanece vencida hasta cerrar la tarea.
- Cerrar evaluación pide elegir En seguimiento o Cerrada. Para cerrar toda la causa no debe haber medidas, tareas ni ORAC pendientes. En seguimiento permite nuevas medidas.

El indicador azul se refiere a una evaluación pendiente originada por recepción de prueba principal. Las alertas de la tarea muestran su vencimiento por separado.

### ORAC

No aparece como sugerencia del triaje inicial. En una ficha de Tránsito con potencial Identificado se habilita **Remitir a ORAC**. Se exige confirmar consentimiento de la/s víctima/s y fecha de remisión.

Primera alerta: 30 días desde remisión. Segunda: 5 días desde la gestión/reiteración registrada. Estados: Remitida, En trámite, Devuelta. La causa permanece visible y en el filtro ORAC pendiente hasta registrar devolución. La remisión a ORAC no suspende automáticamente los plazos de otras medidas.

### Edición y eliminación

Los cambios relevantes guardan usuaria, fecha/hora de Buenos Aires, causa, IPP y referencia de medida/tarea, cuando corresponde.

Eliminar exige abrir un diálogo con el aviso solicitado y escribir la IPP. El servidor verifica además la versión vigente. Borra causa, medidas, tareas y bitácora asociada. La acción de eliminación se registra en el snapshot antes de borrar; como se pidió eliminar también la bitácora, **no queda un registro residual de esa eliminación en la base**. Las copias de seguridad e historial de Google son independientes de ese borrado.

## 7. Plazos y alertas

Editar únicamente la columna **`dias`** en `CONFIGURACION`. Mantener claves y encabezados. Los valores deben ser enteros de 0 a 3650.

| Clave | Días iniciales |
|---|---:|
| RML | 10 |
| CRIP | 15 |
| INFORME_TRANSITO | 15 |
| FECHA_ACCIDENTOLOGICA | 10 |
| DICTAMEN_ACCIDENTOLOGICO | 20 |
| HISTORIA_CLINICA | 10 |
| FECHA_MEDICA | 15 |
| DICTAMEN_MEDICO | 30 |
| ORAC | 30 |
| EVALUACION | 15 |
| SEGUNDA_ALERTA | 5 |
| GENERAL | 15 |
| PROXIMA | 3 |

`GENERAL` cubre medidas sin un plazo específico. `PROXIMA` es la anticipación visual para el amarillo. Las medidas manuales admiten plazo propio.

Los cambios se leen en cada operación sin redeplegar. Se aplican a **nuevas solicitudes y nuevas reiteraciones**; no recalculan silenciosamente las fechas históricas de medidas ya activadas. Si se cambia SEGUNDA_ALERTA, las nuevas gestiones usarán el nuevo valor en lugar de cinco.

Todos los plazos son días corridos. Se guarda `AAAA-MM-DD` como texto para impedir conversiones regionales; las sumas usan componentes UTC y el día actual se obtiene en Buenos Aires. No se omiten feriados ni fines de semana. El día de solicitud es día cero: solicitud el 01/11 + 10 días vence el 11/11.

Semáforos:

- Rojo: día posterior al primer vencimiento sin gestión; segunda alerta desde su fecha inclusive; evaluación vencida.
- Naranja: día exacto de primera alerta, requiere reiteración.
- Amarillo: dentro de los próximos tres días, configurable.
- Verde: dentro de plazo o reiterada a la espera del segundo control.
- Azul: prueba principal recibida con evaluación pendiente.

Las alertas se calculan al consultar, sin modificar la base ni necesitar activadores. El tablero se actualiza cada 60 segundos cuando no hay un formulario o diálogo activo. Una ficha abierta se actualiza al realizar operaciones; puede reabrirse para consultar cambios ajenos. No se envían correos ni notificaciones fuera de la aplicación.

## 8. Actualizar una versión

1. Realizar una copia de seguridad de la Sheet.
2. Actualizar en el mismo proyecto los archivos que cambiaron y guardar.
3. Probar con una base de demostración y revisar las ejecuciones.
4. Ir a **Implementar → Administrar implementaciones → Editar (lápiz)**.
5. Elegir **Nueva versión**, describir el cambio e implementar.
6. Conservar la implementación para que la URL `/exec` siga siendo la misma.
7. Pedir al equipo que recargue la página. Si cambia el manifiesto o los permisos, puede requerirse nueva autorización.

No ejecutar la carga ficticia sobre producción. Esta versión no incluye migraciones automáticas de esquemas futuros.

## 9. Copias de seguridad y recuperación

1. Desde la Sheet: **Archivo → Hacer una copia**. Nombrarla con fecha, por ejemplo `UFIJ22 — respaldo — AAAA-MM-DD`.
2. Guardarla en una carpeta institucional restringida. Comprobar sus permisos de acceso.
3. También se puede usar **Archivo → Historial de versiones → Nombrar versión actual** antes de un cambio importante.
4. Para una copia externa, **Archivo → Descargar → Microsoft Excel (.xlsx)** conserva las cinco hojas. Esa descarga no contiene el proyecto Apps Script; conservar también este ZIP y las versiones del código.
5. Frecuencia sugerida: diaria durante el uso activo y antes de cambios o eliminaciones amplias.

Para recuperar en una Sheet nueva: copiar/restaurar las cinco hojas, vincular el código a esa nueva Sheet y ejecutar inicializar_. Si el proyecto copiado conserva `SPREADSHEET_ID` apuntando a la base anterior, borrar esa propiedad desde Configuración del proyecto antes de inicializar la copia. Revisar también `ALLOWED_EMAILS`, compartir la base y desplegar una nueva URL. Verificar que la copia no apunte a producción antes de probar.

El historial de versiones, la retención de copias y los permisos institucionales se administran en Google Workspace.

## 10. Concurrencia y alcance técnico

- La Sheet es la única base compartida. `sessionStorage` guarda exclusivamente el nombre elegido.
- Todas las lecturas y escrituras de la API usan un mismo `LockService.getScriptLock()` con espera de hasta 30 segundos. Debe existir **un solo proyecto Apps Script** escribiendo en esa base.
- Se vuelve a leer el estado bajo el bloqueo, se modifica un snapshot y se guardan únicamente las tablas modificadas.
- Las filas tienen `version`. Dos ediciones del mismo registro no se pisan: la segunda recibe un aviso de actualización necesaria. Cambios sobre medidas diferentes se conservan ambos.
- La bitácora se escribe junto con cada modificación.
- Ante un error ordinario durante una escritura se intenta restaurar las tablas previas. Sheets no tiene transacciones entre hojas: una interrupción abrupta del runtime puede requerir recuperar una copia de seguridad. No se afirma atomicidad transaccional.
- Ediciones directas de personas sobre la Sheet no adquieren el ScriptLock. Trabajar desde la Web App; reservar las hojas para administración y para cambiar plazos de CONFIGURACION fuera de operaciones activas.
- El MVP carga las tablas completas y reescribe las modificadas. Está orientado a un equipo pequeño y un volumen inicial moderado; no incluye paginación ni un gestor de archivos de prueba. Si el volumen aumenta, medir cuotas y tiempos antes de ampliarlo.
- Los textos se escapan al renderizar HTML y se neutralizan prefijos de fórmulas al escribir en Sheets.
- No hay inteligencia artificial externa ni decisiones automáticas de remisión o cierre. Las sugerencias provienen de reglas explícitas y la instructora confirma las medidas y el despacho.

## 11. Verificación incluida

Con Node.js 18 o superior, sin instalar paquetes:

```sh
node pruebas/verificar.cjs
```

La carpeta `pruebas/` usa módulos nativos de Node y adaptadores locales de Google Sheets/ScriptLock. Comprueba reglas, calendario, persistencia, CRUD y dos escrituras concurrentes en workers. No sustituye una prueba con servicios reales de Google. Ver `VALIDACION.md` para lo efectivamente comprobado y la lista de aceptación después del despliegue.
