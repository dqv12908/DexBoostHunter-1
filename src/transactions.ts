import axios from "axios";
import dotenv from "dotenv";
import { config } from "./config";
import { RugResponse } from "./types";
import Database from 'better-sqlite3';
import { boostAmounts, TokenResponseType, updatedDetailedTokenType } from "./types";

// Load environment variables from the .env file
dotenv.config();

// Replace the database connection code
const db = new Database(config.settings.db_name_tracker);

export async function getRugCheck(tokenMint: string): Promise<RugResponse | false> {
  const rugResponse = await axios.get<RugResponse>("https://api.rugcheck.xyz/v1/tokens/" + tokenMint + "/report/summary", {
    timeout: config.settings.api_get_timeout,
  });

  if (!rugResponse.data) return false;

  if (config.rug_check.verbose_log && config.rug_check.verbose_log === true) {
    console.log(rugResponse.data);
  }

  return rugResponse.data;
  
}
