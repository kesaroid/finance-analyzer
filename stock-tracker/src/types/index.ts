export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  logo: string;
  isETF: boolean;
  profile: {
    name: string;
    description: string;
    industry: string;
    sector: string;
    website: string;
    exchange: string;
    currency: string;
    country: string;
    address: string;
    fiscalYearEnd: string;
    latestQuarter: string;
  };
  fundamentals?: {
    marketCap: number;
    ebitda: number;
    peRatio: number;
    pegRatio: number;
    bookValue: number;
    dividendPerShare: number;
    dividendYield: number;
    eps: number;
    revenuePerShare: number;
    profitMargin: number;
    operatingMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
    revenue: number;
    grossProfit: number;
    quarterlyEarningsGrowth: number;
    quarterlyRevenueGrowth: number;
    analystTargetPrice: number;
    analystRating: {
      strongBuy: number;
      buy: number;
      hold: number;
      sell: number;
      strongSell: number;
    };
    trailingPE: number;
    forwardPE: number;
    priceToSalesRatio: number;
    priceToBookRatio: number;
    evToRevenue: number;
    evToEBITDA: number;
    beta: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    fiftyDayMovingAverage: number;
    twoHundredDayMovingAverage: number;
    sharesOutstanding: number;
    dividendDate: string;
    exDividendDate: string;
  };
  etfProfile?: {
    symbol: string;
    name: string;
    description: string;
    exchange: string;
    assetClass: string;
    assetClassSize: string;
    expenseRatio: string;
    aum: string;
    yield: string;
    ytdReturn: string;
    beta3Year: string;
    sectors: Array<{
      name: string;
      weight: string;
    }>;
    holdings: Array<{
      name: string;
      weight: string;
    }>;
  };
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export interface FinancialStatement {
  fiscalDateEnding: string;
  totalRevenue?: string;
  grossProfit?: string;
  netIncome?: string;
  totalAssets?: string;
  totalLiabilities?: string;
  totalShareholderEquity?: string;
  operatingCashflow?: string;
  capitalExpenditures?: string;
  freeCashFlow?: string;
  dividendPayout?: string;
} 