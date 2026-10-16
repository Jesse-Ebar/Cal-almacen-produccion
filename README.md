# Cal-almacen-produccion
Catálogo digital de equipos y guía de almacenamiento para el área de producción en Cal

## Prototipo de presentación

La pantalla principal conserva los nueve contenedores y sus fotografías reales. Cada ficha muestra los tipos de objetos propuestos en `inventario_propuesto.json`. El CSV es un resumen de revisión: no se carga por separado para evitar duplicar registros.

- 25 tipos de objetos propuestos, sin cantidades de existencias.
- 6 fichas reutilizan fotografías reales; 16 usan referencias de Wikimedia Commons; 3 muestran un marcador ilustrativo pendiente.
- El JBL EON 615 se presenta por separado, sin contenedor asignado.
- Una foto real no confirma la asociación con un contenedor. Las relaciones propuestas y la existencia no confirmada se indican por separado.
- Los tipos similares se mantienen como entradas de la propuesta; no implican equipos físicos distintos ni un conteo de unidades.

## Vista local

Desde la raíz del proyecto, ejecutar `python -m http.server 8000 --bind 127.0.0.1` y abrir `http://localhost:8000/`. El catálogo carga el JSON por HTTP; no abrir `index.html` con `file://`.

GitHub Pages puede servir estos archivos estáticos sin compilación. Mantener `index.html`, `styles.css`, `catalog.js`, `app.js`, `inventario_propuesto.json` y `assets/items/` en sus rutas relativas actuales. No se ha publicado esta versión.

## Fotografías y atribuciones

Las fotos originales permanecen incrustadas en `catalog.js`. Las referencias externas están descargadas en `assets/items/`, con crédito y licencia visibles en cada ficha y documentados en `assets/items/CREDITOS.md`. Los modelos, marcas y conectores de las referencias no identifican equipos reales de CAL ni certifican compatibilidad eléctrica.

## Verificación

`scripts/verify.cjs` comprueba datos, fotos originales, búsquedas, filtros, navegación con teclado, imágenes y tamaños responsive mediante un servidor local con subruta `/Cal-almacen-produccion/`. Requiere Node, Playwright disponible en el entorno de desarrollo y Microsoft Edge; no añade dependencias al sitio. Ejecutar `node scripts/verify.cjs` con Playwright resoluble mediante `NODE_PATH` si está instalado fuera del proyecto.

Las capturas `previews/presentation-*.png` muestran el catálogo y `previews/contents-*.png` muestran una ficha de contenedor. Detalles de la revisión en `VALIDACION.md`.
