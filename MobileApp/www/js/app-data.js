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

  const promoMegaEvolutionCards = [
    ["001", "Meganium [Staff]"],
    ["002", "Inteleon [Staff]"],
    ["003", "Alakazam [Staff]"],
    ["004", "Lunatone [Staff]"],
    ["005", "Drifloon"],
    ["006", "Drifblim"],
    ["007", "Psyduck"],
    ["008", "Golduck"],
    ["009", "Alakazam [Pokemon Center]"],
    ["010", "Riolu [Pokemon Center]"],
    ["011", "Mega Latias ex [Jumbo]"],
    ["012", "Mega Lucario ex [Jumbo]"],
    ["013", "Mega Venusaur ex [Jumbo]"],
    ["014", "Ceruledge [Staff]"],
    ["015", "Zacian [Staff]"],
    ["016", "Flygon [Staff]"],
    ["017", "Toxtricity [Staff]"],
    ["018", "Cottonee"],
    ["019", "Whimsicott"],
    ["020", "Sneasel"],
    ["021", "Weavile"],
    ["022", "Charcadet [Pokemon Center]"],
    ["023", "Mega Charizard X ex"],
    ["024", "Oricorio ex"],
    ["025", "Mega Kangaskhan ex [Jumbo]"],
    ["026", "Meloetta"],
    ["027", "Haunter"],
    ["028", "Celebratory Fanfare"],
    ["029", "Mega Charizard X ex"],
    ["030", "Mega Charizard Y ex"],
    ["031", "N's Zekrom [Pokemon Center]"],
    ["032", "Mega Gardevoir ex"],
    ["033", "Mega Lucario ex"],
    ["034", "Mega Meganium ex [Jumbo]"],
    ["035", "Mega Emboar ex [Jumbo]"],
    ["036", "Mega Feraligatr ex [Jumbo]"],
    ["037", "Bulbasaur"],
    ["038", "Charmander"],
    ["039", "Squirtle"],
    ["040", "Turtwig"],
    ["041", "Chimchar"],
    ["042", "Piplup"],
    ["043", "Rowlet"],
    ["044", "Litten"],
    ["045", "Popplio"],
    ["046", "Chikorita"],
    ["047", "Cyndaquil"],
    ["048", "Totodile"],
    ["049", "Snivy"],
    ["050", "Tepig"],
    ["051", "Oshawott"],
    ["052", "Grookey"],
    ["053", "Scorbunny"],
    ["054", "Sobble"]
  ].map(([number, name]) => ({
    number,
    name,
    rarity: "PROMO",
    quantity: 0,
    owned: false,
    favorite: false,
    image: null,
    marketPrice: null,
    marketCurrency: null,
    marketSource: null,
    marketUpdatedAt: null
  }));

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
      id: "megaevolucao-base",
      name: "MEGAEVOLUCAO Base",
      total: 188,
      owned: 0,
      duplicated: 0,
      rare: 0,
      image: "colecao-megaevolucao-base.svg",
      theme: "blue",
      artFolder: "megaevolucao-base",
      artLocalCount: 180,
      artCount: 188,
      marketQuery: "set.id:me1"
    },
    {
      id: "promos-megaevolucao",
      name: "Promos Megaevolucao",
      total: promoMegaEvolutionCards.length,
      owned: 0,
      duplicated: 0,
      rare: 0,
      image: "colecao-promos-megaevolucao.svg",
      theme: "purple",
      cards: promoMegaEvolutionCards
    }
  ];

  const rarities = ["COMUM", "INCOMUM", "RARA", "ÉPICA", "SECRETA"];

  function buildCards(collection) {
    if (Array.isArray(collection.cards)) {
      return collection.cards.map((card, index) => {
        const number = card.number || String(index + 1).padStart(3, "0");
        const quantity = typeof card.quantity === "number" ? card.quantity : 0;
        return {
          id: `${collection.id}-${number}`,
          number,
          name: card.name || `Carta ${number}`,
          rarity: card.rarity || "PROMO",
          quantity,
          owned: quantity > 0,
          favorite: Boolean(card.favorite),
          image: card.image || null,
          marketPrice: card.marketPrice || null,
          marketCurrency: card.marketCurrency || null,
          marketSource: card.marketSource || null,
          marketUpdatedAt: card.marketUpdatedAt || null
        };
      });
    }

    const total = collection.artCount || Math.min(collection.total, 24);
    return Array.from({ length: total }, (_, index) => {
      const number = String(index + 1).padStart(3, "0");
      const quantity = 0;
      const hasLocalArt = collection.artFolder && (!collection.artLocalCount || index < collection.artLocalCount);
      return {
        id: `${collection.id}-${number}`,
        number,
        name: `Carta ${number}`,
        rarity: rarities[index % rarities.length],
        quantity,
        owned: quantity > 0,
        favorite: false,
        image: hasLocalArt ? `cartas/${collection.artFolder}/${number}.png` : null,
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
    card.favorite = Boolean(card.favorite);
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

  function mergeBaseState(state) {
    const nextState = {
      collections: Array.isArray(state.collections) ? state.collections : [],
      cardsByCollection: state.cardsByCollection || {}
    };
    let changed = false;
    const activeCollectionIds = new Set(baseCollections.map((collection) => collection.id));
    const filteredCollections = nextState.collections.filter((collection) => activeCollectionIds.has(collection.id));

    if (filteredCollections.length !== nextState.collections.length) {
      nextState.collections = filteredCollections;
      changed = true;
    }

    Object.keys(nextState.cardsByCollection).forEach((collectionId) => {
      if (!activeCollectionIds.has(collectionId)) {
        delete nextState.cardsByCollection[collectionId];
        changed = true;
      }
    });

    baseCollections.forEach((baseCollection) => {
      const existingIndex = nextState.collections.findIndex((collection) => collection.id === baseCollection.id);
      const existingCollection = existingIndex >= 0 ? nextState.collections[existingIndex] : null;

      if (existingCollection) {
        nextState.collections[existingIndex] = {
          ...existingCollection,
          ...baseCollection,
          marketFetchedAt: existingCollection.marketFetchedAt
        };
      } else {
        nextState.collections.push(baseCollection);
        changed = true;
      }

      const existingCards = Array.isArray(nextState.cardsByCollection[baseCollection.id])
        ? nextState.cardsByCollection[baseCollection.id].map(normalizeCard)
        : [];
      const existingById = new Map(existingCards.map((card) => [card.id, card]));
      const baseCards = buildCards(baseCollection);
      const mergedCards = baseCards.map((baseCard) => {
        const existingCard = existingById.get(baseCard.id);
        if (!existingCard) return baseCard;
        if (!existingCard.image && baseCard.image) {
          changed = true;
          return { ...existingCard, image: baseCard.image };
        }
        return existingCard;
      });

      if (mergedCards.length !== existingCards.length) changed = true;
      nextState.cardsByCollection[baseCollection.id] = mergedCards;
    });

    const order = new Map(baseCollections.map((collection, index) => [collection.id, index]));
    const previousOrder = nextState.collections.map((collection) => collection.id).join("|");
    nextState.collections.sort((a, b) => {
      const orderA = order.has(a.id) ? order.get(a.id) : Number.MAX_SAFE_INTEGER;
      const orderB = order.has(b.id) ? order.get(b.id) : Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
    if (previousOrder !== nextState.collections.map((collection) => collection.id).join("|")) changed = true;

    return { state: nextState, changed };
  }

  function readState() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return initialState();
      const merged = mergeBaseState(JSON.parse(saved));
      if (merged.changed) writeState(merged.state);
      return merged.state;
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

  function cardImageFor(apiCard) {
    return apiCard.images && (apiCard.images.large || apiCard.images.small) || null;
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
      select: "id,name,number,rarity,images,tcgplayer,cardmarket"
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
        totalCards: summary.totalCards + collection.owned,
        totalCollections: summary.totalCollections + (collection.owned > 0 ? 1 : 0),
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

    async listAllCards() {
      const state = readState();
      return state.collections.flatMap((collection) => {
        const collectionWithStats = collectionStats(state, collection);
        return cardsFor(state, collection.id).map((card) => ({
          ...card,
          collectionId: collection.id,
          collectionName: collection.name,
          collectionTheme: collection.theme,
          collectionImage: collection.image,
          collectionOwned: collectionWithStats.owned,
          collectionTotal: collectionWithStats.total
        }));
      });
    },

    async listFavoriteCards() {
      const state = readState();
      return state.collections.flatMap((collection) => {
        const collectionWithStats = collectionStats(state, collection);
        return cardsFor(state, collection.id)
          .filter((card) => card.favorite && card.quantity > 0)
          .map((card) => ({
            ...card,
            collectionId: collection.id,
            collectionName: collection.name,
            collectionTheme: collection.theme,
            collectionImage: collection.image,
            collectionOwned: collectionWithStats.owned,
            collectionTotal: collectionWithStats.total
          }));
      });
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
        card.image = card.image || cardImageFor(apiCard);
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
        if (!card.owned) card.favorite = false;
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
        if (!card.owned) card.favorite = false;
        writeState(state);
      }
      return card;
    },

    async toggleCardFavorite(collectionId, cardId) {
      const state = readState();
      const cards = cardsFor(state, collectionId);
      const card = cards.find((item) => item.id === cardId);
      if (card && card.quantity > 0) {
        card.favorite = !card.favorite;
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
