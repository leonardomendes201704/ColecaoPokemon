CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  owned INTEGER NOT NULL DEFAULT 0,
  duplicated INTEGER NOT NULL DEFAULT 0,
  rare INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  theme TEXT
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  owned INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cards_collection_id ON cards(collection_id);
CREATE INDEX IF NOT EXISTS idx_cards_owned ON cards(collection_id, owned);
