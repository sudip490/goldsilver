import { MetalPrice, CountryData, NRBRawRate, GoldPriceOrgData } from "./types";
import { API_CONFIG, CURRENCY_TO_NPR, UNIT_CONVERSIONS } from "./api-config";
import * as cheerio from "cheerio";

// Fetch gold and silver prices from GoldPrice.org API
export async function fetchGoldPriceOrgData(): Promise<GoldPriceOrgData | null> {
    try {
        const response = await fetch(
            `${API_CONFIG.goldPrice.baseUrl}/${API_CONFIG.goldPrice.baseCurrency}`,
            {
                next: { revalidate: 10 }, // Cache for 5 minutes
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch from GoldPrice.org");
        }

        const data = await response.json() as GoldPriceOrgData;
        return data;
    } catch {
        return null;
    }
}

// Fetch official exchange rates from Nepal Rastra Bank
async function fetchNRBRates(): Promise<Record<string, number>> {
    try {
        const rawRates = await fetchNRBRatesRaw();

        if (!rawRates || rawRates.length === 0) {
            throw new Error("No rates found from NRB (API or Scrape)");
        }

        // Find USD rate first (handling unit if not 1, though USD is usually 1)
        const usdData = rawRates.find((r: NRBRawRate) => r.currency.iso3 === "USD");
        if (!usdData) throw new Error("USD rate missing in NRB response");

        const usdBuyNPR = parseFloat(usdData.buy) / (usdData.currency.unit || 1);

        const rates: Record<string, number> = {};

        // NRB gives rates where Base is Foreign Currency and Target is NPR
        // We want Base USD for our app
        // Rate(USD->X) = Rate(USD->NPR) / Rate(X->NPR)

        // Add NPR itself
        rates["NPR"] = usdBuyNPR;
        rates["USD"] = 1;

        rawRates.forEach((rate: NRBRawRate) => {
            const code = rate.currency.iso3;
            if (code === "USD") return;

            const buyNPR = parseFloat(rate.buy) / (rate.currency.unit || 1);
            // 1 USD = usdBuyNPR NPR
            // 1 Unit of X = buyNPR NPR
            // => 1 USD = (usdBuyNPR / buyNPR) Units of X
            rates[code] = usdBuyNPR / buyNPR;
        });

        return rates;

    } catch {
        return {};
    }
}

// Fetch raw NRB rates for detailed table display
export async function fetchNRBRatesRaw(): Promise<NRBRawRate[]> {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Try API first
        const response = await fetch(
            `https://www.nrb.org.np/api/forex/v1/rate?from=${today}&to=${today}&per_page=1`,
            { next: { revalidate: 60 } }
        );

        let rates: NRBRawRate[] = [];

        if (response.ok) {
            const json = await response.json();
            const apiRates = json.data?.payload?.rates || [];
            rates = apiRates.map((r: { currency: { iso3: string; name: string; unit: number }; buy: string | number; sell: string | number }) => ({
                currency: {
                    iso3: r.currency.iso3,
                    name: r.currency.name,
                    unit: r.currency.unit
                },
                buy: String(r.buy),
                sell: String(r.sell)
            }));
        }

        if (rates.length > 0) {
            return rates;
        }

        // Fallback to Scraping
        const scrapeResponse = await fetch("https://www.nrb.org.np/forex/", {
            next: { revalidate: 300 },
            // @ts-expect-error - Node.js https agent not available in Edge runtime
            agent: new (await import('https')).Agent({ rejectUnauthorized: false })
        });

        if (!scrapeResponse.ok) throw new Error("Failed to fetch NRB HTML");

        const html = await scrapeResponse.text();
        const $ = cheerio.load(html);
        const scrapedRates: Array<{ currency: { iso3: string; name: string; unit: number }; buy: string; sell: string }> = [];

        // Adjust selector based on actual NRB site structure
        // Look for the main forex table
        $('table').each((i, table) => {
            // Heuristic: Check headers
            const headers = $(table).find('th').map((_j, th) => $(th).text().trim().toLowerCase()).get();
            if (headers.includes('currency') && headers.includes('buy')) {
                $(table).find('tbody tr').each((_k, tr) => {
                    const tds = $(tr).find('td');
                    if (tds.length >= 4) {
                        const currencyName = $(tds[0]).text().trim();
                        const unitText = $(tds[1]).text().trim();
                        const buyText = $(tds[2]).text().trim();
                        const sellText = $(tds[3]).text().trim();

                        // Extract ISO3 from name (e.g. "US Dollar (USD)")
                        // Or mapping. NRB site usually shows "U.S. Dollar"
                        // Let's rely on mapping or simple extraction.
                        let iso3 = "";
                        if (currencyName.includes("Dollar")) iso3 = "USD";
                        else if (currencyName.includes("Euro")) iso3 = "EUR";
                        else if (currencyName.includes("Pound")) iso3 = "GBP";
                        else if (currencyName.includes("Franc")) iso3 = "CHF";
                        else if (currencyName.includes("Australian")) iso3 = "AUD";
                        else if (currencyName.includes("Canadian")) iso3 = "CAD";
                        else if (currencyName.includes("Singapore")) iso3 = "SGD";
                        else if (currencyName.includes("Yen")) iso3 = "JPY";
                        else if (currencyName.includes("Renminbi")) iso3 = "CNY"; // or CNY
                        else if (currencyName.includes("Riyal") && currencyName.includes("Saudi")) iso3 = "SAR";
                        else if (currencyName.includes("Riyal") && currencyName.includes("Qatar")) iso3 = "QAR";
                        else if (currencyName.includes("Baht")) iso3 = "THB";
                        else if (currencyName.includes("Dirham")) iso3 = "AED";
                        else if (currencyName.includes("Ringgit")) iso3 = "MYR";
                        else if (currencyName.includes("Won")) iso3 = "KRW";
                        else if (currencyName.includes("Dinar") && currencyName.includes("Kuwait")) iso3 = "KWD";
                        else if (currencyName.includes("Dinar") && currencyName.includes("Bahrain")) iso3 = "BHD";
                        else if (currencyName.includes("Rupee") && currencyName.includes("Indian")) iso3 = "INR";
                        else if (currencyName.includes("Krona") && currencyName.includes("Danish")) iso3 = "DKK";
                        else if (currencyName.includes("Hong Kong")) iso3 = "HKD";
                        // Add more if needed

                        // Try to find code in parenthesis if present
                        const parenMatch = currencyName.match(/\(([A-Z]{3})\)/);
                        if (parenMatch) iso3 = parenMatch[1];

                        if (iso3) {
                            scrapedRates.push({
                                currency: {
                                    iso3: iso3,
                                    name: currencyName,
                                    unit: parseInt(unitText) || 1
                                },
                                buy: buyText,
                                sell: sellText
                            });
                        }
                    }
                });
            }
        });

        return scrapedRates;

    } catch {
        return [];
    }
}

