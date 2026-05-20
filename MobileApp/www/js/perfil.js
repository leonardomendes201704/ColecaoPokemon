(function () {
  const store = window.PokemonCollectionStore;

  function indexPath() {
    return location.pathname.includes("/Templates/") ? "../index.html" : "index.html";
  }

  function bindNavigation() {
    document.querySelectorAll("[data-nav='home'], [data-nav='collections']").forEach((item) => {
      item.addEventListener("click", () => {
        window.location.href = indexPath();
      });
    });
  }

  function renderPersistenceInfo() {
    const info = store.getPersistenceInfo();
    const device = document.querySelector("[data-device-id]");
    const mode = document.querySelector("[data-persistence-mode]");
    if (device) device.textContent = info.deviceId;
    if (mode) mode.textContent = "Neste dispositivo";
  }

  function bindReset() {
    const button = document.querySelector("[data-clear-data]");
    const message = document.querySelector("[data-clear-message]");
    if (!button) return;

    button.addEventListener("click", () => {
      const confirmed = window.confirm("Limpar cartas obtidas, duplicatas e progresso deste dispositivo?");
      if (!confirmed) return;

      store.resetLocalCollection();
      if (message) message.textContent = "Dados locais limpos. A coleção voltou ao estado inicial.";
      window.setTimeout(() => {
        window.location.href = indexPath();
      }, 900);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindNavigation();
    bindReset();
    renderPersistenceInfo();
  });
}());
