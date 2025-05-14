import axios from 'axios';
import type { SearchResult, StockData, FinancialStatement } from '../types';

const alphaVantageKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const twelveDataKey = import.meta.env.VITE_TWELVE_DATA_API_KEY;

export const searchSymbols = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${alphaVantageKey}`
    );

    if (response.data.Note) {
      throw new Error('API rate limit reached. Please try again later.');
    }

    if (response.data.bestMatches) {
      return response.data.bestMatches.map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        currency: match['8. currency']
      }));
    }
    return [];
  } catch (err) {
    console.error('Error searching symbols:', err);
    return [];
  }
};

export const fetchStockData = async (ticker: string): Promise<{
  stockData: StockData;
  incomeStatement: FinancialStatement[];
  balanceSheet: FinancialStatement[];
  cashFlow: FinancialStatement[];
}> => {
  if (!alphaVantageKey || !twelveDataKey) {
    throw new Error('API keys not found');
  }

  // Fetch logo and quote from Twelve Data
  const [logoResponse, quoteResponse] = await Promise.all([
    axios.get(`https://api.twelvedata.com/logo?symbol=${ticker}&apikey=${twelveDataKey}`),
    axios.get(`https://api.twelvedata.com/quote?symbol=${ticker}&apikey=${twelveDataKey}`)
  ]);

  // Fetch ETF profile
  const etfResponse = await axios.get(`https://www.alphavantage.co/query?function=ETF_PROFILE&symbol=${ticker}&apikey=${alphaVantageKey}`);
  const etfData = etfResponse.data;

  const isETF = etfData && etfData.net_assets && (etfData.sectors || etfData.holdings);

  let logoUrl = null;
  try {
    if (logoResponse.data.url) {
      logoUrl = logoResponse.data.url;
    }
  } catch (e) {
    logoUrl = null;
  }

  let overviewData;
  let earningsData;
  let incomeStatement: FinancialStatement[] = [];
  let balanceSheet: FinancialStatement[] = [];
  let cashFlow: FinancialStatement[] = [];

  if (isETF) {
    overviewData = etfData;
  } else {
    // Fetch company overview, earnings, and financial statements for stocks
    const [overviewResponse, earningsResponse, incomeResponse, balanceResponse, cashflowResponse] = await Promise.all([
      axios.get(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${alphaVantageKey}`),
      axios.get(`https://www.alphavantage.co/query?function=EARNINGS&symbol=${ticker}&apikey=${alphaVantageKey}`),
      axios.get(`https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${alphaVantageKey}`),
      axios.get(`https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${ticker}&apikey=${alphaVantageKey}`),
      axios.get(`https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${ticker}&apikey=${alphaVantageKey}`)
    ]);
    overviewData = overviewResponse.data;
    earningsData = earningsResponse.data;
    incomeStatement = incomeResponse.data.annualReports || [];
    balanceSheet = balanceResponse.data.annualReports || [];
    cashFlow = cashflowResponse.data.annualReports || [];
  }

  if (quoteResponse.data.status === 'error') {
    throw new Error(quoteResponse.data.message || 'Failed to fetch stock data');
  }

  if (overviewData.Note) {
    throw new Error('Alpha Vantage API rate limit reached. Please try again later.');
  }

  if (!isETF && (!overviewData || !overviewData.Name)) {
    throw new Error('No valid data found for this ticker.');
  }

  const quoteData = quoteResponse.data;
  
  const stockData: StockData = {
    symbol: isETF ? ticker : quoteData.symbol,
    price: isETF ? parseFloat(quoteData.close) : parseFloat(quoteData.close),
    change: isETF ? parseFloat(quoteData.change) : parseFloat(quoteData.change),
    changePercent: isETF ? parseFloat(quoteData.percent_change) : parseFloat(quoteData.percent_change),
    volume: isETF ? parseInt(quoteData.volume) : parseInt(quoteData.volume),
    marketCap: isETF ? parseInt(quoteData.market_cap) : parseInt(quoteData.market_cap),
    logo: logoUrl,
    isETF: !!isETF,
    profile: isETF ? {
      name: ticker,
      description: '',
      industry: '',
      sector: '',
      website: '',
      exchange: '',
      currency: '',
      country: '',
      address: '',
      fiscalYearEnd: '',
      latestQuarter: ''
    } : {
      name: overviewData.Name,
      description: overviewData.Description,
      industry: overviewData.Industry,
      sector: overviewData.Sector,
      website: overviewData.Website,
      exchange: overviewData.Exchange,
      currency: overviewData.Currency,
      country: overviewData.Country,
      address: overviewData.Address,
      fiscalYearEnd: overviewData.FiscalYearEnd,
      latestQuarter: overviewData.LatestQuarter
    },
    fundamentals: isETF ? undefined : {
      marketCap: parseInt(overviewData.MarketCapitalization),
      ebitda: parseInt(overviewData.EBITDA),
      peRatio: parseFloat(overviewData.PERatio),
      pegRatio: parseFloat(overviewData.PEGRatio),
      bookValue: parseFloat(overviewData.BookValue),
      dividendPerShare: parseFloat(overviewData.DividendPerShare),
      dividendYield: parseFloat(overviewData.DividendYield),
      eps: parseFloat(overviewData.EPS),
      revenuePerShare: parseFloat(overviewData.RevenuePerShareTTM),
      profitMargin: parseFloat(overviewData.ProfitMargin),
      operatingMargin: parseFloat(overviewData.OperatingMarginTTM),
      returnOnAssets: parseFloat(overviewData.ReturnOnAssetsTTM),
      returnOnEquity: parseFloat(overviewData.ReturnOnEquityTTM),
      revenue: parseInt(overviewData.RevenueTTM),
      grossProfit: parseInt(overviewData.GrossProfitTTM),
      quarterlyEarningsGrowth: parseFloat(overviewData.QuarterlyEarningsGrowthYOY),
      quarterlyRevenueGrowth: parseFloat(overviewData.QuarterlyRevenueGrowthYOY),
      analystTargetPrice: parseFloat(overviewData.AnalystTargetPrice),
      analystRating: {
        strongBuy: parseInt(overviewData.AnalystRatingStrongBuy),
        buy: parseInt(overviewData.AnalystRatingBuy),
        hold: parseInt(overviewData.AnalystRatingHold),
        sell: parseInt(overviewData.AnalystRatingSell),
        strongSell: parseInt(overviewData.AnalystRatingStrongSell)
      },
      trailingPE: parseFloat(overviewData.TrailingPE),
      forwardPE: parseFloat(overviewData.ForwardPE),
      priceToSalesRatio: parseFloat(overviewData.PriceToSalesRatioTTM),
      priceToBookRatio: parseFloat(overviewData.PriceToBookRatio),
      evToRevenue: parseFloat(overviewData.EVToRevenue),
      evToEBITDA: parseFloat(overviewData.EVToEBITDA),
      beta: parseFloat(overviewData.Beta),
      fiftyTwoWeekHigh: parseFloat(overviewData['52WeekHigh']),
      fiftyTwoWeekLow: parseFloat(overviewData['52WeekLow']),
      fiftyDayMovingAverage: parseFloat(overviewData['50DayMovingAverage']),
      twoHundredDayMovingAverage: parseFloat(overviewData['200DayMovingAverage']),
      sharesOutstanding: parseInt(overviewData.SharesOutstanding),
      dividendDate: overviewData.DividendDate,
      exDividendDate: overviewData.ExDividendDate
    },
    etfProfile: isETF ? {
      symbol: ticker,
      name: ticker,
      description: '',
      exchange: '',
      assetClass: '',
      assetClassSize: '',
      expenseRatio: '',
      aum: '',
      yield: '',
      ytdReturn: '',
      beta3Year: '',
      sectors: (etfData.sectors || []).map((s: { sector: string; weight: string }) => ({
        name: s.sector,
        weight: s.weight
      })),
      holdings: (etfData.holdings || []).map((h: { description: string; weight: string }) => ({
        name: h.description,
        weight: h.weight
      }))
    } : undefined,
    earnings: isETF ? [] : earningsData?.quarterlyEarnings?.slice(0, 4).map((earning: any) => ({
      date: earning.fiscalDateEnding,
      eps: parseFloat(earning.reportedEPS),
      epsEstimate: parseFloat(earning.estimatedEPS),
      revenue: parseFloat(earning.reportedRevenue),
      revenueEstimate: parseFloat(earning.estimatedRevenue)
    })) || []
  };

  return { stockData, incomeStatement, balanceSheet, cashFlow };
}; 