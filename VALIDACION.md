# Validación — seguimiento activo de UFIJ N.º 22

## Entorno y resultados

Se modificó el código existente del repositorio. Se utilizaron exclusivamente datos ficticios. **No se instaló ni se ejecutó esta versión en Google Apps Script o Google Sheets reales.**

Comandos ejecutados con Node.js, sin instalar paquetes:

```sh
node pruebas/verificar.cjs
node pruebas/mejoras.cjs
```

Resultado: **28 pruebas de regresión + 22 pruebas adicionales = 50 pruebas locales aprobadas**. La primera suite incluye las comprobaciones de calendario de `pruebasReglas_` ejecutadas en el adaptador local.

| Escenario solicitado | Comprobación ejecutada | Resultado local |
|---|---|---|
| A — Tránsito con cámaras posteriores | Limitado → Identificado; acta, Informe de Tránsito y fecha accidentológica propuestos; edición sin crear pedidos; confirmación y rechazo de versión vieja | Aprobado |
| B — Riesgo de cámaras | Fecha del hecho + conservación; alerta crítica; confirmación de preservación elimina riesgo y conserva remisión pendiente; recepción y acta; referencia superada sin presumir destrucción; cambio de umbrales | Aprobado |
| C — Documentación médica incompleta | Se bloquean flujo y solicitud manual de fecha médica; al completarla se propone y solo al confirmar se solicita | Aprobado |
| D — Ampliación médica | Suspende evaluación; impide cierre; reusa misma tarea y reinicia 15/20 al recibir; permite segunda ampliación sin alterar la primera | Aprobado |
| E — Especialista | Recibir especialista antes del dictamen médico no crea evaluación; varias complementarias pendientes requieren todas las recepciones | Aprobado |
| F — Evaluación | Primera a 15 días, segunda a 20, control +5, vencimiento persistente, cumplimiento y edición posterior sin reapertura indebida | Aprobado |
| G — Nuevas diligencias | Propuesta posterior sin duplicaciones; recepción desde filas; solicitudes explícitas de misma categoría conservan historial; varias medidas necesarias bloquean activación prematura | Aprobado |
| H — Identidad | Cuenta ajena, otro nombre, identidad vacía, configuración ausente/inválida y cuenta duplicada rechazadas | Aprobado |
| I — Volumen | 900 causas, 7.200 medidas y 10.800 movimientos; consultas, filtros, paginación y escritura puntual | Aprobado con adaptador local |
| J — Regresiones | Tres plantillas, ORAC, calendario, alertas, filtros, edición, eliminación, bitácora, despacho sin persistencia, restauración ante error ordinario y concurrencia | Aprobado |
| Migración | V1 a columnas nuevas, valores configurados conservados, repetición idempotente, interrupción tras encabezados, rechazo de cabeceras ajenas y hojas faltantes | Aprobado |
| Madurez legada | Evaluación v1 prematura suspendida; un informe auxiliar no sustituye al dictamen accidentológico | Aprobado |
| Carga ágil | Testigos sin datos; identificación, fecha/hora y declaración recibida separadas | Aprobado |
| Despacho modular | Solo medidas seleccionadas, enumeración, testimonial art. 232 con fecha/hora, medida personalizada y sin artículos agregados | Aprobado |

Las pruebas concurrentes utilizan dos workers que ejecutan API, servicios y repositorio reales del proyecto con una Sheet y un bloqueo simulados compartidos. Sobre la misma versión, una modificación se acepta y la otra se rechaza; sobre medidas distintas se conservan ambas escrituras. Esto verifica la lógica local, no la infraestructura Google LockService.

## Medición ficticia de rendimiento

Una ejecución de `pruebas/mejoras.cjs` produjo:

| Operación | Resultado |
|---|---:|
| Causas / medidas / movimientos | 900 / 7.200 / 10.800 |
| Cinco consultas de tablero | 45,5 / 34 / 29,2 / 28,7 / 32 ms |
| Filtro por instructora | 18,7 ms |
| Escritura de una reiteración | 57,7 ms |
| Celdas escritas en esa gestión | 52: causa + medida + bitácora |
| Tamaño de página | 100 registros |

Se comprueba que la consulta no lea los registros de bitácora: solo verifica su encabezado. Las escrituras no reescriben miles de filas y conservan los 7.200 pedidos y el movimiento agregado.

Los tiempos son de Node y memoria local. **No incluyen latencia de SpreadsheetApp, autenticación, transferencia de datos, cuotas, tiempo de espera de LockService ni renderizado remoto de Google.** Deben medirse nuevamente en una copia de prueba de Apps Script antes de inferir capacidad productiva.

## Interfaz verificada en Chromium

Se ejecutaron dos recorridos automatizados contra un servidor local que utiliza las mismas funciones de negocio, con un puente simulado de `google.script.run`:

- Ingreso y conservación de sesión, filtro por instructora, tres altas, testigos múltiples, medidas manuales, despacho editable y ausencia de su texto en la base.
- Reiteración y recepción, edición, pericia médica completa, evaluación generada, eliminación con IPP y vista móvil a 390 px.
- Rechazo de selección de otro nombre frente a la cuenta del adaptador; controles y cumplimiento de evaluación desde el tablero.
- Edición posterior con cámaras útiles, propuesta nueva, desmarcado de Informe de Tránsito, confirmación de acta y fecha de pericia sin pedidos no seleccionados ni duplicados.
- Proyecto modular posterior, botón de rol probatorio, consulta paginada de bitácora, carga sin nombre de testigos y aparición contextual de autopsia/anatomía patológica.

