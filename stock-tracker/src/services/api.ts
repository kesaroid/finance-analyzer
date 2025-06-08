import axios from 'axios';
import type { SearchResult, StockData, FinancialStatement } from '../types';

const alphaVantageKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const twelveDataKey = import.meta.env.VITE_TWELVE_DATA_API_KEY;
const polygonKey = import.meta.env.VITE_POLYGON_API_KEY;
const disableSymbolSearch = import.meta.env.VITE_DISABLE_SYMBOL_SEARCH === 'true';

export const searchSymbols = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.length < 2) return [];
  
  if (disableSymbolSearch) {
    // Return a simple result with just the entered query as both symbol and name
    return [{
      symbol: query.toUpperCase(),
      name: query,
      type: 'Equity',
      region: 'US',
      currency: 'USD'
    }];
  }
  
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
  if (!alphaVantageKey || !twelveDataKey || !polygonKey) {
    throw new Error('API keys not found');
  }

  let stockData: StockData | null = null;
  let incomeStatement: FinancialStatement[] = [];
  let balanceSheet: FinancialStatement[] = [];
  let cashFlow: FinancialStatement[] = [];
  let error: Error | null = null;

  // Try Alpha Vantage first
  try {
    // Fetch ETF profile
    const etfResponse = await axios.get(`https://www.alphavantage.co/query?function=ETF_PROFILE&symbol=${ticker}&apikey=${alphaVantageKey}`);
    const etfData = etfResponse.data;

    const isETF = etfData && etfData.net_assets && (etfData.sectors || etfData.holdings);

    let overviewData;
    let polygonData;

    if (isETF) {
      overviewData = etfData;
    } else {
      // Fetch company overview and financial statements for stocks
      const [overviewResponse, incomeResponse, balanceResponse, cashflowResponse, polygonResponse] = await Promise.all([
        axios.get(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${alphaVantageKey}`),
        axios.get(`https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${alphaVantageKey}`),
        axios.get(`https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${ticker}&apikey=${alphaVantageKey}`),
        axios.get(`https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${ticker}&apikey=${alphaVantageKey}`),
        axios.get(`https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${polygonKey}`)
      ]);
      overviewData = overviewResponse.data;
      incomeStatement = incomeResponse.data.annualReports || [];
      balanceSheet = balanceResponse.data.annualReports || [];
      cashFlow = cashflowResponse.data.annualReports || [];
      polygonData = polygonResponse.data;
    }

    if (overviewData.Note) {
      throw new Error('Alpha Vantage API rate limit reached. Please try again later.');
    }

    if (!isETF && (!overviewData || !overviewData.Name)) {
      throw new Error('No valid data found for this ticker.');
    }

    // Fetch logo and quote from Twelve Data
    const [logoResponse, quoteResponse] = await Promise.all([
      axios.get(`https://api.twelvedata.com/logo?symbol=${ticker}&apikey=${twelveDataKey}`),
      axios.get(`https://api.twelvedata.com/quote?symbol=${ticker}&apikey=${twelveDataKey}`)
    ]);

    if (quoteResponse.data.status === 'error') {
      throw new Error(quoteResponse.data.message || 'Failed to fetch stock data');
    }

    let logoUrl = null;
    try {
      if (logoResponse.data.url) {
        logoUrl = logoResponse.data.url;
      }
    } catch (e) {
      logoUrl = null;
    }

    const quoteData = quoteResponse.data;
    
    stockData = {
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
        description: polygonData?.results?.description || overviewData.Description,
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
      } : undefined
    };
  } catch (err) {
    error = err instanceof Error ? err : new Error('Failed to fetch data from Alpha Vantage');
    console.error('Error fetching from Alpha Vantage:', err);
  }

  // If Alpha Vantage fails, try Twelve Data
  if (!stockData) {
    try {
      const [quoteResponse, logoResponse] = await Promise.all([
        axios.get(`https://api.twelvedata.com/quote?symbol=${ticker}&apikey=${twelveDataKey}`),
        axios.get(`https://api.twelvedata.com/logo?symbol=${ticker}&apikey=${twelveDataKey}`)
      ]);

      if (quoteResponse.data.status === 'error') {
        throw new Error(quoteResponse.data.message || 'Failed to fetch stock data');
      }

      let logoUrl = null;
      try {
        if (logoResponse.data.url) {
          logoUrl = logoResponse.data.url;
        }
      } catch (e) {
        logoUrl = null;
      }

      const quoteData = quoteResponse.data;
      
      stockData = {
        symbol: quoteData.symbol,
        price: parseFloat(quoteData.close),
        change: parseFloat(quoteData.change),
        changePercent: parseFloat(quoteData.percent_change),
        volume: parseInt(quoteData.volume),
        marketCap: parseInt(quoteData.market_cap),
        logo: logoUrl,
        isETF: false,
        profile: {
          name: quoteData.name || ticker,
          description: '',
          industry: '',
          sector: '',
          website: '',
          exchange: quoteData.exchange || '',
          currency: quoteData.currency || '',
          country: '',
          address: '',
          fiscalYearEnd: '',
          latestQuarter: ''
        }
      };
    } catch (err) {
      console.error('Error fetching from Twelve Data:', err);
      throw error || new Error('Failed to fetch stock data from both APIs');
    }
  }

  if (!stockData) {
    throw new Error('Failed to fetch stock data from both APIs');
  }

  return { stockData, incomeStatement, balanceSheet, cashFlow };
}; 