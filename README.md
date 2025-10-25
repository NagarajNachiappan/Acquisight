# AcquiSight - Government Contract Intelligence

A clean, simple application for searching U.S. Government contracts from USAspending.gov.

## ✅ Fresh Start

All previous files have been backed up to the `/backup` folder.

## 🚀 Quick Start

### Start the Application

```bash
npm start
```

Open your browser to **http://localhost:5000**

## 💻 How to Use

1. **Home Page**: Enter keywords, Award ID, or company name in the search box
2. **Click "Search All Databases"**: Searches USAspending.gov API (last 2 years)
3. **View Results**: See all matching contracts with details
4. **New Search**: Click "New Search" button to go back

## 📁 Project Structure

```
acquisight/
├── public/
│   ├── index.html          # Home page with search box
│   └── results.html        # Results page
├── server.js               # Express server with API
├── usaspending-client.js   # USAspending API client
├── backup/                 # All previous files (SAFE)
└── package.json            # Dependencies
```

## 🎯 Features

- ✅ Clean, simple search interface
- ✅ Real-time search against USAspending.gov
- ✅ Beautiful results cards
- ✅ Contract details (amount, agency, dates, description)
- ✅ No clutter - just search and results

## 🔧 API Endpoint

- `POST /api/search` - Search contracts
  - Body: `{ "keywords": "search term" }`
  - Returns: USAspending.gov results

## 📝 Notes

- Searches last 2 years of contract data by default
- Returns up to 50 results
- All previous functionality is backed up in `/backup` folder

---

**Clean. Simple. Fast.**
