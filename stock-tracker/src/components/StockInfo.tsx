import { Box, Typography, Paper, Table, TableContainer, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { StockData, FinancialStatement } from '../types';

interface StockInfoProps {
  stockData: StockData;
  incomeStatement: FinancialStatement[];
  balanceSheet: FinancialStatement[];
  cashFlow: FinancialStatement[];
}

export const StockInfo = ({ stockData, incomeStatement, balanceSheet, cashFlow }: StockInfoProps) => {
  return (
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
      {!stockData.isETF && incomeStatement.length > 0 && (
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
                {incomeStatement.slice(0, 2).map((row, idx) => (
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
      {!stockData.isETF && balanceSheet.length > 0 && (
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
                {balanceSheet.slice(0, 2).map((row, idx) => (
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
      {!stockData.isETF && cashFlow.length > 0 && (
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
                  <TableCell align="right">Capital Expenditures</TableCell>
                  <TableCell align="right">Free Cash Flow</TableCell>
                  <TableCell align="right">Dividend Payout</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cashFlow.slice(0, 2).map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.fiscalDateEnding}</TableCell>
                    <TableCell align="right">${Number(row.operatingCashflow).toLocaleString()}</TableCell>
                    <TableCell align="right">${Number(row.capitalExpenditures).toLocaleString()}</TableCell>
                    <TableCell align="right">${Number(row.freeCashFlow).toLocaleString()}</TableCell>
                    <TableCell align="right">${Number(row.dividendPayout).toLocaleString()}</TableCell>
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
  );
}; 