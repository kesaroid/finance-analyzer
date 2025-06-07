import { useState } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { StockNews } from './StockNews';

interface RelatedStocksProps {
  ticker: string;
  onStockSelect: (ticker: string) => void;
}

export const RelatedStocks = ({ ticker, onStockSelect }: RelatedStocksProps) => {
  const [relatedStocks, setRelatedStocks] = useState<string[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [error, setError] = useState('');

  const fetchRelatedStocks = async (ticker: string) => {
    setLoadingRelated(true);
    try {
      const response = await fetch(
        `https://api.polygon.io/v1/related-companies/${ticker}?apiKey=${import.meta.env.VITE_POLYGON_API_KEY}`
      );
      const data = await response.json();
      if (data.results) {
        setRelatedStocks(data.results.map((stock: any) => stock.ticker));
      }
    } catch (err) {
      setError('Failed to fetch related stocks');
      console.error('Error fetching related stocks:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  return (
    <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <StockNews ticker={ticker} />
        <Button
          variant="outlined"
          size="small"
          startIcon={<LinkIcon />}
          onClick={() => fetchRelatedStocks(ticker)}
          disabled={loadingRelated}
          sx={{
            borderColor: 'black',
            color: 'black',
            '&:hover': {
              borderColor: 'black',
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          Related Stocks
        </Button>
        {loadingRelated && (
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        )}
      </Box>

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      {relatedStocks.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {relatedStocks.map((relatedTicker) => (
            <Chip
              key={relatedTicker}
              label={relatedTicker}
              onClick={() => onStockSelect(relatedTicker)}
              size="small"
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)'
                }
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}; 