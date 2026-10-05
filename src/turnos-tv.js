(() => {
  "use strict";

  const ROOT_CLASS = "turnos-tv-enabled";
  const MARK = "data-turnos-tv";

  function normalizedText(element) {
    return (element?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function findLabel() {
    return [...document.querySelectorAll("p")].find((element) =>
      normalizedText(element).toLocaleUpperCase("es").includes("ÚLTIMO LLAMADO")
    );
  }

  function findFooter() {
    return document.querySelector('a[href$="/turnero-totem/config"], a[href$="/config"]');
  }

  function directChildOf(element, ancestor) {
    let current = element;
    while (current?.parentElement && current.parentElement !== ancestor) {
      current = current.parentElement;
    }
    return current?.parentElement === ancestor ? current : null;
  }

  function fitTurnText(turn) {
    if (!turn || !document.documentElement.classList.contains(ROOT_CLASS)) return;

    const minimum = 52;
    const maximum = Math.min(176, Math.max(96, window.innerWidth * 0.086));
    let low = minimum;
    let high = maximum;
    let best = minimum;

    // Busca el mayor tamaño que conserva todo el código dentro del recuadro.
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
    const root = document.querySelector("#root");
    const turn = root?.querySelector("h1");
    const details = root?.querySelector("h3");
    const label = findLabel();
    const footer = findFooter();

    if (!root || !turn || !details || !label || !footer) return false;

    // Chakra puede insertar su ColorModeScript como primer hijo de #root
    // durante un nuevo llamado. El contenedor correcto es el hijo directo
    // que realmente contiene el turno, no necesariamente firstElementChild.
    document.querySelectorAll(`[${MARK}]`).forEach((element) => {
      element.removeAttribute(MARK);
    });

    const shell = directChildOf(turn, root);
    const footerBlock = directChildOf(footer, shell) || footer;
    const stage = directChildOf(turn, shell);
    const information = turn.parentElement;
    const content = information?.parentElement;
    const card = content?.parentElement;

    root.setAttribute(MARK, "root");
    shell?.setAttribute(MARK, "shell");
    stage?.setAttribute(MARK, "stage");
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

  function apply(enabled) {
    markLayout();
    document.documentElement.classList.toggle(ROOT_CLASS, enabled);
  }

  let frame = 0;
  const observer = new MutationObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(markLayout);
  });

  chrome.storage.sync.get({ tvModeEnabled: true }, ({ tvModeEnabled }) => {
    apply(Boolean(tvModeEnabled));
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
      apply(Boolean(changes.tvModeEnabled.newValue));
    }
  });
})();
