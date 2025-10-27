/**
 * AcquiSight - Government Contract Intelligence
 * Simple Express server for contract search
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const USASpendingClient = require('./usaspending-client');
const config = require('./config');
const prompts = require('./prompts');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const geminiModel = genAI.getGenerativeModel({ model: config.gemini.model });

// Initialize OpenAI for summarization
const openai = new OpenAI({
    apiKey: config.openai.apiKey
});

// Middleware with increased payload limit for AI analyses
app.use(bodyParser.json({ limit: '10mb' }));  // Increased from default 100kb to 10mb for large AI responses
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Helper function to get default dates (last 10 years for keyword searches)
function getDefaultDates() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 10); // 10 years for keyword/company searches

    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
}

/**
 * Home page
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Search for contracts
 */
app.post('/api/search', async (req, res) => {
    const startTime = Date.now(); // Start timer
    
    try {
        const { keywords } = req.body;

        if (!keywords) {
            return res.status(400).json({ error: 'Keywords are required' });
        }

        console.log('🔍 Searching for:', keywords);

        const client = new USASpendingClient({ timeout: 60000 }); // 60 second timeout
        
        // Check if this looks like an Award ID
        const looksLikeAwardID = /^[A-Z0-9]{10,}$/i.test(keywords.trim());
        
        let searchParams = {
            keywords: keywords,
            limit: 100
        };
        
        if (looksLikeAwardID) {
            console.log('🎯 Detected Award ID - searching without date restrictions');
        } else {
            const dates = getDefaultDates();
            searchParams.startDate = dates.start;
            searchParams.endDate = dates.end;
            console.log('📅 Date range:', dates.start, 'to', dates.end);
        }
        
        const results = await client.searchContracts(searchParams);

        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2); // Convert to seconds
        console.log(`✅ Search successful, found ${results.results?.length || 0} results in ${timeTaken}s`);
        res.json(results);
    } catch (error) {
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Search error after ${timeTaken}s:`, error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Failed to search contracts',
            message: error.message 
        });
    }
});

/**
 * Get detailed award information
 * Directly calls /awards/{award_id}/ endpoint
 * The award_id should be generated_unique_award_id from search results
 */
app.get('/api/award/details/:awardId', async (req, res) => {
    try {
        const { awardId } = req.params;
        
        if (!awardId) {
            return res.status(400).json({ error: 'Award ID is required' });
        }
        
        console.log('🔍 Fetching award details for:', awardId);
        
        const client = new USASpendingClient();
        
        // Call the awards endpoint directly with the generated_unique_award_id
        const details = await client.getAwardDetails(awardId);

        console.log('✅ Award details retrieved successfully');
            
            res.json({ 
            ...details,
            _api_endpoint: `https://api.usaspending.gov/api/v2/awards/${encodeURIComponent(awardId)}/`,
            _award_id: awardId
        });
        
    } catch (error) {
        console.error('❌ Award details error:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Failed to get award details',
            message: error.message 
        });
    }
});

/**
 * Perplexity AI Analysis - Contractor Organization Overview
 */
