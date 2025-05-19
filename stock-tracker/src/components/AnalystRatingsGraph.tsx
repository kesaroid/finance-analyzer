import { Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { StockData } from '../types';

interface AnalystRatingsGraphProps {
  stockData: StockData;
}

export const AnalystRatingsGraph = ({ stockData }: AnalystRatingsGraphProps) => {
  if (!stockData.fundamentals?.analystRating) {
    return null;
  }

  const { buy, hold, sell } = stockData.fundamentals.analystRating;
  const total = buy + hold + sell;

  const data = [
    {
      name: 'Buy',
      value: buy,
      percentage: (buy / total) * 100,
      color: '#4caf50' // Light green
    },
    {
      name: 'Hold',
      value: hold,
      percentage: (hold / total) * 100,
      color: '#ffd700' // Light yellow
    },
    {
      name: 'Sell',
      value: sell,
      percentage: (sell / total) * 100,
      color: '#f44336' // Light red
    }
  ];

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Analyst Ratings
      </Typography>
      <Box sx={{ height: 200, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis type="number" domain={[0, 100]} unit="%" />
            <YAxis type="category" dataKey="name" />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
              labelFormatter={(label) => `${label} Ratings`}
            />
            <Bar
              dataKey="percentage"
              fill="#8884d8"
              background={{ fill: '#eee' }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        {data.map((item) => (
          <Typography key={item.name} variant="body2" color="text.secondary">
            {item.name}: {item.value} analysts
          </Typography>
        ))}
      </Box>
    </Box>
  );
}; 