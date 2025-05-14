import { useState } from 'react'
import { Container, Typography, Box, IconButton } from '@mui/material'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import BackgroundGraph from './components/BackgroundGraph'
import { TickerTape } from './components/TickerTape'
import { StockSearch } from './components/StockSearch'
import { StockInfo } from './components/StockInfo'
import { HelpDialog } from './components/HelpDialog'
import type { StockData, FinancialStatement } from './types'
import { fetchStockData } from './services/api'

function App() {
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [incomeStatement, setIncomeStatement] = useState<FinancialStatement[]>([])
  const [balanceSheet, setBalanceSheet] = useState<FinancialStatement[]>([])
  const [cashFlow, setCashFlow] = useState<FinancialStatement[]>([])
  const [helpOpen, setHelpOpen] = useState(false)

  const handleSearch = async (ticker: string) => {
    if (!ticker) {
      setError('Please enter a ticker symbol')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const { stockData, incomeStatement, balanceSheet, cashFlow } = await fetchStockData(ticker)
      setStockData(stockData)
      setIncomeStatement(incomeStatement)
      setBalanceSheet(balanceSheet)
      setCashFlow(cashFlow)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data. Please try again.')
      console.error('Error fetching stock data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <BackgroundGraph />
      <TickerTape />
      
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
          
          <StockSearch onSearch={handleSearch} loading={loading} />

          {error && (
            <Typography color="error" align="center" gutterBottom>
              {error}
            </Typography>
          )}

          {stockData && (
            <StockInfo
              stockData={stockData}
              incomeStatement={incomeStatement}
              balanceSheet={balanceSheet}
              cashFlow={cashFlow}
            />
          )}
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
