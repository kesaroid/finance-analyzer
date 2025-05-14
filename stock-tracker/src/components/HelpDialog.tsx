import { Dialog, DialogTitle, DialogContent, DialogContentText } from '@mui/material';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export const HelpDialog = ({ open, onClose }: HelpDialogProps) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 3,
          minWidth: { xs: 320, sm: 480 },
          maxWidth: 600,
          mx: 'auto',
          my: 6,
          textAlign: 'center',
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', fontSize: 28, mb: 1 }}>Stock Tracker: Key Terms</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 18, lineHeight: 2 }}>
          <b>P/E Ratio</b>: Price-to-Earnings ratio. <a href="https://en.wikipedia.org/wiki/Price–earnings_ratio" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
          <b>EPS</b>: Earnings Per Share. <a href="https://en.wikipedia.org/wiki/Earnings_per_share" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
          <b>Beta</b>: Volatility relative to the market. <a href="https://en.wikipedia.org/wiki/Beta_(finance)" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
          <b>Dividend Yield</b>: Dividend as a percentage of price. <a href="https://en.wikipedia.org/wiki/Dividend_yield" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
          <b>Market Cap</b>: Total market value of a company. <a href="https://en.wikipedia.org/wiki/Market_capitalization" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
          <b>Revenue</b>: Total income from sales. <a href="https://en.wikipedia.org/wiki/Revenue" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
          <b>Profit Margin</b>: Net income as a percentage of revenue. <a href="https://en.wikipedia.org/wiki/Profit_margin" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
          <b>EBITDA</b>: Earnings before interest, taxes, depreciation, and amortization. <a href="https://en.wikipedia.org/wiki/EBITDA" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
          <b>Book Value</b>: Value of assets minus liabilities. <a href="https://en.wikipedia.org/wiki/Book_value" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
          <b>Cash Flow</b>: Net amount of cash moving in and out. <a href="https://en.wikipedia.org/wiki/Cash_flow" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
          <b>Analyst Target Price</b>: Projected future price by analysts. <a href="https://en.wikipedia.org/wiki/Price_target" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
          <b>Shares Outstanding</b>: Total shares issued by the company. <a href="https://en.wikipedia.org/wiki/Shares_outstanding" target="_blank" rel="noopener noreferrer">Wiki</a><br/>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
}; 