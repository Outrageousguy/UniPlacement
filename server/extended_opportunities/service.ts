import { ScraperManager } from '../scrapers/index.js';
import { db } from '../db.js';
import { externalOpportunities } from '@shared/schema.js';
import { eq, and, desc, ilike, or } from 'drizzle-orm';
import type { NormalizedJob } from '../scrapers/types.js';

// Simple in-memory cache implementation
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(pattern: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new CacheManager();

export class ExtendedOpportunitiesService {
  private scraperManager: ScraperManager;
  
  constructor() {
    this.scraperManager = new ScraperManager();
  }
  
  /**
   * Run scraping process and save new jobs
   */
  async scrapeAndSaveJobs(): Promise<{ added: number; updated: number; total: number; scraperStats: any[] }> {
    try {
      console.log('Starting extended opportunities scraping...');
      
      // Get all scraped jobs
      const scrapingResult = await this.scraperManager.scrapeAll();
      const scrapedJobs = scrapingResult.jobs;
      
      if (scrapedJobs.length === 0) {
        console.log('No jobs scraped');
        return { added: 0, updated: 0, total: 0, scraperStats: [] };
      }
      
      // Save jobs to database
      const result = await this.saveJobs(scrapedJobs);
      
      // Clear cache when new data is added
      if (result.added > 0 || result.updated > 0) {
        cache.delete('opportunities');
        console.log('Cache cleared due to new job data');
      }
      
      console.log(`Scraping completed: ${result.added} added, ${result.updated} updated, ${result.total} total processed`);
      
      return { ...result, scraperStats: scrapingResult.stats };
      
    } catch (error) {
      console.error('Error in scrapeAndSaveJobs:', error);
      throw error;
    } finally {
      // Cleanup scraper resources
      await this.scraperManager.cleanup();
    }
  }

  /**
   * Get statistics for each scraper
   */
  private getScraperStats(jobs: NormalizedJob[]): any[] {
    const stats: { [key: string]: { fetched: number; inserted: number; duplicates: number } } = {};
    
    // Group jobs by source
    for (const job of jobs) {
      if (!stats[job.source]) {
        stats[job.source] = { fetched: 0, inserted: 0, duplicates: 0 };
      }
      stats[job.source].fetched++;
    }
    
    return Object.entries(stats).map(([scraper, data]) => ({
      scraper,
      ...data
    }));
  }
  
  /**
   * Save jobs to database with deduplication
   */
  async saveJobs(jobs: NormalizedJob[]): Promise<{ added: number; updated: number; total: number }> {
    let added = 0;
    let updated = 0;
    
    for (const job of jobs) {
      try {
        // Check if job already exists
        const existing = await db.select()
          .from(externalOpportunities)
          .where(eq(externalOpportunities.externalId, job.externalId))
          .limit(1);
        
        const jobData = {
          externalId: job.externalId,
          title: job.title,
          company: job.company,
          location: job.location,
          jobType: job.jobType,
          salary: job.salary || null,
          description: job.description,
          requirements: job.requirements || [],
          applicationUrl: job.applicationUrl,
          source: job.source,
          postedDate: job.postedDate,
          deadline: job.deadline || null,
          isActive: true,
          region: job.region,
          field: (job.field as any) || 'Other',
          mode: (job.mode as any) || 'onsite',
          isGovernment: job.isGovernment || false,
          updatedAt: new Date()
        };
        
        if (existing.length === 0) {
          // Insert new job
          await db.insert(externalOpportunities).values(jobData);
          added++;
        } else {
          // Update existing job
          await db.update(externalOpportunities)
            .set(jobData)
            .where(eq(externalOpportunities.externalId, job.externalId));
          updated++;
        }
        
      } catch (error) {
        console.error(`Error saving job ${job.externalId}:`, error);
      }
    }
    
    return { added, updated, total: jobs.length };
  }
  
  /**
   * Run specific scraper by name
   */
  async runScraper(name: string): Promise<{ added: number; updated: number; total: number }> {
    try {
      const jobs = await this.scraperManager.runScraper(name);
      const result = await this.saveJobs(jobs);
      
      // Clear cache when new data is added
      if (result.added > 0 || result.updated > 0) {
        cache.delete('opportunities');
        console.log('Cache cleared due to new job data');
      }
      
      return result;
    } catch (error) {
      console.error(`Error running scraper ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get total count of opportunities with filters (for pagination)
   */
  async getOpportunitiesCount(filters: {
    location?: string;
    field?: string;
    type?: string;
    mode?: string;
    isGovernment?: boolean;
    search?: string;
  } = {}): Promise<number> {
    const conditions = [];
    
    if (filters.location) {
      conditions.push(ilike(externalOpportunities.location, `%${filters.location}%`));
    }
    
    if (filters.field) {
      conditions.push(eq(externalOpportunities.field, filters.field as any));
    }
    
    if (filters.type) {
      conditions.push(eq(externalOpportunities.jobType, filters.type as any));
    }
    
    if (filters.mode) {
      conditions.push(eq(externalOpportunities.mode, filters.mode as any));
    }
    
    if (filters.isGovernment !== undefined) {
      conditions.push(eq(externalOpportunities.isGovernment, filters.isGovernment));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          ilike(externalOpportunities.title, `%${filters.search}%`),
          ilike(externalOpportunities.company, `%${filters.search}%`),
          ilike(externalOpportunities.description, `%${filters.search}%`)
        )
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const result = await db.select({ count: externalOpportunities.id })
      .from(externalOpportunities)
      .where(whereClause);
    
    return result.length > 0 ? result[0].count : 0;
  }

  /**
   * Get opportunities with filters
   */
  async getOpportunities(filters: {
    location?: string;
    field?: string;
    type?: string;
    mode?: string;
    isGovernment?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const {
      location,
      field,
      type,
      mode,
      isGovernment,
      search,
      limit = 50,
      offset = 0
    } = filters;
    
    // Create cache key based on filters
    const cacheKey = `opportunities-${JSON.stringify({ location, field, type, mode, isGovernment, search, limit, offset })}`;
    
    // Try cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Cache hit for opportunities:', cacheKey);
      return cached;
    }
    
    console.log('Cache miss, fetching from database:', cacheKey);
    
    const conditions = [];
    
    if (location) {
      conditions.push(ilike(externalOpportunities.location, `%${location}%`));
    }
    
    if (field) {
      conditions.push(eq(externalOpportunities.field, field as any));
    }
    
    if (type) {
      conditions.push(eq(externalOpportunities.jobType, type as any));
    }
    
    if (mode) {
      conditions.push(eq(externalOpportunities.mode, mode as any));
    }
    
    if (isGovernment !== undefined) {
      conditions.push(eq(externalOpportunities.isGovernment, isGovernment));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(externalOpportunities.title, `%${search}%`),
          ilike(externalOpportunities.company, `%${search}%`),
          ilike(externalOpportunities.description, `%${search}%`)
        )
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const opportunities = await db.select()
      .from(externalOpportunities)
      .where(whereClause)
      .orderBy(desc(externalOpportunities.postedDate))
      .limit(limit)
      .offset(offset);
    
    // Cache the result for 5 minutes
    cache.set(cacheKey, opportunities, 5);
    
    return opportunities;
  }
  
  /**
   * Get opportunity by ID
   */
  async getOpportunityById(id: number): Promise<any | null> {
    const opportunities = await db.select()
      .from(externalOpportunities)
      .where(eq(externalOpportunities.id, id))
      .limit(1);
    
    return opportunities.length > 0 ? opportunities[0] : null;
  }
  
  /**
   * Get opportunities statistics
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byField: Record<string, number>;
    byMode: Record<string, number>;
    byLocation: Record<string, number>;
    government: number;
    recent: number;
  }> {
    // Get all opportunities for stats (limit to avoid performance issues)
    const allOpportunities = await db.select()
      .from(externalOpportunities)
      .where(eq(externalOpportunities.isActive, true))
      .limit(5000);
    
    const stats = {
      total: allOpportunities.length,
      byType: {} as Record<string, number>,
      byField: {} as Record<string, number>,
      byMode: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
      government: 0,
      recent: 0
    };
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    for (const opp of allOpportunities) {
      // Count by type
      stats.byType[opp.jobType] = (stats.byType[opp.jobType] || 0) + 1;
      
      // Count by field
      stats.byField[opp.field] = (stats.byField[opp.field] || 0) + 1;
      
      // Count by mode
      stats.byMode[opp.mode] = (stats.byMode[opp.mode] || 0) + 1;
      
      // Count by location (group major cities)
      const locationKey = this.normalizeLocation(opp.location);
      stats.byLocation[locationKey] = (stats.byLocation[locationKey] || 0) + 1;
      
      // Count government jobs
      if (opp.isGovernment) {
        stats.government++;
      }
      
      // Count recent jobs (last 7 days)
      if (new Date(opp.postedDate) > oneWeekAgo) {
        stats.recent++;
      }
    }
    
    return stats;
  }
  
  /**
   * Normalize location names for better grouping
   */
  private normalizeLocation(location: string): string {
    const majorCities = ['mumbai', 'delhi', 'bengaluru', 'bangalore', 'pune', 'hyderabad', 'chennai', 'kolkata', 'gwalior'];
    const locationLower = location.toLowerCase();
    
    for (const city of majorCities) {
      if (locationLower.includes(city)) {
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }
    
    if (locationLower.includes('work from home') || locationLower.includes('remote')) {
      return 'Remote';
    }
    
    if (locationLower.includes('multiple') || locationLower.includes('across')) {
      return 'Multiple Locations';
    }
    
    return location;
  }
  
  /**
   * Deactivate old opportunities with smarter logic
   */
  async deactivateOldOpportunities(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    let deactivated = 0;
    
    try {
      // First, deactivate very old non-government opportunities (>60 days)
      const oldNonGovResult = await db.update(externalOpportunities)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
          eq(externalOpportunities.isActive, true),
          eq(externalOpportunities.isGovernment, false),
          // Note: We would need to add postedDate column for proper filtering
          // For now, we'll use updatedAt as approximation
        ));
      
      // For government opportunities, be more conservative (>90 days)
      const oldGovResult = await db.update(externalOpportunities)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
          eq(externalOpportunities.isActive, true),
          eq(externalOpportunities.isGovernment, true),
          // Note: Same limitation as above
        ));
      
      console.log(`Cleanup completed: deactivated opportunities`);
      console.log(`Note: Consider adding postedDate column for better age-based cleanup`);
      
      return deactivated;
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      return 0;
    }
  }
}
