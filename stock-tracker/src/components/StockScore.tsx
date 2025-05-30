import { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Collapse, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import OpenAI from "openai";
import type { StockData, FinancialStatement } from '../types';


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
                  "text": "You are a financial analyst evaluating a stock based on fundamentals, profitability, growth, stability, and competitive advantage. \nGenerate a comprehensive score out of 10 based on the provided financial metrics.\n\nEvaluate the stock using the following scoring rubric:\n\n1. Valuation (Cheap) - 2 points\n    - P/E Ratio (1 point): Lower P/E gets higher score, with 20 or below = 1 point, 40 or above = 0 points\n    - EBITDA to Market Cap (1 point): Higher EBITDA relative to Market Cap gets a higher score\n\n2. Profitability - 2 points\n    - Profit Margin (0.8 points): Higher margins get higher scores, with 30% or above = 0.8 points\n    - Dividend Yield (0.6 points): Higher yields get higher scores, with 4% or above = 0.6 points\n    - EPS Growth (0.6 points): Higher growth gets higher scores, with 10% or above = 0.6 points\n\n3. Growth - 2 points\n    - Revenue Growth (1 point): Higher growth gets higher scores, with 10% or above = 1 point\n    - Operating Cash Flow Growth (1 point): Higher growth gets higher scores, with 10% or above = 1 point\n\n4. Stability - 2 points\n    - Market Cap (0.8 points): Larger market cap gets higher scores, with logarithmic scaling\n    - Beta (0.4 points): Scores highest when close to 1, lower for highly volatile or defensive stocks\n    - Brand & Leadership (0.8 points): Based on qualitative assessment of brand strength and leadership\n\n5. Financial Health - 2 points\n    - Assets to Liabilities Ratio (0.7 points): Higher ratio gets higher scores, with 1.2 or above = 0.7 points\n    - Operating Income to Revenue (0.7 points): Higher ratio gets higher scores, with 20% or above = 0.7 points\n    - Free Cash Flow to Revenue (0.6 points): Higher ratio gets higher scores, with 20% or above = 0.6 points\n\n6. Competitive Position - 2 points (derived from industry and sector information)\n    - Market Position (0.7 points): Based on the company's position in its industry\n    - Competitive Moat (0.7 points): Based on the company's competitive advantages\n    - Industry Growth Prospects (0.6 points): Based on industry growth outlook\n\nFor the Competitive Position category, please analyze the industry and sector information to:\n1. Identify the likely major competitors in this industry\n2. Determine potential competitive advantages (moat) based on the company's financials and industry\n3. Assess the company's market position relative to competitors\n4. Evaluate industry growth prospects\n\nPlease provide your analysis in the following JSON format:\n{\n  \"score\": number,\n  \"explanation\": string,\n  \"breakdown\": {\n    \"valuation\": number,\n    \"profitability\": number,\n    \"growth\": number,\n    \"stability\": number,\n    \"financialHealth\": number,\n    \"competitivePosition\": number\n  },\n  \"competitiveAnalysis\": string,\n  \"missingInfo\": string[],\n  \"strengths\": string[],\n  \"weaknesses\": string[]\n}\n\nThe score should be a number between 0 and 10."
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

                <Typography variant="h6" gutterBottom>Score Breakdown</Typography>
                <Box sx={{ mb: 3 }}>
                  {analysisData.breakdown && Object.entries(analysisData.breakdown).map(([key, value]) => (
                    <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Typography>
                      <Typography variant="body1">{Number(value).toFixed(1)}</Typography>
                    </Box>
                  ))}
                </Box>

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