Sin errores JavaScript durante los recorridos y sin desborde global en móvil. El proyecto desplegable usa solo HTML, CSS y JavaScript nativos. El navegador de verificación es herramienta de desarrollo del entorno y no una dependencia de la aplicación.

## Qué falta validar en Google

Pendiente: permisos reales de Workspace, identificación con la modalidad institucional, migración sobre una copia de la base existente, disponibilidad del calendario/portapapeles en los navegadores institucionales, latencias/cuotas y bloqueos reales. No se enviaron mensajes ni se accedió a causas reales.

### Aceptación en una copia de demostración

1. Respaldar y copiar la base; comprobar que `SPREADSHEET_ID` apunte a la copia y nunca a producción. Instalar el código actualizado allí.
2. Configurar `USUARIAS_EMAILS` con las cuentas del equipo en propiedades privadas. Ejecutar `migrar_`, verificar columnas y valores conservados, repetir y comprobar que no se dupliquen registros. No ejecutar `datosFicticios_` si la copia contiene registros existentes.
3. En una base separada completamente vacía puede ejecutarse `datosFicticios_`. Ejecutar también `pruebasReglas_` desde el editor: debe devolver 10 verificaciones aprobadas en el runtime real.
4. Implementar `/exec` como usuaria que accede. Abrir con cada cuenta, elegir el nombre correspondiente y autorizar. Seleccionar otro nombre: debe rechazarse. Verificar también cuenta ajena y una configuración de despliegue sin identidad: debe fallar de forma segura, sin obtener causas.
5. Crear Tránsito sin cámaras útiles; editar después a Recibidas/Muestran. Verificar reclasificación, propuestas, que la Sheet todavía no tenga los nuevos pedidos, desmarcar uno y confirmar los restantes. Editar otra vez: no deben duplicarse las ya confirmadas.
6. Cargar un hecho de hace 29 días sin preservación confirmada. Comprobar alerta crítica basada en el hecho. Confirmar preservación: debe cesar el riesgo, con recepción aún pendiente. Recibir las imágenes y revisar el acta propuesta. Para un hecho de hace más de 30 días, comprobar el texto de referencia superada.
7. En Mala praxis incompleta, intentar solicitar fecha: debe impedirlo. Completar antecedentes y confirmación de suficiencia; revisar y confirmar fecha. Registrar fecha otorgada, designación, realización y recepción del dictamen.
8. Con evaluación activa, declarar ampliación Pendiente y confirmar el requerimiento. Debe suspenderse la alerta. Recibir ampliación y comprobar mismo ID de tarea con nuevo ingreso y +15/+20. Repetir con dos complementarias; recibir solo una no debe reactivar. Solicitar una segunda ampliación de igual categoría con descripción distinta y conservar la primera.
9. En otra causa médica, recibir un especialista antes del dictamen original: no debe haber evaluación activa. En Tránsito, una medida auxiliar marcada principal tampoco reemplaza el dictamen accidentológico.
10. En Otros, marcar dos pruebas como necesarias. Recibir una sola: no evaluar. Recibir la restante: activar evaluación. Reabrir una necesaria: suspender. No permitir cierre mientras falte prueba.
11. Usar el filtro/vista de evaluación. Comprobar responsable, ingreso, días y semáforo; registrar control y verificar siguiente fecha a cinco días; marcar cumplida. Una causa con otras medidas puede seguir En seguimiento, pero no cerrarse por completo.
12. Probar testigos sin datos en alta; individualizar después, confirmar audiencia, fijar fecha con calendario y hora opcional, cumplir declaración. En lesiones médicas, mostrar estudios excepcionales; en homicidio comprobar visibilidad contextual.
13. Generar despacho con solo dos medidas y otra personalizada. Verificar numeración y redacción; editar/copiar. Buscar su texto en las cinco hojas y propiedades: no debe estar. Revisar el módulo jurídico con la instructora y la Fiscal.
14. Probar Reiterada y Recibida desde tablero y ficha; segunda alerta = reiteración + 5. Verificar tres estados terminales sin alertas. Probar ORAC a 30 días, gestión +5 y devolución.
15. Abrir la misma ficha en dos pestañas, editar ambas y guardar: la desactualizada debe rechazarse. En una ficha FICTICIA, usar **Validación con datos ficticios → Probar concurrencia real en Apps Script**. Esperar una operación aceptada y la otra rechazada por versión. Luego modificar dos medidas distintas simultáneamente y comprobar ambas recepciones y bitácora.
16. Probar eliminación cancelada, IPP errónea y confirmación correcta, únicamente con datos ficticios y conforme la política de conservación. Comprobar eliminación de todas las dependencias, sin afectar otras causas.
17. En una base ficticia de volumen equivalente, medir tiempos desde los navegadores institucionales, consumo de ejecuciones, paginación y escritura. Revisar errores/cuotas antes de habilitar la versión productiva.

Documentar los resultados de estos pasos después de ejecutarlos; permanecen pendientes de la instalación institucional.
