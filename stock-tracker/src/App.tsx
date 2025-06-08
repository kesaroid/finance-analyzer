import { useState, useRef, useEffect } from 'react'
import { Container, Typography, Box, IconButton, Button, Chip } from '@mui/material'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import AddIcon from '@mui/icons-material/Add'
import HomeIcon from '@mui/icons-material/Home'
import LinkIcon from '@mui/icons-material/Link'
import BackgroundGraph from './components/BackgroundGraph'
import { TickerTape } from './components/TickerTape'
import { StockSearch } from './components/StockSearch'
import { StockInfo } from './components/StockInfo'
import { HelpDialog } from './components/HelpDialog'
import { RelatedStocks } from './components/RelatedStocks'
import type { StockData, FinancialStatement } from './types'
import { fetchStockData } from './services/api'

interface StockPanel {
  stockData: StockData;
  incomeStatement: FinancialStatement[];
  balanceSheet: FinancialStatement[];
  cashFlow: FinancialStatement[];
}

function App() {
  const [stockPanels, setStockPanels] = useState<StockPanel[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [currentTicker, setCurrentTicker] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (stockPanels.length > 1 && scrollContainerRef.current) {
      // Scroll to the far right (newest card)
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth',
      })
    }
  }, [stockPanels.length])

  const handleSearch = async (ticker: string) => {
    if (!ticker) {
      setError('Please enter a ticker symbol')
      return
    }

    setCurrentTicker(ticker)
    setError('')
    setLoading(true)
    
    try {
      const { stockData, incomeStatement, balanceSheet, cashFlow } = await fetchStockData(ticker)
      const newPanel = { stockData, incomeStatement, balanceSheet, cashFlow }
      setStockPanels(prevPanels => {
        // If no panels, add as first; otherwise, append for compare
        if (prevPanels.length === 0) {
          return [newPanel]
        }
        return [...prevPanels, newPanel]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data. Please try again.')
      console.error('Error fetching stock data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCompare = () => {
    if (currentTicker) {
      handleSearch(currentTicker)
    }
  }

  return (
    <>
      <BackgroundGraph />
      <TickerTape />

      {/* Home Button */}
      <Box sx={{ position: 'fixed', top: 72, left: 32, zIndex: 2000 }}>
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => {
            setStockPanels([])
            setError('')
            setLoading(false)
            setCurrentTicker('')
          }}
          sx={{
            backgroundColor: 'black',
            color: 'white',
            minWidth: 100,
            height: 44,
            fontWeight: 'bold',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: 'black',
              opacity: 0.9
            }
          }}
        >
          Home
        </Button>
      </Box>
      
      <Container 
        maxWidth="xl" 
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
            that's my quant 📈
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center' }}>
            <StockSearch 
              onSearch={handleSearch} 
              loading={loading} 
              hasStock={stockPanels.length > 0}
            />
          </Box>

          {error && (
            <Typography color="error" align="center" gutterBottom>
              {error}
            </Typography>
          )}

          <Box
            ref={scrollContainerRef}
            sx={{ 
              display: 'flex',
              gap: 3,
              flexDirection: 'row',
              overflowX: 'auto',
              py: 2,
              width: '100%',
              alignItems: 'stretch',
              scrollbarWidth: 'thin',
              justifyContent: stockPanels.length === 1 ? 'center' : 'flex-start',
              transition: 'justify-content 0.3s',
              '&::-webkit-scrollbar': {
                height: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#bbb',
                borderRadius: '8px',
              },
            }}
          >
            {stockPanels.map((panel, index) => (
              <Box 
                key={panel.stockData.symbol + '-' + index} 
                sx={{ 
                  flex: '0 0 auto',
                  minWidth: { xs: '95vw', sm: '500px', md: '600px', lg: '700px' },
                  maxWidth: { xs: '95vw', sm: '500px', md: '600px', lg: '700px' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  transition: 'margin 0.4s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <StockInfo
                  stockData={panel.stockData}
                  incomeStatement={panel.incomeStatement}
                  balanceSheet={panel.balanceSheet}
                  cashFlow={panel.cashFlow}
                  onStockSelect={handleSearch}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      {/* Help Icon */}
      <Box sx={{ position: 'fixed', top: 64, right: 32, zIndex: 2000 }}>
        <IconButton color="primary" onClick={() => setHelpOpen(true)} sx={{ p: 2 }}>
          <HelpOutlineIcon sx={{ fontSize: 48 }} />
        </IconButton>
      </Box>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  )
}

export default App
