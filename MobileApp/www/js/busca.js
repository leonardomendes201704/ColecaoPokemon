(function () {
  const store = window.PokemonCollectionStore;
  let allCards = [];
  let searchTerm = "";
  let exchangeRates = { USD: 5.10, EUR: 5.55 };

  function indexPath() {
    return location.pathname.includes("/Templates/") ? "../index.html" : "index.html";
  }

  function templatePath(fileName) {
    return location.pathname.includes("/Templates/") ? fileName : `Templates/${fileName}`;
  }

  function cardImagePath(fileName) {
    if (/^https?:\/\//i.test(fileName || "")) return fileName;
    return `${location.pathname.includes("/Templates/") ? "../" : ""}${fileName}`;
  }

  function bindNavigation() {
    document.querySelectorAll("[data-nav]").forEach((item) => {
      item.addEventListener("click", () => {
        const target = {
          home: indexPath(),
          collections: indexPath(),
          favorites: templatePath("favoritos.html"),
          profile: templatePath("perfil.html")
        }[item.dataset.nav];
        if (target) window.location.href = target;
      });
    });
  }

  async function refreshExchangeRates() {
    try {
      const cached = JSON.parse(localStorage.getItem("colecao-pokemon:exchange-rates") || "null");
      const twelveHours = 12 * 60 * 60 * 1000;
      if (cached && Date.now() - cached.timestamp < twelveHours) {
        exchangeRates = cached.rates;
        return;
      }

      const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL,EUR", { cache: "no-cache" });
      if (!response.ok) throw new Error(`Cotação ${response.status}`);
      const payload = await response.json();
      const usdToBrl = payload.rates && payload.rates.BRL;
      const usdToEur = payload.rates && payload.rates.EUR;
      if (typeof usdToBrl === "number") {
        exchangeRates = {
          USD: usdToBrl,
          EUR: typeof usdToEur === "number" && usdToEur > 0 ? usdToBrl / usdToEur : exchangeRates.EUR
        };
        localStorage.setItem("colecao-pokemon:exchange-rates", JSON.stringify({
          timestamp: Date.now(),
          rates: exchangeRates
        }));
      }
    } catch (error) {
      console.warn("Não foi possível atualizar a cotação; usando fallback local.", error);
    }
  }

  function priceInBrl(card) {
    if (!card.marketPrice || !card.marketCurrency) return "Valor indisponível";
    const rate = exchangeRates[card.marketCurrency];
    const value = rate ? card.marketPrice * rate : card.marketPrice;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: rate ? "BRL" : card.marketCurrency
    }).format(value);
  }

  function formatPriceDetail(card) {
    if (!card.marketPrice || !card.marketCurrency) return "Valor indisponível";
    const original = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: card.marketCurrency
    }).format(card.marketPrice);
    return `${priceInBrl(card)} (${original})`;
  }

  function rarityClass(rarity) {
    return {
      COMUM: "common",
      Common: "common",
      Uncommon: "",
      RARA: "rare",
      Rare: "rare",
      ÉPICA: "epic",
      "Illustration Rare": "epic",
      SECRETA: "secret"
    }[rarity] || "";
  }

  function rarityStars(rarity) {
    const text = String(rarity || "").toLowerCase();
    if (/secret|secreta|special|hyper/.test(text)) return "★★★★★";
    if (/illustration|ultra|epic|épica/.test(text)) return "★★★★";
    if (/rare|rara/.test(text)) return "★★★";
    if (/uncommon|incomum/.test(text)) return "★★";
    return "★";
  }

  function cardNumberValue(card) {
    const value = Number(String(card.number || "").replace(/\D/g, ""));
    return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
  }

  function matchesSearch(card) {
    const term = searchTerm.trim().toLocaleLowerCase("pt-BR");
    if (!term) return false;

    const number = String(card.number || "").toLocaleLowerCase("pt-BR");
    const name = String(card.name || "").toLocaleLowerCase("pt-BR");
    const collection = String(card.collectionName || "").toLocaleLowerCase("pt-BR");
    const variant = String(card.variant || "").toLocaleLowerCase("pt-BR");
    const normalizedNumber = number.replace(/^0+/, "");
    const normalizedTerm = term.replace(/^0+/, "");

    return number.includes(term)
      || normalizedNumber.includes(normalizedTerm)
      || name.includes(term)
      || collection.includes(term)
      || variant.includes(term);
  }

  function filteredCards() {
    const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });
    return allCards
      .filter(matchesSearch)
      .sort((a, b) => collator.compare(a.collectionName || "", b.collectionName || "")
        || cardNumberValue(a) - cardNumberValue(b)
        || collator.compare(a.name || "", b.name || ""))
      .slice(0, 120);
  }

  function ensureModal() {
    let modal = document.querySelector(".card-modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "card-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="card-modal-backdrop" data-close-card-modal></div>
      <section class="card-modal-panel" role="dialog" aria-modal="true" aria-labelledby="searchCardModalTitle">
        <button class="card-modal-close" type="button" aria-label="Fechar" data-close-card-modal>×</button>
        <img class="card-modal-image" alt="">
        <div class="card-modal-info">
          <p class="card-modal-number"></p>
          <h2 id="searchCardModalTitle" class="card-modal-title"></h2>
          <p class="card-modal-price"></p>
          <p class="card-modal-status"></p>
        </div>
        <div class="card-modal-actions"></div>
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

  function actionButton(label, className, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function openCardModal(card) {
    const modal = ensureModal();
    const image = modal.querySelector(".card-modal-image");
    const actions = modal.querySelector(".card-modal-actions");
    image.src = card.image ? cardImagePath(card.image) : "";
    image.alt = card.name;
    modal.querySelector(".card-modal-number").textContent = `${card.collectionName} • ${card.number} • ${card.rarity}${card.variant ? ` • ${card.variant}` : ""}`;
    modal.querySelector(".card-modal-title").textContent = card.name;
    modal.querySelector(".card-modal-price").textContent = formatPriceDetail(card);
    modal.querySelector(".card-modal-status").textContent = card.quantity > 0 ? `${card.quantity} na coleção` : "Nova carta";

    actions.innerHTML = "";
    if (card.quantity > 0) {
      actions.className = "card-modal-actions two-actions";
      actions.appendChild(actionButton("Remover", "modal-btn secondary", async () => {
        await store.removeCardCopy(card.collectionId, card.id);
        closeCardModal();
        render();
      }));
      actions.appendChild(actionButton("Adicionar +1", "modal-btn primary", async () => {
        await store.addCardCopy(card.collectionId, card.id);
        closeCardModal();
        render();
      }));
    } else {
      actions.className = "card-modal-actions";
      actions.appendChild(actionButton("Confirmar", "modal-btn primary", async () => {
        await store.addCardCopy(card.collectionId, card.id);
        closeCardModal();
        render();
      }));
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector(".card-modal-close").focus();
  }

  function cardTemplate(card, index) {
    const article = document.createElement("article");
    article.className = "pokemon-card";
    const favoriteLabel = card.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos";
    const favoriteButton = card.owned ? `
      <button class="favorite-card-btn ${card.favorite ? "is-favorite" : ""}" type="button" aria-label="${favoriteLabel}" title="${favoriteLabel}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
      </button>
    ` : "";
    const artContent = card.owned && card.image
      ? `<img src="${cardImagePath(card.image)}" alt="${card.name}">`
      : `<span class="card-art-number">${card.number}</span>`;
    const quantityBadge = card.quantity > 1 ? `<span class="quantity-badge">x${card.quantity}</span>` : "";

    article.innerHTML = `
      <button class="card-art art-${(index % 9) + 1}" type="button" aria-label="Abrir ${card.name}">
        ${artContent}
        ${quantityBadge}
      </button>
      ${favoriteButton}
      <div class="card-info">
        <p class="card-number">${card.number}${card.variant ? ` • ${card.variant}` : ""}</p>
        <h2 class="card-name">${card.name}</h2>
        <p class="card-collection">${card.collectionName}</p>
        <div class="card-meta-row">
          <span class="rarity ${rarityClass(card.rarity)}" aria-label="${card.rarity}" title="${card.rarity}">${rarityStars(card.rarity)}</span>
          <span class="card-price">${priceInBrl(card)}</span>
        </div>
      </div>
    `;
    article.querySelector(".card-art").addEventListener("click", () => openCardModal(card));
    const favorite = article.querySelector(".favorite-card-btn");
    if (favorite) {
      favorite.addEventListener("click", async (event) => {
        event.stopPropagation();
        await store.toggleCardFavorite(card.collectionId, card.id);
        render();
      });
    }
    return article;
  }

  async function render() {
    allCards = await store.listAllCards();
    const grid = document.querySelector(".cards-grid");
    const meta = document.querySelector("[data-result-meta]");
    if (!grid) return;

    const visibleCards = filteredCards();
    grid.innerHTML = "";

    if (!searchTerm.trim()) {
      if (meta) meta.textContent = "Digite para buscar em todas as coleções.";
      grid.innerHTML = `<p class="empty-state">Busque por número, nome da carta ou nome da coleção.</p>`;
      return;
    }

    if (meta) meta.textContent = `${visibleCards.length} resultado${visibleCards.length === 1 ? "" : "s"} encontrado${visibleCards.length === 1 ? "" : "s"}.`;
    if (visibleCards.length === 0) {
      grid.innerHTML = `<p class="empty-state">Nenhuma carta encontrada.</p>`;
      return;
    }

    visibleCards.forEach((card, index) => grid.appendChild(cardTemplate(card, index)));
  }

  function bindSearch() {
    const input = document.querySelector("[data-global-search]");
    if (!input) return;
    input.addEventListener("input", () => {
      searchTerm = input.value;
      render();
    });
    input.focus();
  }

  async function refreshMarketData() {
    try {
      const collections = await store.listCollections();
      await Promise.all(collections.map((collection) => store.refreshCollectionPrices(collection.id).catch(() => null)));
      render();
    } catch (error) {
      console.warn("Não foi possível atualizar valores na busca global.", error);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindNavigation();
    bindSearch();
    refreshExchangeRates().then(render).then(refreshMarketData);
  });
}());
