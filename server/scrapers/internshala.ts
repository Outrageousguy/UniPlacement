import { BaseScraper } from './base.js';
import type { ScrapedJob } from './types.js';
import { generateExternalId } from './utils.js';

export class InternshalaScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Internshala',
      baseUrl: 'https://internshala.com',
      rateLimit: 2000, // 2 seconds between requests
      enabled: true
    });
  }
  
  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    let page;
    
    try {
      page = await this.createPage();
      
      // Scrape internships
      const internshipJobs = await this.scrapeInternships(page);
      jobs.push(...internshipJobs);
      
      await this.delay();
      
      // Scrape full-time jobs
      const fullTimeJobs = await this.scrapeJobs(page);
      jobs.push(...fullTimeJobs);
      
    } catch (error) {
      console.error('Internshala scraper error:', error);
    } finally {
      if (page) {
        await page.close();
      }
    }
    
    return this.validateJobs(jobs);
  }
  
  private async scrapeInternships(page: any): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    const urls = [
      'https://internshala.com/internships/work-from-home-internships',
      'https://internshala.com/internships/internships-in-mumbai',
      'https://internshala.com/internships/internships-in-delhi', 
      'https://internshala.com/internships/internships-in-bengaluru',
      'https://internshala.com/internships/internships-in-pune',
      'https://internshala.com/internships/internships-in-hyderabad'
    ];
    
    for (const url of urls) {
      if (!(await this.safeNavigate(page, url))) continue;
      
      // Wait for page to load with multiple possible selectors
      try {
        await page.waitForSelector('.internship_meta, .individual_internship, .internship-card', { timeout: 15000 });
      } catch (error) {
        console.warn(`Could not find internship elements on ${url}, skipping...`);
        continue;
      }
      
      // Try multiple selectors for internship listings
      const selectors = [
        '.individual_internship',
        '.internship-card', 
        '[class*="internship"]',
        '.job-container'
      ];
      
      let pageJobs: ScrapedJob[] = [];
      
      for (const selector of selectors) {
        try {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            pageJobs = await page.$$eval(selector, (elements: Element[]) => {
              return elements.map((el: any) => {
                // Try multiple selectors for each field
                const titleSelectors = ['.heading_4_8', '.internship_meta .heading_4_8', 'h3', '.title', '[class*="title"]'];
                const companySelectors = ['.company_name', '.company', '[class*="company"]'];
                const locationSelectors = ['.location_link', '.location', '[class*="location"]'];
                const linkSelectors = ['.view_detail_button', '.btn-primary', 'a[href*="/internship/detail/"]', 'a'];
                const stipendSelectors = ['.stipend', '[class*="stipend"]', '.salary'];
                
                const getText = (selectors: string[]) => {
                  for (const sel of selectors) {
                    const element = el.querySelector(sel);
                    if (element?.textContent?.trim()) {
                      return element.textContent.trim();
                    }
                  }
                  return '';
                };
                
                const getAttribute = (selectors: string[], attr: string) => {
                  for (const sel of selectors) {
                    const element = el.querySelector(sel);
                    if (element?.getAttribute(attr)) {
                      return element.getAttribute(attr);
                    }
                  }
                  return '';
                };
                
                return {
                  title: getText(titleSelectors),
                  company: getText(companySelectors),
                  location: getText(locationSelectors),
                  applicationUrl: getAttribute(linkSelectors, 'href'),
                  salary: getText(stipendSelectors),
                  description: getText(titleSelectors),
                  source: 'Internshala'
                };
              }).filter(job => job.title && job.company); // Filter out empty results
            });
            break; // Found working selector
          }
        } catch (error) {
          continue; // Try next selector
        }
      }
      
      // Convert relative URLs to absolute
      pageJobs.forEach((job: any) => {
        if (job.applicationUrl && !job.applicationUrl.startsWith('http')) {
          job.applicationUrl = `https://internshala.com${job.applicationUrl}`;
        }
        job.externalId = generateExternalId('internshala', job.title, job.company);
      });
      
      jobs.push(...pageJobs);
      await this.delay();
    }
    
    return jobs;
  }
  
  private async scrapeJobs(page: any): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    const urls = [
      'https://internshala.com/jobs/work-from-home-jobs',
      'https://internshala.com/jobs/jobs-in-mumbai',
      'https://internshala.com/jobs/jobs-in-delhi',
      'https://internshala.com/jobs/jobs-in-bengaluru',
      'https://internshala.com/jobs/jobs-in-pune'
    ];
    
    for (const url of urls) {
      if (!(await this.safeNavigate(page, url))) continue;
      
      await page.waitForSelector('.individual_job, .job-container, .internship_meta', { timeout: 15000 });
      
      const pageJobs = await page.$$eval('.individual_job', (elements: Element[]) => {
        return elements.map((el: any) => {
          const titleEl = el.querySelector('.heading_4_8');
          const companyEl = el.querySelector('.company-name');
          const locationEl = el.querySelector('.location-link');
          const linkEl = el.querySelector('.btn-outline-secondary');
          const salaryEl = el.querySelector('.salary');
          
          return {
            title: titleEl?.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || '',
            location: locationEl?.textContent?.trim() || '',
            applicationUrl: linkEl?.getAttribute('href') || '',
            salary: salaryEl?.textContent?.trim() || '',
            description: titleEl?.textContent?.trim() || '',
            source: 'Internshala'
          };
        });
      });
      
      // Convert relative URLs to absolute
      pageJobs.forEach((job: any) => {
        if (job.applicationUrl && !job.applicationUrl.startsWith('http')) {
          job.applicationUrl = `https://internshala.com${job.applicationUrl}`;
        }
        job.externalId = generateExternalId('internshala', job.title, job.company);
      });
      
      jobs.push(...pageJobs);
      await this.delay();
    }
    
    return jobs;
  }
}
