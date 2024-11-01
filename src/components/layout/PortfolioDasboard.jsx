import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../elements/Card';
import { Alert, AlertDescription } from '../elements/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../elements/Tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Plus, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Percent, BarChart2, Activity, Wallet, Gauge } from 'lucide-react';
import { Progress, Skeleton, LoadingState } from '../elements/Progress';

const API_BASE_URL = 'https://api.coinpaprika.com/v1';

const MotionCard = motion(Card);


const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 }
};

export const ChartCard = ({ title, children }) => (
  <Card className="overflow-hidden">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

export const PortfolioMetricCard = ({ title, value, icon: Icon, trend, color = "blue" }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p className={`text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(2)}%
            </p>
          )}
        </div>
        <div className={`p-4 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const AssetCard = ({ asset }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">{asset.symbol}</h3>
          <p className="text-sm text-gray-500">
            {asset.amount} × ${asset.currentPrice.toLocaleString(undefined, { 
              maximumFractionDigits: 2 
            })}
          </p>
        </div>
        <div 
          className={`px-3 py-1 rounded-full ${
            asset.percentChange24h >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}
        >
          {asset.percentChange24h >= 0 ? '+' : ''}{asset.percentChange24h.toFixed(2)}%
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className={`h-2 rounded-full ${asset.percentChange24h >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(Math.abs(asset.percentChange24h) * 2, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">24h Volume</p>
          <p className="font-semibold">${asset.volume24h.toLocaleString()}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Market Cap</p>
          <p className="font-semibold">${asset.marketCap.toLocaleString()}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);
;

// const LoadingState = () => (
//   <div className="space-y-6 p-6">
//     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//       {[...Array(3)].map((_, i) => (
//         <Skeleton key={i} className="h-32" />
//       ))}
//     </div>
//     <Skeleton className="h-64" />
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//       {[...Array(4)].map((_, i) => (
//         <Skeleton key={i} className="h-48" />
//       ))}
//     </div>
//   </div>
// );


// Technical Analysis Utilities
const calculateRSI = (prices, periods = 14) => {
    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? -change : 0);
  
    const avgGain = gains.slice(0, periods).reduce((sum, gain) => sum + gain, 0) / periods;
    const avgLoss = losses.slice(0, periods).reduce((sum, loss) => sum + loss, 0) / periods;
  
    let rs = avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
  
    return prices.map((_, i) => {
      if (i < periods) return null;
      return rsi.toFixed(2);
    });
  };
  
  const calculateMACD = (prices, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) => {
    const getEMA = (data, periods) => {
      const k = 2 / (periods + 1);
      let ema = data[0];
      return data.map((price, i) => {
        if (i === 0) return ema;
        ema = (price - ema) * k + ema;
        return ema;
      });
    };
  
    const shortEMA = getEMA(prices, shortPeriod);
    const longEMA = getEMA(prices, longPeriod);
    const macdLine = shortEMA.map((short, i) => short - longEMA[i]);
    const signalLine = getEMA(macdLine, signalPeriod);
    const histogram = macdLine.map((macd, i) => macd - signalLine[i]);
  
    return { macdLine, signalLine, histogram };
  };
  
  // Gas Price Analysis Utilities
  const fetchGasPrice = async () => {
    try {
      const response = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
      const data = await response.json();
      return {
        safe: data.result.SafeGasPrice,
        standard: data.result.ProposeGasPrice,
        fast: data.result.FastGasPrice
      };
    } catch (error) {
      console.error('Error fetching gas price:', error);
      return null;
    }
  };
  
  // Sentiment Analysis Component
  const SentimentIndicator = ({ assets }) => {
    const [sentiment, setSentiment] = useState({
      overall: 0,
      social: 0,
      technical: 0
    });
  
    useEffect(() => {
      // Simulate sentiment calculation
      const calculateSentiment = () => {
        const technicalSignals = assets.map(asset => {
          const lastRSI = parseFloat(asset.technicals.rsi.slice(-1)[0] || 0);
          const lastMACD = parseFloat(asset.technicals.macd.histogram.slice(-1)[0] || 0);
          
          let signal = 0;
          if (lastRSI > 70) signal -= 1;
          if (lastRSI < 30) signal += 1;
          if (lastMACD > 0) signal += 0.5;
          if (lastMACD < 0) signal -= 0.5;
          
          return signal;
        });
  
        const technicalScore = technicalSignals.reduce((acc, val) => acc + val, 0) / technicalSignals.length;
        
        setSentiment({
          overall: ((technicalScore + 1) * 50).toFixed(1),
          social: Math.random() * 100,  // Placeholder - would come from social media API
          technical: ((technicalScore + 1) * 50).toFixed(1)
        });
      };
  
      calculateSentiment();
    }, [assets]);
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${
              sentiment.overall > 50 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <h3 className="text-sm font-medium">Overall</h3>
              <p className="text-2xl font-bold">{sentiment.overall}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium">Social</h3>
              <p className="text-2xl font-bold">{sentiment.social.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium">Technical</h3>
              <p className="text-2xl font-bold">{sentiment.technical}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Technical Analysis Component
  const TechnicalAnalysis = ({ asset }) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Technical Indicators - {asset.symbol}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* RSI Chart */}
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={asset.technicals.rsi.map((value, index) => ({
                  time: index,
                  value: value
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                  {/* Overbought/Oversold lines */}
                  <Line type="monotone" dataKey={() => 70} stroke="#ff0000" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey={() => 30} stroke="#00ff00" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
  
            {/* MACD Chart */}
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={asset.technicals.macd.macdLine.map((value, index) => ({
                  time: index,
                  macd: value,
                  signal: asset.technicals.macd.signalLine[index],
                  histogram: asset.technicals.macd.histogram[index]
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="macd" stroke="#8884d8" />
                  <Line type="monotone" dataKey="signal" stroke="#82ca9d" />
                  <Area type="monotone" dataKey="histogram" fill="#ffc658" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Gas Analysis Component
  const GasAnalysis = ({ gasData, priceData }) => {
    const [correlation, setCorrelation] = useState(0);
  
    useEffect(() => {
      // Calculate price-gas correlation
      if (gasData.length > 0 && priceData.length > 0) {
        const gasValues = gasData.map(d => d.standard);
        const priceValues = priceData.map(d => d.price);
        
        // Simple correlation coefficient
        const n = Math.min(gasValues.length, priceValues.length);
        let sum_xy = 0, sum_x = 0, sum_y = 0, sum_x2 = 0, sum_y2 = 0;
        
        for (let i = 0; i < n; i++) {
          sum_xy += gasValues[i] * priceValues[i];
          sum_x += gasValues[i];
          sum_y += priceValues[i];
          sum_x2 += gasValues[i] * gasValues[i];
          sum_y2 += priceValues[i] * priceValues[i];
        }
        
        const correlation = (n * sum_xy - sum_x * sum_y) / 
          Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y));
        
        setCorrelation(correlation);
      }
    }, [gasData, priceData]);
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gas Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium">Current Gas (Gwei)</h3>
              <p className="text-2xl font-bold">{gasData[0]?.standard || 'N/A'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium">Price Correlation</h3>
              <p className="text-2xl font-bold">{correlation.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="standard" stroke="#8884d8" name="Gas Price" />
                <Line yAxisId="right" type="monotone" dataKey="price" stroke="#82ca9d" name="Asset Price" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

const fetchAssetPrice = async (coinId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tickers/${coinId}`);
    const data = await response.json();
    return {
      price: data.quotes.USD.price,
      volume_24h: data.quotes.USD.volume_24h,
      percent_change_24h: data.quotes.USD.percent_change_24h,
      market_cap: data.quotes.USD.market_cap
    };
  } catch (error) {
    console.error('Error fetching price:', error);
    return null;
  }
};

const fetchHistoricalData = async (coinId, start, end) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/tickers/${coinId}/historical?start=${start}&end=${end}&interval=1d`
    );
    const data = await response.json();
    return data.map(item => ({
      date: new Date(item.timestamp).toLocaleDateString(),
      price: item.price,
      volume: item.volume_24h,
      marketCap: item.market_cap
    }));
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
};

// Analytics Components
const PortfolioAnalytics = ({ assets }) => {
  const [metrics, setMetrics] = useState({
    totalValue: 0,
    dailyChange: 0,
    bestPerformer: null,
    worstPerformer: null,
    riskMetrics: { volatility: 0, sharpeRatio: 0 }
  });

  useEffect(() => {
    calculateMetrics();
  }, [assets]);

  const calculateMetrics = () => {
    const totalValue = assets.reduce((sum, asset) => {
      return sum + (asset.currentPrice * asset.amount);
    }, 0);

    const dailyChange = assets.reduce((sum, asset) => {
      return sum + (asset.percentChange24h * asset.amount * asset.currentPrice / 100);
    }, 0);

    const performers = [...assets].sort((a, b) => 
      b.percentChange24h - a.percentChange24h
    );

    // Calculate portfolio volatility and Sharpe ratio
    const returns = assets.map(asset => 
      asset.priceHistory.map((price, i, arr) => 
        i > 0 ? (price.price - arr[i-1].price) / arr[i-1].price : 0
      ).slice(1)
    ).flat();

    const volatility = calculateVolatility(returns);
    const sharpeRatio = calculateSharpeRatio(returns, 0.02); // Assuming 2% risk-free rate

    setMetrics({
      totalValue,
      dailyChange,
      bestPerformer: performers[0],
      worstPerformer: performers[performers.length - 1],
      riskMetrics: { volatility, sharpeRatio }
    });
  };

  const calculateVolatility = (returns) => {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / returns.length) * Math.sqrt(365);
  };

  const calculateSharpeRatio = (returns, riskFreeRate) => {
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length * 365;
    const volatility = calculateVolatility(returns);
    return (meanReturn - riskFreeRate) / volatility;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Portfolio Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Risk Metrics</h3>
            <p className="text-2xl font-bold">
              {metrics.riskMetrics.volatility.toFixed(2)}% Vol
            </p>
            <p className="text-sm text-gray-500">
              Sharpe: {metrics.riskMetrics.sharpeRatio.toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Best Performer</h3>
            <p className="text-2xl font-bold text-green-500">
              {metrics.bestPerformer?.symbol} (+{metrics.bestPerformer?.percentChange24h.toFixed(2)}%)
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Worst Performer</h3>
            <p className="text-2xl font-bold text-red-500">
              {metrics.worstPerformer?.symbol} ({metrics.worstPerformer?.percentChange24h.toFixed(2)}%)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PortfolioDashboard = () => {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gasData, setGasData] = useState([]);

  // Initial portfolio setup
  const initialPortfolio = [
    { id: 'btc-bitcoin', symbol: 'BTC', amount: 0.5 },
    { id: 'eth-ethereum', symbol: 'ETH', amount: 4 }
  ];

  useEffect(() => {
    const fetchPortfolioData = async () => {
      setIsLoading(true);
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
  
        // Fetch asset data and calculate technical indicators
        const assetData = await Promise.all(initialPortfolio.map(async (asset) => {
          const [priceData, historicalData] = await Promise.all([
            fetchAssetPrice(asset.id),
            fetchHistoricalData(asset.id, startDate.toISOString(), endDate.toISOString())
          ]);
          
          const prices = historicalData.map(d => d.price);
          
          return {
            ...asset,
            currentPrice: priceData.price,
            percentChange24h: priceData.percent_change_24h,
            volume24h: priceData.volume_24h,
            marketCap: priceData.market_cap,
            priceHistory: historicalData,
            technicals: {
              rsi: calculateRSI(prices),
              macd: calculateMACD(prices)
            }
          };
        }));
  
        // Fetch gas data
        const gasPrice = await fetchGasPrice();
        const newGasData = {
          timestamp: new Date().toISOString(),
          ...gasPrice,
          price: assetData[0].currentPrice // Using first asset for correlation
        };
        
        setAssets(assetData);
        setGasData(prev => [newGasData, ...prev].slice(0, 100));
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load portfolio data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
  
    // Initial fetch
    fetchPortfolioData();
    
    // Set up periodic refresh (every 5 minutes)
    const refreshInterval = setInterval(fetchPortfolioData, 300000);
  
    // Cleanup
    return () => clearInterval(refreshInterval);
  }, []);  // Empty dependency array since we're not using any external values
  
  // Loading state
  if (isLoading) {
    return <div className="p-6">Loading portfolio data...</div>;
  }
  
  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  const getPortfolioAllocation = () => {
    const total = assets.reduce((sum, asset) => 
      sum + (asset.currentPrice * asset.amount), 0);
    
    return assets.map(asset => ({
      name: asset.symbol,
      value: (asset.currentPrice * asset.amount / total) * 100
    }));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-6 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PortfolioMetricCard
            title="Total Portfolio Value"
            value={`$${assets.reduce((sum, asset) => sum + (asset.currentPrice * asset.amount), 0).toLocaleString()}`}
            icon={Wallet}
            color="blue"
          />
          <PortfolioMetricCard
            title="24h Change"
            value={`${assets[0].percentChange24h >= 0 ? '+' : ''}${assets[0].percentChange24h.toFixed(2)}%`}
            icon={Activity}
            trend={assets[0].percentChange24h}
            color="green"
          />
          <PortfolioMetricCard
            title="Gas Price"
            value={`${gasData[0]?.standard || 'N/A'} Gwei`}
            icon={Gauge}
            color="purple"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ChartCard title="Portfolio Performance">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={assets[0].priceHistory}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Portfolio Allocation">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPortfolioAllocation()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                    >
                      {getPortfolioAllocation().map((entry, index) => (
                        <Cell key={index} fill={`hsl(${index * 45}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assets.map(asset => (
                <TechnicalAnalysis key={asset.id} asset={asset} />
              ))}
            </div>
            <GasAnalysis gasData={gasData} priceData={assets[0].priceHistory} />
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.map(asset => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
};

export default PortfolioDashboard;