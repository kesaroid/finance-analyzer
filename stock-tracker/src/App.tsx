import { useState } from 'react'
import { Container, TextField, Button, Typography, Box, Paper } from '@mui/material'
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
      // Note: You'll need to replace this with your actual API key and endpoint
      const response = await axios.get(`https://api.twelvedata.com/api_usage?apikey=your_api_key`)
      setStockData(response.data)
    } catch (err) {
      setError('Failed to fetch stock data. Please try again.')
      console.error('Error fetching stock data:', err)
    } finally {
      setLoading(false)
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
        maxWidth="sm" 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: '60px' // Add padding top to account for ticker tape
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
              <Typography variant="h5" gutterBottom>
                {stockData.symbol}
              </Typography>
              <Typography variant="h4" color="black">
                ${stockData.price.toFixed(2)}
              </Typography>
              <Typography
                color="black"
                gutterBottom
              >
                {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Volume: {stockData.volume.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Market Cap: ${(stockData.marketCap / 1e9).toFixed(2)}B
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Container>
    </>
  )
}

export default App
