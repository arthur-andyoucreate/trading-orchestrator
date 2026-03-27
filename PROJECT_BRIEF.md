# Trading Orchestrator - Project Brief

## 🎯 OBJECTIVE
Build an intelligent trading system that combines multiple data sources for alpha generation:
- Reddit sentiment analysis (r/CryptoCurrency, r/Bitcoin)
- DeFi TVL monitoring via DeFiLlama API  
- Breaking news analysis via News API
- Time series forecasting (ARIMA, Prophet)
- Execution via Hyperliquid API

## 🏗️ ARCHITECTURE REQUIREMENTS

### Frontend (Next.js 15 + TypeScript)
- **Dashboard** - Real-time signals, positions, performance
- **Strategy Builder** - Configure trading parameters
- **Backtest Results** - Historical performance visualization
- **Risk Management** - Position sizing, stop losses
- **API Integration** - Hyperliquid connection management

### Backend (API Routes + External APIs)
- **Data Aggregation Service** - Combine all data sources
- **Signal Generation Engine** - Multi-factor scoring algorithm  
- **Risk Management Layer** - Position sizing, portfolio heat
- **Execution Engine** - Hyperliquid API integration
- **Backtesting Engine** - Historical strategy validation

### Data Layer (Supabase)
- **Signals History** - Store all generated signals with outcomes
- **Positions** - Track open/closed positions with PnL
- **Market Data Cache** - Store Reddit/DeFi/News data for analysis
- **Strategy Configs** - User strategy parameters
- **Performance Metrics** - Portfolio performance tracking

### Infrastructure (Vercel + CI/CD)
- **Automatic Deployment** - Git push → Vercel deployment
- **Environment Management** - Dev/Staging/Production
- **API Rate Limiting** - Manage external API quotas
- **Monitoring & Alerts** - System health tracking
- **TDD Setup** - Jest, Playwright, comprehensive test coverage

## 🔌 EXTERNAL INTEGRATIONS

### Data Sources
- **Reddit API** - Social sentiment analysis
- **DeFiLlama API** - TVL and protocol data  
- **News API** - Breaking news impact analysis
- **Time Series Libraries** - Forecasting models

### Trading Execution
- **Hyperliquid API** - Position management
- **Risk Management** - Stop losses, position sizing
- **Portfolio Tracking** - Real-time PnL monitoring

### Development Stack
- **Next.js 15** - App Router, Server Components
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **Supabase** - PostgreSQL + Real-time subscriptions
- **Vercel** - Deployment and hosting
- **GitHub** - Version control and CI/CD

## 📊 SUCCESS METRICS
- **Sharpe Ratio** >2.0 (target performance metric)
- **Max Drawdown** <10% (risk management)  
- **Signal Accuracy** >55% (edge validation)
- **System Uptime** >99% (reliability)
- **Response Time** <2s (user experience)

## 🚀 DELIVERY PHASES
1. **Architecture & Setup** - Project structure, CI/CD, basic UI
2. **Data Integration** - Connect all APIs, data flow
3. **Signal Generation** - Multi-factor algorithm implementation
4. **Backtesting** - Historical validation system
5. **Live Trading** - Hyperliquid integration
6. **Monitoring & Optimization** - Performance tracking, strategy refinement

## 🔧 DEVELOPMENT STANDARDS
- **TDD Approach** - Test-driven development throughout
- **Clean Code** - Proper abstractions, error handling
- **Type Safety** - Full TypeScript coverage  
- **Performance** - Optimized for real-time data processing
- **Security** - API key management, input validation
- **Documentation** - Comprehensive README, API docs