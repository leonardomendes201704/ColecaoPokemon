(function () {
  const store = window.PokemonCollectionStore;
  const params = new URLSearchParams(window.location.search);
  const collectionId = params.get("collection") || "evolucoes-prismaticas";
  let exchangeRates = { USD: 5.10, EUR: 5.55 };
  let activeFilter = "all";
  let currentCards = [];
  let searchTerm = "";
  let sortMode = "number";

  function assetPath(fileName) {
    return `${location.pathname.includes("/Templates/") ? "../" : ""}Imagens/${fileName}`;
  }

  function cardImagePath(fileName) {
    return `${location.pathname.includes("/Templates/") ? "../" : ""}${fileName}`;
  }

  function rarityClass(rarity) {
    return {
      COMUM: "common",
      Common: "common",
      Uncommon: "",
      RARA: "rare",
      Rare: "rare",
      "ÉPICA": "epic",
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

  function formatPrice(card) {
    if (!card.marketPrice || !card.marketCurrency) return "Valor indisponível";
    return priceInBrl(card);
  }

  function formatPriceDetail(card) {
    if (!card.marketPrice || !card.marketCurrency) return "Valor indisponível";
    const original = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: card.marketCurrency
    }).format(card.marketPrice);
    return `${priceInBrl(card)} (${original})`;
  }

  function cardValueInBrl(card) {
    if (!card.marketPrice || !card.marketCurrency) return null;
    const rate = exchangeRates[card.marketCurrency];
    return rate ? card.marketPrice * rate : card.marketPrice;
  }

  function collectionUniqueValue(cards) {
    return cards
      .filter((card) => card.quantity > 0)
      .reduce((total, card) => total + (cardValueInBrl(card) || 0), 0);
  }

  function formatBrlValue(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  }

  function updateText(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function isRareCard(card) {
    return /rare|rara|secreta|secret|epic|épica|illustration|ultra|special/i.test(card.rarity || "");
  }

  function ownedRareCount(cards) {
    return cards.filter((card) => card.quantity > 0 && isRareCard(card)).length;
  }

  function filteredCards(cards) {
    const term = searchTerm.trim().toLocaleLowerCase("pt-BR");
    return cards.filter((card) => {
      if (activeFilter === "owned") return card.quantity > 0;
      if (activeFilter === "missing") return card.quantity === 0;
      if (activeFilter === "rare") return isRareCard(card);
      if (activeFilter === "reverse") return Boolean(card.reverse || card.isReverse);
      return true;
    }).filter((card) => {
      if (!term) return true;
      const number = String(card.number || "").toLocaleLowerCase("pt-BR");
      const name = String(card.name || "").toLocaleLowerCase("pt-BR");
      const normalizedNumber = number.replace(/^0+/, "");
      const normalizedTerm = term.replace(/^0+/, "");
      return number.includes(term)
        || normalizedNumber.includes(normalizedTerm)
        || name.includes(term);
    });
  }

  function cardNumberValue(card) {
    const value = Number(String(card.number || "").replace(/\D/g, ""));
    return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
  }

  function sortCards(cards) {
    const sorted = [...cards];
    const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

    return sorted.sort((a, b) => {
      if (sortMode === "name") {
        return collator.compare(a.name || "", b.name || "")
          || cardNumberValue(a) - cardNumberValue(b);
      }

      if (sortMode === "price") {
        const priceA = cardValueInBrl(a);
        const priceB = cardValueInBrl(b);
        const valueA = typeof priceA === "number" ? priceA : Number.NEGATIVE_INFINITY;
        const valueB = typeof priceB === "number" ? priceB : Number.NEGATIVE_INFINITY;
        return valueB - valueA
          || cardNumberValue(a) - cardNumberValue(b)
          || collator.compare(a.name || "", b.name || "");
      }

      return cardNumberValue(a) - cardNumberValue(b)
        || collator.compare(a.name || "", b.name || "");
    });
  }

  function renderCards(cards, collection) {
    const grid = document.querySelector(".cards-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const visibleCards = sortCards(filteredCards(cards));
    if (visibleCards.length === 0) {
      grid.innerHTML = `<p class="empty-state">Nenhuma carta nesse filtro.</p>`;
      return;
    }

    visibleCards.forEach((card, index) => grid.appendChild(cardTemplate(card, index, collection.id)));
  }

  function bindFilterChips() {
    const filterByLabel = {
      Todas: "all",
      Obtidas: "owned",
      Faltando: "missing",
      Raras: "rare",
      Reversas: "reverse"
    };

    document.querySelectorAll(".chip").forEach((chip) => {
      const filter = filterByLabel[chip.textContent.trim()];
      if (!filter) return;
      chip.dataset.filter = filter;
      chip.classList.toggle("active", filter === activeFilter);
      chip.addEventListener("click", () => {
        activeFilter = filter;
        document.querySelectorAll(".chip").forEach((item) => {
          item.classList.toggle("active", item.dataset.filter === activeFilter);
        });
        store.getCollection(collectionId).then((collection) => renderCards(currentCards, collection));
      });
    });
  }

  function bindSearch() {
    const search = document.querySelector(".search");
    if (!search) return;

    const input = document.createElement("input");
    input.className = "collection-search-input";
    input.type = "search";
    input.placeholder = "Buscar carta na coleção...";
    input.autocomplete = "off";
    input.inputMode = "search";

    const placeholder = search.querySelector("[data-text-placeholder='search-placeholder']");
    if (placeholder) placeholder.replaceWith(input);
    else search.appendChild(input);

    input.addEventListener("input", () => {
      searchTerm = input.value;
      store.getCollection(collectionId).then((collection) => renderCards(currentCards, collection));
    });
  }

  function bindSortButton() {
    const button = document.querySelector(".sort-btn");
    const label = document.querySelector("[data-sort-label]");
    if (!button || !label) return;

    const modes = ["number", "name", "price"];
    const labels = {
      number: "Nº",
      name: "Nome",
      price: "Preço"
    };
    const ariaLabels = {
      number: "Ordenar por número",
      name: "Ordenar por nome",
      price: "Ordenar por preço"
    };

    function updateSortButton() {
      button.dataset.sortMode = sortMode;
      button.setAttribute("aria-label", ariaLabels[sortMode]);
      label.textContent = labels[sortMode];
    }

    button.addEventListener("click", () => {
      const currentIndex = modes.indexOf(sortMode);
      sortMode = modes[(currentIndex + 1) % modes.length];
      updateSortButton();
      store.getCollection(collectionId).then((collection) => renderCards(currentCards, collection));
    });

    updateSortButton();
  }

  function ensureModal() {
    let modal = document.querySelector(".card-modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "card-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="card-modal-backdrop" data-close-card-modal></div>
      <section class="card-modal-panel" role="dialog" aria-modal="true" aria-labelledby="cardModalTitle">
        <button class="card-modal-close" type="button" aria-label="Fechar" data-close-card-modal>×</button>
        <img class="card-modal-image" alt="">
        <div class="card-modal-info">
          <p class="card-modal-number"></p>
          <h2 id="cardModalTitle" class="card-modal-title"></h2>
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
    updateText(".card-modal-number", `${card.number} • ${card.rarity}`);
    updateText(".card-modal-title", card.name);
    updateText(".card-modal-price", formatPriceDetail(card));
    updateText(".card-modal-status", card.quantity > 0 ? `${card.quantity} na coleção` : "Nova carta");

    actions.innerHTML = "";
    if (card.quantity > 0) {
      actions.className = "card-modal-actions two-actions";
      actions.appendChild(actionButton("Remover", "modal-btn secondary", async () => {
        await store.removeCardCopy(collectionId, card.id);
        closeCardModal();
        render();
      }));
      actions.appendChild(actionButton("Adicionar +1", "modal-btn primary", async () => {
        await store.addCardCopy(collectionId, card.id);
        closeCardModal();
        render();
      }));
    } else {
      actions.className = "card-modal-actions";
      actions.appendChild(actionButton("Confirmar", "modal-btn primary", async () => {
        await store.addCardCopy(collectionId, card.id);
        closeCardModal();
        render();
      }));
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector(".card-modal-close").focus();
  }

  function cardTemplate(card, index, collectionIdValue) {
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
        <p class="card-number">${card.number}</p>
        <h4 class="card-name">${card.name}</h4>
        <div class="card-meta-row">
          <span class="rarity ${rarityClass(card.rarity)}" aria-label="${card.rarity}" title="${card.rarity}">${rarityStars(card.rarity)}</span>
          <span class="card-price">${formatPrice(card)}</span>
        </div>
      </div>
    `;
    article.querySelector("button").addEventListener("click", () => {
      openCardModal(card);
    });
    const favorite = article.querySelector(".favorite-card-btn");
    if (favorite) {
      favorite.addEventListener("click", async (event) => {
        event.stopPropagation();
        await store.toggleCardFavorite(collectionIdValue, card.id);
        render();
      });
    }
    return article;
  }

  async function render() {
    const [collection, cards] = await Promise.all([
      store.getCollection(collectionId),
      store.listCards(collectionId)
    ]);
    currentCards = cards;

    const percent = Math.round((collection.owned / collection.total) * 100);
    document.title = collection.name;
    updateText(".page-title", collection.name);
    updateText("[data-text-placeholder='collection-title']", collection.name);
    updateText("[data-text-placeholder='completion-percent']", `${percent}%`);
    updateText("[data-text-placeholder='completion-count']", `${collection.owned} / ${collection.total} cartas`);
    updateText("[data-text-placeholder='owned-count']", collection.owned);
    updateText("[data-text-placeholder='missing-count']", collection.total - collection.owned);
    updateText("[data-text-placeholder='rare-count']", ownedRareCount(cards));
    updateText("[data-text-placeholder='collection-value']", formatBrlValue(collectionUniqueValue(cards)));

    const cover = document.querySelector("[data-image-placeholder='collection-cover']");
    if (cover) {
      cover.innerHTML = `<img src="${assetPath(collection.image)}" alt="${collection.name}">`;
    }

    const progress = document.querySelector(".hero-card .progress-fill");
    if (progress) progress.style.width = `${percent}%`;

    renderCards(cards, collection);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const back = document.querySelector(".topbar .icon-btn");
    if (back) back.addEventListener("click", () => window.history.length > 1 ? window.history.back() : window.location.href = "../index.html");
    bindFilterChips();
    bindSearch();
    bindSortButton();
    refreshExchangeRates().then(render).then(async () => {
      try {
        const result = await store.refreshCollectionPrices(collectionId);
        if (!result.skipped && result.updated > 0) render();
      } catch (error) {
        console.warn("Não foi possível atualizar valores das cartas.", error);
      }
    });
  });
}());
