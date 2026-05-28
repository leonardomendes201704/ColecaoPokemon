(function () {
  const store = window.PokemonCollectionStore;
  const formatter = new Intl.NumberFormat("pt-BR");

  function indexPath() {
    return location.pathname.includes("/Templates/") ? "../index.html" : "index.html";
  }

  function profilePath() {
    return location.pathname.includes("/Templates/") ? "perfil.html" : "Templates/perfil.html";
  }

  function searchPath() {
    return location.pathname.includes("/Templates/") ? "busca.html" : "Templates/busca.html";
  }

  function cardImagePath(fileName) {
    if (/^https?:\/\//i.test(fileName || "")) return fileName;
    return `${location.pathname.includes("/Templates/") ? "../" : ""}${fileName}`;
  }

  function ensureModal() {
    let modal = document.querySelector(".card-modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "card-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="card-modal-backdrop" data-close-card-modal></div>
      <section class="card-modal-panel" role="dialog" aria-modal="true" aria-labelledby="favoriteCardModalTitle">
        <button class="card-modal-close" type="button" aria-label="Fechar" data-close-card-modal>×</button>
        <img class="card-modal-image" alt="">
        <div class="card-modal-info">
          <p class="card-modal-number"></p>
          <h2 id="favoriteCardModalTitle" class="card-modal-title"></h2>
          <p class="card-modal-meta"></p>
        </div>
      </section>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll("[data-close-card-modal]").forEach((button) => {
      button.addEventListener("click", closeCardModal);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCardModal();
    });
    return modal;
  }

  function closeCardModal() {
    const modal = document.querySelector(".card-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  function openCardModal(card) {
    const modal = ensureModal();
    const image = modal.querySelector(".card-modal-image");
    image.src = card.image ? cardImagePath(card.image) : "";
    image.alt = card.name;
    modal.querySelector(".card-modal-number").textContent = `${card.number} • ${card.rarity}${card.variant ? ` • ${card.variant}` : ""}`;
    modal.querySelector(".card-modal-title").textContent = card.name;
    modal.querySelector(".card-modal-meta").textContent = card.collectionName;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector(".card-modal-close").focus();
  }

  function bindNavigation() {
    document.querySelectorAll("[data-nav]").forEach((item) => {
      item.addEventListener("click", () => {
        const target = {
          home: indexPath(),
          collections: indexPath(),
          search: searchPath(),
          profile: profilePath()
        }[item.dataset.nav];
        if (target) window.location.href = target;
      });
    });
  }

  function cardTemplate(card) {
    const article = document.createElement("article");
    article.className = "favorite-card";
    const art = card.image
      ? `<img src="${cardImagePath(card.image)}" alt="${card.name}">`
      : `<span>${card.number}</span>`;

    article.innerHTML = `
      <button class="favorite-open" type="button" aria-label="Visualizar ${card.name}">
        <div class="favorite-art">${art}</div>
        <div class="favorite-info">
          <p class="favorite-number">${card.number}${card.variant ? ` • ${card.variant}` : ""}</p>
          <h2 class="favorite-name">${card.name}</h2>
          <p class="favorite-collection">${card.collectionName}</p>
        </div>
      </button>
      <button class="favorite-remove" type="button" aria-label="Remover dos favoritos" title="Remover dos favoritos">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
      </button>
    `;

    article.querySelector(".favorite-open").addEventListener("click", () => {
      openCardModal(card);
    });
    article.querySelector(".favorite-remove").addEventListener("click", async () => {
      await store.toggleCardFavorite(card.collectionId, card.id);
      render();
    });
    return article;
  }

  async function render() {
    const cards = await store.listFavoriteCards();
    const count = document.querySelector("[data-favorites-count]");
    const grid = document.querySelector(".favorites-grid");

    if (count) count.textContent = formatter.format(cards.length);
    if (!grid) return;

    grid.innerHTML = "";
    if (cards.length === 0) {
      grid.innerHTML = `<p class="empty-state">Nenhuma carta favorita ainda.</p>`;
      return;
    }

    cards.forEach((card) => grid.appendChild(cardTemplate(card)));
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindNavigation();
    render();
  });
}());
