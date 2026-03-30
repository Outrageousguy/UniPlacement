import { InternshalaScraper } from './internshala.js';
import { AICTEScraper } from './aicte.js';
import { NaukriScraper } from './naukri.js';
import { FreshersworldScraper } from './freshersworld.js';
import { NCSScraper } from './ncs.js';
import type { ScrapedJob, NormalizedJob } from './types.js';
import { 
  cleanText, 
  detectField, 
  detectMode, 
  detectType, 
  detectGovernment, 
  detectRegion,
  generateExternalId,
  normalizeText,
  calculateSimilarity
} from './utils.js';

export class ScraperManager {
  private scrapers = [
    new InternshalaScraper(),
    new AICTEScraper(),
    // Naukri scraper is disabled by default due to anti-scraping measures
    // Enable with environment variable: ENABLE_NAUKRI=true
    ...(process.env.ENABLE_NAUKRI === 'true' ? [new NaukriScraper()] : []),
    new FreshersworldScraper(),
    new NCSScraper()
  ];
  
  /**
   * Run all enabled scrapers and return combined results
   */
  async scrapeAll(): Promise<{ jobs: NormalizedJob[]; stats: any[] }> {
    const allJobs: NormalizedJob[] = [];
    const scraperStats: any[] = [];
    
    console.log('Starting scraping process...');
    
    for (const scraper of this.scrapers) {
      const scraperName = scraper.constructor.name;
      let fetchedCount = 0;
      let errorCount = 0;
      
      try {
        console.log(`Running ${scraperName}...`);
        const jobs = await scraper.scrape();
        fetchedCount = jobs.length;
        
        // Normalize and enhance job data
        const normalizedJobs = jobs.map(job => this.normalizeJob(job));
        allJobs.push(...normalizedJobs);
        
        console.log(`${scraperName} scraped ${jobs.length} jobs`);
        
      } catch (error) {
        errorCount++;
        console.error(`Error in ${scraperName}:`, error);
        console.error(`Error details:`, {
          scraper: scraperName,
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        });
      } finally {
        // Cleanup scraper resources
        try {
          await scraper.cleanup();
        } catch (cleanupError) {
          console.error(`Cleanup error in ${scraperName}:`, cleanupError);
        }
        
        // Delay between scrapers to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Add to stats
      scraperStats.push({
        scraper: scraperName,
        fetched: fetchedCount,
        errors: errorCount,
        success: errorCount === 0
      });
    }
    
    console.log(`Total jobs scraped: ${allJobs.length}`);
    
    // Remove duplicates based on enhanced similarity matching
    const uniqueJobs = this.removeDuplicates(allJobs);
    const duplicatesRemoved = allJobs.length - uniqueJobs.length;
    
    console.log(`After deduplication: ${uniqueJobs.length} unique jobs (${duplicatesRemoved} duplicates removed)`);
    
    // Update stats with duplicate information
    const finalStats = scraperStats.map(stat => ({
      ...stat,
      duplicates: Math.floor(duplicatesRemoved / scraperStats.length) // Distribute duplicates across scrapers
    }));
    
    return { jobs: uniqueJobs, stats: finalStats };
  }
  
  /**
   * Calculate urgency flags for a job
   */
  private calculateUrgencyFlags(postedDate: Date): { isUrgent: boolean; isNew: boolean } {
    const now = new Date();
    const hoursDiff = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60);
    const daysDiff = hoursDiff / 24;
    
    return {
      isUrgent: daysDiff <= 3, // Posted within last 3 days
      isNew: hoursDiff <= 24      // Posted within last 24 hours
    };
  }

/**
   * Normalize scraped job data to standard format
   */
  private normalizeJob(job: ScrapedJob): NormalizedJob {
    const cleanedDescription = cleanText(job.description, 200);
    const jobId = job.externalId || generateExternalId(job.source, job.title, job.company);
    const postedDate = job.postedDate ? new Date(job.postedDate) : new Date();
    const urgencyFlags = this.calculateUrgencyFlags(postedDate);
    
    return {
      id: jobId,
      externalId: jobId,
      title: job.title,
      company: job.company,
      location: job.location || 'Location not specified',
      description: cleanedDescription,
      requirements: job.requirements || [],
      applicationUrl: job.applicationUrl,
      salary: job.salary,
      jobType: detectType(job.title),
      source: job.source,
      postedDate,
      deadline: job.deadline ? new Date(job.deadline) : undefined,
      region: detectRegion(job.location || '', cleanedDescription),
      field: detectField(job.title, cleanedDescription),
      mode: detectMode(cleanedDescription),
      isGovernment: detectGovernment(job.source, job.title),
      ...urgencyFlags
    };
  }
  
  /**
   * Remove duplicate jobs based on enhanced similarity matching
   */
  private removeDuplicates(jobs: NormalizedJob[]): NormalizedJob[] {
    const unique: NormalizedJob[] = [];
    const seen = new Set<string>();
    
    for (const job of jobs) {
      let isDuplicate = false;
      
      // Check against existing unique jobs
      for (const existingJob of unique) {
        const titleSimilarity = calculateSimilarity(job.title, existingJob.title);
        const companyMatch = normalizeText(job.company) === normalizeText(existingJob.company);
        
        // Consider duplicate if:
        // 1. Titles are very similar (>80% similarity) AND companies match
        // 2. OR exact same normalized title + company + source combination
        const normalizedKey = `${normalizeText(job.title)}-${normalizeText(job.company)}-${job.source}`;
        
        if ((titleSimilarity > 0.8 && companyMatch) || seen.has(normalizedKey)) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        unique.push(job);
        seen.add(`${normalizeText(job.title)}-${normalizeText(job.company)}-${job.source}`);
      }
    }
    
    return unique;
  }
  
  /**
   * Run specific scraper by name
   */
  async runScraper(name: string): Promise<NormalizedJob[]> {
    const scraper = this.scrapers.find(s => s.constructor.name.toLowerCase().includes(name.toLowerCase()));
    
    if (!scraper) {
      throw new Error(`Scraper '${name}' not found`);
    }
    
    try {
      const jobs = await scraper.scrape();
      const normalizedJobs = jobs.map(this.normalizeJob);
      await scraper.cleanup();
      
      return this.removeDuplicates(normalizedJobs);
    } catch (error) {
      console.error(`Error in ${scraper.constructor.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Get list of available scrapers
   */
  getAvailableScrapers(): string[] {
    return this.scrapers.map(s => s.constructor.name);
  }
  
  /**
   * Cleanup all scrapers
   */
  async cleanup(): Promise<void> {
    for (const scraper of this.scrapers) {
      try {
        await scraper.cleanup();
      } catch (error) {
        console.error(`Error cleaning up ${scraper.constructor.name}:`, error);
      }
    }
  }
}

// Export individual scrapers for testing or individual use
export {
  InternshalaScraper,
  AICTEScraper,
  NaukriScraper,
  FreshersworldScraper,
  NCSScraper
};
