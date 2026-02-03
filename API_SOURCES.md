# API Data Sources

## Currently Active APIs

### 1. **GoldPrice.org** - Global Gold/Silver Prices
- **URL**: `https://data-asg.goldprice.org/dbXRates/USD`
- **Status**: ✅ ACTIVE
- **Cost**: FREE (No API key required)
- **Provides**: Real-time gold and silver prices in USD

### 2. **Nepal Rastra Bank (NRB)** - Exchange Rates
- **URL**: `https://www.nrb.org.np/api/forex/v1/rate`
- **Status**: ✅ ACTIVE
- **Cost**: FREE (Official government API)
- **Provides**: Official NPR exchange rates for all currencies

### 3. **Ashesh.com.np** - Nepal Market Prices
- **URL**: `https://www.ashesh.com.np/gold/chart.php`
- **Status**: ✅ ACTIVE
- **Cost**: FREE (No authentication)
- **Provides**: 
  - Fine Gold, Tejabi Gold, Silver prices
  - 30-day historical data
  - Daily updates at ~11 AM NPT

## Data Sources Summary

| Data Type | Source | Function |
|-----------|--------|----------|
| Global Gold/Silver Prices | GoldPrice.org | `fetchGoldPriceOrgData()` |
| Exchange Rates | Nepal Rastra Bank | `fetchNRBRatesRaw()` |
| Nepal Market Prices | Ashesh.com.np | `fetchAsheshRates()` |
| Historical Data | Ashesh.com.np | `fetchAsheshHistory()` |

**Note**: We do NOT use fenegosida.org - all Nepal data comes from ashesh.com.np
