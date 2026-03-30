import type { Request, Response } from 'express';
import { ExtendedOpportunitiesService } from './service.js';
import { z } from 'zod';

// Create service instance
const opportunitiesService = new ExtendedOpportunitiesService();

// Query parameters schema for validation
const opportunitiesQuerySchema = z.object({
  location: z.string().optional(),
  field: z.enum(['CS', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Other']).optional(),
  type: z.enum(['internship', 'full-time', 'part-time', 'remote']).optional(),
  mode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  isGovernment: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional()
});

/**
 * GET /api/opportunities
 * Get extended opportunities with filters
 */
export async function getOpportunities(req: Request, res: Response) {
  try {
    const validatedQuery = opportunitiesQuerySchema.parse(req.query);
    
    // Handle pagination: convert page to offset
    const limit = validatedQuery.limit || 20;
    const page = validatedQuery.page || 1;
    const offset = validatedQuery.offset || ((page - 1) * limit);
    
    const opportunities = await opportunitiesService.getOpportunities({
      ...validatedQuery,
      limit,
      offset
    });
    
    // Return only fields needed for frontend display
    const minimalOpportunities = opportunities.map(opp => ({
      id: opp.id,
      title: opp.title,
      company: opp.company,
      location: opp.location,
      field: opp.field,
      type: opp.jobType,
      mode: opp.mode,
      isGovernment: opp.isGovernment,
      isUrgent: opp.isUrgent || false,
      isNew: opp.isNew || false,
      shortDescription: opp.description.length > 150 ? opp.description.substring(0, 150) + '...' : opp.description,
      postedDate: opp.postedDate,
      applyLink: opp.applicationUrl
    }));
    
    // Calculate pagination metadata
    const totalCount = await opportunitiesService.getOpportunitiesCount({
      location: validatedQuery.location,
      field: validatedQuery.field,
      type: validatedQuery.type,
      mode: validatedQuery.mode,
      isGovernment: validatedQuery.isGovernment,
      search: validatedQuery.search
    });
    
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    res.json({
      data: minimalOpportunities,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      }
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ message: 'Failed to fetch opportunities' });
  }
}

/**
 * GET /api/opportunities/search
 * Search opportunities by query
 */
export async function searchOpportunities(req: Request, res: Response) {
  try {
    const { q, page = '1', limit = '20' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Handle pagination for search
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const offset = (pageNum - 1) * limitNum;
    
    const opportunities = await opportunitiesService.getOpportunities({
      search: q,
      limit: limitNum,
      offset
    });
    
    const minimalOpportunities = opportunities.map(opp => ({
      id: opp.id,
      title: opp.title,
      company: opp.company,
      location: opp.location,
      field: opp.field,
      type: opp.jobType,
      mode: opp.mode,
      isGovernment: opp.isGovernment,
      isUrgent: opp.isUrgent || false,
      isNew: opp.isNew || false,
      shortDescription: opp.description.length > 150 ? opp.description.substring(0, 150) + '...' : opp.description,
      postedDate: opp.postedDate,
      applyLink: opp.applicationUrl
    }));
    
    res.json(minimalOpportunities);
  } catch (error) {
    console.error('Error searching opportunities:', error);
    res.status(500).json({ message: 'Failed to search opportunities' });
  }
}

/**
 * GET /api/opportunities/:id
 * Get opportunity by ID
 */
export async function getOpportunityById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid opportunity ID' });
    }
    
    const opportunity = await opportunitiesService.getOpportunityById(id);
    
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }
    
    // Return full opportunity details
    res.json(opportunity);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    res.status(500).json({ message: 'Failed to fetch opportunity' });
  }
}

/**
 * POST /api/opportunities/refresh
 * Trigger background scraping for new opportunities
 */
export async function refreshOpportunities(req: Request, res: Response) {
  try {
    console.log('Opportunities refresh triggered...');
    
    // Respond immediately and run scraping in background
    setImmediate(async () => {
      try {
        const result = await opportunitiesService.scrapeAndSaveJobs();
        console.log('Background scraping completed:', result);
      } catch (error) {
        console.error('Background scraping error:', error);
      }
    });
    
    res.json({
      message: 'Opportunities refresh started. New jobs will be available shortly.',
      status: 'processing'
    });
  } catch (error) {
    console.error('Error triggering refresh:', error);
    res.status(500).json({ message: 'Failed to start refresh process' });
  }
}

/**
 * GET /api/opportunities/stats
 * Get opportunities statistics
 */
export async function getOpportunitiesStats(req: Request, res: Response) {
  try {
    const stats = await opportunitiesService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching opportunities stats:', error);
    res.status(500).json({ message: 'Failed to fetch opportunities statistics' });
  }
}

/**
 * POST /api/opportunities/cleanup
 * Deactivate old opportunities (admin only)
 */
export async function cleanupOpportunities(req: Request, res: Response) {
  try {
    const deactivated = await opportunitiesService.deactivateOldOpportunities();
    
    res.json({
      message: `Deactivated ${deactivated} old opportunities`,
      deactivated
    });
  } catch (error) {
    console.error('Error cleaning up opportunities:', error);
    res.status(500).json({ message: 'Failed to cleanup opportunities' });
  }
}
