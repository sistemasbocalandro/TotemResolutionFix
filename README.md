# Turnos TV — Salud Bonaerense

Extensión local de Chrome que adapta la pantalla pública de turnos de Salud Bonaerense a televisores y monitores 16:9.

Versión actual: **1.2.0**.

## Qué muestra

- Una tarjeta grande para **Último llamado**, con el número a la izquierda y la sala y el box a la derecha.
- Una sección de **Llamados anteriores** similar a la original, con los tres cambios recientes más nuevos arriba.
- El pie, el logotipo, el reloj y las animaciones que proporciona el sitio.

El tamaño del número se ajusta al ancho disponible. El diseño también se adapta a pantallas angostas y respeta la preferencia del sistema de reducir animaciones.

## Instalar y actualizar

1. Abrí `chrome://extensions` en Chrome.
2. Activá **Modo desarrollador**.
3. Elegí **Cargar extensión sin empaquetar** y seleccioná la carpeta `src` de este proyecto, que contiene `manifest.json`.
4. Abrí `https://totem-shc.ms.gba.gov.ar/turnero-totem/turnos` y recargá la página.

Después de editar los archivos, pulsá **Recargar** en la tarjeta de Turnos TV dentro de `chrome://extensions` y recargá también la página de turnos. El interruptor **Modo TV** del icono de la extensión permite alternar con la presentación original sin reinstalarla.

## Cómo funciona el historial

En las pruebas, la tabla original del sitio no avanzó cuando se volvió a llamar a un número que ya figuraba en ella. Por eso, mientras la pestaña está abierta, la extensión observa el **Último llamado** y guarda los tres llamados que lo precedieron. El orden mostrado es del más reciente al más antiguo e incluye números repetidos.

Al abrir o recargar la página, el historial empieza con las filas que entrega el sitio. Los llamados omitidos antes de abrir la extensión no se pueden recuperar. Dos llamados consecutivos con el mismo número, sala y box tampoco se pueden distinguir si el contenido visible no cambia. El historial se mantiene en memoria de la pestaña; no se envía a un servidor ni se guarda en Chrome. En `chrome.storage.sync` solo se conserva el estado del interruptor.

## Archivos

| Archivo | Función |
| --- | --- |
| `src/manifest.json` | Declara la extensión Manifest V3, el permiso de almacenamiento y la página donde se inyecta. |
| `src/turnos-tv.js` | Reconoce los bloques del sitio, registra llamados, prepara la tabla y ajusta el tamaño del número. |
| `src/turnos-tv.css` | Distribuye la tarjeta principal, la lista y el pie; contiene los estilos adaptables. |
| `src/popup.html`, `src/popup.js`, `src/popup.css` | Implementan el interruptor Modo TV. |

El script marca los bloques reconocidos con `data-turnos-tv`; el CSS usa esas marcas en lugar de depender de las clases generadas por Chakra. Si el script no encuentra la estructura esencial, deja la página con su diseño original. Los cambios de la página se procesan con `MutationObserver` y se agrupan en un cuadro de animación.

La extensión solo se ejecuta en `https://totem-shc.ms.gba.gov.ar/turnero-totem/turnos*`.
