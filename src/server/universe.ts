// Curated ticker universe across global markets — ~150 liquid large/mid caps.
// Used by the screener as the input universe to filter against.

export type UniverseEntry = {
  symbol: string;
  name: string;
  region: "US" | "IN" | "EU" | "JP" | "HK" | "KR" | "TW" | "AU" | "SG" | "CN";
  exchange: string;
  country: string;
  currency: string;
  sector: string;
  industry: string;
};

export const UNIVERSE: UniverseEntry[] = [
  // ===== USA (40) =====
  { symbol: "AAPL", name: "Apple", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Technology", industry: "Consumer Electronics" },
  { symbol: "MSFT", name: "Microsoft", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Technology", industry: "Software—Infrastructure" },
  { symbol: "NVDA", name: "NVIDIA", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Technology", industry: "Semiconductors" },
  { symbol: "GOOGL", name: "Alphabet", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Communication Services", industry: "Internet Content & Information" },
  { symbol: "AMZN", name: "Amazon", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Consumer Cyclical", industry: "Internet Retail" },
  { symbol: "META", name: "Meta Platforms", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Communication Services", industry: "Internet Content & Information" },
  { symbol: "TSLA", name: "Tesla", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Consumer Cyclical", industry: "Auto Manufacturers" },
  { symbol: "BRK-B", name: "Berkshire Hathaway", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Financial Services", industry: "Insurance—Diversified" },
  { symbol: "JPM", name: "JPMorgan Chase", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "V", name: "Visa", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Financial Services", industry: "Credit Services" },
  { symbol: "MA", name: "Mastercard", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Financial Services", industry: "Credit Services" },
  { symbol: "UNH", name: "UnitedHealth", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Healthcare", industry: "Healthcare Plans" },
  { symbol: "JNJ", name: "Johnson & Johnson", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Healthcare", industry: "Drug Manufacturers—General" },
  { symbol: "PG", name: "Procter & Gamble", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Consumer Defensive", industry: "Household & Personal Products" },
  { symbol: "XOM", name: "Exxon Mobil", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Energy", industry: "Oil & Gas Integrated" },
  { symbol: "CVX", name: "Chevron", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Energy", industry: "Oil & Gas Integrated" },
  { symbol: "HD", name: "Home Depot", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Consumer Cyclical", industry: "Home Improvement Retail" },
  { symbol: "KO", name: "Coca-Cola", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Consumer Defensive", industry: "Beverages—Non-Alcoholic" },
  { symbol: "PEP", name: "PepsiCo", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Consumer Defensive", industry: "Beverages—Non-Alcoholic" },
  { symbol: "WMT", name: "Walmart", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Consumer Defensive", industry: "Discount Stores" },
  { symbol: "COST", name: "Costco", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Consumer Defensive", industry: "Discount Stores" },
  { symbol: "DIS", name: "Walt Disney", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Communication Services", industry: "Entertainment" },
  { symbol: "NFLX", name: "Netflix", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Communication Services", industry: "Entertainment" },
  { symbol: "ADBE", name: "Adobe", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Technology", industry: "Software—Application" },
  { symbol: "CRM", name: "Salesforce", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Technology", industry: "Software—Application" },
  { symbol: "ORCL", name: "Oracle", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Technology", industry: "Software—Infrastructure" },
  { symbol: "AMD", name: "AMD", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Technology", industry: "Semiconductors" },
  { symbol: "INTC", name: "Intel", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Technology", industry: "Semiconductors" },
  { symbol: "AVGO", name: "Broadcom", region: "US", exchange: "NASDAQ", country: "United States", currency: "USD", sector: "Technology", industry: "Semiconductors" },
  { symbol: "PFE", name: "Pfizer", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Healthcare", industry: "Drug Manufacturers—General" },
  { symbol: "MRK", name: "Merck", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Healthcare", industry: "Drug Manufacturers—General" },
  { symbol: "LLY", name: "Eli Lilly", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Healthcare", industry: "Drug Manufacturers—General" },
  { symbol: "ABBV", name: "AbbVie", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Healthcare", industry: "Drug Manufacturers—General" },
  { symbol: "BAC", name: "Bank of America", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "WFC", name: "Wells Fargo", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "GS", name: "Goldman Sachs", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Financial Services", industry: "Capital Markets" },
  { symbol: "BA", name: "Boeing", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Industrials", industry: "Aerospace & Defense" },
  { symbol: "CAT", name: "Caterpillar", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Industrials", industry: "Farm & Heavy Construction Machinery" },
  { symbol: "MCD", name: "McDonald's", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Consumer Cyclical", industry: "Restaurants" },
  { symbol: "NKE", name: "Nike", region: "US", exchange: "NYSE", country: "United States", currency: "USD", sector: "Consumer Cyclical", industry: "Footwear & Accessories" },

  // ===== India (20) =====
  { symbol: "RELIANCE.NS", name: "Reliance Industries", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Energy", industry: "Oil & Gas Refining & Marketing" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Technology", industry: "Information Technology Services" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Financial Services", industry: "Banks—Regional" },
  { symbol: "INFY.NS", name: "Infosys", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Technology", industry: "Information Technology Services" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Financial Services", industry: "Banks—Regional" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Consumer Defensive", industry: "Household & Personal Products" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Communication Services", industry: "Telecom Services" },
  { symbol: "ITC.NS", name: "ITC", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Consumer Defensive", industry: "Tobacco" },
  { symbol: "SBIN.NS", name: "State Bank of India", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Financial Services", industry: "Banks—Regional" },
  { symbol: "LT.NS", name: "Larsen & Toubro", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Industrials", industry: "Engineering & Construction" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Financial Services", industry: "Banks—Regional" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Financial Services", industry: "Banks—Regional" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Consumer Cyclical", industry: "Auto Manufacturers" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Basic Materials", industry: "Specialty Chemicals" },
  { symbol: "WIPRO.NS", name: "Wipro", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Technology", industry: "Information Technology Services" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Technology", industry: "Information Technology Services" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Healthcare", industry: "Drug Manufacturers—Specialty & Generic" },
  { symbol: "TITAN.NS", name: "Titan Company", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Consumer Cyclical", industry: "Luxury Goods" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Industrials", industry: "Conglomerates" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", region: "IN", exchange: "NSE", country: "India", currency: "INR", sector: "Financial Services", industry: "Credit Services" },

  // ===== Europe (25) =====
  { symbol: "ASML.AS", name: "ASML Holding", region: "EU", exchange: "Euronext Amsterdam", country: "Netherlands", currency: "EUR", sector: "Technology", industry: "Semiconductor Equipment & Materials" },
  { symbol: "SAP.DE", name: "SAP", region: "EU", exchange: "Xetra", country: "Germany", currency: "EUR", sector: "Technology", industry: "Software—Application" },
  { symbol: "SHEL.L", name: "Shell", region: "EU", exchange: "LSE", country: "United Kingdom", currency: "GBP", sector: "Energy", industry: "Oil & Gas Integrated" },
  { symbol: "BP.L", name: "BP", region: "EU", exchange: "LSE", country: "United Kingdom", currency: "GBP", sector: "Energy", industry: "Oil & Gas Integrated" },
  { symbol: "AZN.L", name: "AstraZeneca", region: "EU", exchange: "LSE", country: "United Kingdom", currency: "GBP", sector: "Healthcare", industry: "Drug Manufacturers—General" },
  { symbol: "HSBA.L", name: "HSBC Holdings", region: "EU", exchange: "LSE", country: "United Kingdom", currency: "GBP", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "ULVR.L", name: "Unilever", region: "EU", exchange: "LSE", country: "United Kingdom", currency: "GBP", sector: "Consumer Defensive", industry: "Household & Personal Products" },
  { symbol: "GSK.L", name: "GSK", region: "EU", exchange: "LSE", country: "United Kingdom", currency: "GBP", sector: "Healthcare", industry: "Drug Manufacturers—General" },
  { symbol: "RIO.L", name: "Rio Tinto", region: "EU", exchange: "LSE", country: "United Kingdom", currency: "GBP", sector: "Basic Materials", industry: "Other Industrial Metals & Mining" },
  { symbol: "MC.PA", name: "LVMH", region: "EU", exchange: "Euronext Paris", country: "France", currency: "EUR", sector: "Consumer Cyclical", industry: "Luxury Goods" },
  { symbol: "OR.PA", name: "L'Oréal", region: "EU", exchange: "Euronext Paris", country: "France", currency: "EUR", sector: "Consumer Defensive", industry: "Household & Personal Products" },
  { symbol: "AIR.PA", name: "Airbus", region: "EU", exchange: "Euronext Paris", country: "France", currency: "EUR", sector: "Industrials", industry: "Aerospace & Defense" },
  { symbol: "TTE.PA", name: "TotalEnergies", region: "EU", exchange: "Euronext Paris", country: "France", currency: "EUR", sector: "Energy", industry: "Oil & Gas Integrated" },
  { symbol: "BNP.PA", name: "BNP Paribas", region: "EU", exchange: "Euronext Paris", country: "France", currency: "EUR", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "SAN.PA", name: "Sanofi", region: "EU", exchange: "Euronext Paris", country: "France", currency: "EUR", sector: "Healthcare", industry: "Drug Manufacturers—General" },
  { symbol: "SIE.DE", name: "Siemens", region: "EU", exchange: "Xetra", country: "Germany", currency: "EUR", sector: "Industrials", industry: "Specialty Industrial Machinery" },
  { symbol: "ALV.DE", name: "Allianz", region: "EU", exchange: "Xetra", country: "Germany", currency: "EUR", sector: "Financial Services", industry: "Insurance—Diversified" },
  { symbol: "BMW.DE", name: "BMW", region: "EU", exchange: "Xetra", country: "Germany", currency: "EUR", sector: "Consumer Cyclical", industry: "Auto Manufacturers" },
  { symbol: "MBG.DE", name: "Mercedes-Benz Group", region: "EU", exchange: "Xetra", country: "Germany", currency: "EUR", sector: "Consumer Cyclical", industry: "Auto Manufacturers" },
  { symbol: "VOW3.DE", name: "Volkswagen", region: "EU", exchange: "Xetra", country: "Germany", currency: "EUR", sector: "Consumer Cyclical", industry: "Auto Manufacturers" },
  { symbol: "NESN.SW", name: "Nestlé", region: "EU", exchange: "SIX", country: "Switzerland", currency: "CHF", sector: "Consumer Defensive", industry: "Packaged Foods" },
  { symbol: "NOVN.SW", name: "Novartis", region: "EU", exchange: "SIX", country: "Switzerland", currency: "CHF", sector: "Healthcare", industry: "Drug Manufacturers—General" },
  { symbol: "ROG.SW", name: "Roche Holding", region: "EU", exchange: "SIX", country: "Switzerland", currency: "CHF", sector: "Healthcare", industry: "Drug Manufacturers—General" },
  { symbol: "ENI.MI", name: "Eni", region: "EU", exchange: "Borsa Italiana", country: "Italy", currency: "EUR", sector: "Energy", industry: "Oil & Gas Integrated" },
  { symbol: "ISP.MI", name: "Intesa Sanpaolo", region: "EU", exchange: "Borsa Italiana", country: "Italy", currency: "EUR", sector: "Financial Services", industry: "Banks—Diversified" },

  // ===== Japan (15) =====
  { symbol: "7203.T", name: "Toyota Motor", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Consumer Cyclical", industry: "Auto Manufacturers" },
  { symbol: "6758.T", name: "Sony Group", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Technology", industry: "Consumer Electronics" },
  { symbol: "9984.T", name: "SoftBank Group", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Communication Services", industry: "Telecom Services" },
  { symbol: "6098.T", name: "Recruit Holdings", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Industrials", industry: "Staffing & Employment Services" },
  { symbol: "8306.T", name: "Mitsubishi UFJ Financial", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "9432.T", name: "NTT", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Communication Services", industry: "Telecom Services" },
  { symbol: "9433.T", name: "KDDI", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Communication Services", industry: "Telecom Services" },
  { symbol: "6861.T", name: "Keyence", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Technology", industry: "Scientific & Technical Instruments" },
  { symbol: "8035.T", name: "Tokyo Electron", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Technology", industry: "Semiconductor Equipment & Materials" },
  { symbol: "7974.T", name: "Nintendo", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Communication Services", industry: "Electronic Gaming & Multimedia" },
  { symbol: "4063.T", name: "Shin-Etsu Chemical", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Basic Materials", industry: "Specialty Chemicals" },
  { symbol: "6501.T", name: "Hitachi", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Industrials", industry: "Specialty Industrial Machinery" },
  { symbol: "7267.T", name: "Honda Motor", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Consumer Cyclical", industry: "Auto Manufacturers" },
  { symbol: "9983.T", name: "Fast Retailing", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Consumer Cyclical", industry: "Apparel Retail" },
  { symbol: "4502.T", name: "Takeda Pharmaceutical", region: "JP", exchange: "Tokyo", country: "Japan", currency: "JPY", sector: "Healthcare", industry: "Drug Manufacturers—General" },

  // ===== Hong Kong (10) =====
  { symbol: "0700.HK", name: "Tencent Holdings", region: "HK", exchange: "HKEX", country: "Hong Kong", currency: "HKD", sector: "Communication Services", industry: "Internet Content & Information" },
  { symbol: "9988.HK", name: "Alibaba Group", region: "HK", exchange: "HKEX", country: "Hong Kong", currency: "HKD", sector: "Consumer Cyclical", industry: "Internet Retail" },
  { symbol: "1299.HK", name: "AIA Group", region: "HK", exchange: "HKEX", country: "Hong Kong", currency: "HKD", sector: "Financial Services", industry: "Insurance—Life" },
  { symbol: "0939.HK", name: "China Construction Bank", region: "HK", exchange: "HKEX", country: "Hong Kong", currency: "HKD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "0005.HK", name: "HSBC Holdings", region: "HK", exchange: "HKEX", country: "Hong Kong", currency: "HKD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "3690.HK", name: "Meituan", region: "HK", exchange: "HKEX", country: "Hong Kong", currency: "HKD", sector: "Consumer Cyclical", industry: "Internet Retail" },
  { symbol: "0883.HK", name: "CNOOC", region: "HK", exchange: "HKEX", country: "Hong Kong", currency: "HKD", sector: "Energy", industry: "Oil & Gas E&P" },
  { symbol: "1398.HK", name: "ICBC", region: "HK", exchange: "HKEX", country: "Hong Kong", currency: "HKD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "1810.HK", name: "Xiaomi", region: "HK", exchange: "HKEX", country: "Hong Kong", currency: "HKD", sector: "Technology", industry: "Consumer Electronics" },
  { symbol: "2318.HK", name: "Ping An Insurance", region: "HK", exchange: "HKEX", country: "Hong Kong", currency: "HKD", sector: "Financial Services", industry: "Insurance—Diversified" },

  // ===== Korea (10) =====
  { symbol: "005930.KS", name: "Samsung Electronics", region: "KR", exchange: "KRX", country: "South Korea", currency: "KRW", sector: "Technology", industry: "Consumer Electronics" },
  { symbol: "000660.KS", name: "SK hynix", region: "KR", exchange: "KRX", country: "South Korea", currency: "KRW", sector: "Technology", industry: "Semiconductors" },
  { symbol: "207940.KS", name: "Samsung Biologics", region: "KR", exchange: "KRX", country: "South Korea", currency: "KRW", sector: "Healthcare", industry: "Biotechnology" },
  { symbol: "005380.KS", name: "Hyundai Motor", region: "KR", exchange: "KRX", country: "South Korea", currency: "KRW", sector: "Consumer Cyclical", industry: "Auto Manufacturers" },
  { symbol: "035420.KS", name: "NAVER", region: "KR", exchange: "KRX", country: "South Korea", currency: "KRW", sector: "Communication Services", industry: "Internet Content & Information" },
  { symbol: "051910.KS", name: "LG Chem", region: "KR", exchange: "KRX", country: "South Korea", currency: "KRW", sector: "Basic Materials", industry: "Specialty Chemicals" },
  { symbol: "006400.KS", name: "Samsung SDI", region: "KR", exchange: "KRX", country: "South Korea", currency: "KRW", sector: "Industrials", industry: "Electrical Equipment & Parts" },
  { symbol: "035720.KS", name: "Kakao", region: "KR", exchange: "KRX", country: "South Korea", currency: "KRW", sector: "Communication Services", industry: "Internet Content & Information" },
  { symbol: "105560.KS", name: "KB Financial Group", region: "KR", exchange: "KRX", country: "South Korea", currency: "KRW", sector: "Financial Services", industry: "Banks—Regional" },
  { symbol: "068270.KS", name: "Celltrion", region: "KR", exchange: "KRX", country: "South Korea", currency: "KRW", sector: "Healthcare", industry: "Biotechnology" },

  // ===== Taiwan (8) =====
  { symbol: "2330.TW", name: "TSMC", region: "TW", exchange: "TWSE", country: "Taiwan", currency: "TWD", sector: "Technology", industry: "Semiconductors" },
  { symbol: "2317.TW", name: "Hon Hai Precision (Foxconn)", region: "TW", exchange: "TWSE", country: "Taiwan", currency: "TWD", sector: "Technology", industry: "Electronic Components" },
  { symbol: "2454.TW", name: "MediaTek", region: "TW", exchange: "TWSE", country: "Taiwan", currency: "TWD", sector: "Technology", industry: "Semiconductors" },
  { symbol: "2308.TW", name: "Delta Electronics", region: "TW", exchange: "TWSE", country: "Taiwan", currency: "TWD", sector: "Technology", industry: "Electronic Components" },
  { symbol: "2412.TW", name: "Chunghwa Telecom", region: "TW", exchange: "TWSE", country: "Taiwan", currency: "TWD", sector: "Communication Services", industry: "Telecom Services" },
  { symbol: "2882.TW", name: "Cathay Financial Holding", region: "TW", exchange: "TWSE", country: "Taiwan", currency: "TWD", sector: "Financial Services", industry: "Insurance—Diversified" },
  { symbol: "1303.TW", name: "Nan Ya Plastics", region: "TW", exchange: "TWSE", country: "Taiwan", currency: "TWD", sector: "Basic Materials", industry: "Specialty Chemicals" },
  { symbol: "2881.TW", name: "Fubon Financial Holding", region: "TW", exchange: "TWSE", country: "Taiwan", currency: "TWD", sector: "Financial Services", industry: "Insurance—Diversified" },

  // ===== Australia (10) =====
  { symbol: "CBA.AX", name: "Commonwealth Bank", region: "AU", exchange: "ASX", country: "Australia", currency: "AUD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "BHP.AX", name: "BHP Group", region: "AU", exchange: "ASX", country: "Australia", currency: "AUD", sector: "Basic Materials", industry: "Other Industrial Metals & Mining" },
  { symbol: "RIO.AX", name: "Rio Tinto", region: "AU", exchange: "ASX", country: "Australia", currency: "AUD", sector: "Basic Materials", industry: "Other Industrial Metals & Mining" },
  { symbol: "CSL.AX", name: "CSL", region: "AU", exchange: "ASX", country: "Australia", currency: "AUD", sector: "Healthcare", industry: "Biotechnology" },
  { symbol: "NAB.AX", name: "National Australia Bank", region: "AU", exchange: "ASX", country: "Australia", currency: "AUD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "WBC.AX", name: "Westpac Banking", region: "AU", exchange: "ASX", country: "Australia", currency: "AUD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "ANZ.AX", name: "ANZ Group", region: "AU", exchange: "ASX", country: "Australia", currency: "AUD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "WES.AX", name: "Wesfarmers", region: "AU", exchange: "ASX", country: "Australia", currency: "AUD", sector: "Consumer Defensive", industry: "Discount Stores" },
  { symbol: "WOW.AX", name: "Woolworths Group", region: "AU", exchange: "ASX", country: "Australia", currency: "AUD", sector: "Consumer Defensive", industry: "Grocery Stores" },
  { symbol: "MQG.AX", name: "Macquarie Group", region: "AU", exchange: "ASX", country: "Australia", currency: "AUD", sector: "Financial Services", industry: "Capital Markets" },

  // ===== Singapore (5) =====
  { symbol: "D05.SI", name: "DBS Group", region: "SG", exchange: "SGX", country: "Singapore", currency: "SGD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "O39.SI", name: "OCBC", region: "SG", exchange: "SGX", country: "Singapore", currency: "SGD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "U11.SI", name: "UOB", region: "SG", exchange: "SGX", country: "Singapore", currency: "SGD", sector: "Financial Services", industry: "Banks—Diversified" },
  { symbol: "Z74.SI", name: "Singtel", region: "SG", exchange: "SGX", country: "Singapore", currency: "SGD", sector: "Communication Services", industry: "Telecom Services" },
  { symbol: "C6L.SI", name: "Singapore Airlines", region: "SG", exchange: "SGX", country: "Singapore", currency: "SGD", sector: "Industrials", industry: "Airlines" },
];

export const REGIONS = ["US", "IN", "EU", "JP", "HK", "KR", "TW", "AU", "SG", "CN"] as const;
export const SECTORS = Array.from(new Set(UNIVERSE.map((u) => u.sector))).sort();
