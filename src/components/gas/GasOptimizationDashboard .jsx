import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../elements/Card';
import { useToast, ToastAction } from '../elements/ToastAction';
import { Alert, AlertDescription, AlertTitle } from '../elements/Alert';
import { Activity, TrendingDown, Clock, AlertCircle, Timer } from 'lucide-react';
import { useQuickNode } from '../../hooks/useQuickNode';

const GasOptimizationDashboard = ({ optimizedGasPrice, onOptimizedGasUpdate }) => {
    const [notifications, setNotifications] = useState([]);
    const [currentOptimization, setCurrentOptimization] = useState(null);
    const [predictionData, setPredictionData] = useState(null);
    const { streamData, isConnected } = useQuickNode();
    const { toast } = useToast();
    const [lastToastTime, setLastToastTime] = useState(0);
  
    // Simulate gas price prediction based on historical data
    const predictGasPrices = (currentPrice) => {
      // In a real implementation, this would use historical data and ML models
      const expectedDrop = currentPrice * 0.15; // Simulate 15% expected drop
      const timeToWait = 15; // minutes
      
      return {
        expectedPrice: currentPrice - expectedDrop,
        timeToWait,
        confidence: 0.85
      };
    };

    useEffect(() => {
      if (streamData.length > 0) {
        const latestTx = streamData[0];
        
        if (latestTx.optimization?.suggestions?.length > 0) {
          const currentGasPrice = latestTx.gasAnalysis.currentGasPrice;
          
          // Generate price prediction
          const prediction = predictGasPrices(currentGasPrice);
          setPredictionData(prediction);
          
          const newNotification = {
            id: Date.now(),
            type: 'optimization',
            message: `Waiting ${prediction.timeToWait} minutes could save up to ${(currentGasPrice - prediction.expectedPrice).toFixed(2)} Gwei`,
            timestamp: new Date().toLocaleTimeString(),
            savings: latestTx.gasAnalysis?.potentialSavings?.eth || 0
          };
  
          setNotifications(prev => [newNotification, ...prev].slice(0, 5));
          
          if (latestTx.gasAnalysis?.potentialSavings?.eth > 0.001) {
            const optimizedSettings = {
              currentGasPrice,
              recommendedPrice: prediction.expectedPrice,
              potentialSavings: latestTx.gasAnalysis.potentialSavings.eth,
              timestamp: Date.now()
            };
            
            setCurrentOptimization(optimizedSettings);
            onOptimizedGasUpdate?.(prediction.expectedPrice);
  
            if (optimizedGasPrice && 
                Math.abs(currentGasPrice - (optimizedGasPrice / 1e9)) <= 0.5 &&
                Date.now() - lastToastTime > 60000) {
              
              toast({
                title: "⏰ Price Drop Predicted!",
                description: `Consider waiting ${prediction.timeToWait} minutes for lower gas prices. Estimated savings: ${(currentGasPrice - prediction.expectedPrice).toFixed(2)} Gwei`,
                action: (
                  <ToastAction onClick={() => console.log('Apply optimized settings')}>
                    Apply Settings
                  </ToastAction>
                ),
                duration: 8000,
                variant: "default",
                icon: <Timer className="h-4 w-4" />
              });
              
              setLastToastTime(Date.now());
            }
          }
        }
      }
    }, [streamData, optimizedGasPrice, toast, lastToastTime, onOptimizedGasUpdate]);

  const renderOptimizationAlert = () => {
    if (!currentOptimization || !predictionData) return null;
    
    const timeAgo = Math.floor((Date.now() - currentOptimization.timestamp) / 1000);
    if (timeAgo > 300) return null;
    
    return (
      <Alert className="mb-4 border-green-500 bg-green-50">
        <TrendingDown className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700">Gas Price Prediction Available</AlertTitle>
        <AlertDescription className="text-green-600">
          Current gas price: {currentOptimization.currentGasPrice.toFixed(2)} Gwei
          <br />
          Predicted price in {predictionData.timeToWait} mins: {predictionData.expectedPrice.toFixed(2)} Gwei
          <br />
          Potential savings: {currentOptimization.potentialSavings.toFixed(6)} ETH
          <br />
          Confidence: {(predictionData.confidence * 100).toFixed(0)}%
        </AlertDescription>
      </Alert>
    );
  };


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Gas Optimization Monitor
          {isConnected && 
            <span className="h-2 w-2 rounded-full bg-green-500 ml-2" />
          }
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderOptimizationAlert()}
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gray-50">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Recent Notifications
              </h3>
              {notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className="p-2 rounded bg-white border border-gray-200 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {notification.timestamp}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-700">{notification.message}</p>
                      {notification.savings > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          Potential savings: {notification.savings.toFixed(6)} ETH
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  No recent notifications
                </div>
              )}
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Optimization Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Wait for lower gas prices during off-peak hours
                </li>
                <li className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  Use EIP-1559 for more predictable gas fees
                </li>
                <li className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  Monitor network congestion for better timing
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GasOptimizationDashboard;