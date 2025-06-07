import { useState } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, IconButton, CircularProgress, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArticleIcon from '@mui/icons-material/Article';

interface StockNewsProps {
  ticker: string;
}

interface NewsArticle {
  title: string;
  description: string;
  article_url: string;
  published_utc: string;
  publisher: {
    name: string;
    logo_url: string;
    homepage_url: string;
  };
}

export const StockNews = ({ ticker }: StockNewsProps) => {
  const [open, setOpen] = useState(false);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.polygon.io/v2/reference/news?ticker=${ticker}&limit=10&apiKey=${import.meta.env.VITE_POLYGON_API_KEY}`
      );
      const data = await response.json();
      if (data.results) {
        setNews(data.results);
      }
    } catch (err) {
      setError('Failed to fetch news');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    fetchNews();
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<ArticleIcon />}
        onClick={handleOpen}
        sx={{
          borderColor: 'black',
          color: 'black',
          '&:hover': {
            borderColor: 'black',
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        News
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Latest News for {ticker}
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Typography color="error" sx={{ p: 2 }}>
              {error}
            </Typography>
          )}

          {!loading && !error && news.length === 0 && (
            <Typography sx={{ p: 2 }}>
              No news available for this ticker.
            </Typography>
          )}

          {news.map((article, index) => (
            <Box key={index} sx={{ mb: 3, p: 2, borderBottom: '1px solid #eee' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {article.publisher.logo_url && (
                  <a
                    href={article.publisher.homepage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <img
                      src={article.publisher.logo_url}
                      alt={`${article.publisher.name} logo`}
                      style={{
                        height: '42px',
                        width: '42px',
                        objectFit: 'contain'
                      }}
                    />
                  </a>
                )}
                <Typography variant="body2" color="text.secondary">
                  {new Date(article.published_utc).toLocaleDateString()} - {article.publisher.name}
                </Typography>
              </Box>
              <Typography variant="h6" component="h2" gutterBottom>
                <a
                  href={article.article_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {article.title}
                </a>
              </Typography>
              <Typography variant="body1">
                {article.description}
              </Typography>
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </>
  );
}; 