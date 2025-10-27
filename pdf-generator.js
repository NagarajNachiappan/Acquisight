/**
 * PDF Generator
 * Generates PDF from any URL using Puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * Generate PDF from URL with optional cover page
 */
async function generatePDFFromURL(url, options = {}) {
    console.log(`\n📄 Generating PDF from: ${url}\n`);
    
    // Validate URL
    if (!url) {
        throw new Error('URL is required for PDF generation');
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('Invalid URL format - must start with http:// or https://');
    }
    
    let browser = null;
    let page = null;
    
    try {
        // Launch Puppeteer browser
        console.log('🌐 Launching browser...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--log-level=3'
            ],
            timeout: 30000
        });
        
        page = await browser.newPage();
        
        // Set page timeout - use custom timeout if provided, otherwise default
        const navigationTimeout = options.timeout || 90000; // Default 90 seconds
        page.setDefaultNavigationTimeout(navigationTimeout);
        page.setDefaultTimeout(options.timeout || 30000);
        
        // Set viewport for better PDF rendering
        await page.setViewport({
            width: 1200,
            height: 1600
        });
        
        console.log('📍 Navigating to URL...');
        await page.goto(url, {
            waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
            timeout: navigationTimeout
        });
        
        console.log('✅ Page loaded, waiting for content to render...');
        
        // Wait for the page to be fully rendered - longer for FPDS
        const renderWait = url.includes('fpds.gov') ? 10000 : 5000;
        await new Promise(resolve => setTimeout(resolve, renderWait));
        
        // Generate filename if not provided
        const outputPath = options.outputPath || path.join(__dirname, 'public', `report-${Date.now()}.pdf`);
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        console.log('📍 Generating PDF...');
        
        // Generate PDF
        await page.pdf({
            path: outputPath,
            format: 'Letter',
            printBackground: true,
            preferCSSPageSize: false,
            margin: {
                top: '0.5in',
                right: '0.5in',
                bottom: '0.5in',
                left: '0.5in'
            },
            timeout: 30000
        });
        
        // Verify PDF was created
        if (!fs.existsSync(outputPath)) {
            throw new Error('PDF file was not created');
        }
        
        const fileSize = fs.statSync(outputPath).size;
        console.log(`✅ PDF generated: ${outputPath} (${fileSize} bytes)\n`);
        
        return outputPath;
        
    } catch (error) {
        console.error('❌ PDF generation error:', error.message);
        console.error('Stack trace:', error.stack);
        
        throw new Error(`PDF generation failed: ${error.message}`);
        
    } finally {
        // Always clean up browser resources
        if (page) {
            try {
                await page.close();
            } catch (e) {
                console.error('⚠️ Error closing page:', e.message);
            }
        }
        
        if (browser) {
            try {
                await browser.close();
                console.log('🔒 Browser closed successfully');
            } catch (closeError) {
                console.error('⚠️ Error closing browser:', closeError.message);
            }
        }
    }
}

module.exports = { generatePDFFromURL };