// Fetch latest rates from Ashesh.com.np (using chart API as reliable source)
export async function fetchAsheshRates(): Promise<import("./types").NepalRate[] | null> {
    try {
        const ratesList: import("./types").NepalRate[] = [];
        const today = new Date().toISOString().split('T')[0];

        // Helper to fetch price from chart
        // Types: 0=Fine Gold, 1=Tejabi Gold, 2=Silver
        // Units: tola, gram
        const getPrice = async (type: number, unit: string) => {
            const url = `https://www.ashesh.com.np/gold/chart.php?api=506&unit=${unit}&type=${type}&range=30&v=3`;
            const res = await fetch(url, { next: { revalidate: 300 } }); // 5 minutes cache
            const html = await res.text();
            const dataMatch = html.match(/data: \[([\s\S]*?)\]/);
            if (dataMatch) {
                // The data is ordered from newest to oldest in the array [today, yesterday, ...]
                // Actually the debug output showed { x: new Date(2026,1,03), y: 290300 } as the first item.
                // So we take the first match.
                const m = dataMatch[1].match(/y: (\d+)/);
                if (m) return parseFloat(m[1]);
            }
            return 0;
        };

        const addRate = (name: string, unit: string, price: number) => {
            if (price <= 0) return;
            ratesList.push({
                key: `${name}-${unit}`.replace(/\s+/g, '-').toLowerCase(),
                name: name,
                unit: unit,
                price: price,
                change: 0,
                changePercent: 0,
                date: today
            });
        };

        // Fetch Fine Gold Tola (Type 0, unit tola)
        const fineGoldTola = await getPrice(0, "tola");
        addRate("Fine Gold", "Tola", fineGoldTola);

        // Fetch Fine Gold 10g (Type 0, unit gram -> implies 10g value in Ashesh? Debug showed 248885 for 'gram' which is 10g price)
        // Verified in debug: 'gram' param gives 248885 which matches Fine Gold 10g price.
        const fineGold10g = await getPrice(0, "gram");
        addRate("Fine Gold", "10 Gram", fineGold10g);

        // Fetch Tejabi Gold Tola (Type 1, unit tola)
        const tejabiTola = await getPrice(1, "tola");
        addRate("Tejabi Gold", "Tola", tejabiTola);

        // Fetch Tejabi Gold 10g (Type 1, unit gram)
        const tejabi10g = await getPrice(1, "gram");
        addRate("Tejabi Gold", "10 Gram", tejabi10g);

        // Fetch Silver Tola (Type 2, unit tola)
        const silverTola = await getPrice(2, "tola");
        addRate("Silver", "Tola", silverTola);

        // Fetch Silver 10g (Type 2, unit gram)
        const silver10g = await getPrice(2, "gram");
        addRate("Silver", "10 Gram", silver10g);

        return ratesList.length > 0 ? ratesList : null;

    } catch {
        return null;
    }
}

// Scrape history from Ashesh.com.np
// Type 0 = Gold, Type 2 = Silver
export async function fetchAsheshHistory(type: 0 | 2 = 0): Promise<import("./types").PriceHistory[]> {
    try {
        // Fetch 5 years of history (approx 1825 days) to support 1Y and ALL views
        const url = `https://www.ashesh.com.np/gold/chart.php?api=506&unit=tola&type=${type}&range=1825&v=3`;

        const response = await fetch(url, {
            next: { revalidate: 300 }, // Cache for 5 minutes (same as other data)
        });

        if (!response.ok) throw new Error("Failed to fetch Ashesh chart");

        const html = await response.text();

        // Extract dataPoints: [ { x: new Date(2026,1,03), y: 290300 }, ... ]
        // Use [\s\S]*? for multiline match instead of /s flag
        const dataMatch = html.match(/data: \[([\s\S]*?)\]/);
        const history: import("./types").PriceHistory[] = [];

        if (dataMatch && dataMatch[1]) {
            // We need to parse the inner content manually or via regex
            // Content looks like: { x: new Date(2026,1,03), y: 290300 },{ x: new Date(2026,1,02), y: 286600 }...

            // Regex to capture Date(y,m,d) and y value
            const regex = /x: new Date\((\d+),(\d+),(\d+)\), y: (\d+)/g;
            let match;

            while ((match = regex.exec(dataMatch[1])) !== null) {
                const [, year, month, day, price] = match;
                // Adjust for timezone offset if needed, or just use YYYY-MM-DD string construction manually to avoid TZ issues
                const monthStr = (parseInt(month) + 1).toString().padStart(2, '0');
                const dayStr = parseInt(day).toString().padStart(2, '0');
                const dateStr = `${year}-${monthStr}-${dayStr}`;

                history.push({
                    date: dateStr,
                    price: parseFloat(price)
                });
            }
        }

        return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    } catch {
        return [];
    }
}

