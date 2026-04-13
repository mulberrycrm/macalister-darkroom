import { logger } from "@crm/shared/lib/logger";

const AKAHU_API_BASE = "https://api.akahu.io/v1";

export interface AkahuTransaction {
  id: string;
  date: string; // ISO date
  amount: number;
  description: string;
  particulars?: string;
  code?: string;
  reference?: string;
  balance?: number;
  merchant?: {
    id?: string;
    name?: string;
  };
  category?: {
    id?: string;
    name?: string;
    groups?: { [key: string]: string };
  };
}

interface AkahuAccountsResponse {
  success: boolean;
  items: Array<{
    id: string;
    name: string;
    type: string;
    attributes: {
      account_number?: string;
      balance?: number;
      currency?: string;
    };
  }>;
}

interface AkahuTransactionsResponse {
  success: boolean;
  items: AkahuTransaction[];
  cursor?: {
    next?: string;
  };
}

/**
 * Akahu API client for personal bank feed integration
 * Uses app_token + user_token authentication
 */
export class AkahuClient {
  private appToken: string;
  private userToken: string;

  constructor(appToken: string, userToken: string) {
    this.appToken = appToken;
    this.userToken = userToken;
  }

  /**
   * Get all connected bank accounts
   */
  async getAccounts(): Promise<AkahuAccountsResponse["items"]> {
    try {
      const response = await fetch(`${AKAHU_API_BASE}/accounts`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Akahu API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as AkahuAccountsResponse;
      if (!data.success) {
        throw new Error("Akahu API returned success: false");
      }

      return data.items;
    } catch (error) {
      logger.error("[akahu] Failed to fetch accounts", { error });
      throw error;
    }
  }

  /**
   * Get transactions for an account
   * @param accountId Akahu account ID
   * @param from ISO date string (defaults to 90 days ago)
   * @param to ISO date string (defaults to today)
   * @returns Array of transactions
   */
  async getTransactions(
    accountId: string,
    from?: string,
    to?: string
  ): Promise<AkahuTransaction[]> {
    try {
      // Default to last 90 days if not specified
      const toDate = to || new Date().toISOString().split("T")[0];
      const fromDate = from || this.getDateOffset(90);

      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
      });

      const url = `${AKAHU_API_BASE}/accounts/${accountId}/transactions?${params.toString()}`;

      logger.info("[akahu] Fetching transactions", {
        accountId,
        fromDate,
        toDate,
      });

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Akahu API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as AkahuTransactionsResponse;
      if (!data.success) {
        throw new Error("Akahu API returned success: false");
      }

      logger.info("[akahu] Fetched transactions", {
        count: data.items.length,
        accountId,
      });

      return data.items;
    } catch (error) {
      logger.error("[akahu] Failed to fetch transactions", { error, accountId });
      throw error;
    }
  }

  /**
   * Get all transactions from all connected accounts
   */
  async getAllTransactions(from?: string, to?: string): Promise<
    Array<{
      accountId: string;
      transactions: AkahuTransaction[];
    }>
  > {
    try {
      const accounts = await this.getAccounts();
      const allTransactions = [];

      for (const account of accounts) {
        const transactions = await this.getTransactions(account.id, from, to);
        allTransactions.push({
          accountId: account.id,
          transactions,
        });
      }

      return allTransactions;
    } catch (error) {
      logger.error("[akahu] Failed to fetch all transactions", { error });
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const accounts = await this.getAccounts();
      return accounts.length > 0;
    } catch (error) {
      logger.error("[akahu] Connection test failed", { error });
      return false;
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      "X-Akahu-ID": this.appToken,
      Authorization: `Bearer ${this.userToken}`,
      "Content-Type": "application/json",
    };
  }

  private getDateOffset(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  }
}

/**
 * Initialize Akahu client from environment variables
 * Requires AKAHU_APP_TOKEN and AKAHU_USER_TOKEN
 */
export function initializeAkahuClient(): AkahuClient {
  const appToken = process.env.AKAHU_APP_TOKEN;
  const userToken = process.env.AKAHU_USER_TOKEN;

  if (!appToken || !userToken) {
    throw new Error("Missing Akahu credentials in environment variables");
  }

  return new AkahuClient(appToken, userToken);
}
