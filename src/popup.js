const enabled = document.querySelector("#enabled");
const status = document.querySelector("#status");

// Mantiene el texto y el estado visual del interruptor en una sola función.
function render(value) {
  enabled.checked = value;
  status.textContent = value ? "Activo" : "Desactivado";
  status.style.color = value ? "#0c8b96" : "#7a898c";
}

chrome.storage.sync.get({ tvModeEnabled: true }, ({ tvModeEnabled }) => {
  // El modo TV está activado por defecto hasta que el usuario lo cambie.
  render(Boolean(tvModeEnabled));
});

enabled.addEventListener("change", () => {
  const value = enabled.checked;
  render(value);
  // turnos-tv.js escucha este cambio y aplica el modo sin recargar la página.
  chrome.storage.sync.set({ tvModeEnabled: value });
});
