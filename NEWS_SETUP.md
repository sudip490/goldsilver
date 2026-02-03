# OnlineKhabar News Integration - Auto-Refresh Setup

## ✅ Configuration Complete

### **News Source**
- **Single Source**: OnlineKhabar.com only
- **Sections**: Main site + Business section
- **Language**: Nepali (नेपाली)
- **Focus**: Gold and silver related news only

---

## 🔄 **Auto-Refresh System**

### **Backend (API)**
- **Cache Duration**: 5 minutes (300 seconds)
- **File**: `app/api/prices/route.ts`
- **Setting**: `export const revalidate = 300;`

### **News Fetching**
- **Cache Duration**: 5 minutes (300 seconds)
- **File**: `lib/api-service.ts`
- **Main Site**: `next: { revalidate: 300 }`
- **Business Section**: `next: { revalidate: 300 }`

### **Frontend**
- **Auto-Refresh**: Every 5 minutes
- **File**: `app/page.tsx`
- **Setting**: `setInterval(fetchPrices, 5 * 60 * 1000)`

---

## 📰 **News Fetching Details**

### **Keywords (Nepali)**
- सुनको मूल्य (Gold price)
- सुनको भाउ (Gold rate)
- चाँदीको मूल्य (Silver price)
- चाँदीको भाउ (Silver rate)
- गोल्ड लोन (Gold loan)
- बुलियन (Bullion)
- सुन चाँदी (Gold silver)

### **Keywords (English)**
- gold price
- silver price
- gold loan
- gold market
- silver market

### **Excluded Keywords**
- सुनसरी (Sunsari district - false match)
- मतदाता (voters)
- उम्मेद्वार (candidates)

---

## 📊 **Article Limits**

### **Main Site**
- **Maximum**: 10 articles
- **URL**: https://www.onlinekhabar.com/

### **Business Section**
- **Triggered**: If less than 5 articles from main site
- **Maximum**: Additional articles to reach 10 total
- **URL**: https://www.onlinekhabar.com/business

### **Total Display**
- **Maximum**: 10 latest gold-related articles
- **Duplicates**: Automatically removed
- **Sorting**: Latest first

---

## ⏱️ **Refresh Timeline**

```
Time 0:00  → Fetch news from OnlineKhabar
Time 5:00  → Auto-refresh (new articles)
Time 10:00 → Auto-refresh (new articles)
Time 15:00 → Auto-refresh (new articles)
...and so on every 5 minutes
```

---

## 🎯 **How It Works**

1. **User visits site** → Fetches latest news
2. **After 5 minutes** → Frontend auto-refreshes
3. **API checks cache** → If expired, fetches new data
4. **OnlineKhabar scrape** → Gets latest gold articles
5. **Filter & deduplicate** → Removes duplicates and non-gold news
6. **Display** → Shows up to 10 latest articles

---

## 📝 **Example News Article**

```json
{
  "id": "nepal-0",
  "title": "एनआईसी एसिया बैंकले ल्यायो 'गोल्ड लोन' योजना, सुन धितो राखेर ५० लाखसम्म कर्जा पाइने",
  "summary": "एनआईसी एसिया बैंकले ल्यायो 'गोल्ड लोन' योजना...",
  "url": "https://www.onlinekhabar.com/2026/02/1861091/...",
  "source": "OnlineKhabar Nepal",
  "publishedAt": "2026-02-03T11:57:24.189Z",
  "category": "Nepal"
}
```

---

## ✨ **Benefits**

✅ **Always Fresh**: News updates every 5 minutes  
✅ **Relevant**: Only gold/silver related articles  
✅ **No Duplicates**: Smart deduplication system  
✅ **Local Focus**: 100% Nepal-focused content  
✅ **Automatic**: No manual intervention needed  
✅ **Reliable**: Single trusted source (OnlineKhabar)

---

## 🔍 **Monitoring**

Check console logs for:
- `[News] Fetching latest gold news from OnlineKhabar...`
- `[News] Successfully fetched X real news articles from OnlineKhabar`
- `[News] OnlineKhabar fetch failed:` (if errors)

---

**Last Updated**: February 3, 2026, 5:45 PM NPT  
**Status**: ✅ Active and auto-refreshing every 5 minutes