// Fetch exchange rates
export async function fetchExchangeRates(): Promise<Record<string, number>> {
    try {
        // Try NRB first as requested by user
        const nrbRates = await fetchNRBRates();
        if (nrbRates && Object.keys(nrbRates).length > 2) {
            return nrbRates;
        }


        // Fallback to ExchangeRate-API
        const response = await fetch(
            `${API_CONFIG.exchangeRate.baseUrl}/USD`,
            {
                next: { revalidate: 3600 },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch exchange rates");
        }

        const data = await response.json();

        // Manual override for NPR if using fallback
        if (data.rates) {
            data.rates.NPR = CURRENCY_TO_NPR.USD; // Use static fallback/override for NPR
            return data.rates;
        }

        throw new Error("Fallback API returned no rates");
    } catch {
        return CURRENCY_TO_NPR; // Final Fallback to static rates
    }
}

// Convert gold price from USD/oz to various currencies and units
// Now accepts an optional exchangeRates object to use live rates
export function convertGoldPrice(
    usdPerOz: number,
    targetCurrency: string,
    unit: "oz" | "gram" | "tola" | "10g",
    liveRates?: Record<string, number>
): number {
    // Get exchange rate 
    // Uses liveRates if provided, otherwise falls back to static CURRENCY_TO_NPR
    const rates: Record<string, number> = liveRates || CURRENCY_TO_NPR;

    let exchangeRate = 1;

    // Map currency codes to exchange rates
    switch (targetCurrency) {
        case "NPR":
            exchangeRate = rates.NPR || rates.USD;
            break;
        case "INR":
            exchangeRate = rates.INR || 83;
            break;
        case "GBP":
            exchangeRate = rates.GBP || 0.79;
            break;
        case "CNY":
            exchangeRate = rates.CNY || 7.2;
            break;
        case "AED":
            exchangeRate = rates.AED || 3.67;
            break;
        case "JPY":
            exchangeRate = rates.JPY || 150;
            break;
        case "AUD":
            exchangeRate = rates.AUD || 1.55;
            break;
        case "CAD":
            exchangeRate = rates.CAD || 1.36;
            break;
        case "CHF":
            exchangeRate = rates.CHF || 0.88;
            break;
        case "SAR":
            exchangeRate = rates.SAR || 3.75;
            break;
        case "THB":
            exchangeRate = rates.THB || 35;
            break;
        case "SGD":
            exchangeRate = rates.SGD || 1.35;
            break;
        case "EUR":
            exchangeRate = rates.EUR || 0.92;
            break;
        case "USD":
        default:
            exchangeRate = 1; // Already in USD
            break;
    }

    let priceInTargetCurrency = usdPerOz * exchangeRate;

    // Convert to different units
    switch (unit) {
        case "gram":
            // 1 oz = 31.1035 grams, so price per gram = price per oz / 31.1035
            priceInTargetCurrency = priceInTargetCurrency / UNIT_CONVERSIONS.OZ_TO_GRAM;
            break;
        case "tola":
            // 1 tola = 11.6638 grams
            priceInTargetCurrency = (priceInTargetCurrency / UNIT_CONVERSIONS.OZ_TO_GRAM) * UNIT_CONVERSIONS.GRAM_TO_TOLA;
            break;
        case "10g":
            priceInTargetCurrency = (priceInTargetCurrency / UNIT_CONVERSIONS.OZ_TO_GRAM) * 10;
            break;
        case "oz":
        default:
            // Already in oz
            break;
    }

    return Math.round(priceInTargetCurrency * 100) / 100;
}

// Convert silver price similarly
export function convertSilverPrice(
    usdPerOz: number,
    targetCurrency: string,
    unit: "oz" | "gram" | "tola" | "10g",
    liveRates?: Record<string, number>
): number {
    return convertGoldPrice(usdPerOz, targetCurrency, unit, liveRates);
}

// Fetch and process all metal prices
export async function fetchAllMetalPrices(): Promise<{
    prices: MetalPrice[],
    rates: Record<string, number>,
    nepalRates: import("./types").NepalRate[],
    goldHistory: import("./types").PriceHistory[],
    silverHistory: import("./types").PriceHistory[]
}> {
    try {
        const [goldPriceData, exchangeRates, asheshRates, goldHistory, silverHistory] = await Promise.all([
            fetchGoldPriceOrgData(),
            fetchExchangeRates(),
            fetchAsheshRates(),
            fetchAsheshHistory(0), // Gold
            fetchAsheshHistory(2)  // Silver
        ]);

        if (!goldPriceData || !goldPriceData.items || goldPriceData.items.length === 0) {
            throw new Error("Invalid data from API");
        }

        const item = goldPriceData.items[0];
        const goldPriceUSD = item.xauPrice; // Gold price in USD per oz
        const silverPriceUSD = item.xagPrice; // Silver price in USD per oz
        const goldChange = item.chgXau;
        const silverChange = item.chgXag;
        const goldChangePercent = item.pcXau;
        const silverChangePercent = item.pcXag;

        const prices: MetalPrice[] = [];
        const now = new Date().toISOString();

        // Nepal prices (From Ashesh.com.np if available, else fallback)
        let nepalGoldPrice = 290300; // Fallback
        let nepalSilverPrice = 5335; // Fallback
        let nepalGoldChange = 0;
        let nepalGoldChangePercent = 0;
        let nepalSilverChange = 0;
        let nepalSilverChangePercent = 0;

        if (asheshRates && Array.isArray(asheshRates)) {
            // Calculate theoretical change factors (Fallback)
            const usdToNpr = exchangeRates.NPR || exchangeRates.USD || 134;
            const goldChangeFactor = (goldChange * usdToNpr / UNIT_CONVERSIONS.OZ_TO_GRAM); // Change per gram
            const silverChangeFactor = (silverChange * usdToNpr / UNIT_CONVERSIONS.OZ_TO_GRAM);

            // Determine previous closing prices from history for Real Change calculation
            const getPrevClose = (history: import("./types").PriceHistory[]) => {
                if (!history || history.length === 0) return 0;
                const todayStr = new Date().toISOString().split('T')[0];
                const last = history[history.length - 1];

                // If last entry is today, use previous one. Else use last one.
                if (last.date === todayStr) {
                    return history.length >= 2 ? history[history.length - 2].price : last.price;
                }
                return last.price;
            };

            const goldPrevClose = getPrevClose(goldHistory);
            const silverPrevClose = getPrevClose(silverHistory);

            // Update rates with ACTUAL changes from history if available, else Theoretical
            asheshRates.forEach((rate: import("./types").NepalRate) => {
                let prevPrice = 0;

                // Determine previous price for this specific unit
                if (rate.name.includes("Gold") && goldPrevClose > 0) {
                    if (rate.unit === "Tola") prevPrice = goldPrevClose;
                    else if (rate.unit === "10 Gram") prevPrice = (goldPrevClose / UNIT_CONVERSIONS.GRAM_TO_TOLA) * 10;
                    else if (rate.unit === "Gram") prevPrice = goldPrevClose / UNIT_CONVERSIONS.GRAM_TO_TOLA;
                } else if (rate.name.includes("Silver") && silverPrevClose > 0) {
                    if (rate.unit === "Tola") prevPrice = silverPrevClose;
                    else if (rate.unit === "10 Gram") prevPrice = (silverPrevClose / UNIT_CONVERSIONS.GRAM_TO_TOLA) * 10;
                    else if (rate.unit === "Gram") prevPrice = silverPrevClose / UNIT_CONVERSIONS.GRAM_TO_TOLA;
                }

                if (prevPrice > 0) {
                    rate.change = rate.price - prevPrice;
                    rate.changePercent = ((rate.price - prevPrice) / prevPrice) * 100;
                } else if (rate.change === 0) {
                    // Fallback to theoretical
                    let factor = 0;
                    if (rate.name.includes("Gold")) factor = goldChangeFactor;
                    else if (rate.name.includes("Silver")) factor = silverChangeFactor;

                    if (rate.unit === "Tola") factor *= UNIT_CONVERSIONS.GRAM_TO_TOLA;
                    else if (rate.unit === "10 Gram") factor *= 10;

                    // Add market premium adjustment
                    factor *= 1.15;

                    rate.change = Math.round(factor * 100) / 100;
                    rate.changePercent = rate.name.includes("Gold") ? goldChangePercent : silverChangePercent;
                }
            });

            const fineGoldTola = asheshRates.find((r: import("./types").NepalRate) => r.name === "Fine Gold" && r.unit === "Tola");
            if (fineGoldTola) {
                nepalGoldPrice = fineGoldTola.price;
                nepalGoldChange = fineGoldTola.change || 0;
                nepalGoldChangePercent = fineGoldTola.changePercent || 0;
            }

            const silverTolaItem = asheshRates.find((r: import("./types").NepalRate) => r.name === "Silver" && r.unit === "Tola");
            if (silverTolaItem) {
                nepalSilverPrice = silverTolaItem.price;
                nepalSilverChange = silverTolaItem.change || 0;
                nepalSilverChangePercent = silverTolaItem.changePercent || 0;
            }
        }

        prices.push({
            id: "np-gold-tola",
            metal: "gold",
            country: "Nepal",
            countryCode: "NP",
            price: nepalGoldPrice,
            currency: "NPR",
            unit: "per tola",
            // Use actual Nepal market change values
            change: nepalGoldChange,
            changePercent: nepalGoldChangePercent,
            lastUpdated: now,
            high24h: nepalGoldPrice,
            low24h: nepalGoldPrice,
        });

        // Add 10g Gold if available in scraped data
        const gold10g = asheshRates?.find((r: import("./types").NepalRate) => r.name === "Fine Gold" && r.unit === "10 Gram");
        if (gold10g) {
            prices.push({
                id: "np-gold-10g",
                metal: "gold",
                country: "Nepal",
                countryCode: "NP",
                price: gold10g.price,
                currency: "NPR",
                unit: "per 10g",
                change: 0,
                changePercent: goldChangePercent,
                lastUpdated: now,
                high24h: gold10g.price,
                low24h: gold10g.price,
            });
        }

        prices.push({
            id: "np-silver-tola",
            metal: "silver",
            country: "Nepal",
            countryCode: "NP",
            price: nepalSilverPrice,
            currency: "NPR",
            unit: "per tola",
            // Use actual Nepal market change values
            change: nepalSilverChange,
            changePercent: nepalSilverChangePercent,
            lastUpdated: now,
            high24h: nepalSilverPrice,
            low24h: nepalSilverPrice,
        });

        const silver10g = asheshRates?.find((r: import("./types").NepalRate) => r.name === "Silver" && r.unit === "10 Gram");
        if (silver10g) {
            prices.push({
                id: "np-silver-10g",
                metal: "silver",
                country: "Nepal",
                countryCode: "NP",
                price: silver10g.price,
                currency: "NPR",
                unit: "per 10g",
                change: 0,
                changePercent: silverChangePercent,
                lastUpdated: now,
                high24h: silver10g.price,
                low24h: silver10g.price,
            });
        }

        // India prices (with markup for import duties and GST)
        const INDIA_MARKUP = 1.16; // 16% markup

        const indiaGoldPrice = convertGoldPrice(goldPriceUSD, "INR", "10g", exchangeRates) * INDIA_MARKUP;
        const indiaSilverPrice = convertSilverPrice(silverPriceUSD, "INR", "10g", exchangeRates) * INDIA_MARKUP;

        prices.push({
            id: "in-gold",
            metal: "gold",
            country: "India",
            countryCode: "IN",
            price: indiaGoldPrice,
            currency: "INR",
            unit: "per 10g",
            change: (goldChange * exchangeRates.INR * 10 / UNIT_CONVERSIONS.OZ_TO_GRAM) * INDIA_MARKUP,
            changePercent: goldChangePercent,
            lastUpdated: now,
            high24h: indiaGoldPrice * 1.005,
            low24h: indiaGoldPrice * 0.995,
        });

        prices.push({
            id: "in-silver",
            metal: "silver",
            country: "India",
            countryCode: "IN",
            price: indiaSilverPrice,
            currency: "INR",
            unit: "per 10g",
            change: (silverChange * exchangeRates.INR * 10 / UNIT_CONVERSIONS.OZ_TO_GRAM) * INDIA_MARKUP,
            changePercent: silverChangePercent,
            lastUpdated: now,
            high24h: indiaSilverPrice * 1.005,
            low24h: indiaSilverPrice * 0.995,
        });

        // USA prices
        prices.push({
            id: "us-gold",
            metal: "gold",
            country: "United States",
            countryCode: "US",
            price: goldPriceUSD,
            currency: "USD",
            unit: "per oz",
            change: goldChange,
            changePercent: goldChangePercent,
            lastUpdated: now,
            high24h: goldPriceUSD * 1.005,
            low24h: goldPriceUSD * 0.995,
        });

        prices.push({
            id: "us-silver",
            metal: "silver",
            country: "United States",
            countryCode: "US",
            price: silverPriceUSD,
            currency: "USD",
            unit: "per oz",
            change: silverChange,
            changePercent: silverChangePercent,
            lastUpdated: now,
            high24h: silverPriceUSD * 1.005,
            low24h: silverPriceUSD * 0.995,
        });

        // UK prices
        const ukGoldPrice = convertGoldPrice(goldPriceUSD, "GBP", "oz", exchangeRates);
        const ukSilverPrice = convertSilverPrice(silverPriceUSD, "GBP", "oz", exchangeRates);

        prices.push({
            id: "uk-gold",
            metal: "gold",
            country: "United Kingdom",
            countryCode: "GB",
            price: ukGoldPrice,
            currency: "GBP",
            unit: "per oz",
            change: goldChange * exchangeRates.GBP,
            changePercent: goldChangePercent,
            lastUpdated: now,
            high24h: ukGoldPrice * 1.005,
            low24h: ukGoldPrice * 0.995,
        });

        prices.push({
            id: "uk-silver",
            metal: "silver",
            country: "United Kingdom",
            countryCode: "GB",
            price: ukSilverPrice,
            currency: "GBP",
            unit: "per oz",
            change: silverChange * exchangeRates.GBP,
            changePercent: silverChangePercent,
            lastUpdated: now,
            high24h: ukSilverPrice * 1.005,
            low24h: ukSilverPrice * 0.995,
        });

        // China prices
        const chinaGoldPrice = convertGoldPrice(goldPriceUSD, "CNY", "gram", exchangeRates);
        const chinaSilverPrice = convertSilverPrice(silverPriceUSD, "CNY", "gram", exchangeRates);

        prices.push({
            id: "cn-gold",
            metal: "gold",
            country: "China",
            countryCode: "CN",
            price: chinaGoldPrice,
            currency: "CNY",
            unit: "per gram",
            change: (goldChange * exchangeRates.CNY) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: goldChangePercent,
            lastUpdated: now,
            high24h: chinaGoldPrice * 1.005,
            low24h: chinaGoldPrice * 0.995,
        });

        prices.push({
            id: "cn-silver",
            metal: "silver",
            country: "China",
            countryCode: "CN",
            price: chinaSilverPrice,
            currency: "CNY",
            unit: "per gram",
            change: (silverChange * exchangeRates.CNY) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: silverChangePercent,
            lastUpdated: now,
            high24h: chinaSilverPrice * 1.005,
            low24h: chinaSilverPrice * 0.995,
        });

        // UAE prices
        const uaeGoldPrice = convertGoldPrice(goldPriceUSD, "AED", "gram", exchangeRates);
        const uaeSilverPrice = convertSilverPrice(silverPriceUSD, "AED", "gram", exchangeRates);

        prices.push({
            id: "ae-gold",
            metal: "gold",
            country: "UAE",
            countryCode: "AE",
            price: uaeGoldPrice,
            currency: "AED",
            unit: "per gram",
            change: (goldChange * exchangeRates.AED) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: goldChangePercent,
            lastUpdated: now,
            high24h: uaeGoldPrice * 1.005,
            low24h: uaeGoldPrice * 0.995,
        });

        prices.push({
            id: "ae-silver",
            metal: "silver",
            country: "UAE",
            countryCode: "AE",
            price: uaeSilverPrice,
            currency: "AED",
            unit: "per gram",
            change: (silverChange * exchangeRates.AED) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: silverChangePercent,
            lastUpdated: now,
            high24h: uaeSilverPrice * 1.005,
            low24h: uaeSilverPrice * 0.995,
        });

        // Japan prices
        const japanGoldPrice = convertGoldPrice(goldPriceUSD, "JPY", "gram", exchangeRates);
        const japanSilverPrice = convertSilverPrice(silverPriceUSD, "JPY", "gram", exchangeRates);

        prices.push({
            id: "jp-gold",
            metal: "gold",
            country: "Japan",
            countryCode: "JP",
            price: japanGoldPrice,
            currency: "JPY",
            unit: "per gram",
            change: (goldChange * (exchangeRates.JPY || 150)) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: goldChangePercent,
            lastUpdated: now,
            high24h: japanGoldPrice * 1.005,
            low24h: japanGoldPrice * 0.995,
        });

        prices.push({
            id: "jp-silver",
            metal: "silver",
            country: "Japan",
            countryCode: "JP",
            price: japanSilverPrice,
            currency: "JPY",
            unit: "per gram",
            change: (silverChange * (exchangeRates.JPY || 150)) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: silverChangePercent,
            lastUpdated: now,
            high24h: japanSilverPrice * 1.005,
            low24h: japanSilverPrice * 0.995,
        });

        // Australia prices
        const australiaGoldPrice = convertGoldPrice(goldPriceUSD, "AUD", "oz", exchangeRates);
        const australiaSilverPrice = convertSilverPrice(silverPriceUSD, "AUD", "oz", exchangeRates);

        prices.push({
            id: "au-gold",
            metal: "gold",
            country: "Australia",
            countryCode: "AU",
            price: australiaGoldPrice,
            currency: "AUD",
            unit: "per oz",
            change: goldChange * (exchangeRates.AUD || 1.5),
            changePercent: goldChangePercent,
            lastUpdated: now,
            high24h: australiaGoldPrice * 1.005,
            low24h: australiaGoldPrice * 0.995,
        });

        prices.push({
            id: "au-silver",
            metal: "silver",
            country: "Australia",
            countryCode: "AU",
            price: australiaSilverPrice,
            currency: "AUD",
            unit: "per oz",
            change: silverChange * (exchangeRates.AUD || 1.5),
            changePercent: silverChangePercent,
            lastUpdated: now,
            high24h: australiaSilverPrice * 1.005,
            low24h: australiaSilverPrice * 0.995,
        });

        // Canada prices
        const canadaGoldPrice = convertGoldPrice(goldPriceUSD, "CAD", "oz", exchangeRates);
        const canadaSilverPrice = convertSilverPrice(silverPriceUSD, "CAD", "oz", exchangeRates);

        prices.push({
            id: "ca-gold",
            metal: "gold",
            country: "Canada",
            countryCode: "CA",
            price: canadaGoldPrice,
            currency: "CAD",
            unit: "per oz",
            change: goldChange * (exchangeRates.CAD || 1.35),
            changePercent: goldChangePercent,
            lastUpdated: now,
            high24h: canadaGoldPrice * 1.005,
            low24h: canadaGoldPrice * 0.995,
        });

        prices.push({
            id: "ca-silver",
            metal: "silver",
            country: "Canada",
            countryCode: "CA",
            price: canadaSilverPrice,
            currency: "CAD",
            unit: "per oz",
            change: silverChange * (exchangeRates.CAD || 1.35),
            changePercent: silverChangePercent,
            lastUpdated: now,
            high24h: canadaSilverPrice * 1.005,
            low24h: canadaSilverPrice * 0.995,
        });

        // Switzerland prices
        const switzerlandGoldPrice = convertGoldPrice(goldPriceUSD, "CHF", "gram", exchangeRates);
        const switzerlandSilverPrice = convertSilverPrice(silverPriceUSD, "CHF", "gram", exchangeRates);

        prices.push({
            id: "ch-gold",
            metal: "gold",
            country: "Switzerland",
            countryCode: "CH",
            price: switzerlandGoldPrice,
            currency: "CHF",
            unit: "per gram",
            change: (goldChange * (exchangeRates.CHF || 0.88)) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: goldChangePercent,
            lastUpdated: now,
            high24h: switzerlandGoldPrice * 1.005,
            low24h: switzerlandGoldPrice * 0.995,
        });

        prices.push({
            id: "ch-silver",
            metal: "silver",
            country: "Switzerland",
            countryCode: "CH",
            price: switzerlandSilverPrice,
            currency: "CHF",
            unit: "per gram",
            change: (silverChange * (exchangeRates.CHF || 0.88)) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: silverChangePercent,
            lastUpdated: now,
            high24h: switzerlandSilverPrice * 1.005,
            low24h: switzerlandSilverPrice * 0.995,
        });

        // Saudi Arabia prices
        const saudiGoldPrice = convertGoldPrice(goldPriceUSD, "SAR", "gram", exchangeRates);
        const saudiSilverPrice = convertSilverPrice(silverPriceUSD, "SAR", "gram", exchangeRates);

        prices.push({
            id: "sa-gold",
            metal: "gold",
            country: "Saudi Arabia",
            countryCode: "SA",
            price: saudiGoldPrice,
            currency: "SAR",
            unit: "per gram",
            change: (goldChange * (exchangeRates.SAR || 3.75)) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: goldChangePercent,
            lastUpdated: now,
            high24h: saudiGoldPrice * 1.005,
            low24h: saudiGoldPrice * 0.995,
        });

        prices.push({
            id: "sa-silver",
            metal: "silver",
            country: "Saudi Arabia",
            countryCode: "SA",
            price: saudiSilverPrice,
            currency: "SAR",
            unit: "per gram",
            change: (silverChange * (exchangeRates.SAR || 3.75)) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: silverChangePercent,
            lastUpdated: now,
            high24h: saudiSilverPrice * 1.005,
            low24h: saudiSilverPrice * 0.995,
        });

        // Thailand prices
        const thailandGoldPrice = convertGoldPrice(goldPriceUSD, "THB", "gram", exchangeRates);
        const thailandSilverPrice = convertSilverPrice(silverPriceUSD, "THB", "gram", exchangeRates);

        prices.push({
            id: "th-gold",
            metal: "gold",
            country: "Thailand",
            countryCode: "TH",
            price: thailandGoldPrice,
            currency: "THB",
            unit: "per gram",
            change: (goldChange * (exchangeRates.THB || 35)) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: goldChangePercent,
            lastUpdated: now,
            high24h: thailandGoldPrice * 1.005,
            low24h: thailandGoldPrice * 0.995,
        });

        prices.push({
            id: "th-silver",
            metal: "silver",
            country: "Thailand",
            countryCode: "TH",
            price: thailandSilverPrice,
            currency: "THB",
            unit: "per gram",
            change: (silverChange * (exchangeRates.THB || 35)) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: silverChangePercent,
            lastUpdated: now,
            high24h: thailandSilverPrice * 1.005,
            low24h: thailandSilverPrice * 0.995,
        });

        // Singapore prices
        const singaporeGoldPrice = convertGoldPrice(goldPriceUSD, "SGD", "gram", exchangeRates);
        const singaporeSilverPrice = convertSilverPrice(silverPriceUSD, "SGD", "gram", exchangeRates);

        prices.push({
            id: "sg-gold",
            metal: "gold",
            country: "Singapore",
            countryCode: "SG",
            price: singaporeGoldPrice,
            currency: "SGD",
            unit: "per gram",
            change: (goldChange * (exchangeRates.SGD || 1.35)) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: goldChangePercent,
            lastUpdated: now,
            high24h: singaporeGoldPrice * 1.005,
            low24h: singaporeGoldPrice * 0.995,
        });

        prices.push({
            id: "sg-silver",
            metal: "silver",
            country: "Singapore",
            countryCode: "SG",
            price: singaporeSilverPrice,
            currency: "SGD",
            unit: "per gram",
            change: (silverChange * (exchangeRates.SGD || 1.35)) / UNIT_CONVERSIONS.OZ_TO_GRAM,
            changePercent: silverChangePercent,
            lastUpdated: now,
            high24h: singaporeSilverPrice * 1.005,
            low24h: singaporeSilverPrice * 0.995,
        });

        // Add today's current price to history if not already there
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Get today's Nepal gold price (Fine Gold Tola)
        const todayGoldPrice = asheshRates?.find(r => r.key === 'fine-gold-tola')?.price;
        const todaySilverPrice = asheshRates?.find(r => r.key === 'silver-tola')?.price;

        // Add today's price to gold history if we have it and it's not already there
        if (todayGoldPrice && !goldHistory.some(h => h.date === today)) {
            goldHistory.push({
                date: today,
                price: todayGoldPrice
            });
        }

        // Add today's price to silver history if we have it and it's not already there
        if (todaySilverPrice && !silverHistory.some(h => h.date === today)) {
            silverHistory.push({
                date: today,
                price: todaySilverPrice
            });
        }

        // Sort histories by date
        goldHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        silverHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            prices,
            rates: exchangeRates,
            nepalRates: asheshRates || [],
            goldHistory,
            silverHistory
        };
    } catch {
        // Return empty array or throw error
        throw new Error('Failed to fetch metal prices');
    }
}

