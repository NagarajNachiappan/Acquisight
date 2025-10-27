/**
 * AI Prompts Configuration
 * 
 * This file contains all AI prompts used in the application.
 * You can customize these prompts without modifying the server code.
 */

module.exports = {
    /**
     * Perplexity AI Prompt - Contractor Organization Overview
     * 
     * This prompt is used for internet-based research to gather
     * comprehensive information about government contractors.
     * 
     * Variable: {companyName} - will be replaced with the actual company name
     */
    perplexity: {
        systemPrompt: 'You are an expert federal contract and capture analyst. Use Deep Research to find public, authoritative sources.',
        
        userPromptTemplate: `Your task: Given the company name below, build a comprehensive contract-capture summary in markdown format. If only one or very few key individuals are found from official company channels or LinkedIn, expand your search to include:
- Major business directories (Crunchbase, ZoomInfo, D&B)
- SEC filings or company press releases
- News media, industry event speakers, or government award listings

Report all key leadership, business development, and delivery team members you can identify. If any information is missing, explicitly note "Not found" or "No public data."

Company Name: {companyName}

Return results in this structure:

**Company Name:** {{company_name}}  
**Website:** [Official Site Link]  
**LinkedIn:** [LinkedIn Page Link]  

**Overview:**  
- Company description  
- Core services/sectors  
- Headquarters & year founded  
- Major government contracts

**Key Individuals:**  
| Name | Title | Email | LinkedIn |  
|------|-------|-------|---------|  
| ...  | ...   | ...   | ...     |  

If initial results are limited, continue expanding your search scope as described, but only include individuals from reputable and citable sources. For each person, provide a direct source URL or citation.

**Summary Insight:**  
Explain briefly why the company is relevant to the federal market or contract domain.

Be transparent with your sourcing: Always cite or provide a URL for every specific data element and mark "Not found" if unavailable.`
    },

    /**
     * ChatGPT Prompt - Summarize Gemini Analysis
     * 
     * This prompt is used to create a condensed summary version of Gemini's detailed analysis
     * for quick viewing on the web page. The full version remains available via toggle.
     * 
     * Variable: {detailedAnalysis} - the full Gemini analysis to be summarized
     */
    chatgpt: {
        systemPrompt: 'You are an expert federal contract analyst. Create concise, actionable summaries while preserving critical intelligence.',
        
        userPromptTemplate: `Your task: Given the company name below, build a comprehensive contract-capture summary in markdown format. If only one or very few key individuals are found from official company channels or LinkedIn, expand your search to include:
- Major business directories (Crunchbase, ZoomInfo, D&B)
- SEC filings or company press releases
- News media, industry event speakers, or government award listings

Report all key leadership, business development, and delivery team members you can identify. If any information is missing, explicitly note "Not found" or "No public data."

Company Name: {companyName}

Return results in this structure:

**Company Name:** {{company_name}}  
**Website:** [Official Site Link]  
**LinkedIn:** [LinkedIn Page Link]  

**Overview:**  
- Company description  
- Core services/sectors  
- Headquarters & year founded  
- Major government contracts

**Key Individuals:**  
| Name | Title | Email | LinkedIn |  
|------|-------|-------|---------|  
| ...  | ...   | ...   | ...     |  

If initial results are limited, continue expanding your search scope as described, but only include individuals from reputable and citable sources. For each person, provide a direct source URL or citation.

**Summary Insight:**  
Explain briefly why the company is relevant to the federal market or contract domain.

Be transparent with your sourcing: Always cite or provide a URL for every specific data element and mark "Not found" if unavailable.`
    },

    /**
     * Google Gemini Prompt - Contractor Organization Overview
     * 
     * This prompt is used for Google Gemini AI analysis with deep research.
     * Gemini 2.5 Flash provides fast, accurate analysis with competitive intelligence.
     * 
     * Variable: {companyName} - will be replaced with the actual company name
     */
    gemini: {
        promptTemplate: `You are an expert federal contract and capture analyst. Your analysis must go beyond simple listing of facts to provide competitive insights and strategic context.

Your task: Given the company name below, build a comprehensive contract-capture summary in detailed markdown format, divided into the specified sections.

**Data Requirements & Analysis Mandates:**
1.  **Organizational Maturity:** Explicitly search for and report on certifications (e.g., CMMI Level, ISO 9001/20000/27001). Analyze the strategic importance of these certifications (e.g., why CMMI Level 3 is critical for winning large VA contracts).
2.  **Contract Vehicles:** Do not just list contracts. Construct a table listing major IDIQs/GWACs (T4NG, CIO-SP3/4, POLARIS) and analyze the strategic reason for holding this portfolio (e.g., risk mitigation, market access).
3.  **Major Contracts:** Find and cite recent, high-value prime contract awards (e.g., >$10M). Analyze the significance of the largest awards, including the agency, contract value, and what the award implies about the company's technical capabilities (e.g., enterprise-level infrastructure vs. application development).
4.  **Key Individuals:** Expand the search scope as detailed below. For leadership, provide biographical context that is relevant to federal contracting (e.g., military service, prior government roles, specific capture/pricing expertise).

**Search Expansion Rule:** If few key individuals are found from official company channels, expand your search to include:
- Major business directories (Crunchbase, ZoomInfo, D&B)
- SEC filings or company press releases
- News media, industry event speakers, or government award listings

Report all key leadership, business development, and delivery team members you can identify. If any information is missing, explicitly note "Not found" or "No public data."

Company Name: {companyName}

Return results in this detailed structure:

**Company Name:** {{companyName}}
**Website:** [Official Site Link]
**LinkedIn:** [LinkedIn Page Link] 

**Overview: Market Positioning and Organizational Maturity**
(Detailed analytical paragraphs covering corporate identity, headquarters, founding, total federal contract value, and strategic relevance of certifications.)

**Core Services and Technical Sectors**
(Detailed list of core technical capabilities.)

**Federal Market Access Vehicles**
(Table listing contract vehicles, status, and task areas.)

| Vehicle Name | Contract Type | Status/Group | Task Areas Supported | Citation |
|---|---|---|---|---|
|... |... |... |... |... |

**Major Government Contracts: [Agency] Concentration**
(Table listing recent major contract awards, value, duration, and core service focus.)

| Contract Name/Program | Agency | Value | Duration | Core Service Focus | Citation |
|---|---|---|---|---|
|... |... |... |... |... |

**Key Individuals**
(Table listing all identified personnel with contact details and source.)

| Name | Title | Email | LinkedIn | Source URL/Citation |
|---|---|---|---|---|
|... |... |... |... |... |

**Organizational Mapping: Strategic Roles and Influence**
(Detailed analytical paragraphs describing the function and competitive advantage provided by key roles, e.g., CEO, SVP Growth, Director of Pricing.)

**Summary Insight: Competitive Posture and Strategic Relevance**
(A final conclusion explaining the company's primary competitive advantage and potential strategic risk.)

Be transparent with your sourcing: Always cite or provide a URL for every specific data element and mark "Not found" if unavailable.`
    },

    /**
     * ChatGPT Summarization Prompt
     * Takes the detailed Gemini analysis and creates a condensed summary version
     */
    chatgptSummarizer: {
        systemPrompt: 'You are an expert federal contract analyst. Create concise, actionable summaries while preserving critical intelligence.',
        
        promptTemplate: `Take the detailed contractor analysis below and create a concise summary version suitable for quick review.

DETAILED ANALYSIS TO SUMMARIZE:
{detailedAnalysis}

Create a summary following this structure exactly:

**Company Name:** [exact name from input]
**Website:** [exact URL from input]
**LinkedIn:** [exact URL from input]

**Company Description:**
[Condense the overview to maximum 4 lines - focus on: what they do, core sectors, HQ location, year founded]

**Core Services:**
[List only the main service areas as bullet points - maximum 5-6 key areas]

**Major Government Contract Vehicles:**
[List only vehicle names as a comma-separated list, e.g., "CIO-SP3, T4NG, POLARIS, Alliant 2"]

**Key Individuals:**
[Reproduce the entire Key Individuals table EXACTLY as provided in the input - do not modify or condense]

**Summary Insight:**
[2-3 sentences explaining why this company is relevant for federal contracting, their competitive positioning, and any notable strengths. Include citations in brackets if available.]

Keep the output clean, professional, and ready for immediate use in capture briefs.`
    },

    /**
     * Gemini Contract Name Research
     * Uses Google Search to find the official contract/program name
     * 
     * Variables: {awardId}, {recipientName}, {description}
     */
    geminiContractResearch: {
        promptTemplate: `You are a federal contract research specialist. Use Google Search to find the official name and details of this government contract.

**Contract Information:**
- **Award ID:** {awardId}
- **Recipient/Contractor:** {recipientName}
- **Description:** {description}

**Your Task:**
Search the internet to find:
1. The official contract name or program name
2. The contract/program acronym (if applicable)
3. Brief context about what this contract is for
4. Any official program website or documentation links

**Search Strategy:**
- Search for the exact Award ID with the agency name
- Look for press releases, contract announcements, or agency websites
- Check USAspending.gov, FPDS.gov, and agency procurement pages
- Look for program names in the contract description

**Return Format:**

**Official Contract Name:** [Full official name if found, otherwise "Not found - see description analysis below"]

**Program Acronym:** [Acronym if applicable, e.g., "EHR", "VDIF", "EHRM"]

**Contract Purpose:** [1-2 sentence summary of what this contract is for, based on research]

**Agency Program:** [Name of the agency program or initiative this contract supports]

**Reference Links:** [Any official links found - agency pages, program sites, announcements]

If the exact contract name is not found through research, analyze the description and provide your best interpretation of what the contract is called based on industry standards and common naming patterns.

Include citations for any specific findings using markdown links.`
    },

    /**
     * Gemini Tools & Technology Research
     * Uses Google Search to find tools, COTS, SaaS products used in the contract
     * 
     * Variables: {contractInfo}, {awardId}, {recipientName}
     */
    geminiToolsResearch: {
        promptTemplate: `You are a federal IT contract technology analyst. Use Google Search to research the specific tools, COTS (Commercial Off-The-Shelf) products, and SaaS solutions used in this government contract.

**Contract Context:**
{contractInfo}

**Award ID:** {awardId}
**Contractor:** {recipientName}

**Your Task:**
Search the internet to identify:
1. **Primary Technology Stack:** What are the main software platforms, tools, or technologies being used/deployed?
2. **COTS Products:** Any commercial products (e.g., ServiceNow, Salesforce, Oracle, Microsoft, etc.)
3. **SaaS Solutions:** Cloud-based services or platforms
4. **Development Tools:** Programming languages, frameworks, DevOps tools mentioned
5. **Infrastructure:** Cloud providers (AWS, Azure, GCP), databases, etc.

**Search Sources:**
- Contract solicitations and amendments
- Company press releases about the contract
- Technical documentation or white papers
- GitHub repositories (if open source components)
- Technology partner announcements
- Industry news and case studies

**Return Format:**

**Technology Stack & Tools:**

**COTS Products:**
- [Product Name]: [How it's used in the contract]

**SaaS Solutions:**
- [Service Name]: [Purpose/use case]

**Development & DevOps:**
- [Tools/platforms used]

**Cloud Infrastructure:**
- [Provider and services]

**Additional Technologies:**
- [Any other relevant tech]

If no specific tools are found, state: "No specific tools/products publicly disclosed for this contract." Then provide an analysis of what types of tools would typically be used based on the contract description and industry standards.

Include citations using markdown links for all findings.`
    },

    /**
     * Gemini GAO Reports Research
     * Uses Google Search to find relevant GAO reports related to the contract/program
     * 
     * Variables: {contractInfo}, {awardId}, {recipientName}
     */
    geminiGAOResearch: {
        promptTemplate: `You are a federal oversight and audit research specialist. Use Google Search to find relevant GAO (Government Accountability Office) reports related to this government contract or program.

**Contract Context:**
{contractInfo}

**Award ID:** {awardId}
**Contractor:** {recipientName}

**Your Task:**
Search for GAO reports that are relevant to:
1. This specific contract or program
2. The agency's broader program that this contract supports
3. Related technology initiatives or modernization efforts
4. Oversight of similar contracts in this domain

**Search Strategy:**
- Search GAO.gov for reports mentioning the program name or agency initiative
- Look for audits, evaluations, or oversight reports
- Search for the agency name + program name + "GAO report"
- Check for reports on IT modernization, contract oversight, or similar initiatives

**Return Format:**

**Relevant GAO Reports Found:** [Yes/No]

If reports found, list each report as:

**Report Title:** [Full title with link]
**Report Number:** [GAO-XX-XXX]
**Date:** [Publication date]
**Key Findings:**
- [Major finding 1]
- [Major finding 2]
- [Major finding 3]

**Mitigations/Actions Taken:**
- [Mitigation 1]
- [Mitigation 2]

**Recommendations:**
- [Recommendation 1]
- [Recommendation 2]

**Report Link:** [Direct link to GAO report]

---

If NO relevant GAO reports are found, state: "No GAO reports directly related to this specific contract were found through public search." Then mention if there are any general GAO reports about the agency's program or technology domain that might provide useful context.

Include direct links to all GAO reports mentioned.`
    }
};

