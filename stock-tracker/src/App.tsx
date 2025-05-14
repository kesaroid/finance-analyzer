import { useState, useEffect } from 'react'
import { Container, TextField, Button, Typography, Box, Paper, Table, TableContainer, TableHead, TableBody, TableRow, TableCell, Autocomplete, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText } from '@mui/material'
import { Grid } from '@mui/material'
import axios from 'axios'
import BackgroundGraph from './components/BackgroundGraph'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'

// Sample S&P 500 tickers (you can replace this with actual API data later)
const SP500_TICKERS = [
  'AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'META', 'BRK.B', 'JPM', 'JNJ', 'V',
  'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV', 'PFE', 'KO', 'BAC', 'PEP',
  'COST', 'TMO', 'DHR', 'CSCO', 'VZ', 'ADBE', 'CRM', 'CMCSA', 'NEE', 'WMT'
]

// Create a longer list by repeating the tickers multiple times
const REPEATED_TICKERS = [...SP500_TICKERS, ...SP500_TICKERS, ...SP500_TICKERS, ...SP500_TICKERS]

interface StockData {
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
  earnings: {
    date: string;
    eps: number;
    epsEstimate: number;
    revenue: number;
    revenueEstimate: number;
  }[];
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

function App() {
  const [ticker, setTicker] = useState('')
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [incomeStatement, setIncomeStatement] = useState<any | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<any | null>(null);
  const [cashFlow, setCashFlow] = useState<any | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const searchSymbols = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const alphaVantageKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
      if (!alphaVantageKey) {
        throw new Error('API key not found');
      }

      const response = await axios.get(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${alphaVantageKey}`
      );

      if (response.data.Note) {
        throw new Error('API rate limit reached. Please try again later.');
      }

      if (response.data.bestMatches) {
        setSearchResults(response.data.bestMatches.map((match: any) => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
          type: match['3. type'],
          region: match['4. region'],
          currency: match['8. currency']
        })));
      }
    } catch (err) {
      console.error('Error searching symbols:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ticker) {
        searchSymbols(ticker);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [ticker]);

  const fetchStockData = async () => {
    if (!ticker) {
      setError('Please enter a ticker symbol')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const alphaVantageKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
      const twelveDataKey = import.meta.env.VITE_TWELVE_DATA_API_KEY;
      
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
      console.log('ETF_PROFILE response for', ticker, etfData); // DEBUG LOG

      // New ETF detection logic
      const isETF = etfData && etfData.net_assets && (etfData.sectors || etfData.holdings);

      let logoUrl = null;
      try {
        if (logoResponse.data.url) {
          logoUrl = logoResponse.data.url;
        }
      } catch (e) {
        logoUrl = null; // or a default ETF image
      }

      let overviewData;
      let earningsData;

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
        setIncomeStatement(incomeResponse.data);
        setBalanceSheet(balanceResponse.data);
        setCashFlow(cashflowResponse.data);
      }

      if (quoteResponse.data.status === 'error') {
        throw new Error(quoteResponse.data.message || 'Failed to fetch stock data');
      }

      if (overviewData.Note) {
        throw new Error('Alpha Vantage API rate limit reached. Please try again later.');
      }

      // If neither ETF nor stock data is valid, show error
      if (!isETF && (!overviewData || !overviewData.Name)) {
        throw new Error('No valid data found for this ticker.');
      }

      const quoteData = quoteResponse.data;
      
      setStockData({
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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data. Please try again.');
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <BackgroundGraph />
      
      {/* Ticker Tape */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'black',
          color: 'white',
          padding: '8px 0',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          zIndex: 1000
        }}
      >
        <Box
          sx={{
            display: 'inline-block',
            animation: 'scroll 60s linear infinite',
            '@keyframes scroll': {
              '0%': {
                transform: 'translateX(0)',
              },
              '100%': {
                transform: 'translateX(-50%)',
              },
            },
          }}
        >
          {REPEATED_TICKERS.map((symbol, index) => (
            <Typography
              key={`${symbol}-${index}`}
              component="span"
              sx={{
                display: 'inline-block',
                margin: '0 20px',
                color: Math.random() > 0.5 ? '#4caf50' : '#f44336',
                fontWeight: 'bold'
              }}
            >
              {symbol}
            </Typography>
          ))}
        </Box>
      </Box>

      <Container 
        maxWidth="md" 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: '60px'
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            align="center"
            sx={{ 
              color: 'black',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              mb: 4
            }}
          >
            my name Yang
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Autocomplete
              fullWidth
              options={searchResults}
              getOptionLabel={(option) => `${option.symbol} - ${option.name}`}
              loading={searchLoading}
              inputValue={ticker}
              onInputChange={(_, newValue) => setTicker(newValue)}
              onChange={(_, newValue) => {
                if (newValue) {
                  setTicker(newValue.symbol);
                  fetchStockData();
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Enter Ticker Symbol"
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">
                      {option.symbol} - {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.type} • {option.region} • {option.currency}
                    </Typography>
                  </Box>
                </li>
              )}
            />
            <Button
              variant="contained"
              onClick={fetchStockData}
              disabled={loading}
              sx={{ 
                backgroundColor: 'black',
                '&:hover': {
                  backgroundColor: 'black',
                  opacity: 0.9
                }
              }}
            >
              {loading ? 'Loading...' : 'Search'}
            </Button>
          </Box>

          {error && (
            <Typography color="error" align="center" gutterBottom>
              {error}
            </Typography>
          )}

          {stockData && (
            <Paper elevation={3} sx={{ p: 3 }}>
              {/* Logo and Basic Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {stockData.logo && (
                  <Box
                    component="img"
                    src={stockData.logo}
                    alt={`${stockData.symbol} logo`}
                    sx={{ width: 100, height: 100, mr: 2 }}
                  />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {stockData.symbol}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h4" color="black">
                        ${stockData.price.toFixed(2)}
                      </Typography>
                      <Box sx={{
                        background: '#eee',
                        borderRadius: '50%',
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: 32,
                        color: '#333',
                      }}>
                        0
                      </Box>
                    </Box>
                    <Typography
                      color={stockData.change >= 0 ? 'success.main' : 'error.main'}
                      gutterBottom
                    >
                      {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* ETF Profile */}
              {stockData.isETF && stockData.etfProfile && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    ETF Profile
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Asset Class</TableCell>
                          <TableCell align="right">{stockData.etfProfile.assetClass}</TableCell>
                          <TableCell>Asset Class Size</TableCell>
                          <TableCell align="right">{stockData.etfProfile.assetClassSize}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Expense Ratio</TableCell>
                          <TableCell align="right">{stockData.etfProfile.expenseRatio}</TableCell>
                          <TableCell>AUM</TableCell>
                          <TableCell align="right">{stockData.etfProfile.aum}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Yield</TableCell>
                          <TableCell align="right">{stockData.etfProfile.yield}</TableCell>
                          <TableCell>YTD Return</TableCell>
                          <TableCell align="right">{stockData.etfProfile.ytdReturn}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>3-Year Beta</TableCell>
                          <TableCell align="right">{stockData.etfProfile.beta3Year}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* ETF Charts */}
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 4 }}>
                    <Paper sx={{ p: 2, flex: 1 }}>
                      <Typography variant="h6" gutterBottom align="center">
                        Sector Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={stockData.etfProfile?.sectors.map((sector) => ({
                              name: sector.name,
                              value: parseFloat(sector.weight)
                            }))}
                            cx="50%"
                            cy="50%"
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                          >
                            {(stockData.etfProfile?.sectors || []).map((_, index) => (
                              <Cell key={`cell-sector-${index}`} fill={`hsl(${(index * 360) / (stockData.etfProfile?.sectors.length || 1)}, 70%, 50%)`} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string, props: any) => [`${value.toFixed(2)}%`, props.payload.name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                    <Paper sx={{ p: 2, flex: 1 }}>
                      <Typography variant="h6" gutterBottom align="center">
                        Top Holdings
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={stockData.etfProfile?.holdings.slice(0, 10).map((holding) => ({
                              name: holding.name,
                              value: parseFloat(holding.weight)
                            }))}
                            cx="50%"
                            cy="50%"
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                          >
                            {(stockData.etfProfile?.holdings.slice(0, 10) || []).map((_, index) => (
                              <Cell key={`cell-holding-${index}`} fill={`hsl(${(index * 360) / 10}, 70%, 50%)`} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string, props: any) => [`${value.toFixed(2)}%`, props.payload.name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Box>
                </Box>
              )}

              {/* Fundamentals (for stocks only) */}
              {!stockData.isETF && stockData.fundamentals && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Fundamentals
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Market Cap</TableCell>
                          <TableCell align="right">${(stockData.fundamentals.marketCap / 1e9).toFixed(2)}B</TableCell>
                          <TableCell>P/E Ratio</TableCell>
                          <TableCell align="right">{stockData.fundamentals.peRatio.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>EPS</TableCell>
                          <TableCell align="right">${stockData.fundamentals.eps.toFixed(2)}</TableCell>
                          <TableCell>Dividend Yield</TableCell>
                          <TableCell align="right">{(stockData.fundamentals.dividendYield * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>52 Week High</TableCell>
                          <TableCell align="right">${stockData.fundamentals.fiftyTwoWeekHigh.toFixed(2)}</TableCell>
                          <TableCell>52 Week Low</TableCell>
                          <TableCell align="right">${stockData.fundamentals.fiftyTwoWeekLow.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Revenue (TTM)</TableCell>
                          <TableCell align="right">${(stockData.fundamentals.revenue / 1e9).toFixed(2)}B</TableCell>
                          <TableCell>Profit Margin</TableCell>
                          <TableCell align="right">{(stockData.fundamentals.profitMargin * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Analyst Target Price</TableCell>
                          <TableCell align="right">${stockData.fundamentals.analystTargetPrice.toFixed(2)}</TableCell>
                          <TableCell>Beta</TableCell>
                          <TableCell align="right">{stockData.fundamentals.beta.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Income Statement (for stocks only) */}
              {!stockData.isETF && incomeStatement && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Income Statement (Annual)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fiscal Date</TableCell>
                          <TableCell align="right">Total Revenue</TableCell>
                          <TableCell align="right">Gross Profit</TableCell>
                          <TableCell align="right">Net Income</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {incomeStatement.annualReports?.slice(0, 2).map((row: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{row.fiscalDateEnding}</TableCell>
                            <TableCell align="right">${Number(row.totalRevenue).toLocaleString()}</TableCell>
                            <TableCell align="right">${Number(row.grossProfit).toLocaleString()}</TableCell>
                            <TableCell align="right">${Number(row.netIncome).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Balance Sheet (for stocks only) */}
              {!stockData.isETF && balanceSheet && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Balance Sheet (Annual)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fiscal Date</TableCell>
                          <TableCell align="right">Total Assets</TableCell>
                          <TableCell align="right">Total Liabilities</TableCell>
                          <TableCell align="right">Shareholder Equity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {balanceSheet.annualReports?.slice(0, 2).map((row: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{row.fiscalDateEnding}</TableCell>
                            <TableCell align="right">${Number(row.totalAssets).toLocaleString()}</TableCell>
                            <TableCell align="right">${Number(row.totalLiabilities).toLocaleString()}</TableCell>
                            <TableCell align="right">${Number(row.totalShareholderEquity).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Cash Flow (for stocks only) */}
              {!stockData.isETF && cashFlow && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Cash Flow (Annual)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fiscal Date</TableCell>
                          <TableCell align="right">Operating Cash Flow</TableCell>
                          <TableCell align="right">Investing Cash Flow</TableCell>
                          <TableCell align="right">Financing Cash Flow</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cashFlow.annualReports?.slice(0, 2).map((row: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{row.fiscalDateEnding}</TableCell>
                            <TableCell align="right">${Number(row.operatingCashflow).toLocaleString()}</TableCell>
                            <TableCell align="right">${Number(row.investingCashflow).toLocaleString()}</TableCell>
                            <TableCell align="right">${Number(row.financingCashflow).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Earnings Calendar (for stocks only) */}
              {!stockData.isETF && stockData.earnings && stockData.earnings.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Earnings Calendar
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          {(() => {
                            const earnings = stockData.earnings;
                            const showEPS = earnings.some(e => !isNaN(e.eps));
                            const showEPSEst = earnings.some(e => !isNaN(e.epsEstimate));
                            const showRev = earnings.some(e => !isNaN(e.revenue));
                            const showRevEst = earnings.some(e => !isNaN(e.revenueEstimate));
                            return <>
                              {showEPS && <TableCell align="right">EPS</TableCell>}
                              {showEPSEst && <TableCell align="right">EPS Estimate</TableCell>}
                              {showRev && <TableCell align="right">Revenue</TableCell>}
                              {showRevEst && <TableCell align="right">Revenue Estimate</TableCell>}
                            </>;
                          })()}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stockData.earnings.map((earning, index) => {
                          const showEPS = !isNaN(earning.eps);
                          const showEPSEst = !isNaN(earning.epsEstimate);
                          const showRev = !isNaN(earning.revenue);
                          const showRevEst = !isNaN(earning.revenueEstimate);
                          return (
                            <TableRow key={index}>
                              <TableCell>{new Date(earning.date).toLocaleDateString()}</TableCell>
                              {showEPS && <TableCell align="right">${earning.eps.toFixed(2)}</TableCell>}
                              {showEPSEst && <TableCell align="right">${earning.epsEstimate.toFixed(2)}</TableCell>}
                              {showRev && <TableCell align="right">${(earning.revenue / 1e9).toFixed(2)}B</TableCell>}
                              {showRevEst && <TableCell align="right">${(earning.revenueEstimate / 1e9).toFixed(2)}B</TableCell>}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Profile Information */}
              {stockData.profile && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {stockData.profile.name}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {stockData.profile.description}
                  </Typography>
                  {!stockData.isETF && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Industry: {stockData.profile.industry}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sector: {stockData.profile.sector}
                      </Typography>
                    </>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Exchange: {stockData.profile.exchange}
                  </Typography>
                  {!stockData.isETF && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Country: {stockData.profile.country}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Website: <a href={stockData.profile.website} target="_blank" rel="noopener noreferrer">{stockData.profile.website}</a>
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </Container>

      {/* Help Icon */}
      <Box sx={{ position: 'fixed', top: 64, right: 32, zIndex: 2000 }}>
        <IconButton color="primary" onClick={() => setHelpOpen(true)} sx={{ p: 2 }}>
          <HelpOutlineIcon sx={{ fontSize: 48 }} />
        </IconButton>
      </Box>
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 3,
            minWidth: { xs: 320, sm: 480 },
            maxWidth: 600,
            mx: 'auto',
            my: 6,
            textAlign: 'center',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: 28, mb: 1 }}>Stock Tracker: Key Terms</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 18, lineHeight: 2 }}>
            <b>P/E Ratio</b>: Price-to-Earnings ratio. <a href="https://en.wikipedia.org/wiki/Price–earnings_ratio" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
            <b>EPS</b>: Earnings Per Share. <a href="https://en.wikipedia.org/wiki/Earnings_per_share" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
            <b>Beta</b>: Volatility relative to the market. <a href="https://en.wikipedia.org/wiki/Beta_(finance)" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
            <b>Dividend Yield</b>: Dividend as a percentage of price. <a href="https://en.wikipedia.org/wiki/Dividend_yield" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
            <b>Market Cap</b>: Total market value of a company. <a href="https://en.wikipedia.org/wiki/Market_capitalization" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
            <b>Revenue</b>: Total income from sales. <a href="https://en.wikipedia.org/wiki/Revenue" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
            <b>Profit Margin</b>: Net income as a percentage of revenue. <a href="https://en.wikipedia.org/wiki/Profit_margin" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
            <b>EBITDA</b>: Earnings before interest, taxes, depreciation, and amortization. <a href="https://en.wikipedia.org/wiki/EBITDA" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
            <b>Book Value</b>: Value of assets minus liabilities. <a href="https://en.wikipedia.org/wiki/Book_value" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
            <b>Cash Flow</b>: Net amount of cash moving in and out. <a href="https://en.wikipedia.org/wiki/Cash_flow" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
            <b>Analyst Target Price</b>: Projected future price by analysts. <a href="https://en.wikipedia.org/wiki/Price_target" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
            <b>Shares Outstanding</b>: Total shares issued by the company. <a href="https://en.wikipedia.org/wiki/Shares_outstanding" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default App
