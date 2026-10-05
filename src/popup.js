const enabled = document.querySelector("#enabled");
const status = document.querySelector("#status");

function render(value) {
  enabled.checked = value;
  status.textContent = value ? "Activo" : "Desactivado";
  status.style.color = value ? "#0c8b96" : "#7a898c";
}

chrome.storage.sync.get({ tvModeEnabled: true }, ({ tvModeEnabled }) => {
  render(Boolean(tvModeEnabled));
});

enabled.addEventListener("change", () => {
  const value = enabled.checked;
  render(value);
  chrome.storage.sync.set({ tvModeEnabled: value });
});
