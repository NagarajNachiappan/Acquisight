# AcquiSight - Government Contract Intelligence

A powerful application for searching U.S. Government contracts from USAspending.gov with AI-powered contract analysis.

## ✅ Fresh Start

All previous files have been backed up to the `/backup` folder.

## 🚀 Quick Start

### 1. Configure API Keys

**IMPORTANT:** Before running the application, set up your API keys:

```bash
# Copy the example config file
cp config.example.js config.js

# Edit config.js and add your API keys
# (Use any text editor)
```

**API Keys Required:**
- **OpenAI API Key** (starts with `sk-proj-...`)
  - Get from: https://platform.openai.com/api-keys
  - Used for: ChatGPT-powered contract analysis
  
- **Perplexity API Key** (starts with `pplx-...`)
  - Get from: https://www.perplexity.ai/settings/api
  - Used for: Real-time web research and intelligence gathering

**Security Note:** The `config.js` file is in `.gitignore` and will NOT be committed to git.

### 2. Start the Application

```bash
npm start
```

Open your browser to **http://localhost:5000**

## 💻 How to Use

1. **Home Page**: Enter keywords, Award ID, or company name in the search box
2. **Click "Search All Databases"**: Searches USAspending.gov API (optimized date ranges)
3. **View Results**: See all matching contracts with details
4. **View Details**: Click on any contract to see detailed information including:
   - Contract overview and financial details
   - Subcontractor information (up to 100 records)
   - Transaction history (up to 100 records)
   - 🤖 **Perplexity AI Analysis** (AI-powered insights)
   - 💬 **ChatGPT Analysis** (GPT-powered contract review)
   - 👨‍💻 **Developer Corner** (Raw API data for technical users)
5. **Generate PDFs**: Download contract reports from USAspending.gov and FPDS.gov

## 📁 Project Structure

```
usaspending/
├── public/
│   ├── index.html          # Home page with search interface
│   ├── results.html        # Search results page
│   └── detail.html         # Contract detail page with AI analysis
├── server.js               # Express server with API endpoints
├── usaspending-client.js   # USAspending.gov API client
├── pdf-generator.js        # PDF generation from URLs
├── config.js               # API keys (NOT in git - you create this)
├── config.example.js       # Example config file (safe to commit)
├── prompts.js              # AI prompts configuration (customize as needed)
├── backup/                 # All previous files (SAFE)
└── package.json            # Dependencies
```

## 🎯 Features

### Search & Discovery
- ✅ Smart search with optimized date ranges
  - Award ID searches: No date restrictions (finds contracts from any time period)
  - Keyword searches: Last 10 years of data
- ✅ Real-time search against USAspending.gov API
- ✅ Beautiful, card-based results interface
- ✅ Detailed contract information (amount, agency, dates, description)
- ✅ Performance timing in logs

### Contract Details
- ✅ Comprehensive contract overview
- ✅ Subcontractor information (limit: 100 records)
- ✅ Transaction history (limit: 100 records)
- ✅ Links to official government sources (USAspending.gov, FPDS.gov)

### AI-Powered Analysis
- 🤖 **Perplexity AI Analysis**
  - Real-time web research
  - Contract intelligence gathering
  - Uses: `llama-3.1-sonar-small-128k-online` model
  
- 💬 **ChatGPT Analysis**
  - Contract review and insights
  - Natural language processing
  - Uses: `gpt-4o` model

### Developer Features
- 👨‍💻 **Developer Corner** (collapsible section)
  - Raw API responses in JSON format
  - API endpoint information
  - Copy-to-clipboard functionality
  - Hidden by default for clean UX

### PDF Generation
- 📄 Generate PDFs from USAspending.gov URLs (with custom cover page)
- 📄 Generate PDFs from FPDS.gov URLs (with custom cover page)

## 🔧 API Endpoints

- `POST /api/search` - Search contracts
  - Body: `{ "keywords": "search term" }`
  - Returns: USAspending.gov results (up to 100 records)
  - Smart date range detection (Award ID vs keywords)

- `GET /api/award/details/:awardId` - Get award details
  - Returns: Detailed contract information
  
- `POST /api/generate-usaspending-pdf` - Generate PDF from USAspending.gov
  - Body: `{ "url": "...", "awardId": "..." }`
  - Returns: PDF file with cover page
  
- `POST /api/generate-fpds-pdf` - Generate PDF from FPDS.gov
  - Body: `{ "url": "...", "awardId": "..." }`
  - Returns: PDF file with cover page

## 📝 Important Notes

### API Rate Limits
- **USAspending.gov API**: Max 100 records per request (API limitation)
- **OpenAI API**: Subject to your plan's rate limits
- **Perplexity API**: Subject to your plan's rate limits

### Security
- ⚠️ **NEVER commit `config.js` to version control**
- ✅ `config.js` is already in `.gitignore`
- ✅ Use `config.example.js` as a template
- ✅ API keys are kept server-side only

### Search Optimization
- **Award ID searches** (e.g., `36C10B22N10280026`): 
  - No date restrictions applied
  - Searches entire database history
  - Faster performance
  
- **Keyword/Company searches**:
  - Searches last 10 years of data
  - Broader coverage for general queries

### Data Limits
- Search results: Up to 100 contracts
- Subcontractor records: Up to 100 per contract
- Transaction history: Up to 100 transactions per contract

### Backup
- All previous functionality is backed up in `/backup` folder

---

## 🔐 Configuration File Details

### Understanding the Two API Keys

**OpenAI (ChatGPT)**
- Key format: `sk-proj-XXXXXXXXXXXX...`
- Purpose: Contract analysis using GPT models
- Best for: Natural language understanding, summarization, insights
- Model: `gpt-4o` (can be changed to `gpt-3.5-turbo` for cost savings)

**Perplexity AI**
- Key format: `pplx-XXXXXXXXXXXX...`
- Purpose: Real-time web research and fact-finding
- Best for: Up-to-date information, research, intelligence gathering
- Model: `llama-3.1-sonar-small-128k-online`

Both keys are clearly separated in `config.js` with comments explaining their purpose.

---

## 📝 Customizing AI Prompts

All AI prompts are stored in **`prompts.js`** for easy customization:

```javascript
// prompts.js
module.exports = {
    perplexity: {
        systemPrompt: '...',
        userPromptTemplate: '...'  // Use {companyName} as variable
    },
    chatgpt: {
        systemPrompt: '...',
        userPromptTemplate: '...'  // Use {companyName} as variable
    }
};
```

**To customize:**
1. Open `prompts.js`
2. Edit the `systemPrompt` or `userPromptTemplate`
3. Use `{companyName}` where you want the company name inserted
4. Save and restart the server

**No code changes needed!** Just modify the prompts file.

---

**Intelligent. Powerful. Secure.**
