"""Regenera la ayuda HTML y su ZIP con fuentes explícitas. Solo biblioteca estándar."""
from pathlib import Path
from io import BytesIO
import base64
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
fuentes = sorted(p for p in ROOT.iterdir() if p.suffix in ('.gs', '.html') and p.name != 'Instalador.html')
fuentes += [ROOT / n for n in ('appsscript.json', 'README.md', 'MIGRACION.md', 'VALIDACION.md')]
contenido = {p.name: p.read_text(encoding='utf-8') for p in fuentes}
extras = sorted((ROOT / 'pruebas').glob('*.cjs')) + [ROOT / 'pruebas/RESULTADOS.txt', Path(__file__).resolve()]
archivo = BytesIO()
with zipfile.ZipFile(archivo, 'w', zipfile.ZIP_DEFLATED) as paquete:
    for p in sorted(fuentes + extras):
        info = zipfile.ZipInfo('ufij22-gas/' + p.relative_to(ROOT).as_posix())
        info.compress_type = zipfile.ZIP_DEFLATED
        paquete.writestr(info, p.read_bytes())
datos = json.dumps(contenido, ensure_ascii=False).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
zip_b64 = base64.b64encode(archivo.getvalue()).decode('ascii')
plantilla = '''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UFIJ 22 · Instalación y actualización</title><style>
*{box-sizing:border-box}body{font:15px/1.5 Arial,sans-serif;color:#1e3443;background:#f3f6f8;margin:0}header{background:#17384d;color:white;padding:28px 5%}header p{color:#c8d9e5;margin-bottom:0}main{max-width:1200px;margin:auto;padding:25px}section{background:white;border:1px solid #dce3e8;border-radius:7px;padding:24px;margin-bottom:20px}h1{font-size:25px;margin:0}h2{font-size:19px;margin-top:0}button,select{font:inherit;padding:10px 15px;border:1px solid #bdcad4;border-radius:5px;background:white;color:#17384d;cursor:pointer}button.principal{background:#17384d;color:white}select{min-width:230px}textarea{display:block;width:100%;height:480px;margin-top:20px;font:13px/1.5 Consolas,monospace;padding:16px;color:#263d4c;border:1px solid #c5d1db;border-radius:5px;white-space:pre;tab-size:2}li{margin:8px 0}small{color:#607582}.acciones{display:flex;gap:10px;flex-wrap:wrap;align-items:center}#estado{color:#286b51;font-weight:bold}@media(max-width:600px){main{padding:12px}section{padding:18px}h1{font-size:21px}textarea{height:440px}select{width:100%}}
</style><header><h1>UFIJ N.º 22 QUILMES</h1><p>Agente de triaje y gestión de prueba · Seguimiento activo</p></header><main><section><h2>Actualizar la instalación existente</h2><p>Respaldar primero la Sheet y conservar su ID. Este archivo no accede a Google ni contiene credenciales; permite copiar el código y descargar el proyecto.</p><ol><li>Copiar los archivos actualizados al mismo proyecto Apps Script.</li><li>Configurar <strong>USUARIAS_EMAILS</strong> en propiedades privadas, con cada nombre y su cuenta Google institucional. No publicar correos reales en el código.</li><li>Ejecutar <strong>migrar_</strong> desde el editor. Agrega columnas y configuración sin borrar datos. Leer MIGRACION.md antes de ejecutarla.</li><li>Implementar una nueva versión de la misma Web App, ejecutada por la usuaria que accede. Mantener la URL /exec y recargar.</li></ol><p>Para una base nueva, seguir el README: crear la Sheet vinculada y ejecutar inicializar_. Cargar datos ficticios solo en una base vacía de demostración.</p><div class="acciones"><button class="principal" id="zip">Descargar proyecto completo (.zip)</button><small>Incluye código, documentación, migración y pruebas sin dependencias.</small></div></section><section><h2>Consultar y copiar archivos</h2><div class="acciones"><select id="archivo" aria-label="Archivo"></select><button id="copiar">Copiar contenido</button><button id="descargar">Descargar archivo</button><span id="estado" role="status"></span></div><textarea id="codigo" readonly aria-label="Contenido del archivo" spellcheck="false"></textarea></section><section><h2>Verificación</h2><p>El detalle de las pruebas está en VALIDACION.md y los resultados en el ZIP. Los servicios de Google fueron simulados; la autorización, migración y concurrencia reales requieren validación institucional.</p><p>La propuesta de despacho permanece en el navegador. Las decisiones corresponden a la Fiscalía. Todos los plazos son días corridos.</p></section></main><script>
const archivos=__FILES__;
const zip='__ZIP__';
const selector=document.querySelector('#archivo'),codigo=document.querySelector('#codigo'),estado=document.querySelector('#estado');
const orden=['README.md','MIGRACION.md','Code.gs','Modelo.gs','Repositorio.gs','Reglas.gs','Servicios.gs','DatosPrueba.gs','PruebasGoogle.gs','Index.html','Estilos.html','Cliente.html','Despacho.html','appsscript.json','VALIDACION.md'];
for(const nombre of orden){const o=document.createElement('option');o.value=nombre;o.textContent=nombre;selector.appendChild(o);}
function mostrar(){codigo.value=archivos[selector.value];estado.textContent='';}selector.addEventListener('change',mostrar);mostrar();
function guardar(nombre,bytes,tipo){const url=URL.createObjectURL(new Blob([bytes],{type:tipo}));const a=document.createElement('a');a.href=url;a.download=nombre;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
document.querySelector('#descargar').onclick=()=>guardar(selector.value,codigo.value,'text/plain;charset=utf-8');
document.querySelector('#zip').onclick=()=>guardar('ufij22-seguimiento-activo.zip',Uint8Array.from(atob(zip),x=>x.charCodeAt(0)),'application/zip');
document.querySelector('#copiar').onclick=async()=>{try{await navigator.clipboard.writeText(codigo.value);estado.textContent='Contenido copiado.';}catch(e){codigo.focus();codigo.select();estado.textContent=document.execCommand('copy')?'Contenido copiado.':'Contenido seleccionado: pulsar Ctrl+C.';}};
</script></html>'''
(ROOT / 'Instalador.html').write_text(plantilla.replace('__FILES__', datos).replace('__ZIP__', zip_b64), encoding='utf-8')
print('Instalador regenerado con', len(contenido), 'archivos de consulta y', len(fuentes + extras), 'archivos en el ZIP.')
