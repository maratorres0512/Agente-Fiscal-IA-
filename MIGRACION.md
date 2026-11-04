# Migración aditiva de v1 a seguimiento activo

No ejecutar la carga de datos ficticios sobre una base existente. Respaldar la Sheet y el código anterior antes de actualizar. Detener temporalmente operaciones del equipo.

## Procedimiento

1. Copiar los archivos actualizados al mismo proyecto vinculado.
2. Mantener `SPREADSHEET_ID` sin cambios.
3. Configurar `USUARIAS_EMAILS` en propiedades privadas. `ALLOWED_EMAILS` no reemplaza la correspondencia entre cuenta y nombre.
4. Ejecutar `migrar_` desde el editor.
5. Revisar su resultado. Los encabezados deben ser un prefijo exacto del esquema conocido. Una columna ajena, renombrada o reordenada detiene la migración antes de modificar hojas; corregir a partir del respaldo, sin borrar datos.
6. Si falta una hoja de una base ya inicializada, se rechaza la operación. Restaurar la hoja original; no se crea una sustituta vacía.
7. Verificar registros, configuración y evaluaciones suspendidas. Ejecutar nuevamente `migrar_` es seguro: no duplica columnas, claves ni tareas.
8. Implementar una nueva versión de la Web App y recargar en las cinco cuentas.

La migración conserva el prefijo original de columnas y agrega las siguientes al final. No cambia IDs ni fechas históricas de solicitudes, recepciones y reiteraciones.

## MEDIDAS: tres columnas nuevas

| Columna | Significado | Registros legados |
|---|---|---|
| `sugerenciaClave` | Identidad semántica de la diligencia confirmada | Vacía. La deduplicación también compara categoría/descripción legada |
| `necesariaEvaluacion` | Debe resolverse antes de evaluar | Verdadera si era principal o ampliación/especialista médica |
| `naturaleza` | Requerimiento / Ampliación / Nueva pericia | Inferida para complementarias; Requerimiento en las demás |

`principal` se conserva. En Tránsito y Mala praxis el dictamen original se identifica por su categoría; una complementaria no lo reemplaza aunque una fila legada estuviera marcada como principal.

## TAREAS: cinco columnas nuevas

| Columna | Significado | Registros legados |
|---|---|---|
| `sugerenciaClave` | Deduplicación de tareas sugeridas | Vacía; se usa comparación de tareas existentes |
| `evaluacionSuspendida` | Prueba necesaria pendiente, sin alerta final activa | Inicialmente falsa; se revisa la madurez durante la migración |
| `fechaIngresoEvaluacion` | Ingreso efectivo o reactivación del ciclo de evaluación | Fecha de creación para evaluaciones existentes |
| `horaAudiencia` | Hora opcional `HH:mm` | Vacía |
| `testigoId` | Referencia estable al testigo | Vacía; no se inventa una asociación ambigua |

Se mantiene `fechaCreacion` para conservar el alta original. La reactivación actualiza ingreso y alertas en esa misma tarea, y registra el nuevo ciclo en bitácora.

## CAUSAS.datos: campos JSON adicionales

No se agregan columnas a CAUSAS ni se reescribe automáticamente todo su JSON.

- `preservacion`: estado independiente de remisión. Si falta en una causa legada, se considera sin confirmación; cámaras ya recibidas se reconocen como recibidas. La interfaz lo explicita al editar y guardar.
- `estudiosExcepcionales`: permite autopsia/anatomía patológica en lesiones. Los antecedentes legados relevantes se reconocen al editar para no ocultarlos.
- `listaTestigos[]`: agrega `id`, `estado` y `hora` a los datos existentes. Al editar se conservan o asignan identificadores estables; un testigo sin datos no impide continuar. Las tareas antiguas se deduplican mediante descripción si aún no tienen referencia.

La edición posterior de plantillas no modifica las medidas ordenadas. No se generan recepciones retrospectivas ni se cancela una solicitud por modificar el estado descriptivo de un campo.

## CONFIGURACION: cinco claves nuevas

| Clave | Valor inicial |
|---|---:|
| CAMARAS_CONSERVACION | 30 |
| CAMARAS_PREVENTIVA_1 | 10 |
| CAMARAS_PREVENTIVA_2 | 5 |
| AMPLIACION_MEDICA | 30 |
| ESPECIALISTA | 30 |

Se insertan solo si no existen; se mantienen todos los valores anteriores. Los umbrales de cámaras se expresan como anticipaciones al plazo de referencia y deben respetar primera ≥ segunda, con primera ≤ conservación.

## Evaluaciones existentes

Se recalcula madurez sin eliminar informes ni tareas:

- Una evaluación prematura puede quedar suspendida si falta dictamen principal o prueba necesaria.
- Si corresponde una evaluación y no existía tarea, se crea; si ya había una tarea pendiente se reutiliza.
- Las evaluaciones cumplidas no se reabren por el mero hecho de migrar o editar un dato ajeno.
- Las evaluaciones activas correctas mantienen sus fechas. Las reactivaciones posteriores reciben un nuevo plazo con bitácora.
- Se actualizan los indicadores derivados de CAUSAS cuando resulte necesario, incrementando versión y registrando `Sistema · migración`.

La migración es aditiva, pero Sheets no ofrece transacciones globales para el cambio de esquema. Si Google interrumpe la ejecución mientras agrega columnas, corregir la causa de la interrupción y volver a ejecutar: reconoce los prefijos ya agregados. No borrar columnas ni inicializar otra base para continuar. Ante una inconsistencia de datos, recuperar el respaldo.

## Recuperación

La vía más segura es restaurar una copia completa con el código correspondiente. La versión anterior del programa espera encabezados v1 y no es compatible directamente con las columnas nuevas: no volver a desplegarla sobre la Sheet migrada sin restaurar el respaldo v1. Verificar ID y permisos antes de activar una copia recuperada.