app.post('/api/analyze/perplexity', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { companyName } = req.body;
        
        if (!companyName) {
            return res.status(400).json({ error: 'Company name is required' });
        }
        
        console.log('🤖 Perplexity AI Analysis for:', companyName);
        
        // Get prompt from prompts.js and replace {companyName} variable
        const userPrompt = prompts.perplexity.userPromptTemplate.replace('{companyName}', companyName);

        // Call Perplexity API with Deep Research (with extended timeout)
        const response = await axios.post('https://api.perplexity.ai/chat/completions', {
            model: config.perplexity.model,
            messages: [
                {
                    role: 'system',
                    content: prompts.perplexity.systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            max_tokens: config.perplexity.maxTokens,
            temperature: config.perplexity.temperature,
            search_depth: 'deep',  // Enable deep research for comprehensive results
            return_citations: true,  // Get citations for all sources
            return_images: false  // We don't need images for contractor analysis
        }, {
            headers: {
                'Authorization': `Bearer ${config.perplexity.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 90000  // 90 second timeout for deep research
        });
        
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Perplexity analysis completed in ${timeTaken}s`);
        
        // Mask API key for logging
        const maskedRequest = {
            model: config.perplexity.model,
            messages: [{
                role: 'system',
                content: 'You are a helpful research assistant...'
            }, {
                role: 'user', 
                content: `[Company: ${companyName}]`
            }],
            max_tokens: config.perplexity.maxTokens,
            temperature: config.perplexity.temperature
        };
        
        res.json({
            analysis: response.data.choices[0].message.content,
            citations: response.data.citations || [],
            model: config.perplexity.model,
            timeTaken,
            apiRequest: maskedRequest,
            apiResponse: {
                usage: response.data.usage,
                model: response.data.model
            }
        });
        
    } catch (error) {
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Perplexity analysis error after ${timeTaken}s:`, error.message);
        if (error.response) {
            console.error('API Response Status:', error.response.status);
            console.error('API Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        res.status(500).json({
            error: 'Failed to analyze with Perplexity AI',
            message: error.response?.data?.error?.message || error.message,
            details: error.response?.data
        });
    }
});

/**
 * Google Gemini Analysis - Contractor Organization Overview
 */
app.post('/api/analyze/gemini', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { companyName } = req.body;
        
        if (!companyName) {
            return res.status(400).json({ error: 'Company name is required' });
        }
        
        console.log('✨ Gemini AI Analysis for:', companyName);
        
        // Get prompt from prompts.js and replace {companyName} variable
        const prompt = prompts.gemini.promptTemplate.replace('{companyName}', companyName);

        // Call Gemini API with Google Search grounding enabled (with timeout)
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Gemini API timeout after 120 seconds')), 120000)
        );
        
        const geminiPromise = geminiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: config.gemini.maxTokens,
                temperature: config.gemini.temperature,
            },
            tools: [{
                googleSearch: {}  // Enable Google Search for real-time web data and citations
            }]
        });
        
        const result = await Promise.race([geminiPromise, timeoutPromise]);
        
        const response = await result.response;
        const analysisText = response.text();
        
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Gemini analysis completed in ${timeTaken}s`);
        
        // Extract grounding metadata (web search results)
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata) {
            console.log('🔍 Gemini used Google Search grounding with', 
                groundingMetadata.webSearchQueries?.length || 0, 'web queries');
        }
        
        // Mask API key for logging
        const maskedRequest = {
            model: config.gemini.model,
            prompt: `[Company: ${companyName}]`,
            maxOutputTokens: config.gemini.maxTokens,
            temperature: config.gemini.temperature,
            googleSearchEnabled: true
        };
        
        res.json({
            analysis: analysisText,
            model: config.gemini.model,
            timeTaken,
            groundingMetadata: groundingMetadata ? {
                webSearchQueries: groundingMetadata.webSearchQueries?.length || 0,
                searchEntryPoint: groundingMetadata.searchEntryPoint
            } : null,
            apiRequest: maskedRequest,
            apiResponse: {
                candidates: response.candidates?.length || 0,
                usageMetadata: response.usageMetadata
            }
        });
        
    } catch (error) {
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Gemini analysis error after ${timeTaken}s:`, error.message);
        console.error('Gemini error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to analyze with Gemini AI',
            message: error.message,
            timeout: error.message.includes('timeout'),
            timeTaken: timeTaken
        });
    }
});

/**
 * Gemini Contract Research - Find Official Contract Name
 */
app.post('/api/research/contract', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { awardId, recipientName, description } = req.body;
        
        if (!awardId || !description) {
            return res.status(400).json({ error: 'Award ID and description are required' });
        }
        
        console.log('🔍 Researching contract name for Award ID:', awardId);
        
        // Get prompt and replace variables
        let prompt = prompts.geminiContractResearch.promptTemplate
            .replace('{awardId}', awardId)
            .replace('{recipientName}', recipientName || 'N/A')
            .replace('{description}', description);
        
        // Call Gemini API with Google Search
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Contract research timeout after 60 seconds')), 60000)
        );
        
        const geminiPromise = geminiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 2000,  // Contract name research doesn't need as many tokens
                temperature: 0.2,  // Low for factual accuracy
            },
            tools: [{
                googleSearch: {}  // Enable Google Search
            }]
        });
        
        const result = await Promise.race([geminiPromise, timeoutPromise]);
        const response = await result.response;
        const contractInfo = response.text();
        
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Contract research completed in ${timeTaken}s`);
        
        // Extract grounding metadata
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata) {
            console.log('🔍 Contract research used', 
                groundingMetadata.webSearchQueries?.length || 0, 'web queries');
        }
        
        res.json({
            contractInfo: contractInfo,
            timeTaken,
            model: config.gemini.model,
            groundingMetadata: groundingMetadata ? {
                webSearchQueries: groundingMetadata.webSearchQueries?.length || 0
            } : null
        });
        
    } catch (error) {
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Contract research error after ${timeTaken}s:`, error.message);
        res.status(500).json({
            error: 'Failed to research contract',
            message: error.message
        });
    }
});

/**
 * Gemini Tools & Technology Research - Find tools/COTS/SaaS used in contract
 */
app.post('/api/research/tools', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { contractInfo, awardId, recipientName } = req.body;
        
        if (!contractInfo || !awardId) {
            return res.status(400).json({ error: 'Contract info and award ID are required' });
        }
        
        console.log('🔧 Researching tools/tech for Award ID:', awardId);
        
        // Get prompt and replace variables
        let prompt = prompts.geminiToolsResearch.promptTemplate
            .replace('{contractInfo}', contractInfo)
            .replace('{awardId}', awardId)
            .replace('{recipientName}', recipientName || 'N/A');
        
        // Call Gemini API with Google Search
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Tools research timeout after 60 seconds')), 60000)
        );
        
        const geminiPromise = geminiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 3000,
                temperature: 0.2,
            },
            tools: [{
                googleSearch: {}
            }]
        });
        
        const result = await Promise.race([geminiPromise, timeoutPromise]);
        const response = await result.response;
        const toolsInfo = response.text();
        
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Tools research completed in ${timeTaken}s`);
        
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata) {
            console.log('🔍 Tools research used', 
                groundingMetadata.webSearchQueries?.length || 0, 'web queries');
        }
        
        res.json({
            toolsInfo: toolsInfo,
            timeTaken,
            model: config.gemini.model,
            groundingMetadata: groundingMetadata ? {
                webSearchQueries: groundingMetadata.webSearchQueries?.length || 0
            } : null
        });
        
    } catch (error) {
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Tools research error after ${timeTaken}s:`, error.message);
        res.status(500).json({
            error: 'Failed to research tools',
            message: error.message
        });
    }
});

/**
 * Gemini GAO Reports Research - Find relevant GAO oversight reports
 */
app.post('/api/research/gao', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { contractInfo, awardId, recipientName } = req.body;
        
        if (!contractInfo || !awardId) {
            return res.status(400).json({ error: 'Contract info and award ID are required' });
        }
        
        console.log('📊 Researching GAO reports for Award ID:', awardId);
        
        // Get prompt and replace variables
        let prompt = prompts.geminiGAOResearch.promptTemplate
            .replace('{contractInfo}', contractInfo)
            .replace('{awardId}', awardId)
            .replace('{recipientName}', recipientName || 'N/A');
        
        // Call Gemini API with Google Search
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('GAO research timeout after 60 seconds')), 60000)
        );
        
        const geminiPromise = geminiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 3000,
                temperature: 0.2,
            },
            tools: [{
                googleSearch: {}
            }]
        });
        
        const result = await Promise.race([geminiPromise, timeoutPromise]);
        const response = await result.response;
        const gaoInfo = response.text();
        
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ GAO research completed in ${timeTaken}s`);
        
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata) {
            console.log('🔍 GAO research used', 
                groundingMetadata.webSearchQueries?.length || 0, 'web queries');
        }
        
        res.json({
            gaoInfo: gaoInfo,
            timeTaken,
            model: config.gemini.model,
            groundingMetadata: groundingMetadata ? {
                webSearchQueries: groundingMetadata.webSearchQueries?.length || 0
            } : null
        });
        
    } catch (error) {
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ GAO research error after ${timeTaken}s:`, error.message);
        res.status(500).json({
            error: 'Failed to research GAO reports',
            message: error.message
        });
    }
});

/**
 * Summarize Gemini Analysis with ChatGPT
 */
app.post('/api/summarize/gemini', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { detailedAnalysis } = req.body;
        
        if (!detailedAnalysis) {
            return res.status(400).json({ error: 'Detailed analysis is required' });
        }
        
        console.log('📝 Summarizing Gemini analysis with ChatGPT...');
        
        // Get prompt and replace variable
        const prompt = prompts.chatgptSummarizer.promptTemplate.replace('{detailedAnalysis}', detailedAnalysis);
        
        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: config.openai.model,
            messages: [
                {
                    role: 'system',
                    content: prompts.chatgptSummarizer.systemPrompt
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 2000,  // Summary should be shorter
            temperature: 0.3   // Lower for consistent summaries
        });
        
        const summary = response.choices[0].message.content;
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(`✅ Summary generated in ${timeTaken}s`);
        
        res.json({
            summary: summary,
            timeTaken,
            model: config.openai.model
        });
        
    } catch (error) {
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Summarization error after ${timeTaken}s:`, error.message);
        res.status(500).json({
            error: 'Failed to summarize analysis',
            message: error.message
        });
    }
});

