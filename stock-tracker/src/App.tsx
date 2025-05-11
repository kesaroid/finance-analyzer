import { useState } from 'react'
import { Container, TextField, Button, Typography, Box, Paper, Table, TableContainer, TableHead, TableBody, TableRow, TableCell } from '@mui/material'
import axios from 'axios'
import BackgroundGraph from './components/BackgroundGraph'

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
  profile: {
    name: string;
    description: string;
    industry: string;
    sector: string;
    website: string;
  };
  earnings: {
    date: string;
    eps: number;
    epsEstimate: number;
    revenue: number;
    revenueEstimate: number;
  }[];
}

function App() {
  const [ticker, setTicker] = useState('')
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchStockData = async () => {
    if (!ticker) {
      setError('Please enter a ticker symbol')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const apiKey = import.meta.env.VITE_TWELVE_DATA_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found');
      }

      // Fetch logo
      const logoResponse = await axios.get(`https://api.twelvedata.com/logo?symbol=${ticker}&apikey=${apiKey}`);
      
      // Fetch current price
      const quoteResponse = await axios.get(`https://api.twelvedata.com/quote?symbol=${ticker}&apikey=${apiKey}`);
      
      // Fetch profile
      const profileResponse = await axios.get(`https://api.twelvedata.com/profile?symbol=${ticker}&apikey=${apiKey}`);
      
      // Fetch earnings calendar
      const earningsResponse = await axios.get(`https://api.twelvedata.com/earnings_calendar?symbol=${ticker}&apikey=${apiKey}`);

      if (quoteResponse.data.status === 'error') {
        throw new Error(quoteResponse.data.message || 'Failed to fetch stock data');
      }

      const quoteData = quoteResponse.data;
      const profileData = profileResponse.data;
      
      setStockData({
        symbol: quoteData.symbol,
        price: parseFloat(quoteData.close),
        change: parseFloat(quoteData.change),
        changePercent: parseFloat(quoteData.percent_change),
        volume: parseInt(quoteData.volume),
        marketCap: parseInt(quoteData.market_cap),
        logo: logoResponse.data.url,
        profile: {
          name: profileData.name,
          description: profileData.description,
          industry: profileData.industry,
          sector: profileData.sector,
          website: profileData.website
        },
        earnings: earningsResponse.data.earnings
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
            Stock Tracker
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <TextField
              fullWidth
              label="Enter Ticker Symbol"
              variant="outlined"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && fetchStockData()}
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
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {stockData.symbol}
                  </Typography>
                  <Typography variant="h4" color="black">
                    ${stockData.price.toFixed(2)}
                  </Typography>
                  <Typography
                    color={stockData.change >= 0 ? 'success.main' : 'error.main'}
                    gutterBottom
                  >
                    {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
                  </Typography>
                </Box>
              </Box>

              {/* Earnings Calendar */}
              {stockData.earnings && stockData.earnings.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Earnings Calendar
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">EPS</TableCell>
                          <TableCell align="right">EPS Estimate</TableCell>
                          <TableCell align="right">Revenue</TableCell>
                          <TableCell align="right">Revenue Estimate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stockData.earnings.map((earning, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(earning.date).toLocaleDateString()}</TableCell>
                            <TableCell align="right">${earning.eps.toFixed(2)}</TableCell>
                            <TableCell align="right">${earning.epsEstimate.toFixed(2)}</TableCell>
                            <TableCell align="right">${(earning.revenue / 1e9).toFixed(2)}B</TableCell>
                            <TableCell align="right">${(earning.revenueEstimate / 1e9).toFixed(2)}B</TableCell>
                          </TableRow>
                        ))}
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
                  <Typography variant="body2" color="text.secondary">
                    Industry: {stockData.profile.industry}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sector: {stockData.profile.sector}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Website: <a href={stockData.profile.website} target="_blank" rel="noopener noreferrer">{stockData.profile.website}</a>
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </Container>
    </>
  )
}

export default App
