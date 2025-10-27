/**
 * Example Configuration File
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to 'config.js'
 * 2. Replace the dummy API keys below with your actual API keys
 * 3. Never commit config.js to version control (it's in .gitignore)
 * 4. Keep this example file for reference
 */

module.exports = {
    // OpenAI ChatGPT API Configuration (optional - not currently used)
    // Used for: Contract analysis, insights generation, and natural language processing
    // Get your key from: https://platform.openai.com/api-keys
    // Key format: sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    openai: {
        apiKey: 'sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',  // Replace with your OpenAI API key
        model: 'gpt-4o',  // Best model for complex analysis and summarization (Options: 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo')
        maxTokens: 4096,  // Increased for comprehensive summaries and detailed analysis (max: 4096 for gpt-4o)
        temperature: 0.5  // Balanced - factual but allows some creativity in explanations (0.0 = deterministic, 1.0 = creative)
    },

    // Google Gemini API Configuration (currently active)
    // Used for: Contract analysis with deep research capabilities
    // Get your key from: https://aistudio.google.com/app/apikey
    // Key format: AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    gemini: {
        apiKey: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',  // Replace with your Gemini API key
        model: 'gemini-2.5-flash',  // Fast, powerful model (Options: 'gemini-2.5-flash', 'gemini-pro')
        maxTokens: 8000,  // Higher limit for comprehensive summaries
        temperature: 0.2  // Low temperature for factual accuracy (recommended: 0.2-0.4 for research)
    },

    // Perplexity AI API Configuration
    // Used for: Real-time web research and contract intelligence gathering
    // Get your key from: https://www.perplexity.ai/settings/api
    // Key format: pplx-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // Features: Deep Research mode enabled, citation tracking, authoritative sources
    perplexity: {
        apiKey: 'pplx-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',  // Replace with your Perplexity API key
        model: 'sonar-pro',  // Enterprise-grade model for deep web search (Options: 'sonar', 'sonar-pro')
        maxTokens: 4000,  // Comprehensive research summaries with citations
        temperature: 0.2,  // Very low for maximum factual accuracy in web research (recommended: 0.2 for research tasks)
        // Note: search_depth: 'deep' is enabled in server.js for highest quality research
    },

    // Server Configuration
    server: {
        port: process.env.PORT || 5000  // Server port (default: 5000)
    }
};

