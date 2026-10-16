# Validación del prototipo — 16 de octubre de 2026

- Leídos `INSTRUCCIONES_PARA_CODEX.txt`, `inventario_propuesto.json` e `inventario_resumen.csv`.
- CSV y JSON: 25 identificadores coincidentes, sin repetidos.
- Nueve contenedores con sus códigos originales: MU-01, MU-02, MU-03, SO-01, PR-01, PR-02, BG-01, BG-02 y ML-01.
- Fotografías originales comparadas byte a byte con la versión Git existente: sin cambios.
- Seis fichas con foto real, dieciséis fichas con referencia descargada (quince archivos distintos) y tres marcadores ilustrativos. No se generaron fotografías artificiales.
- JBL EON 615 separado de los 25 tipos, sin asignación a cajas o bolsas.
- Todas las cantidades del JSON continúan en null. Los números de las fichas expresan tipos propuestos, no existencias.
- Búsqueda de los 25 nombres: encuentra el tipo y su contenedor. Comprobados también acentos, filtros por área, estado sin resultados y restablecimiento.
- Apertura de las nueve fichas, regreso, Escape, ciclo de foco con Tab/Shift+Tab y restauración del foco al cerrar.
- Todas las imágenes decodificadas y respuestas HTTP correctas desde `/Cal-almacen-produccion/`, incluidos JSON, scripts, CSS y referencias locales. Sin dependencia de enlaces remotos para las imágenes.
- Anchos 375, 390, 430 y 1440 px: sin desbordamiento horizontal en listado y ficha. Revisión visual de las capturas móvil y escritorio.
- Sin errores de JavaScript durante la verificación.

## Límites pendientes de revisión

Los contenidos siguen siendo preliminares. Deben confirmarse existencia, cantidades, modelos, significado de C/P y asociaciones indicadas en el JSON. Los registros similares no prueban que existan unidades distintas.

Faltan referencias fotográficas adecuadas para MU-02-I03 (patch corto), SO-01-I03 (unión XLR) y BG-01-I02 (parante robusto para parlante). Se usó el marcador neutro permitido en las instrucciones. Las búsquedas y razones se documentan en `assets/items/CREDITOS.md`.

La compatibilidad de rutas con GitHub Pages se probó en un servidor local con la misma estructura de subruta. No se verificó un despliegue real porque esta versión no se ha publicado. No se realizó commit ni push.
