import { Box, Typography } from '@mui/material';

// Sample S&P 500 tickers
const SP500_TICKERS = [
  'AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'META', 'BRK.B', 'JPM', 'JNJ', 'V',
  'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV', 'PFE', 'KO', 'BAC', 'PEP',
  'COST', 'TMO', 'DHR', 'CSCO', 'VZ', 'ADBE', 'CRM', 'CMCSA', 'NEE', 'WMT'
];

// Create a longer list by repeating the tickers multiple times
const REPEATED_TICKERS = [...SP500_TICKERS, ...SP500_TICKERS, ...SP500_TICKERS, ...SP500_TICKERS];

export const TickerTape = () => {
  return (
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
  );
}; 