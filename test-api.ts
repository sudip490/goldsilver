import { fetchAllMetalPrices } from './lib/api-service';

async function test() {
    console.log("Testing fetchAllMetalPrices...");
    try {
        const data = await fetchAllMetalPrices();
        console.log("Success!");
        console.log("Sample Prices:", JSON.stringify(data.prices.slice(0, 2), null, 2));
        console.log("Nepal Rates:", JSON.stringify(data.nepalRates.slice(0, 2), null, 2));
        
        const check = (obj: any, path: string = "") => {
            if (typeof obj === 'number') {
                if (!isFinite(obj)) {
                    console.log(`❌ Invalid number at ${path}: ${obj}`);
                }
            } else if (Array.isArray(obj)) {
                obj.forEach((item, i) => check(item, `${path}[${i}]`));
            } else if (obj && typeof obj === 'object') {
                Object.keys(obj).forEach(key => check(obj[key], `${path}.${key}`));
            }
        };
        
        check(data);
        console.log("Check complete.");
    } catch (err) {
        console.error("Crash during test:", err);
    }
}

test();
