import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Autocomplete, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { SearchResult } from '../types';
import { searchSymbols } from '../services/api';

const disableSymbolSearch = import.meta.env.VITE_DISABLE_SYMBOL_SEARCH === 'true';

interface StockSearchProps {
  onSearch: (ticker: string) => void;
  loading: boolean;
  hasStock?: boolean;
}

export const StockSearch = ({ onSearch, loading, hasStock = false }: StockSearchProps) => {
  const [ticker, setTicker] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ticker) {
        setSearchLoading(true);
        searchSymbols(ticker)
          .then(setSearchResults)
          .finally(() => setSearchLoading(false));
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [ticker]);

  const handleSearch = () => {
    setSearchResults([]); // Clear previous results
    onSearch(ticker);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4, flex: 1 }}>
      {disableSymbolSearch && (
        <Typography variant="body2" color="text.secondary" align="center">
          Symbol search is disabled to conserve API credits. Please enter the exact ticker symbol.
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 2 }}>
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
              handleSearch();
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
          onClick={handleSearch}
          disabled={loading}
          startIcon={hasStock ? <AddIcon sx={{ fontSize: 20 }} /> : undefined}
          sx={{ 
            backgroundColor: 'black',
            minWidth: 120,
            height: 48,
            fontSize: 16,
            boxShadow: 3,
            '&:hover': {
              backgroundColor: 'black',
              opacity: 0.9
            }
          }}
        >
          {loading ? 'Loading...' : hasStock ? 'Compare' : 'Search'}
        </Button>
      </Box>
    </Box>
  );
}; 