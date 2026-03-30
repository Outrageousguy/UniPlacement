import { BaseScraper } from './base.js';
import type { ScrapedJob } from './types.js';
import { generateExternalId } from './utils.js';

export class NCSScraper extends BaseScraper {
  constructor() {
    super({
      name: 'National Career Service',
      baseUrl: 'https://www.ncs.gov.in',
      rateLimit: 3000, // 3 seconds between requests
      enabled: true
    });
  }
  
  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    let page;
    
    try {
      page = await this.createPage();
      
      // Scrape government jobs from NCS
      const govJobs = await this.scrapeGovJobs(page);
      jobs.push(...govJobs);
      
    } catch (error) {
      console.error('NCS scraper error:', error);
    } finally {
      if (page) {
        await page.close();
      }
    }
    
    return this.validateJobs(jobs);
  }
  
  private async scrapeGovJobs(page: any): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    // NCS job search URL - focusing on latest jobs
    const urls = [
      'https://www.ncs.gov.in/job/search',
      'https://www.ncs.gov.in/job/search?location=Delhi',
      'https://www.ncs.gov.in/job/search?location=Mumbai',
      'https://www.ncs.gov.in/job/search?location=Bengaluru',
      'https://www.ncs.gov.in/job/search?location=Pune',
      'https://www.ncs.gov.in/job/search?location=Hyderabad'
    ];
    
    for (const url of urls) {
      const pageJobs = await this.scrapeNCSPage(page, url);
      jobs.push(...pageJobs);
      await this.delay();
    }
    
    return jobs;
  }
  
  private async scrapeNCSPage(page: any, url: string): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    if (!(await this.safeNavigate(page, url))) {
      return jobs;
    }
    
    try {
      // Wait for job listings to load - NCS might have different selectors
      await page.waitForSelector('.job-card, .job-item, .search-result, .card', { timeout: 20000 });
      
      // Extract job information
      const pageJobs = await page.$$eval('.job-card, .job-item, .search-result, .card', (elements: any) => {
        return elements.map((el: any) => {
          const titleEl = el.querySelector('.job-title, .title, h3, h4, .job-heading');
          const companyEl = el.querySelector('.company, .organization, .dept, .department');
          const locationEl = el.querySelector('.location, .job-location, .city, .state');
          const linkEl = el.querySelector('a, .apply-btn, .btn-primary, .view-details');
          const salaryEl = el.querySelector('.salary, .pay-scale, .emoluments');
          const descEl = el.querySelector('.description, .job-desc, .summary, .job-details');
          const postedEl = el.querySelector('.posted-date, .date, .published');
          
          return {
            title: titleEl?.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || 'Government of India',
            location: locationEl?.textContent?.trim() || 'India',
            applicationUrl: linkEl?.getAttribute('href') || '',
            salary: salaryEl?.textContent?.trim() || '',
            description: descEl?.textContent?.trim() || titleEl?.textContent?.trim() || '',
            postedDate: postedEl?.textContent?.trim() || ''
          };
        });
      });
      
      // Process and validate jobs
      pageJobs.forEach((job: any) => {
        if (job.title && job.applicationUrl) {
          // Convert relative URLs to absolute
          if (job.applicationUrl && !job.applicationUrl.startsWith('http')) {
            job.applicationUrl = `https://www.ncs.gov.in${job.applicationUrl}`;
          }
          
          job.source = 'National Career Service';
          job.externalId = generateExternalId('ncs', job.title, job.company);
          
          jobs.push(job);
        }
      });
      
    } catch (error) {
      console.error(`Error scraping NCS page ${url}:`, error);
      
      // Fallback: Try to extract any government job information
      try {
        const fallbackJobs = await this.extractFallbackJobs(page);
        jobs.push(...fallbackJobs);
      } catch (fallbackError) {
        console.error('NCS fallback extraction failed:', fallbackError);
      }
    }
    
    return jobs;
  }
  
  private async extractFallbackJobs(page: any): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    // Try to find any links that might be job postings
    const links = await page.$$eval('a[href]', (elements: any) => {
      return elements
        .map((el: any) => ({
          text: el.textContent?.trim() || '',
          href: el.getAttribute('href') || ''
        }))
        .filter((link: any) => 
          link.text && 
          (link.text.toLowerCase().includes('recruitment') || 
           link.text.toLowerCase().includes('vacancy') ||
           link.text.toLowerCase().includes('position') ||
           link.text.toLowerCase().includes('post')) &&
          link.href
        );
    });
    
    links.forEach((link: any) => {
      if (link.text && link.href) {
        const job: ScrapedJob = {
          title: link.text,
          company: 'Government of India',
          location: 'India',
          description: link.text,
          applicationUrl: link.href.startsWith('http') ? link.href : `https://www.ncs.gov.in${link.href}`,
          source: 'National Career Service',
          externalId: generateExternalId('ncs', link.text, 'Government of India')
        };
        jobs.push(job);
      }
    });
    
    return jobs;
  }
}
