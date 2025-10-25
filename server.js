/**
 * AcquiSight - Government Contract Intelligence
 * Simple Express server for contract search
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const USASpendingClient = require('./usaspending-client');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Helper function to get default dates (last 2 years)
function getDefaultDates() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2); // 2 years ago

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
    try {
        const { keywords } = req.body;

        if (!keywords) {
            return res.status(400).json({ error: 'Keywords are required' });
        }

        console.log('🔍 Searching for:', keywords);

        const client = new USASpendingClient();
        const dates = getDefaultDates();
        
        console.log('📅 Date range:', dates.start, 'to', dates.end);
        
        const results = await client.searchContracts({
            startDate: dates.start,
            endDate: dates.end,
            keywords: keywords,
            limit: 50
        });

        console.log('✅ Search successful, found', results.results?.length || 0, 'results');
        res.json(results);
    } catch (error) {
        console.error('❌ Search error:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Failed to search contracts',
            message: error.message 
        });
    }
});

/**
 * Get detailed award information using proper two-step flow
 * Step 1: Search by Award ID to get generated_internal_id
 * Step 2: Call /awards/{generated_internal_id}/ for full details
 */
app.get('/api/award/details/:awardId', async (req, res) => {
    try {
        const { awardId } = req.params;
        
        if (!awardId) {
            return res.status(400).json({ error: 'Award ID is required' });
        }
        
        console.log('🔍 Step 1: Resolving award ID to get generated_internal_id...');
        
        const client = new USASpendingClient();
        
        // Step 1: Search to get the generated_internal_id
        const searchResults = await client.searchContracts({
            startDate: '2020-01-01',
            endDate: new Date().toISOString().split('T')[0],
            keywords: awardId,
            limit: 1
        });

        if (!searchResults.results || searchResults.results.length === 0) {
            return res.status(404).json({ 
                error: 'Award not found',
                message: 'No award found with this ID'
            });
        }

        const generatedInternalId = searchResults.results[0]['generated_unique_award_id'];
        
        if (!generatedInternalId) {
            return res.status(404).json({ 
                error: 'Generated internal ID not found',
                message: 'Unable to resolve award ID to internal ID'
            });
        }

        console.log('✅ Found generated_internal_id:', generatedInternalId);
        console.log('🔍 Step 2: Fetching full award details...');

        // Step 2: Get full details using generated_internal_id
        const details = await client.getAwardDetails(generatedInternalId);

        console.log('✅ Award details retrieved successfully');
            
            res.json({ 
            ...details,
            _api_endpoint: `https://api.usaspending.gov/api/v2/awards/${generatedInternalId}/`,
            _search_endpoint: 'https://api.usaspending.gov/api/v2/search/spending_by_award/',
            _generated_internal_id: generatedInternalId,
            _award_id: awardId
            });
            
        } catch (error) {
        console.error('❌ Award details error:', error.message);
        res.status(500).json({ 
            error: 'Failed to get award details',
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
