(() => {
  "use strict";

  const ROOT_CLASS = "turnos-tv-enabled";
  const HISTORY_CLASS = "turnos-tv-has-history";
  const MARK = "data-turnos-tv";
  const MAX_HISTORY = 3;

  // Historial de esta pestaña. No se guarda: al recargar se vuelve a tomar
  // como punto de partida la lista que entrega el sitio.
  let lastCall = null;
  let recentCalls = [];

  function normalizedText(element) {
    return (element?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function findLabel() {
    // El sitio genera clases CSS de Chakra; el texto visible es una referencia
    // más estable para encontrar el encabezado del llamado actual.
    return [...document.querySelectorAll("p")].find((element) =>
      normalizedText(element).toLocaleUpperCase("es").includes("ÚLTIMO LLAMADO")
    );
  }

  function findFooter() {
    return document.querySelector('a[href$="/turnero-totem/config"], a[href$="/config"]');
  }

  function directChildOf(element, ancestor) {
    // Devuelve el bloque de diseño bajo ancestor que contiene a element.
    // Evita depender de la cantidad de wrappers que agrega React/Chakra.
    let current = element;
    while (current?.parentElement && current.parentElement !== ancestor) {
      current = current.parentElement;
    }
    return current?.parentElement === ancestor ? current : null;
  }

  function readPreviousCalls(table) {
    // Si la extensión se carga con llamados ya visibles, usa la tabla del sitio
    // para iniciar el historial; luego sigue los cambios del llamado actual.
    return [...(table?.rows || [])].map((row) => ({
      turn: normalizedText(row.cells[0]),
      details: normalizedText(row.cells[1])
    })).filter((call) => call.turn).slice(0, MAX_HISTORY);
  }

  function trackCall(turn, details, sourceTable) {
    const current = { turn: normalizedText(turn), details: normalizedText(details) };
    if (!current.turn) return false;

    if (!lastCall) {
      recentCalls = readPreviousCalls(sourceTable);
      lastCall = current;
      return true;
    }

    // La página puede omitir toda la actualización de su tabla al repetir un
    // turno. Aquí se registra igualmente el llamado anterior cuando cambia el
    // turno o el box visible. Dos llamadas consecutivas idénticas no se detectan.
    if (current.turn === lastCall.turn && current.details === lastCall.details) return false;

    recentCalls.unshift(lastCall);
    recentCalls = recentCalls.slice(0, MAX_HISTORY);
    lastCall = current;
    return true;
  }

  function renderPreviousCalls(history, changed) {
    // Tabla propia: React puede reemplazar el contenido de la tabla original.
    // Se reconstruyen las filas solo cuando cambió el historial o falta la tabla.
    let table = history.querySelector('table[data-turnos-tv-owned="history-table"]');
    if (!table) {
      table = document.createElement("table");
      table.setAttribute("data-turnos-tv-owned", "history-table");
      table.setAttribute("role", "table");
      history.append(table);
      changed = true;
    }
    table.setAttribute(MARK, "history-table");
    if (!changed) return;

    const body = document.createElement("tbody");
    for (const call of recentCalls) {
      const row = document.createElement("tr");
      for (const value of [call.turn, call.details]) {
        const cell = document.createElement("td");
        const paragraph = document.createElement("p");
        paragraph.textContent = value; // El texto proviene de la página, nunca se interpreta como HTML.
        cell.append(paragraph);
        row.append(cell);
      }
      body.append(row);
    }
    table.replaceChildren(body);
  }

  function fitTurnText(turn) {
    if (!turn || !document.documentElement.classList.contains(ROOT_CLASS)) return;

    const minimum = 52;
    const maximum = Math.min(176, Math.max(96, window.innerWidth * 0.086));
    let low = minimum;
    let high = maximum;
    let best = minimum;

    // Búsqueda binaria del mayor tamaño que conserva el código completo dentro
    // del recuadro, incluso cuando el identificador del turno es largo.
    for (let step = 0; step < 9; step += 1) {
      const size = (low + high) / 2;
      turn.style.setProperty("--turnos-tv-turn-size", `${size}px`);

      const fitsWidth = turn.scrollWidth <= turn.clientWidth;
      const fitsHeight = turn.scrollHeight <= turn.clientHeight;

      if (fitsWidth && fitsHeight) {
        best = size;
        low = size;
      } else {
        high = size;
      }
    }

    // Un pequeño margen evita que sombras y bordes ópticos rocen los extremos.
    turn.style.setProperty("--turnos-tv-turn-size", `${Math.max(minimum, best - 4)}px`);
  }

  function markLayout() {
    // Reconoce la estructura actual del sitio. Si falta un bloque esencial,
    // apply() deja el diseño original para evitar recortar información.
    const root = document.querySelector("#root");
    const turn = root?.querySelector("h1");
    const details = root?.querySelector("h3");
    const label = findLabel();
    const footer = findFooter();

    if (!root || !turn || !details || !label || !footer) {
      if (normalizedText(root).includes("No hay llamados recientes")) {
        lastCall = null;
        recentCalls = [];
      }
      document.documentElement.classList.remove(HISTORY_CLASS);
      return false;
    }

    // Chakra puede insertar su ColorModeScript como primer hijo de #root
    // durante un nuevo llamado. El contenedor correcto es el hijo directo
    // que realmente contiene el turno, no necesariamente firstElementChild.
    document.querySelectorAll(`[${MARK}]`).forEach((element) => {
      element.removeAttribute(MARK);
    });

    const shell = directChildOf(turn, root);
    const footerBlock = directChildOf(footer, shell) || footer;
    const stage = directChildOf(turn, shell);
    const stageFrame = stage && directChildOf(turn, stage);
    const historyStack = stageFrame && directChildOf(turn, stageFrame);
    const cardSlot = historyStack && directChildOf(turn, historyStack);
    // Excluye nuestra tabla para seguir identificando la tabla original tras
    // cada actualización de React.
    const historyTable = stage?.querySelector('table:not([data-turnos-tv-owned])');
    const history = historyTable?.parentElement;
    const hasHistory = Boolean(historyTable && history?.parentElement === historyStack);
    const information = turn.parentElement;
    const content = information?.parentElement;
    const card = content?.parentElement;

    if (!shell || !stage || !stageFrame || !historyStack || !cardSlot || !card || !content || !information) {
      document.documentElement.classList.remove(HISTORY_CLASS);
      return false;
    }

    const historyChanged = trackCall(turn, details, historyTable);

    root.setAttribute(MARK, "root");
    shell.setAttribute(MARK, "shell");
    stage.setAttribute(MARK, "stage");
    stageFrame.setAttribute(MARK, "stage-frame");
    historyStack.setAttribute(MARK, "history-stack");
    cardSlot.setAttribute(MARK, "card-slot");
    if (hasHistory) {
      history.setAttribute(MARK, "history");
      historyTable.setAttribute(MARK, "history-source");
      renderPreviousCalls(history, historyChanged);
    }
    // Los atributos data-turnos-tv son los únicos puntos de acople del CSS.
    document.documentElement.classList.toggle(HISTORY_CLASS, hasHistory);
    card?.setAttribute(MARK, "card");
    content?.setAttribute(MARK, "content");
    information?.setAttribute(MARK, "information");
    label.parentElement?.setAttribute(MARK, "label");
    turn.setAttribute(MARK, "turn");
    details.setAttribute(MARK, "details");
    footerBlock?.setAttribute(MARK, "footer");
    footer.setAttribute(MARK, "footer-link");
    footer.querySelector("img")?.setAttribute(MARK, "logo");
    footer.querySelector("p")?.setAttribute(MARK, "clock");

    requestAnimationFrame(() => fitTurnText(turn));

    return true;
  }

  let enabled = true;

  function apply() {
    const found = markLayout();
    // El modo TV solo se activa si se reconoció toda la estructura necesaria.
    document.documentElement.classList.toggle(ROOT_CLASS, enabled && found);
  }

  let frame = 0;
  const observer = new MutationObserver(() => {
    // Agrupa varias mutaciones del mismo render en una sola pasada. No se
    // observan atributos para que nuestras marcas no disparen otro ciclo.
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(apply);
  });

  chrome.storage.sync.get({ tvModeEnabled: true }, ({ tvModeEnabled }) => {
    // El interruptor del popup comparte este valor con todas las pestañas.
    enabled = Boolean(tvModeEnabled);
    apply();
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true
    });
  });

  window.addEventListener("resize", () => {
    const turn = document.querySelector(`[${MARK}="turn"]`);
    requestAnimationFrame(() => fitTurnText(turn));
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.tvModeEnabled) {
      enabled = Boolean(changes.tvModeEnabled.newValue);
      apply();
    }
  });
})();