/**
 * Generate Word Document from AI Analysis
 */
app.post('/api/generate-word-doc', async (req, res) => {
    try {
        const { content, title, companyName, model, groundingMetadata } = req.body;
        
        if (!content || !title) {
            return res.status(400).json({ error: 'Content and title are required' });
        }
        
        console.log('📄 Generating Word document for:', companyName);
        
        const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType, Table, TableCell, TableRow, WidthType, BorderStyle } = require('docx');
        const { Packer } = require('docx');
        
        // Parse markdown to create document structure
        const lines = content.split(/\r?\n/);
        const children = [];
        
        // Add title
        children.push(
            new Paragraph({
                text: title,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        );
        
        // Add metadata
        children.push(
            new Paragraph({
                text: `Generated: ${new Date().toLocaleString()}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            })
        );
        
        children.push(
            new Paragraph({
                text: `Model: ${model}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        );
        
        // Add Google Search metadata if available
        if (groundingMetadata && groundingMetadata.webSearchQueries > 0) {
            children.push(
                new Paragraph({
                    text: `🔍 Google Search Grounding: ${groundingMetadata.webSearchQueries} web searches performed`,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                })
            );
        }
        
        // Parse content - simple conversion of markdown to Word
        let inTable = false;
        let tableRows = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip empty lines
            if (!trimmed) {
                if (!inTable) {
                    children.push(new Paragraph({ text: '' }));
                }
                continue;
            }
            
            // Headers
            if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.includes('|')) {
                const text = trimmed.replace(/\*\*/g, '');
                children.push(
                    new Paragraph({
                        text: text,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 300, after: 200 }
                    })
                );
            }
            // Table rows
            else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                
                // Skip separator rows
                if (!trimmed.match(/^\|[\s:-]+\|$/)) {
                    const cells = trimmed.split('|').filter(c => c.trim()).map(c => c.trim());
                    tableRows.push(cells);
                }
            }
            // End of table
            else if (inTable) {
                // Create table
                if (tableRows.length > 0) {
                    const tableDoc = new Table({
                        rows: tableRows.map((row, idx) => 
                            new TableRow({
                                children: row.map(cell => 
                                    new TableCell({
                                        children: [new Paragraph({ text: cell.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') })],
                                        shading: idx === 0 ? { fill: '667eea' } : undefined
                                    })
                                )
                            })
                        ),
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    });
                    children.push(tableDoc);
                    children.push(new Paragraph({ text: '' }));
                }
                inTable = false;
                tableRows = [];
                
                // Process current line
                children.push(new Paragraph({ text: trimmed }));
            }
            // Regular text
            else {
                const text = trimmed.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
                children.push(new Paragraph({ text: text, spacing: { after: 100 } }));
            }
        }
        
        // Handle table at end of document
        if (inTable && tableRows.length > 0) {
            const tableDoc = new Table({
                rows: tableRows.map((row, idx) => 
                    new TableRow({
                        children: row.map(cell => 
                            new TableCell({
                                children: [new Paragraph({ text: cell.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') })],
                                shading: idx === 0 ? { fill: '667eea' } : undefined
                            })
                        )
                    })
                ),
                width: { size: 100, type: WidthType.PERCENTAGE }
            });
            children.push(tableDoc);
        }
        
        // Create document
        const doc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });
        
        // Generate buffer
        const buffer = await Packer.toBuffer(doc);
        
        console.log('✅ Word document generated successfully');
        
        // Send as download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${companyName.replace(/[^a-z0-9]/gi, '-')}-analysis-${Date.now()}.docx"`);
        res.send(buffer);
        
    } catch (error) {
        console.error('Word document generation error:', error.message);
        res.status(500).json({
            error: 'Failed to generate Word document',
            message: error.message
        });
    }
});

/**
 * Generate PDF from USAspending.gov URL with cover page
 */
app.post('/api/generate-usaspending-pdf', async (req, res) => {
    try {
        const { url, awardId } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        const { generatePDFFromURL } = require('./pdf-generator');
        const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
        const fs = require('fs');
        
        console.log('📄 Generating USAspending.gov PDF with cover page...');
        
        // Generate PDF from URL
        const contentPdfPath = await generatePDFFromURL(url);
        
        // Create cover page
        const coverPdf = await PDFDocument.create();
        const coverPage = coverPdf.addPage([612, 792]); // Letter size
        const font = await coverPdf.embedFont(StandardFonts.HelveticaBold);
        const { width, height } = coverPage.getSize();
        
        // Draw purple gradient background (approximate with rectangle)
        coverPage.drawRectangle({
            x: 0,
            y: 0,
            width: width,
            height: height,
            color: rgb(0.4, 0.49, 0.92),
        });
        
        // Add title
        coverPage.drawText('Contract Report', {
            x: width / 2 - 150,
            y: height / 2 + 100,
            size: 48,
            font: font,
            color: rgb(1, 1, 1),
        });
        
        // Add subtitle
        coverPage.drawText('USAspending.gov', {
            x: width / 2 - 100,
            y: height / 2 + 50,
            size: 24,
            font: font,
            color: rgb(1, 1, 1),
        });
        
        // Add Award ID
        if (awardId) {
            const awardIdText = awardId.toString();
            const textWidth = font.widthOfTextAtSize(awardIdText, 28);
            coverPage.drawText(awardIdText, {
                x: width / 2 - textWidth / 2,
                y: height / 2 - 20,
                size: 28,
                font: font,
                color: rgb(1, 1, 1),
            });
        }
        
        // Add date
        const currentDate = new Date().toLocaleDateString();
        coverPage.drawText(`Generated: ${currentDate}`, {
            x: width / 2 - 80,
            y: height / 2 - 80,
            size: 14,
            font: font,
            color: rgb(1, 1, 1),
        });
        
        // Load content PDF
        const contentPdfBytes = fs.readFileSync(contentPdfPath);
        const contentPdf = await PDFDocument.load(contentPdfBytes);
        
        // Merge cover page with content
        const mergedPdf = await PDFDocument.create();
        
        // Copy cover page
        const [copiedCoverPage] = await mergedPdf.copyPages(coverPdf, [0]);
        mergedPdf.addPage(copiedCoverPage);
        
        // Copy all content pages
        const contentPages = await mergedPdf.copyPages(contentPdf, contentPdf.getPageIndices());
        contentPages.forEach(page => mergedPdf.addPage(page));
        
        // Save merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        
        // Clean up temporary file
        fs.unlinkSync(contentPdfPath);
        
        console.log('✅ PDF with cover page generated successfully');
        
        // Send PDF as download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="usaspending-report-${awardId || 'contract'}-${Date.now()}.pdf"`);
        res.send(Buffer.from(mergedPdfBytes));
        
    } catch (error) {
        console.error('PDF generation error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate PDF',
            message: error.message 
        });
    }
});

/**
 * Generate PDF from FPDS.gov URL with cover page
 */
app.post('/api/generate-fpds-pdf', async (req, res) => {
    try {
        const { url, awardId } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        const { generatePDFFromURL } = require('./pdf-generator');
        const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
        const fs = require('fs');
        
        console.log('📄 Generating FPDS.gov PDF with cover page...');
        console.log('🔗 URL:', url);
        
        // Generate PDF from URL with longer timeout for FPDS
        const contentPdfPath = await generatePDFFromURL(url, {
            timeout: 120000  // 2 minutes for FPDS
        });
        
        // Create cover page
        const coverPdf = await PDFDocument.create();
        const coverPage = coverPdf.addPage([612, 792]); // Letter size
        const font = await coverPdf.embedFont(StandardFonts.HelveticaBold);
        const { width, height } = coverPage.getSize();
        
        // Draw orange/brown gradient background for FPDS
        coverPage.drawRectangle({
            x: 0,
            y: 0,
            width: width,
            height: height,
            color: rgb(0.8, 0.4, 0.2),
        });
        
        // Add title
        coverPage.drawText('Contract Report', {
            x: width / 2 - 150,
            y: height / 2 + 100,
            size: 48,
            font: font,
            color: rgb(1, 1, 1),
        });
        
        // Add subtitle
        coverPage.drawText('FPDS.gov', {
            x: width / 2 - 70,
            y: height / 2 + 50,
            size: 24,
            font: font,
            color: rgb(1, 1, 1),
        });
        
        // Add award ID
        if (awardId) {
            coverPage.drawText(`Award ID: ${awardId}`, {
                x: width / 2 - 100,
                y: height / 2,
                size: 16,
                font: font,
                color: rgb(1, 1, 1),
            });
        }
        
        // Add generated date
        const currentDate = new Date().toLocaleDateString();
        coverPage.drawText(`Generated: ${currentDate}`, {
            x: width / 2 - 80,
            y: height / 2 - 80,
            size: 14,
            font: font,
            color: rgb(1, 1, 1),
        });
        
        // Load content PDF
        const contentPdfBytes = fs.readFileSync(contentPdfPath);
        const contentPdf = await PDFDocument.load(contentPdfBytes);
        
        // Merge cover page with content
        const mergedPdf = await PDFDocument.create();
        
        // Copy cover page
        const [copiedCoverPage] = await mergedPdf.copyPages(coverPdf, [0]);
        mergedPdf.addPage(copiedCoverPage);
        
        // Copy all content pages
        const contentPages = await mergedPdf.copyPages(contentPdf, contentPdf.getPageIndices());
        contentPages.forEach(page => mergedPdf.addPage(page));
        
        // Save merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        
        // Clean up temporary file
        fs.unlinkSync(contentPdfPath);
        
        console.log('✅ FPDS PDF with cover page generated successfully');
        
        // Send PDF as download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="fpds-report-${awardId || 'contract'}-${Date.now()}.pdf"`);
        res.send(Buffer.from(mergedPdfBytes));
        
    } catch (error) {
        console.error('FPDS PDF generation error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate FPDS PDF',
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 AcquiSight - Government Contract Intelligence');
    console.log('='.repeat(60));
    console.log(`\n📱 Server running at: http://localhost:${PORT}`);
    console.log('\n⏹️  Press Ctrl+C to stop the server\n');
});

module.exports = app;
