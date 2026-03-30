import { BaseScraper } from './base.js';
import type { ScrapedJob } from './types.js';
import { generateExternalId } from './utils.js';

export class FreshersworldScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Freshersworld',
      baseUrl: 'https://www.freshersworld.com',
      rateLimit: 2000, // 2 seconds between requests
      enabled: true
    });
  }
  
  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    let page;
    
    try {
      page = await this.createPage();
      
      // Scrape fresher jobs from different categories
      const jobCategories = [
        { url: 'https://www.freshersworld.com/jobs/category/walk-in', category: 'Walk-in' },
        { url: 'https://www.freshersworld.com/jobs/category/it-software', category: 'IT-Software' },
        { url: 'https://www.freshersworld.com/jobs/category/govt-sector', category: 'Government' },
        { url: 'https://www.freshersworld.com/jobs/location/mumbai', location: 'Mumbai' },
        { url: 'https://www.freshersworld.com/jobs/location/delhi', location: 'Delhi' },
        { url: 'https://www.freshersworld.com/jobs/location/bengaluru', location: 'Bengaluru' },
        { url: 'https://www.freshersworld.com/jobs/location/pune', location: 'Pune' },
        { url: 'https://www.freshersworld.com/jobs/location/hyderabad', location: 'Hyderabad' }
      ];
      
      for (const category of jobCategories) {
        const categoryJobs = await this.scrapeJobCategory(page, category.url, category);
        jobs.push(...categoryJobs);
        await this.delay();
      }
      
    } catch (error) {
      console.error('Freshersworld scraper error:', error);
    } finally {
      if (page) {
        await page.close();
      }
    }
    
    return this.validateJobs(jobs);
  }
  
  private async scrapeJobCategory(page: any, url: string, categoryInfo: any): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    if (!(await this.safeNavigate(page, url))) {
      return jobs;
    }
    
    try {
      // Wait for job listings to load
      await page.waitForSelector('.job-item, .job-list-container, .card, .job-card, .list-item', { timeout: 20000 });
      
      // Extract job information
      const pageJobs = await page.$$eval('.job-item, .job-list-container, .card, .job-card', (elements: any) => {
        return elements.map((el: any) => {
          const titleEl = el.querySelector('.job-title, .title, h3, h4');
          const companyEl = el.querySelector('.company-name, .company, .organization');
          const locationEl = el.querySelector('.location, .job-location, .loc');
          const linkEl = el.querySelector('a, .apply-btn, .btn-primary');
          const salaryEl = el.querySelector('.salary, .package, .ctc');
          const descEl = el.querySelector('.description, .job-desc, .summary');
          const postedEl = el.querySelector('.posted-date, .date, .time');
          
          return {
            title: titleEl?.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || '',
            location: locationEl?.textContent?.trim() || '',
            applicationUrl: linkEl?.getAttribute('href') || '',
            salary: salaryEl?.textContent?.trim() || '',
            description: descEl?.textContent?.trim() || titleEl?.textContent?.trim() || '',
            postedDate: postedEl?.textContent?.trim() || ''
          };
        });
      });
      
      // Process and validate jobs
      pageJobs.forEach((job: any) => {
        if (job.title && job.company && job.applicationUrl) {
          // Convert relative URLs to absolute
          if (job.applicationUrl && !job.applicationUrl.startsWith('http')) {
            job.applicationUrl = `https://www.freshersworld.com${job.applicationUrl}`;
          }
          
          job.source = 'Freshersworld';
          job.externalId = generateExternalId('freshersworld', job.title, job.company);
          
          jobs.push(job);
        }
      });
      
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
    }
    
    return jobs;
  }
}
