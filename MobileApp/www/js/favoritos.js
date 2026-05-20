(function () {
  const store = window.PokemonCollectionStore;
  const formatter = new Intl.NumberFormat("pt-BR");

  function indexPath() {
    return location.pathname.includes("/Templates/") ? "../index.html" : "index.html";
  }

  function profilePath() {
    return location.pathname.includes("/Templates/") ? "perfil.html" : "Templates/perfil.html";
  }

  function collectionPath(collectionId) {
    const prefix = location.pathname.includes("/Templates/") ? "" : "Templates/";
    return `${prefix}view-colecao.html?collection=${encodeURIComponent(collectionId)}`;
  }

  function cardImagePath(fileName) {
    return `${location.pathname.includes("/Templates/") ? "../" : ""}${fileName}`;
  }

  function bindNavigation() {
    document.querySelectorAll("[data-nav]").forEach((item) => {
      item.addEventListener("click", () => {
        const target = {
          home: indexPath(),
          collections: indexPath(),
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
      <button class="favorite-open" type="button" aria-label="Abrir ${card.collectionName}">
        <div class="favorite-art">${art}</div>
        <div class="favorite-info">
          <p class="favorite-number">${card.number}</p>
          <h2 class="favorite-name">${card.name}</h2>
          <p class="favorite-collection">${card.collectionName}</p>
        </div>
      </button>
      <button class="favorite-remove" type="button" aria-label="Remover dos favoritos" title="Remover dos favoritos">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
      </button>
    `;

    article.querySelector(".favorite-open").addEventListener("click", () => {
      window.location.href = collectionPath(card.collectionId);
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
