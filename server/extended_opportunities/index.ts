/**
 * Extended Opportunities Module
 * 
 * This module provides:
 * - Scraping of external job opportunities from Indian platforms
 * - Data cleaning and classification
 * - API endpoints for filtered job search
 * - Background job processing
 * 
 * Architecture:
 * - Modular design following existing project patterns
 * - Reuses existing database models and API structure
 * - Integrates with existing authentication and session management
 */

export { ExtendedOpportunitiesService } from './service.js';
export {
  getOpportunities,
  searchOpportunities,
  getOpportunityById,
  refreshOpportunities,
  getOpportunitiesStats,
  cleanupOpportunities
} from './routes.js';

// Module info
export const MODULE_INFO = {
  name: 'Extended Opportunities',
  version: '1.0.0',
  description: 'External job opportunities scraping and management system',
  features: [
    'Scrapes from Internshala, AICTE, Naukri, Freshersworld, NCS',
    'Automatic job classification and tagging',
    'Duplicate detection and removal',
    'Filterable API endpoints',
    'Background processing',
    'Performance optimized with database indexing'
  ],
  endpoints: [
    'GET /api/opportunities - List opportunities with filters',
    'GET /api/opportunities/search?q= - Search opportunities',
    'GET /api/opportunities/:id - Get opportunity details',
    'POST /api/opportunities/refresh - Trigger scraping',
    'GET /api/opportunities/stats - Get statistics',
    'POST /api/opportunities/cleanup - Cleanup old jobs'
  ]
};
