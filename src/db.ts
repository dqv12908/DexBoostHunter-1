import Database from 'better-sqlite3';
import { config } from "./config";
import { boostAmounts, TokenResponseType, updatedDetailedTokenType } from "./types";

// Helper function to get database connection
function getDatabase(): Database {
  return new Database(config.settings.db_name_tracker);
}

// Tokens
export async function createTokensTable(database: Database): Promise<boolean> {
  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        chainId TEXT NOT NULL,
        tokenAddress TEXT NOT NULL UNIQUE,
        icon TEXT,
        header TEXT,
        openGraph TEXT,
        description TEXT,
        totalAmount INTEGER,
        amount INTEGER,
        links TEXT,
        created INTEGER, 
        boosted INTEGER,
        pairsAvailable INTEGER,
        dexPair TEXT,
        currentPrice INTEGER,
        liquidity INTEGER,
        marketCap INTEGER,
        pairCreatedAt INTEGER,
        tokenName TEXT,
        tokenSymbol TEXT
      );
    `);
    return true;
  } catch (error: any) {
    console.error("Error creating TokenData table:", error);
    return false;
  }
}

export async function selectAllTokens() {
  const db = getDatabase();

  try {
    // Create Table if not exists
    const tokensTableExist = await createTokensTable(db);
    if (!tokensTableExist) {
      db.close();
      return;
    }

    // Proceed with returning tokens
    const tokens = db.prepare("SELECT * FROM tokens").all();
    return tokens;
  } finally {
    db.close();
  }
}

export async function upsertTokenBoost(token: updatedDetailedTokenType): Promise<boolean> {
  const db = getDatabase();

  try {
    // Create Table if not exists
    const tokensTableExist = await createTokensTable(db);
    if (!tokensTableExist) {
      return false;
    }

    const {
      chainId, description, dexPair, header, icon, links,
      openGraph, tokenAddress, tokenName, tokenSymbol, url,
      amount, currentPrice, liquidity, marketCap,
      pairCreatedAt, pairsAvailable, totalAmount,
    } = token;

    // Delete token to make room for new one
    db.prepare(`DELETE FROM tokens WHERE tokenAddress = ?`).run(tokenAddress);

    // Create timestamp for token profile creation
    const recordAdded = Date.now();
    const linksLength = links ? links.length : 0;

    const result = db.prepare(`
      INSERT INTO tokens (
        url, chainId, tokenAddress, icon, header, openGraph, 
        description, totalAmount, amount, links, created, 
        boosted, pairsAvailable, dexPair, currentPrice, 
        liquidity, marketCap, pairCreatedAt, tokenName, tokenSymbol
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      url, chainId, tokenAddress, icon, header, openGraph,
      description, totalAmount, amount, linksLength, recordAdded,
      recordAdded, pairsAvailable, dexPair, currentPrice,
      liquidity, marketCap, pairCreatedAt, tokenName, tokenSymbol
    );

    return result.changes > 0;
  } finally {
    db.close();
  }
}

export async function selectTokenPresent(token: string): Promise<boolean> {
  const db = getDatabase();

  try {
    // Create Table if not exists
    const tokensTableExist = await createTokensTable(db);
    if (!tokensTableExist) {
      return false;
    }

    const tokenExists = db.prepare(`SELECT id FROM tokens WHERE tokenAddress = ?`).get(token);
    return !!tokenExists;
  } finally {
    db.close();
  }
}

export async function selectTokenBoostAmounts(token: string): Promise<false | boostAmounts> {
  const db = getDatabase();

  try {
    // Create Table if not exists
    const tokensTableExist = await createTokensTable(db);
    if (!tokensTableExist) {
      return false;
    }

    const tokenAmounts = db.prepare(`SELECT amount, totalAmount FROM tokens WHERE tokenAddress = ?`).get(token);

    if (tokenAmounts) {
      const amount = tokenAmounts.amount ?? 0;
      const amountTotal = tokenAmounts.totalAmount ?? 0;
      return { amount, amountTotal };
    }

    return false;
  } finally {
    db.close();
  }
}
