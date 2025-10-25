/**
 * USAspending API Client for Node.js
 * 
 * This client provides methods to fetch contract information from the USAspending.gov API.
 * Documentation: https://api.usaspending.gov/
 */

const axios = require('axios');

class USASpendingClient {
    constructor(options = {}) {
        this.baseURL = 'https://api.usaspending.gov/api/v2';
        this.timeout = options.timeout || 30000;
        this.retryAttempts = options.retryAttempts || 3;
        
        // Contract award type codes
        this.contractTypes = ['A', 'B', 'C', 'D']; // A=BPA Call, B=Purchase Order, C=Delivery Order, D=Definitive Contract
        
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'USASpendingClient-NodeJS/1.0'
            }
        });
    }

    /**
     * Make an API request with retry logic
     */
    async _makeRequest(endpoint, method = 'POST', data = null) {
        let lastError = null;
        
        for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
            try {
                let response;
                
                if (method.toUpperCase() === 'POST') {
                    response = await this.client.post(endpoint, data);
                } else {
                    response = await this.client.get(endpoint, { params: data });
                }
                
                // Validate response
                if (!response || !response.data) {
                    throw new Error('Invalid response from API');
                }
                
                return response.data;
                
            } catch (error) {
                lastError = error;
                
                // Log the error
                const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
                console.error(`API request failed (attempt ${attempt + 1}/${this.retryAttempts}):`, errorMessage);
                
                // Don't retry on client errors (4xx)
                if (error.response && error.response.status >= 400 && error.response.status < 500) {
                    console.error('Client error - not retrying');
                    throw new Error(`API client error (${error.response.status}): ${errorMessage}`);
                }
                
                // If this was the last attempt, throw the error
                if (attempt === this.retryAttempts - 1) {
                    throw new Error(`API request failed after ${this.retryAttempts} attempts: ${errorMessage}`);
                }
                
                // Exponential backoff before retrying
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`Retrying in ${delay}ms...`);
                await this._sleep(delay);
            }
        }
        
        // Should never reach here, but just in case
        throw lastError || new Error('API request failed');
    }

    /**
     * Sleep helper for retry logic
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Search for contract awards with various filters
     */
    async searchContracts(options = {}) {
        const {
            startDate,
            endDate,
            keywords = null,
            awardAmounts = null,
            recipientSearchText = null,
            agencies = null,
            naicsCodes = null,
            pscCodes = null,
            limit = 100,
            page = 1,
            sort = 'Award Amount',
            order = 'desc'
        } = options;

        const filters = {
            award_type_codes: this.contractTypes,
            time_period: [
                {
                    start_date: startDate,
                    end_date: endDate
                }
            ]
        };

        if (keywords) {
            filters.keywords = [keywords];
        }

        if (awardAmounts) {
            filters.award_amounts = [awardAmounts];
        }

        if (recipientSearchText) {
            filters.recipient_search_text = [recipientSearchText];
        }

        if (agencies && agencies.length > 0) {
            filters.agencies = agencies.map(agency => ({ name: agency }));
        }

        if (naicsCodes && naicsCodes.length > 0) {
            filters.naics_codes = naicsCodes;
        }

        if (pscCodes && pscCodes.length > 0) {
            filters.psc_codes = pscCodes;
        }

        const payload = {
            filters,
            fields: [
                'Award ID',
                'Recipient Name',
                'Start Date',
                'End Date',
                'Award Amount',
                'Total Obligation',
                'Potential Award Amount',
                'Total Outlays',
                'Description',
                'Award Type',
                'Awarding Agency',
                'Awarding Sub Agency',
                'Contract Award Type',
                'prime_award_recipient_id',
                'generated_unique_award_id',
                'Period of Performance Start Date',
                'Period of Performance Current End Date',
                'Period of Performance Potential End Date',
                'funding_agency_name',
                'awarding_sub_agency_name',
                'Treasury Account Symbol',
                'Program Activity',
                'Object Class',
                'Number of Offers Received',
                'Extent Competed',
                'Type of Contract Pricing',
                'Solicitation Procedures',
                'Fair Opportunity Limited Sources',
                'Contracting Officer Name',
                'awarding_office_name',
                'funding_office_name',
                'Type of Set Aside'
            ],
            limit: Math.min(limit, 100),
            page,
            sort,
            order
        };

        return await this._makeRequest('search/spending_by_award/', 'POST', payload);
    }

    /**
     * Get detailed information about a specific contract award
     */
    async getContractDetails(awardId) {
        const endpoint = `awards/${awardId}/`;
        return await this._makeRequest(endpoint, 'GET');
    }

    /**
     * Get detailed award information (includes ALL fields)
     */
    async getAwardDetails(awardId) {
        const endpoint = `awards/${encodeURIComponent(awardId)}/`;
        return await this._makeRequest(endpoint, 'GET');
    }

    /**
     * Get transaction history for a specific award
     */
    async getAwardTransactions(generatedAwardId) {
        const payload = {
            award_id: generatedAwardId,
            limit: 100,
            page: 1
        };
        return await this._makeRequest('transactions/', 'POST', payload);
    }

    /**
     * Get sub-awards for a specific prime award
     */
    async getSubAwards(primeAwardId) {
        const payload = {
            award_id: primeAwardId,
            limit: 100,
            page: 1
        };
        return await this._makeRequest('subawards/', 'POST', payload);
    }

    /**
     * Get all contracts for a specific recipient
     */
    async getContractsByRecipient(recipientName, startDate, endDate, limit = 100) {
        return await this.searchContracts({
            startDate,
            endDate,
            recipientSearchText: recipientName,
            limit,
            sort: 'Award Amount',
            order: 'desc'
        });
    }

    /**
     * Get all contracts awarded by a specific agency
     */
    async getContractsByAgency(agencyName, startDate, endDate, limit = 100) {
        return await this.searchContracts({
            startDate,
            endDate,
            agencies: [agencyName],
            limit,
            sort: 'Award Amount',
            order: 'desc'
        });
    }

    /**
     * Get contracts for a specific NAICS industry code
     */
    async getContractsByNAICS(naicsCode, startDate, endDate, limit = 100) {
        return await this.searchContracts({
            startDate,
            endDate,
            naicsCodes: [naicsCode],
            limit,
            sort: 'Award Amount',
            order: 'desc'
        });
    }

    /**
     * Get contracts above a certain dollar amount
     */
    async getLargeContracts(startDate, endDate, minAmount, limit = 100) {
        return await this.searchContracts({
            startDate,
            endDate,
            awardAmounts: { lower_bound: minAmount },
            limit,
            sort: 'Award Amount',
            order: 'desc'
        });
    }

    /**
     * Get all contracts matching criteria with automatic pagination
     */
    async getAllContractsPaginated(startDate, endDate, maxResults = null, options = {}) {
        let allResults = [];
        let page = 1;
        const perPage = 100;

        while (true) {
            const response = await this.searchContracts({
                startDate,
                endDate,
                limit: perPage,
                page,
                ...options
            });

            const results = response.results || [];
            if (results.length === 0) {
                break;
            }

            allResults = allResults.concat(results);

            if (maxResults && allResults.length >= maxResults) {
                allResults = allResults.slice(0, maxResults);
                break;
            }

            if (results.length < perPage) {
                break;
            }

            page++;
            await this._sleep(500); // Rate limiting
        }

        return allResults;
    }

    /**
     * Get contract spending by geographic location
     */
    async getSpendingByGeography(startDate, endDate, scope = 'place_of_performance', geoLayer = 'state') {
        const payload = {
            scope,
            geo_layer: geoLayer,
            filters: {
                award_type_codes: this.contractTypes,
                time_period: [
                    {
                        start_date: startDate,
                        end_date: endDate
                    }
                ]
            }
        };

        return await this._makeRequest('search/spending_by_geography/', 'POST', payload);
    }
}

module.exports = USASpendingClient;

