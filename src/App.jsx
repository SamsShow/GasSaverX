import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider, createTheme } from '@mui/material';
import { 
  AppBar, 
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  useMediaQuery
} from '@mui/material';
import "react-toastify/dist/ReactToastify.css";
import { EthereumProvider } from "./context/EthereumContext";
import { ToastProvider } from "./components/elements/ToastAction";
import Layout from "./components/layout/Layout";
import Navbar from "./components/layout/Navbar";
import GasMetrics from "./components/gas/GasMetrics";
import OptimizeGas from "./components/gas/OptimizeGas";
import PriceFeeds from "./components/gas/PriceFeeds";
import PortfolioDashboard from "./components/layout/PortfolioDasboard";
import GasOptimizationDashboard from "./components/gas/GasOptimizationDashboard ";
import TransactionForm from "./components/transaction/TransactionForm";
import TransactionHistory from "./components/transaction/TransactionHistory";
import LandingPage from './components/Landing';

// Custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
      light: '#757de8',
      dark: '#002984',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
    },
    background: {
      default: '#f5f7ff',
      paper: '#ffffff',
    },
  },
});

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const cardVariants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.4 }
};

const GasAnalytics = ({ optimizedGasPrice, setOptimizedGasPrice }) => {
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <motion.div variants={cardVariants}>
            <Card 
              elevation={3} 
              sx={{ 
                background: 'linear-gradient(145deg, #ffffff 0%, #f5f7ff 100%)',
                borderRadius: 2,
                mb: 3
              }}
            >
              <CardContent>
                  <GasMetrics />
                <PriceFeeds />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card 
              elevation={3}
              sx={{ 
                background: 'linear-gradient(145deg, #ffffff 0%, #f5f7ff 100%)',
                borderRadius: 2
              }}
            >

                <OptimizeGas />
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} lg={6}>
          <motion.div variants={cardVariants}>
            <Card 
              elevation={3}
              sx={{ 
                background: 'linear-gradient(145deg, #ffffff 0%, #f5f7ff 100%)',
                borderRadius: 2,
                mb: 3
              }}
            >
              <CardContent>
                <GasOptimizationDashboard
                  optimizedGasPrice={optimizedGasPrice}
                  onOptimizedGasUpdate={setOptimizedGasPrice}
                />
                <TransactionForm optimizedGasPrice={optimizedGasPrice} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card 
              elevation={3}
              sx={{ 
                background: 'linear-gradient(145deg, #ffffff 0%, #f5f7ff 100%)',
                borderRadius: 2
              }}
            >
              <CardContent>
                <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                  Transaction History
                </Typography>
                <TransactionHistory />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
};

const PortfolioView = () => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageTransition}
  >
    <Card 
      elevation={3}
      sx={{ 
        background: 'linear-gradient(145deg, #ffffff 0%, #f5f7ff 100%)',
        borderRadius: 2
      }}
    >
      <CardContent>
        <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
          Portfolio Dashboard
        </Typography>
        <PortfolioDashboard />
      </CardContent>
    </Card>
  </motion.div>
);

const Footer = () => (
  <Box 
    component={motion.footer}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.5 }}
    sx={{ 
      mt: 4,
      p: 4,
      background: 'linear-gradient(145deg, #ffffff 0%, #f5f7ff 100%)',
      borderRadius: 2,
      boxShadow: 3
    }}
  >
    <Grid container spacing={4}>
      <Grid item xs={12} md={4}>
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
          About GasSaverX
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Optimize your transaction costs with real-time gas fee
          estimates and intelligent routing.
        </Typography>
      </Grid>
      <Grid item xs={12} md={4}>
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
          Supported Networks
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          {['Ethereum Mainnet', 'Polygon', 'Arbitrum', 'Optimism'].map((network) => (
            <Typography 
              key={network}
              component="li" 
              variant="body1" 
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {network}
            </Typography>
          ))}
        </Box>
      </Grid>
      <Grid item xs={12} md={4}>
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
          Features
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          {['Real-time gas tracking', 'PYUSD integration', 'Route optimization', 'Historical analytics'].map((feature) => (
            <Typography 
              key={feature}
              component="li" 
              variant="body1" 
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {feature}
            </Typography>
          ))}
        </Box>
      </Grid>
    </Grid>
  </Box>
);

const App = () => {
  const [optimizedGasPrice, setOptimizedGasPrice] = useState(null);

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <EthereumProvider>
          <ToastProvider>
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
              <Navbar />
              <Layout>
                <Container maxWidth="xl" sx={{ py: 4 }}>
                  <AnimatePresence mode="wait">
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route 
                        path="/gas" 
                        element={
                          <GasAnalytics 
                            optimizedGasPrice={optimizedGasPrice}
                            setOptimizedGasPrice={setOptimizedGasPrice}
                          />
                        } 
                      />
                      <Route path="/portfolio" element={<PortfolioView />} />
                    </Routes>
                  </AnimatePresence>
                  <Footer />
                </Container>
              </Layout>

              <ToastContainer
                position="bottom-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
            </Box>
          </ToastProvider>
        </EthereumProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;