// Generate country data from metal prices
export function generateCountryData(prices: MetalPrice[]): CountryData[] {
    const countryMap = new Map<string, CountryData>();

    prices.forEach((price) => {
        if (!countryMap.has(price.countryCode)) {
            countryMap.set(price.countryCode, {
                country: price.country,
                countryCode: price.countryCode,
                currency: price.currency,
                goldPrice: 0,
                goldUnit: "",
                silverPrice: 0,
                silverUnit: "",
                goldChange: 0,
                goldChangeValue: 0,
                silverChange: 0,
                silverChangeValue: 0,
                lastUpdated: price.lastUpdated,
            });
        }

        const countryData = countryMap.get(price.countryCode)!;

        if (price.metal === "gold") {
            countryData.goldPrice = price.price;
            countryData.goldUnit = price.unit;
            countryData.goldChange = price.changePercent;
            countryData.goldChangeValue = price.change;
        } else {
            countryData.silverPrice = price.price;
            countryData.silverUnit = price.unit;
            countryData.silverChange = price.changePercent;
            countryData.silverChangeValue = price.change;
        }
    });

    return Array.from(countryMap.values());
}

// Fetch real gold and silver news from OnlineKhabar only
// Refreshes every 5 minutes to get latest news
export async function fetchGoldSilverNews(): Promise<import("./types").NewsItem[]> {
    const allNews: import("./types").NewsItem[] = [];

    try {

        const seenTitles = new Set<string>();

        try {
            // Try OnlineKhabar main site for gold-related news
            const nepalResponse = await fetch('https://www.onlinekhabar.com/', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                next: { revalidate: 300 } // Cache for 5 minutes
            });

            if (nepalResponse.ok) {
                const html = await nepalResponse.text();
                const $ = cheerio.load(html);

                // Look for articles with gold-related keywords
                $('article, .ok-post, .post, .news-item, div[class*="post"]').each((index, element) => {
                    if (allNews.filter(n => n.category === 'Nepal').length >= 10) return false; // Get up to 10 articles

                    const $el = $(element);
                    const title = $el.find('h2, h3, h4, .ok-post-title, a').first().text().trim();
                    const link = $el.find('a').first().attr('href');
                    const summary = $el.find('p, .excerpt, .ok-excerpt').first().text().trim();

                    // Skip if we've seen this title
                    if (seenTitles.has(title)) return;

                    // Broader gold/silver keywords
                    const goldKeywords = [
                        'सुन', 'चाँदी', 'सुनको', 'चाँदीको',
                        'सुनको मूल्य', 'सुनको भाउ', 'सुन तोलामा', 'सुन धितो',
                        'चाँदीको मूल्य', 'चाँदीको भाउ',
                        'gold', 'silver', 'gold price', 'silver price',
                        'gold loan', 'गोल्ड लोन', 'बुलियन',
                        'सुन चाँदी', 'सुन बढ्यो', 'सुन घट्यो'
                    ];

                    const hasGoldKeyword = goldKeywords.some(keyword =>
                        title.toLowerCase().includes(keyword.toLowerCase())
                    );

                    // Exclude false matches
                    const excludeKeywords = [
                        'सुनसरी', 'sunsari', 'मतदाता', 'उम्मेद्वार',
                        'बिजनेस विशेष', 'ताजा समाचार', 'breaking'
                    ];
                    const hasExcludeKeyword = excludeKeywords.some(keyword =>
                        title.toLowerCase().includes(keyword.toLowerCase())
                    );

                    // Basic validation - not too strict
                    const isValid = title && title.length > 10 && !seenTitles.has(title);

                    if (isValid && hasGoldKeyword && !hasExcludeKeyword) {
                        seenTitles.add(title);
                        allNews.push({
                            id: `nepal-${allNews.length}`,
                            title: title,
                            description: summary || title,
                            summary: summary || title,
                            url: link?.startsWith('http') ? link : `https://www.onlinekhabar.com${link || ''}`,
                            source: 'OnlineKhabar Nepal',
                            publishedAt: new Date().toISOString(),
                            category: 'Nepal'
                        });
                    }
                });
            }
        } catch {
        }

        // Also try business section if we don't have enough Nepal news
        if (allNews.filter(n => n.category === 'Nepal').length < 5) {
            try {
                const businessResponse = await fetch('https://www.onlinekhabar.com/business', {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    next: { revalidate: 300 } // Cache for 5 minutes
                });

                if (businessResponse.ok) {
                    const html = await businessResponse.text();
                    const $ = cheerio.load(html);

                    $('article, .ok-post').slice(0, 10).each((index, element) => {
                        const $el = $(element);
                        const title = $el.find('h2, h3, .ok-post-title, a').first().text().trim();
                        const link = $el.find('a').first().attr('href');
                        const summary = $el.find('p, .excerpt').first().text().trim();

                        if (seenTitles.has(title)) return;

                        const goldKeywords = [
                            'सुन', 'चाँदी', 'सुनको', 'चाँदीको',
                            'सुनको मूल्य', 'सुनको भाउ', 'सुन तोलामा',
                            'gold', 'silver', 'gold price', 'silver price', 'gold loan', 'गोल्ड लोन'
                        ];
                        const hasGoldKeyword = goldKeywords.some(keyword =>
                            title.toLowerCase().includes(keyword.toLowerCase())
                        );

                        const excludeKeywords = [
                            'सुनसरी', 'sunsari', 'बिजनेस विशेष', 'ताजा समाचार'
                        ];
                        const hasExcludeKeyword = excludeKeywords.some(keyword =>
                            title.toLowerCase().includes(keyword.toLowerCase())
                        );

                        const cleanTitle = title.replace(/\s+/g, ' ').trim();
                        const isValid = cleanTitle.length > 10;

                        if (cleanTitle && isValid && hasGoldKeyword && !hasExcludeKeyword) {
                            seenTitles.add(cleanTitle);
                            allNews.push({
                                id: `nepal-biz-${allNews.length}`,
                                title: cleanTitle,
                                description: summary || title,
                                summary: summary || title,
                                url: link?.startsWith('http') ? link : `https://www.onlinekhabar.com${link || '/business'}`,
                                source: 'OnlineKhabar Business',
                                publishedAt: new Date().toISOString(),
                                category: 'Nepal'
                            });
                        }
                    });
                }
            } catch {
            }
        }

        // Return only real scraped news from OnlineKhabar
        if (allNews.length > 0) {
            return allNews.slice(0, 10); // Return up to 10 real articles
        }

        // If no news found, return empty array
        return [];

    } catch {

        // Return empty array on error
        return [];
    }
}
