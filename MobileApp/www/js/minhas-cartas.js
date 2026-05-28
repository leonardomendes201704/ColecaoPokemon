(function () {
  const store = window.PokemonCollectionStore;
  const formatter = new Intl.NumberFormat("pt-BR");
  let exchangeRates = { USD: 5.10, EUR: 5.55 };

  function assetPath(fileName) {
    return `${location.pathname.includes("/Templates/") ? "../" : ""}Imagens/${fileName}`;
  }

  function viewPath(collectionId) {
    const prefix = location.pathname.includes("/Templates/") ? "" : "Templates/";
    return `${prefix}view-colecao.html?collection=${encodeURIComponent(collectionId)}`;
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

  function collectionValueInBrl(collection) {
    const totals = collection.valueByCurrency || {};
    return Object.entries(totals).reduce((sum, [currency, value]) => {
      const rate = exchangeRates[currency];
      return sum + (rate ? value * rate : value);
    }, 0);
  }

  function formatBrlValue(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value || 0);
  }

  function countUp(id, targetValue) {
    const node = document.getElementById(id);
    if (!node) return;

    const target = Number(targetValue) || 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || target === 0) {
      node.textContent = formatter.format(target);
      return;
    }

    const duration = 700;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = formatter.format(Math.round(target * eased));

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        node.textContent = formatter.format(target);
      }
    }

    node.textContent = formatter.format(0);
    requestAnimationFrame(tick);
  }

  function collectionCard(collection) {
    const percent = Math.round((collection.owned / collection.total) * 100);
    const collectionValue = formatBrlValue(collectionValueInBrl(collection));
    const article = document.createElement("article");
    article.className = "collection-card";
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-label", `Abrir ${collection.name}`);
    article.innerHTML = `
      <div class="image-placeholder collection-cover-image">
        <img src="${assetPath(collection.image)}" alt="${collection.name}">
      </div>
      <div class="collection-info">
        <h3 class="collection-title">${collection.name}</h3>
        <p class="progress-meta"><span>${collection.owned} / ${collection.total}</span><span>${collectionValue}</span></p>
        <div class="progress-bar" aria-label="Progresso de ${collection.name}">
          <span class="progress-fill fill-${collection.theme}" style="width: ${percent}%"></span>
        </div>
      </div>
      <div class="badge badge-${collection.theme}" aria-label="Progresso da coleção">
        <strong>${percent}%</strong>
      </div>
    `;
    const open = () => { window.location.href = viewPath(collection.id); };
    article.addEventListener("click", open);
    article.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") open();
    });
    return article;
  }

  async function render() {
    const [summary, collections] = await Promise.all([
      store.getSummary(),
      store.listCollections()
    ]);

    countUp("totalCartas", summary.totalCards);
    countUp("totalColecoes", summary.totalCollections);
    countUp("totalDuplicadas", summary.duplicated);

    const list = document.querySelector(".collections");
    if (list) {
      list.innerHTML = "";
      collections.forEach((collection) => list.appendChild(collectionCard(collection)));
    }
  }

  function bindBottomNav() {
    document.querySelectorAll("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        const inTemplates = location.pathname.includes("/Templates/");
        const target = {
          profile: `${inTemplates ? "" : "Templates/"}perfil.html`,
          favorites: `${inTemplates ? "" : "Templates/"}favoritos.html`,
          search: `${inTemplates ? "" : "Templates/"}busca.html`,
          home: `${inTemplates ? "../" : ""}index.html`,
          collections: `${inTemplates ? "../" : ""}index.html`
        }[button.dataset.nav];
        if (!target) return;
        window.location.href = target;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindBottomNav();
    refreshExchangeRates().then(render).then(async () => {
      try {
        const collections = await store.listCollections();
        await Promise.all(collections.map((collection) => store.refreshCollectionPrices(collection.id).catch(() => null)));
        render();
      } catch (error) {
        console.warn("Não foi possível atualizar valores das coleções.", error);
      }
    });
  });
}());
