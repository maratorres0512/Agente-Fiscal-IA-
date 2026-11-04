# Validación de la primera versión

## Alcance de lo ejecutado

Las comprobaciones se hicieron con datos ficticios y el código entregado. No se conectó este entorno a una cuenta de Google Apps Script ni se desplegó una Web App en Google.

| Verificación | Resultado |
|---|---|
| Sintaxis de todos los `.gs` y scripts HTML | Correcta en V8/Node |
| Suite local de 28 pruebas | Aprobada |
| Calendario: fines de semana, cambio de año, bisiestos e inválidas | Aprobado |
| Segunda alerta de medida desde reiteración + 5 días | Aprobada |
| Segunda reiteración y rechazo de fecha anterior | Aprobados |
| Alertas desactivadas en los tres estados terminales | Aprobado |
| Tres investigaciones y cinco instructoras | Aprobadas |
| Filtros por IPP, instructora, investigación, resultado, estado, ORAC, evaluación, vencidas y reiteradas | Aprobados |
| Recepción de prueba principal genera una sola evaluación pendiente | Aprobada |
| Evaluación: +15 y +5 días, persistencia hasta cierre | Aprobada |
| Mala praxis: documentación previa, flujo de pericia y ampliación pendiente bloquea cierre | Aprobados |
| Edición y rechazo de versión desactualizada | Aprobados |
| Restauración compensatoria ante error ordinario y lista de correos permitidos | Aprobadas con servicios simulados |
| Eliminación con IPP y eliminación de dependencias | Aprobadas |
| Dos escrituras simultáneas en el mismo registro | Una aceptada y otra rechazada por versión |
| Dos escrituras simultáneas sobre medidas distintas | Ambas conservadas |
| Ausencia de persistencia del despacho, aun si alguien envía un campo extra | Aprobada |
| Pantalla de ingreso y conservación de sesión al recargar | Aprobadas en Chromium |
| Altas desde la interfaz con las tres plantillas | Aprobadas en Chromium |
| Testigos múltiples, medida manual y propuesta editable | Aprobados en Chromium |
| Acciones rápidas, edición y eliminación desde la interfaz | Aprobadas en Chromium |
| Pericia médica y generación de evaluación desde la interfaz | Aprobadas en Chromium |
| Diseño móvil a 390 px y escritorio a 1440 px | Sin desborde global |
| Errores JavaScript en navegación probada | Ninguno |
| Dependencias externas en el proyecto desplegable | Ninguna |

La suite local ejecuta las funciones de servidor y repositorio entregadas con un adaptador de Sheets y un bloqueo compartido entre workers Node. Verifica serialización y conservación de datos; no demuestra por sí sola el comportamiento del servicio Google LockService, autorizaciones o cuotas. Las pruebas de interfaz usaron Chromium contra una API local con los mismos servicios de negocio y una simulación de `google.script.run`.

## Repetir pruebas locales

Con Node.js 18 o superior, desde la carpeta del proyecto:

```sh
node pruebas/verificar.cjs
```

No se requiere `npm install` ni acceso de red. Se utilizan únicamente módulos nativos. Se crean archivos temporales para las pruebas concurrentes y se eliminan al finalizar.

## Aceptación después de desplegar en Google

Usar exclusivamente una Sheet de demostración con `datosFicticios_` y dos cuentas autorizadas, o dos pestañas para la comprobación de bloqueo.

1. Ejecutar `pruebasReglas_` en el editor. Comprobar sus 10 resultados en el registro.
2. Abrir `/exec` con cada cuenta del equipo. Verificar permiso sobre la Sheet y autorizar el proyecto.
3. Seleccionar usuaria. Recargar: no debe pedir nuevamente el nombre. Cambiar usuaria y verificar que las nuevas acciones se atribuyan al nombre elegido.
4. Aplicar cada instructora al filtro. Debe mostrarse su causa ficticia y solo sus medidas.
5. Crear una causa de Tránsito con cámaras recibidas útiles, Policía Científica y un testigo. Revisar sugerencias, quitar una, agregar una manual. Antes de confirmar, comprobar que la Sheet no tiene esa IPP. Confirmar y verificar las medidas aceptadas y tareas. Buscar el texto del despacho en las cinco hojas: no debe existir.
6. Desde el tablero, marcar una medida Reiterada con fecha de hoy. Verificar `segundaAlerta = fechaReiteracion + 5`. Marcarla Recibida: debe desaparecer la alerta y registrarse la usuaria.
7. En Tránsito registrar fecha otorgada, designar, registrar pericia realizada y recibir el dictamen. Debe crearse la tarea de evaluación con primera alerta a 15 días de recepción y segunda a 20, sin duplicarse por recibir nuevamente la misma medida.
8. Crear Mala praxis con documentación incompleta: no debe sugerir fecha de pericia médica. Reunir y actualizar documentación, confirmar documentación completa, solicitar fecha y completar el flujo. Recibir dictamen y marcar una ampliación Pendiente: la evaluación no debe poder cerrarse hasta resolver esa ampliación.
9. Crear Otros con una prueba principal personalizada. Recibirla: debe generar evaluación con la misma lógica.
10. En una causa de Tránsito con potencial Identificado, remitir a ORAC confirmando consentimiento. Comprobar control a 30 días y persistencia hasta devolución. Registrar gestión: segundo control a 5 días. Registrar devolución: debe salir del filtro ORAC pendiente.
11. Editar un dato y comprobar la bitácora. Abrir la misma ficha en dos pestañas y editar en ambas: tras guardar la primera, la segunda debe pedir actualizar, sin pisar el cambio.
12. En una ficha `FICTICIA-`, abrir **Validación con datos ficticios** y pulsar **Probar concurrencia real en Apps Script**. El navegador envía dos solicitudes simultáneas con la misma versión. Debe informar una aceptada y una rechazada por versión desactualizada. Queda una tarea `PRUEBA CONCURRENCIA` en la ficha y su movimiento en bitácora.
13. En dos pestañas, marcar recibidas dos medidas diferentes casi simultáneamente. Reabrir ficha y verificar ambas recepciones y movimientos. Si ambas seleccionaron la misma medida, la segunda debe avisar conflicto de versión.
14. Intentar eliminar: cancelar primero y comprobar que todo sigue presente. Repetir, escribir IPP incorrecta y comprobar rechazo. Escribir IPP correcta: no deben quedar causa, medidas, tareas ni bitácora asociada.
15. Cambiar RML de 10 a 8 en CONFIGURACION. Crear otra causa de prueba y verificar el nuevo plazo. El vencimiento histórico no debe cambiar. Restablecer 10 al terminar.
16. Abrir la URL desde una cuenta no permitida: no debe obtener datos de la API. Revisar la configuración del dominio y `ALLOWED_EMAILS` si el resultado difiere.

Estas verificaciones reales quedan pendientes de la instalación por la persona administradora. El proyecto incluye el código y los controles necesarios para realizarlas; no se afirma que ya se hayan ejecutado en Google.
