# Trading Orchestrator - Deployment Guide

## 🚀 Quick Deploy to Vercel

### 1. Setup Environment
```bash
# Copy environment template
cp .env.example .env.local

# Configure API keys (essential)
REDDIT_CLIENT_ID=...
NEWS_API_KEY=...
HYPERLIQUID_API_KEY=...
DATABASE_URL=...
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel --prod
```

### 3. Configure Vercel Environment Variables
In Vercel dashboard, add environment variables from `.env.example`

### 4. Feature Flag Rollout Strategy

#### Phase 1: Analytics Only
```env
FEATURE_LIVE_TRADING=false
FEATURE_INTELLIGENCE_DASHBOARD=true
```

#### Phase 2: Paper Trading
```env
FEATURE_LIVE_TRADING=false
FEATURE_KELLY_POSITION_SIZING=true
```

#### Phase 3: Live Trading (After validation)
```env
FEATURE_LIVE_TRADING=true
```

## 🛡️ Safety Checklist

- [ ] Live trading is DISABLED by default
- [ ] Kelly fraction set to 0.25 (conservative)
- [ ] Portfolio heat limit ≤ 80%
- [ ] Daily drawdown limit ≤ 3%
- [ ] API rate limits configured
- [ ] Database migration completed
- [ ] Feature flags tested individually

## 📊 Monitoring

After deployment:
1. Check `/api/health` endpoint
2. Monitor feature flag status in dashboard
3. Validate signal generation without live trades
4. Test risk management limits
5. Verify Hyperliquid connection (testnet first)

## 🎯 Success Metrics

- Signal generation latency < 500ms
- API uptime > 99.9%
- Risk validation success rate > 99%
- Feature flag response time < 50ms

Deploy with confidence! The system is production-ready. 🚀