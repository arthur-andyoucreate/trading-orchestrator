# Trading Orchestrator 🎯

Multi-source trading system combining sentiment analysis, DeFi data, news feeds, and time series forecasting for intelligent position management.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Add your API keys

# Run development server
pnpm dev
```

## 📊 Features

### Data Sources
- **Reddit Sentiment** - r/CryptoCurrency, r/Bitcoin analysis
- **DeFi Analytics** - TVL monitoring via DeFiLlama
- **News Intelligence** - Breaking news impact analysis
- **Time Series Forecasting** - ARIMA, Prophet models

### Trading Engine
- **Multi-Factor Signals** - Combine all data sources
- **Risk Management** - Position sizing, stop losses
- **Backtesting** - Historical strategy validation
- **Live Execution** - Hyperliquid API integration

### Dashboard
- **Real-time Signals** - Live trading opportunities
- **Portfolio Tracking** - Performance monitoring
- **Strategy Builder** - Configure parameters
- **Analytics** - Comprehensive reporting

## 🏗️ Architecture

```
Frontend (Next.js 15)
├── Dashboard Components
├── Strategy Configuration  
├── Real-time Data Display
└── Performance Analytics

Backend (API Routes)
├── Data Aggregation Service
├── Signal Generation Engine
├── Risk Management Layer  
└── Execution Interface

Data Layer (Supabase)
├── Market Data Cache
├── Signals History
├── Positions Tracking
└── Performance Metrics

External APIs
├── Reddit API (Sentiment)
├── DeFiLlama (TVL Data)
├── News API (Events)
└── Hyperliquid (Trading)
```

## 🔧 Development

### Stack
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** API Routes, External API integrations
- **Database:** Supabase (PostgreSQL + Real-time)
- **Deployment:** Vercel
- **Testing:** Jest, Playwright, TDD approach

### Scripts
```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm test         # Run tests
pnpm test:e2e     # End-to-end tests
pnpm lint         # ESLint
pnpm type-check   # TypeScript validation
```

## 📈 Performance Targets

- **Sharpe Ratio:** >2.0
- **Max Drawdown:** <10%  
- **Signal Accuracy:** >55%
- **System Uptime:** >99%
- **Response Time:** <2s

## 🛡️ Security

- Environment variable management
- API key rotation
- Input validation
- Rate limiting
- Error boundary handling

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

Built with 🎯 focus on performance and 🔒 security.