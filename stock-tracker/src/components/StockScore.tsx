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
                  "text": "You are a financial analyst evaluating a stock based on fundamentals, profitability, growth, stability, and competitive advantage. \nGenerate a comprehensive score out of 10 based on the provided financial metrics.\n\nEvaluate the stock using the following scoring rubric:\n\n1. Valuation (Cheap) - 2 points\n    - P/E Ratio (1 point): Lower P/E gets higher score, with 20 or below = 1 point, 40 or above = 0 points\n    - EBITDA to Market Cap (1 point): Higher EBITDA relative to Market Cap gets a higher score\n\n2. Profitability - 2 points\n    - Profit Margin (0.8 points): Higher margins get higher scores, with 30% or above = 0.8 points\n    - Dividend Yield (0.6 points): Higher yields get higher scores, with 4% or above = 0.6 points\n    - EPS Growth (0.6 points): Higher growth gets higher scores, with 10% or above = 0.6 points\n\n3. Growth - 2 points\n    - Revenue Growth (1 point): Higher growth gets higher scores, with 10% or above = 1 point\n    - Operating Cash Flow Growth (1 point): Higher growth gets higher scores, with 10% or above = 1 point\n\n4. Stability - 2 points\n    - Market Cap (0.8 points): Larger market cap gets higher scores, with logarithmic scaling\n    - Beta (0.4 points): Scores highest when close to 1, lower for highly volatile or defensive stocks\n    - Brand & Leadership (0.8 points): Based on qualitative assessment of brand strength and leadership\n\n5. Financial Health - 2 points\n    - Assets to Liabilities Ratio (0.7 points): Higher ratio gets higher scores, with 1.2 or above = 0.7 points\n    - Operating Income to Revenue (0.7 points): Higher ratio gets higher scores, with 20% or above = 0.7 points\n    - Free Cash Flow to Revenue (0.6 points): Higher ratio gets higher scores, with 20% or above = 0.6 points\n\n6. Competitive Position - 2 points (derived from industry and sector information)\n    - Market Position (0.7 points): Based on the company's position in its industry\n    - Competitive Moat (0.7 points): Based on the company's competitive advantages\n    - Industry Growth Prospects (0.6 points): Based on industry growth outlook\n\nFor the Competitive Position category, please analyze the industry and sector information to:\n1. Identify the likely major competitors in this industry\n2. Determine potential competitive advantages (moat) based on the company's financials and industry\n3. Assess the company's market position relative to competitors\n4. Evaluate industry growth prospects\n\nPlease provide:\n1. A detailed breakdown of scores for each category\n2. A brief analysis of the company's competitive position and moat\n3. A list of any missing information that would improve the analysis\n4. Key strengths and weaknesses based on the scoring\n5. The total score out of 10 should be the last line of the response in the format {Score:X}\n\nThe user will provide the JSON"
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
        
        const analysis = JSON.parse(response.output_text);
        console.log('Parsed Analysis:', analysis);

        // Extract the final score from the Total Score field
        const finalScore = analysis["Total Score"] || analysis.Score || analysis.score;
        setScore(finalScore);
        setExplanation(analysis["Competitive Position Analysis"] || analysis.explanation || '');
        setScoreBreakdown(
          analysis.breakdown || {
            valuation: analysis.Valuation?.["Total Valuation Score"] ?? analysis.valuation ?? 0,
            profitability: analysis.Profitability?.["Total Profitability Score"] ?? analysis.profitability ?? 0,
            growth: analysis.Growth?.["Total Growth Score"] ?? analysis.growth ?? 0,
            stability: analysis.Stability?.["Total Stability Score"] ?? analysis.stability ?? 0,
            financialHealth: analysis["Financial Health"]?.["Total Financial Health Score"] ?? analysis.financialHealth ?? 0,
            competitivePosition: analysis["Competitive Position"]?.["Total Competitive Position Score"] ?? analysis.competitivePosition ?? 0
          }
        );
        setCompetitiveAnalysis(analysis["Competitive Position Analysis"] || analysis.competitiveAnalysis || '');
        setMissingInfo(analysis["Missing Information"] || analysis.missingInfo || []);
        setStrengths(analysis["Key Strengths"] || analysis.strengths || []);
        setWeaknesses(analysis["Key Weaknesses"] || analysis.weaknesses || []);
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
        <DialogTitle>Stock Analysis Details (Raw JSON)</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {analysisData && (
              <pre style={{ fontSize: 14, background: '#f5f5f5', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
                {JSON.stringify(analysisData, null, 2)}
              </pre>
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