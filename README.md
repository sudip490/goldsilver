# Gold & Silver Price Tracker

A modern, real-time precious metal price tracking website with a focus on Nepal and global markets. Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- 🇳🇵 **Nepal Market Focus**: Prominent display of Nepal gold and silver prices
- 🌍 **Global Coverage**: Track prices across multiple countries (India, USA, UK, China, UAE)
- 📊 **Price Charts**: 30-day historical price trends with interactive charts
- 📰 **Market News**: Latest news and updates about precious metals
- 🎨 **Beautiful UI**: Modern design with gradient backgrounds and smooth animations
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile devices
- ⚡ **Real-time Updates**: Live price updates (ready for API integration)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd goldprice
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
goldprice/
├── app/
│   ├── globals.css          # Global styles and CSS variables
│   ├── layout.tsx            # Root layout with metadata
│   └── page.tsx              # Main homepage
├── components/
│   ├── ui/                   # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   └── separator.tsx
│   ├── price-card.tsx        # Individual price card component
│   ├── country-price-table.tsx  # Global prices table
│   ├── price-chart.tsx       # Historical price chart
│   └── news-list.tsx         # News items list
├── lib/
│   ├── utils.ts              # Utility functions
│   ├── types.ts              # TypeScript type definitions
│   └── mock-data.ts          # Mock data for development
└── public/                   # Static assets
```

## Customization

### Adding Real API Integration

Currently, the app uses mock data. To integrate real APIs:

1. Create an API route in `app/api/prices/route.ts`
2. Update the data fetching in `app/page.tsx`
3. Replace mock data imports with API calls

Example API sources:
- [GoldAPI](https://www.goldapi.io/)
- [Metals-API](https://metals-api.com/)
- Nepal Rastra Bank API (if available)

### Styling

The app uses Tailwind CSS with custom color palettes for gold and silver:

- Gold colors: `gold-50` to `gold-900`
- Silver colors: `silver-50` to `silver-900`

Modify `tailwind.config.ts` to customize the theme.

### Adding More Countries

Edit `lib/mock-data.ts` and add new entries to:
- `mockMetalPrices` array
- `mockCountryData` array

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Deploy with one click

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Digital Ocean
- Railway

## Future Enhancements

- [ ] Real-time API integration
- [ ] User authentication
- [ ] Price alerts and notifications
- [ ] Currency converter
- [ ] Historical data export
- [ ] Dark/light theme toggle
- [ ] Multi-language support (Nepali, Hindi, etc.)
- [ ] Mobile app version

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For questions or support, please open an issue in the GitHub repository.

---

Made with ❤️ for the Nepal precious metals market
