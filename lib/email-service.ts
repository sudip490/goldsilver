import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_USER = 'goldsilvertracker.info@gmail.com';
const EMAIL_PASS = 'svkeyestcxwozboj'; // Gmail App Password

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

interface PriceData {
    goldPrice: number;
    silverPrice: number;
    goldChange: number;
    silverChange: number;
    goldChangePercent: number;
    silverChangePercent: number;
}

interface PortfolioData {
    totalInvestment: number;
    currentValue: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    todayProfitLoss: number;
    todayProfitLossPercent: number;
}

// Send email with portfolio data
export async function sendPriceUpdateEmail(
    recipientEmail: string,
    recipientName: string,
    priceData: PriceData,
    portfolioData: PortfolioData
) {
    try {
        const isProfit = portfolioData.totalProfitLoss >= 0;
        const isTodayProfit = portfolioData.todayProfitLoss >= 0;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .section h2 { margin-top: 0; color: #667eea; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
        .price-card { padding: 15px; border-radius: 6px; text-align: center; }
        .gold-card { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }
        .silver-card { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
        .price-card h3 { margin: 0 0 10px 0; font-size: 16px; color: #333; }
        .price-card .price { font-size: 24px; font-weight: bold; color: #333; margin: 5px 0; }
        .price-card .change { font-size: 14px; margin-top: 5px; }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .portfolio-stats { margin-top: 15px; }
        .stat-row { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #e5e7eb; }
        .stat-row:last-child { border-bottom: none; }
        .stat-label { font-weight: 500; color: #6b7280; font-size: 14px; }
        .stat-value { font-weight: bold; font-size: 18px; text-align: right; }
        .highlight-box { background: ${isProfit ? '#d1fae5' : '#fee2e2'}; border-left: 4px solid ${isProfit ? '#10b981' : '#ef4444'}; padding: 15px; margin-top: 15px; border-radius: 4px; }
        .highlight-box h3 { margin: 0 0 10px 0; color: ${isProfit ? '#065f46' : '#991b1b'}; font-size: 16px; }
        .highlight-box .big-number { font-size: 32px; font-weight: bold; color: ${isProfit ? '#10b981' : '#ef4444'}; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Gold & Silver Price Update</h1>
        <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    <div class="content">
        <div class="section">
            <h2>💰 Current Prices (Nepal)</h2>
            <div class="price-grid">
                <div class="price-card gold-card">
                    <h3>🥇 Gold (per tola)</h3>
                    <div class="price">NPR ${Math.round(priceData.goldPrice).toLocaleString()}</div>
                    <div class="change ${priceData.goldChange >= 0 ? 'positive' : 'negative'}">
                        ${priceData.goldChange >= 0 ? '▲' : '▼'} NPR ${Math.abs(Math.round(priceData.goldChange)).toLocaleString()} 
                        (${priceData.goldChangePercent >= 0 ? '+' : ''}${priceData.goldChangePercent.toFixed(2)}%)
                    </div>
                </div>
                <div class="price-card silver-card">
                    <h3>🥈 Silver (per tola)</h3>
                    <div class="price">NPR ${Math.round(priceData.silverPrice).toLocaleString()}</div>
                    <div class="change ${priceData.silverChange >= 0 ? 'positive' : 'negative'}">
                        ${priceData.silverChange >= 0 ? '▲' : '▼'} NPR ${Math.abs(Math.round(priceData.silverChange)).toLocaleString()} 
                        (${priceData.silverChangePercent >= 0 ? '+' : ''}${priceData.silverChangePercent.toFixed(2)}%)
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📈 Your Portfolio Summary</h2>
            <div class="portfolio-stats">
                <div class="stat-row">
                    <span class="stat-label">Total Investment</span>
                    <span class="stat-value">NPR ${Math.round(portfolioData.totalInvestment).toLocaleString()}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Current Value</span>
                    <span class="stat-value">NPR ${Math.round(portfolioData.currentValue).toLocaleString()}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Total Profit/Loss</span>
                    <span class="stat-value ${isProfit ? 'positive' : 'negative'}">
                        ${isProfit ? '+' : ''}NPR ${Math.abs(Math.round(portfolioData.totalProfitLoss)).toLocaleString()} 
                        (${portfolioData.totalProfitLossPercent >= 0 ? '+' : ''}${portfolioData.totalProfitLossPercent.toFixed(2)}%)
                    </span>
                </div>
            </div>

            <div class="highlight-box">
                <h3>${isTodayProfit ? '🎉' : '📉'} Today's Change</h3>
                <div class="big-number">
                    ${isTodayProfit ? '+' : ''}NPR ${Math.abs(Math.round(portfolioData.todayProfitLoss)).toLocaleString()}
                </div>
                <div style="margin-top: 5px; font-size: 16px; color: #6b7280;">
                    ${portfolioData.todayProfitLossPercent >= 0 ? '+' : ''}${portfolioData.todayProfitLossPercent.toFixed(2)}% from yesterday
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This is an automated price update from Gold Silver Tracker</p>
            <p>📧 goldsilvertracker.info@gmail.com</p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"Gold Silver Tracker" <${EMAIL_USER}>`,
            to: recipientEmail,
            subject: `📊 Price Update: ${isTodayProfit ? '📈 Profit' : '📉 Loss'} NPR ${Math.abs(Math.round(portfolioData.todayProfitLoss)).toLocaleString()} Today`,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        return { success: false, error };
    }
}

// Send price-only email (for users without portfolios)
export async function sendPriceOnlyEmail(
    recipientEmail: string,
    recipientName: string,
    priceData: PriceData
) {
    try {
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .section h2 { margin-top: 0; color: #667eea; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
        .price-card { padding: 20px; border-radius: 6px; text-align: center; }
        .gold-card { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }
        .silver-card { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
        .price-card h3 { margin: 0 0 10px 0; font-size: 16px; color: #333; }
        .price-card .price { font-size: 28px; font-weight: bold; color: #333; margin: 10px 0; }
        .price-card .change { font-size: 14px; margin-top: 5px; }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .cta-box { background: #e0e7ff; border: 2px solid #667eea; padding: 20px; margin-top: 20px; border-radius: 8px; text-align: center; }
        .cta-box h3 { margin: 0 0 10px 0; color: #667eea; }
        .cta-box p { margin: 10px 0; color: #6b7280; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Gold & Silver Price Update</h1>
        <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    <div class="content">
        <div class="section">
            <h2>💰 Today's Prices (Nepal)</h2>
            <div class="price-grid">
                <div class="price-card gold-card">
                    <h3>🥇 Gold (per tola)</h3>
                    <div class="price">NPR ${Math.round(priceData.goldPrice).toLocaleString()}</div>
                    <div class="change ${priceData.goldChange >= 0 ? 'positive' : 'negative'}">
                        ${priceData.goldChange >= 0 ? '▲' : '▼'} NPR ${Math.abs(Math.round(priceData.goldChange)).toLocaleString()} 
                        (${priceData.goldChangePercent >= 0 ? '+' : ''}${priceData.goldChangePercent.toFixed(2)}%)
                    </div>
                </div>
                <div class="price-card silver-card">
                    <h3>🥈 Silver (per tola)</h3>
                    <div class="price">NPR ${Math.round(priceData.silverPrice).toLocaleString()}</div>
                    <div class="change ${priceData.silverChange >= 0 ? 'positive' : 'negative'}">
                        ${priceData.silverChange >= 0 ? '▲' : '▼'} NPR ${Math.abs(Math.round(priceData.silverChange)).toLocaleString()} 
                        (${priceData.silverChangePercent >= 0 ? '+' : ''}${priceData.silverChangePercent.toFixed(2)}%)
                    </div>
                </div>
            </div>
        </div>

        <div class="cta-box">
            <h3>📈 Start Tracking Your Portfolio!</h3>
            <p>Add your gold and silver investments to track your portfolio performance in real-time.</p>
            <p style="margin-top: 15px; font-size: 14px;">Login to your account to get started!</p>
        </div>

        <div class="footer">
            <p>This is an automated price update from Gold Silver Tracker</p>
            <p>📧 goldsilvertracker.info@gmail.com</p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"Gold Silver Tracker" <${EMAIL_USER}>`,
            to: recipientEmail,
            subject: `📊 Daily Price Update: Gold NPR ${Math.round(priceData.goldPrice).toLocaleString()} | Silver NPR ${Math.round(priceData.silverPrice).toLocaleString()}`,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        return { success: false, error };
    }
}
