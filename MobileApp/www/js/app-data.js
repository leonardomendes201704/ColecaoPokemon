(function () {
  const STORAGE_KEY = "colecao-pokemon:v3";
  const DEVICE_KEY = "colecao-pokemon:device-id";

  function createDeviceId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    const random = Math.random().toString(36).slice(2);
    return `device-${Date.now().toString(36)}-${random}`;
  }

  function getDeviceId() {
    let deviceId = window.localStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      deviceId = createDeviceId();
      window.localStorage.setItem(DEVICE_KEY, deviceId);
    }
    return deviceId;
  }

  const baseCollections = [
    {
      id: "evolucoes-prismaticas",
      name: "Evoluções Prismáticas",
      total: 180,
      owned: 87,
      duplicated: 24,
      rare: 12,
      image: "colecao-evoluções-prismaticas.png",
      theme: "purple",
      artFolder: "evolucoes-prismaticas",
      artCount: 180,
      marketQuery: "set.id:sv8pt5"
    },
    {
      id: "fogo-fantasmagorico",
      name: "Fogo Fantasmagórico",
      total: 130,
      owned: 76,
      duplicated: 18,
      rare: 9,
      image: "colecao-fogo-fantasmagorico.png",
      theme: "orange",
      artFolder: "fogo-fantasmagorico",
      artCount: 130,
      marketQuery: "set.name:\"Phantasmal Flames\""
    },
    {
      id: "parceiros-iniciais",
      name: "Parceiros Iniciais",
      total: 120,
      owned: 90,
      duplicated: 31,
      rare: 15,
      image: "colecao-parceiros-iniciais.png",
      theme: "green"
    },
    {
      id: "sombras-do-eclipse",
      name: "Sombras do Eclipse",
      total: 180,
      owned: 42,
      duplicated: 7,
      rare: 6,
      image: "colecao-sombras-do-eclipse.png",
      theme: "blue"
    }
  ];

  const rarities = ["COMUM", "INCOMUM", "RARA", "ÉPICA", "SECRETA"];

  function buildCards(collection) {
    const total = collection.artCount || Math.min(collection.total, 24);
    return Array.from({ length: total }, (_, index) => {
      const number = String(index + 1).padStart(3, "0");
      const quantity = 0;
      return {
        id: `${collection.id}-${number}`,
        number,
        name: `Carta ${number}`,
        rarity: rarities[index % rarities.length],
        quantity,
        owned: quantity > 0,
        image: collection.artFolder ? `cartas/${collection.artFolder}/${number}.png` : null,
        marketPrice: null,
        marketCurrency: null,
        marketSource: null,
        marketUpdatedAt: null
      };
    });
  }

  function normalizeCard(card) {
    if (typeof card.quantity !== "number") {
      card.quantity = card.owned ? 1 : 0;
    }
    card.owned = card.quantity > 0;
    return card;
  }

  function cardsFor(state, collectionId) {
    return (state.cardsByCollection[collectionId] || []).map(normalizeCard);
  }

  function collectionStats(state, collection) {
    const cards = cardsFor(state, collection.id);
    const owned = cards.filter((card) => card.quantity > 0).length;
    const duplicated = cards.reduce((total, card) => total + Math.max(card.quantity - 1, 0), 0);
    return {
      ...collection,
      owned,
      duplicated,
      total: collection.total || cards.length
    };
  }

  function collectionsWithStats(state) {
    return state.collections.map((collection) => collectionStats(state, collection));
  }

  function initialState() {
    return {
      collections: baseCollections,
      cardsByCollection: Object.fromEntries(baseCollections.map((collection) => [
        collection.id,
        buildCards(collection)
      ]))
    };
  }

  function readState() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialState();
    } catch (error) {
      console.warn("Falha ao ler dados locais; usando dados iniciais.", error);
      return initialState();
    }
  }

  function writeState(state) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function appRootPath() {
    return location.pathname.includes("/Templates/") ? "../" : "";
  }

  function normalizeNumber(value) {
    return String(value || "").replace(/^0+/, "") || "0";
  }

  function bestTcgplayerPrice(tcgplayer) {
    if (!tcgplayer || !tcgplayer.prices) return null;
    const variants = Object.values(tcgplayer.prices);
    const market = variants.find((price) => typeof price.market === "number");
    if (market) return market.market;
    const mid = variants.find((price) => typeof price.mid === "number");
    return mid ? mid.mid : null;
  }

  function bestCardmarketPrice(cardmarket) {
    if (!cardmarket || !cardmarket.prices) return null;
    const prices = cardmarket.prices;
    return prices.averageSellPrice || prices.trendPrice || prices.avg30 || null;
  }

  function marketValueFor(apiCard) {
    if (typeof apiCard.marketPrice === "number" && apiCard.marketCurrency) {
      return {
        marketPrice: apiCard.marketPrice,
        marketCurrency: apiCard.marketCurrency,
        marketSource: apiCard.marketSource || "Arquivo local",
        marketUpdatedAt: apiCard.marketUpdatedAt || null
      };
    }

    const tcgplayerPrice = bestTcgplayerPrice(apiCard.tcgplayer);
    if (tcgplayerPrice) {
      return {
        marketPrice: tcgplayerPrice,
        marketCurrency: "USD",
        marketSource: "TCGplayer",
        marketUpdatedAt: apiCard.tcgplayer.updatedAt || null
      };
    }

    const cardmarketPrice = bestCardmarketPrice(apiCard.cardmarket);
    if (cardmarketPrice) {
      return {
        marketPrice: cardmarketPrice,
        marketCurrency: "EUR",
        marketSource: "Cardmarket",
        marketUpdatedAt: apiCard.cardmarket.updatedAt || null
      };
    }

    return null;
  }

  async function fetchMarketCards(collection) {
    if (!collection.marketQuery || typeof fetch !== "function") return [];
    try {
      const localResponse = await fetch(`${appRootPath()}data/prices/${collection.id}.json`, { cache: "no-cache" });
      if (localResponse.ok) {
        const localPayload = await localResponse.json();
        if (Array.isArray(localPayload.cards) && localPayload.cards.length > 0) {
          return localPayload.cards;
        }
      }
    } catch (error) {
      console.warn("Falha ao carregar preços locais; tentando API externa.", error);
    }

    const params = new URLSearchParams({
      q: collection.marketQuery,
      pageSize: "250",
      select: "id,name,number,rarity,tcgplayer,cardmarket"
    });
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?${params.toString()}`);
    if (!response.ok) throw new Error(`Pokemon TCG API ${response.status}`);
    const payload = await response.json();
    return payload.data || [];
  }

  const store = {
    getPersistenceInfo() {
      return {
        mode: "device-local",
        deviceId: getDeviceId(),
        storageKey: STORAGE_KEY
      };
    },

    resetLocalCollection() {
      window.localStorage.removeItem(STORAGE_KEY);
      return initialState();
    },

    async getSummary() {
      getDeviceId();
      const state = readState();
      return collectionsWithStats(state).reduce((summary, collection) => ({
        totalCards: summary.totalCards + collection.total,
        totalCollections: summary.totalCollections + 1,
        duplicated: summary.duplicated + collection.duplicated
      }), { totalCards: 0, totalCollections: 0, duplicated: 0 });
    },

    async listCollections() {
      const state = readState();
      return collectionsWithStats(state);
    },

    async getCollection(id) {
      const state = readState();
      const collection = state.collections.find((item) => item.id === id) || state.collections[0];
      return collectionStats(state, collection);
    },

    async listCards(collectionId) {
      const state = readState();
      return cardsFor(state, collectionId);
    },

    async refreshCollectionPrices(collectionId) {
      const state = readState();
      const collection = state.collections.find((item) => item.id === collectionId);
      if (!collection) return { updated: 0, skipped: true };
      const existingCards = cardsFor(state, collectionId);
      const hasMarketPrices = existingCards.some((card) => typeof card.marketPrice === "number");

      const now = new Date();
      const lastUpdate = collection.marketFetchedAt ? new Date(collection.marketFetchedAt) : null;
      const sixHours = 6 * 60 * 60 * 1000;
      if (hasMarketPrices && lastUpdate && now - lastUpdate < sixHours) {
        return { updated: 0, skipped: true };
      }

      const apiCards = await fetchMarketCards(collection);
      const byNumber = new Map(apiCards.map((card) => [normalizeNumber(card.number), card]));
      const cards = existingCards;
      let updated = 0;

      cards.forEach((card) => {
        const apiCard = byNumber.get(normalizeNumber(card.number));
        if (!apiCard) return;
        const marketValue = marketValueFor(apiCard);
        card.name = apiCard.name || card.name;
        card.rarity = apiCard.rarity || card.rarity;
        if (marketValue) {
          Object.assign(card, marketValue);
          updated += 1;
        }
      });

      if (updated > 0) {
        collection.marketFetchedAt = now.toISOString();
      }
      writeState(state);
      return { updated, skipped: false };
    },

    async toggleCardOwned(collectionId, cardId) {
      const state = readState();
      const cards = cardsFor(state, collectionId);
      const card = cards.find((item) => item.id === cardId);
      if (card) {
        card.quantity = card.quantity > 0 ? 0 : 1;
        card.owned = card.quantity > 0;
        writeState(state);
      }
      return card;
    },

    async addCardCopy(collectionId, cardId) {
      const state = readState();
      const cards = cardsFor(state, collectionId);
      const card = cards.find((item) => item.id === cardId);
      if (card) {
        card.quantity += 1;
        card.owned = true;
        writeState(state);
      }
      return card;
    },

    async removeCardCopy(collectionId, cardId) {
      const state = readState();
      const cards = cardsFor(state, collectionId);
      const card = cards.find((item) => item.id === cardId);
      if (card) {
        card.quantity = Math.max(card.quantity - 1, 0);
        card.owned = card.quantity > 0;
        writeState(state);
      }
      return card;
    },

    isNativeSQLiteAvailable() {
      return Boolean(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorSQLite);
    }
  };

  window.PokemonCollectionStore = store;
}());
