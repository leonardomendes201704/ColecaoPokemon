(function () {
  const store = window.PokemonCollectionStore;

  function indexPath() {
    return location.pathname.includes("/Templates/") ? "../index.html" : "index.html";
  }

  function favoritesPath() {
    return location.pathname.includes("/Templates/") ? "favoritos.html" : "Templates/favoritos.html";
  }

  function bindNavigation() {
    document.querySelectorAll("[data-nav]").forEach((item) => {
      item.addEventListener("click", () => {
        const target = item.dataset.nav === "favorites" ? favoritesPath() : indexPath();
        window.location.href = target;
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
