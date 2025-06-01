import { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Collapse, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import OpenAI from "openai";
import type { StockData, FinancialStatement } from '../types';

const STOCK_ANALYSIS_PROMPT = `<stock_analysis>
  <role>You are a financial analyst evaluating a stock based on fundamentals, profitability, growth, stability, and competitive advantage.</role>
  
  <task>Generate a comprehensive score out of 10 based on the provided financial metrics.</task>

  <scoring_rubric>
    <category name="Valuation" points="2">
      <metric name="P/E Ratio" points="1">
        <criteria>Lower P/E gets higher score</criteria>
        <thresholds>
          <threshold value="20" points="1">20 or below = 1 point</threshold>
          <threshold value="40" points="0">40 or above = 0 points</threshold>
        </thresholds>
      </metric>
      <metric name="EBITDA to Market Cap" points="1">
        <criteria>Higher EBITDA relative to Market Cap gets a higher score</criteria>
      </metric>
    </category>

    <category name="Profitability" points="2">
      <metric name="Profit Margin" points="0.8">
        <criteria>Higher margins get higher scores</criteria>
        <thresholds>
          <threshold value="30" points="0.8">30% or above = 0.8 points</threshold>
        </thresholds>
      </metric>
      <metric name="Dividend Yield" points="0.6">
        <criteria>Higher yields get higher scores</criteria>
        <thresholds>
          <threshold value="4" points="0.6">4% or above = 0.6 points</threshold>
        </thresholds>
      </metric>
      <metric name="EPS Growth" points="0.6">
        <criteria>Higher growth gets higher scores</criteria>
        <thresholds>
          <threshold value="10" points="0.6">10% or above = 0.6 points</threshold>
        </thresholds>
      </metric>
    </category>

    <category name="Growth" points="2">
      <metric name="Revenue Growth" points="1">
        <criteria>Higher growth gets higher scores</criteria>
        <thresholds>
          <threshold value="10" points="1">10% or above = 1 point</threshold>
        </thresholds>
      </metric>
      <metric name="Operating Cash Flow Growth" points="1">
        <criteria>Higher growth gets higher scores</criteria>
        <thresholds>
          <threshold value="10" points="1">10% or above = 1 point</threshold>
        </thresholds>
      </metric>
    </category>

    <category name="Stability" points="2">
      <metric name="Market Cap" points="0.8">
        <criteria>Larger market cap gets higher scores</criteria>
        <note>Uses logarithmic scaling</note>
      </metric>
      <metric name="Beta" points="0.4">
        <criteria>Scores highest when close to 1</criteria>
        <note>Lower for highly volatile or defensive stocks</note>
      </metric>
      <metric name="Brand & Leadership" points="0.8">
        <criteria>Based on qualitative assessment of brand strength and leadership</criteria>
      </metric>
    </category>

    <category name="Financial Health" points="2">
      <metric name="Assets to Liabilities Ratio" points="0.7">
        <criteria>Higher ratio gets higher scores</criteria>
        <thresholds>
          <threshold value="1.2" points="0.7">1.2 or above = 0.7 points</threshold>
        </thresholds>
      </metric>
      <metric name="Operating Income to Revenue" points="0.7">
        <criteria>Higher ratio gets higher scores</criteria>
        <thresholds>
          <threshold value="20" points="0.7">20% or above = 0.7 points</threshold>
        </thresholds>
      </metric>
      <metric name="Free Cash Flow to Revenue" points="0.6">
        <criteria>Higher ratio gets higher scores</criteria>
        <thresholds>
          <threshold value="20" points="0.6">20% or above = 0.6 points</threshold>
        </thresholds>
      </metric>
    </category>

    <category name="Competitive Position" points="2">
      <metric name="Market Position" points="0.7">
        <criteria>Based on the company's position in its industry</criteria>
      </metric>
      <metric name="Competitive Moat" points="0.7">
        <criteria>Based on the company's competitive advantages</criteria>
      </metric>
      <metric name="Industry Growth Prospects" points="0.6">
        <criteria>Based on industry growth outlook</criteria>
      </metric>
    </category>
  </scoring_rubric>

  <competitive_analysis_requirements>
    <requirement>Identify the likely major competitors in this industry</requirement>
    <requirement>Determine potential competitive advantages (moat) based on the company's financials and industry</requirement>
    <requirement>Assess the company's market position relative to competitors</requirement>
    <requirement>Evaluate industry growth prospects</requirement>
  </competitive_analysis_requirements>

  <response_format>
    <json_structure>
      {
        "score": number,
        "explanation": string,
        "breakdown": {
          "valuation": number,
          "profitability": number,
          "growth": number,
          "stability": number,
          "financialHealth": number,
          "competitivePosition": number
        },
        "competitiveAnalysis": string,
        "missingInfo": string[],
        "strengths": string[],
        "weaknesses": string[],
        "scoringTable": string
      }
    </json_structure>
    <table_format>
      | Category | Points Rewarded | Max Points | Details |
      |----------|----------------|------------|---------|
      | Valuation | number | 2 | P/E Ratio (1), EBITDA to Market Cap (1) |
      | Profitability | number | 2 | Profit Margin (0.8), Dividend Yield (0.6), EPS Growth (0.6) |
      | Growth | number | 2 | Revenue Growth (1), Operating Cash Flow Growth (1) |
      | Stability | number | 2 | Market Cap (0.8), Beta (0.4), Brand & Leadership (0.8) |
      | Financial Health | number | 2 | Assets/Liabilities (0.7), Operating Income/Revenue (0.7), FCF/Revenue (0.6) |
      | Competitive Position | number | 2 | Market Position (0.7), Competitive Moat (0.7), Industry Growth (0.6) |
      | **Total** | number | **10** | |
    </table_format>
    <note>The score should be a number between 0 and 10.</note>
  </response_format>
</stock_analysis>`;

interface StockScoreProps {
  stockData: StockData;
  incomeStatement: FinancialStatement[];
  balanceSheet: FinancialStatement[];
  cashFlow: FinancialStatement[];
}

interface ScoreResponse {
  score: number;
  explanation: string;
  breakdown?: {
    valuation: number;
    profitability: number;
    growth: number;
    stability: number;
    financialHealth: number;
    competitivePosition: number;
  };
  competitiveAnalysis?: string;
  missingInfo?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

export const StockScore: React.FC<StockScoreProps> = ({ stockData, incomeStatement, balanceSheet, cashFlow }) => {
  const [score, setScore] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreResponse['breakdown']>();
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState<string>('');
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    const calculateScore = async () => {
      setLoading(true);
      setError('');

      try {
        // Get the most recent and previous year's data
        const currentYear = incomeStatement[0];
        const previousYear = incomeStatement[1];
        const currentBalanceSheet = balanceSheet[0];
        const currentCashFlow = cashFlow[0];

        // Calculate derived values
        const revenueCurrent = Number(currentYear?.totalRevenue) || 0;
        const revenuePrevious = Number(previousYear?.totalRevenue) || 0;
        const totalAssets = Number(currentBalanceSheet?.totalAssets) || 0;
        const totalLiabilities = Number(currentBalanceSheet?.totalLiabilities) || 0;
        const operatingCashFlow = Number(currentCashFlow?.operatingCashflow) || 0;
        const capitalExpenditures = Number(currentCashFlow?.capitalExpenditures) || 0;
        const freeCashFlow = currentCashFlow?.freeCashFlow 
          ? Number(currentCashFlow.freeCashFlow) 
          : operatingCashFlow - capitalExpenditures;

        const analysisData = {
          symbol: stockData.symbol,
          companyName: stockData.profile?.name || '',
          price: stockData.price,
          marketCap: stockData.fundamentals?.marketCap || 0,
          peRatio: stockData.fundamentals?.peRatio || 0,
          eps: stockData.fundamentals?.eps || 0,
          dividendYield: stockData.fundamentals?.dividendYield || 0,
          ebitda: stockData.fundamentals?.ebitda || 0,
          profitMargin: stockData.fundamentals?.profitMargin || 0,
          revenueCurrent,
          revenuePrevious,
          totalAssets,
          totalLiabilities,
          operatingCashFlow,
          capitalExpenditures,
          freeCashFlow,
          fiscalDate: currentYear?.fiscalDateEnding || '',
          sector: stockData.profile?.sector || '',
          industry: stockData.profile?.industry || '',
          beta: stockData.fundamentals?.beta || 0,
          "52WeekHigh": stockData.fundamentals?.fiftyTwoWeekHigh || 0,
          "52WeekLow": stockData.fundamentals?.fiftyTwoWeekLow || 0,
          evRevenue: stockData.fundamentals?.evToRevenue || 0,
          analystTargetPrice: stockData.fundamentals?.analystTargetPrice || 0
        };

        const client = new OpenAI({
          apiKey: import.meta.env.VITE_OPENAI_API_KEY,
          dangerouslyAllowBrowser: true
        });

        const response = await client.responses.create({
          model: "gpt-4.1-mini",
          input: [
            {
              "role": "system",
              "content": [
                {
                  "type": "input_text",
                  "text": STOCK_ANALYSIS_PROMPT
                }
              ]
            },
            {
              "role": "user",
              "content": [
                {
                  "type": "input_text",
                  "text": JSON.stringify(analysisData)
                }
              ]
            }
          ],
          text: {
            "format": {
              "type": "json_object"
            }
          },
          reasoning: {},
          tools: [],
          temperature: 1,
          max_output_tokens: 2048,
          top_p: 1,
          store: true
        });

        console.log('Raw API Response:', response);
        
        let analysis;
        try {
          analysis = JSON.parse(response.output_text);
          console.log('Parsed Analysis:', analysis);
        } catch (err) {
          console.error('Failed to parse API response:', err);
          throw new Error('Invalid API response format');
        }

        if (!analysis || typeof analysis.score !== 'number') {
          throw new Error('Invalid score in API response');
        }

        setScore(analysis.score);
        setExplanation(analysis.explanation || '');
        setScoreBreakdown(analysis.breakdown);
        setCompetitiveAnalysis(analysis.competitiveAnalysis || '');
        setMissingInfo(analysis.missingInfo || []);
        setStrengths(analysis.strengths || []);
        setWeaknesses(analysis.weaknesses || []);
        setAnalysisData(analysis);
      } catch (err) {
        setError('Failed to calculate stock score. Please try again.');
        console.error('Error calculating stock score:', err);
      } finally {
        setLoading(false);
      }
    };

    if (stockData) {
      calculateScore();
    }
  }, [stockData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={1}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" variant="body2">
        {error}
      </Typography>
    );
  }

  if (!score) {
    return null;
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography 
          variant="h6" 
          component="div" 
          onClick={() => setDialogOpen(true)}
          sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
        >
          {score.toFixed(1)}
        </Typography>
      </Box>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Stock Analysis Details</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            mt: 2,
            maxHeight: '70vh',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
              '&:hover': {
                background: '#555',
              },
            },
          }}>
            {analysisData && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Overall Score</Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>{analysisData.score.toFixed(1)}/10</Typography>

                <Typography variant="h6" gutterBottom>Explanation</Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>{analysisData.explanation}</Typography>

                {analysisData.scoringTable && (
                  <>
                    <Typography variant="h6" gutterBottom>Detailed Scoring</Typography>
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Points Rewarded</TableCell>
                            <TableCell align="right">Max Points</TableCell>
                            <TableCell>Details</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(analysisData.breakdown).map(([category, points]) => (
                            <TableRow key={category}>
                              <TableCell component="th" scope="row" sx={{ textTransform: 'capitalize' }}>
                                {category.replace(/([A-Z])/g, ' $1').trim()}
                              </TableCell>
                              <TableCell align="right">{Number(points).toFixed(1)}</TableCell>
                              <TableCell align="right">2</TableCell>
                              <TableCell>
                                {category === 'valuation' && 'P/E Ratio (1), EBITDA to Market Cap (1)'}
                                {category === 'profitability' && 'Profit Margin (0.8), Dividend Yield (0.6), EPS Growth (0.6)'}
                                {category === 'growth' && 'Revenue Growth (1), Operating Cash Flow Growth (1)'}
                                {category === 'stability' && 'Market Cap (0.8), Beta (0.4), Brand & Leadership (0.8)'}
                                {category === 'financialHealth' && 'Assets/Liabilities (0.7), Operating Income/Revenue (0.7), FCF/Revenue (0.6)'}
                                {category === 'competitivePosition' && 'Market Position (0.7), Competitive Moat (0.7), Industry Growth (0.6)'}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{analysisData.score.toFixed(1)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>10</TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                <Typography variant="h6" gutterBottom>Competitive Analysis</Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>{analysisData.competitiveAnalysis}</Typography>

                {analysisData.strengths && analysisData.strengths.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>Strengths</Typography>
                    <Box component="ul" sx={{ mb: 3, pl: 2 }}>
                      {analysisData.strengths.map((strength: string, index: number) => (
                        <Typography component="li" key={index} variant="body1">{strength}</Typography>
                      ))}
                    </Box>
                  </>
                )}

                {analysisData.weaknesses && analysisData.weaknesses.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>Weaknesses</Typography>
                    <Box component="ul" sx={{ mb: 3, pl: 2 }}>
                      {analysisData.weaknesses.map((weakness: string, index: number) => (
                        <Typography component="li" key={index} variant="body1">{weakness}</Typography>
                      ))}
                    </Box>
                  </>
                )}

                {analysisData.missingInfo && analysisData.missingInfo.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>Missing Information</Typography>
                    <Box component="ul" sx={{ mb: 3, pl: 2 }}>
                      {analysisData.missingInfo.map((info: string, index: number) => (
                        <Typography component="li" key={index} variant="body1">{info}</Typography>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 