import { BaseScraper } from './base.js';
import type { ScrapedJob } from './types.js';
import { generateExternalId } from './utils.js';

export class NaukriScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Naukri',
      baseUrl: 'https://www.naukri.com',
      rateLimit: 2500, // 2.5 seconds between requests
      enabled: true
    });
  }
  
  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    let page;
    
    try {
      page = await this.createPage();
      
      // Scrape jobs from different locations and categories
      const jobCategories = [
        { url: 'https://www.naukri.com/work-from-home-jobs', location: 'Work from Home' },
        { url: 'https://www.naukri.com/jobs-in-mumbai', location: 'Mumbai' },
        { url: 'https://www.naukri.com/jobs-in-delhi', location: 'Delhi' },
        { url: 'https://www.naukri.com/jobs-in-bengaluru', location: 'Bengaluru' },
        { url: 'https://www.naukri.com/jobs-in-pune', location: 'Pune' },
        { url: 'https://www.naukri.com/jobs-in-hyderabad', location: 'Hyderabad' },
        { url: 'https://www.naukri.com/jobs-in-gwalior', location: 'Gwalior' }
      ];
      
      for (const category of jobCategories) {
        const categoryJobs = await this.scrapeJobCategory(page, category.url, category.location);
        jobs.push(...categoryJobs);
        await this.delay();
      }
      
    } catch (error) {
      console.error('Naukri scraper error:', error);
    } finally {
      if (page) {
        await page.close();
      }
    }
    
    return this.validateJobs(jobs);
  }
  
  private async scrapeJobCategory(page: any, url: string, defaultLocation: string): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    if (!(await this.safeNavigate(page, url))) {
      return jobs;
    }
    
    try {
      // Wait for job listings to load
      await page.waitForSelector('.jobTuple, .job-card, .srp-jobtuple', { timeout: 15000 });
      
      // Extract job information
      const pageJobs = await page.$$eval('.jobTuple, .job-card, .srp-jobtuple', (elements: any) => {
        return elements.map((el: any) => {
          const titleEl = el.querySelector('.title, .job-title, .job-tuple-heading');
          const companyEl = el.querySelector('.company, .company-name, .subTitle, .job-tuple-company');
          const locationEl = el.querySelector('.location, .loc, .job-tuple-location');
          const linkEl = el.querySelector('a, .title-wrapper');
          const experienceEl = el.querySelector('.experience, .exp, .job-tuple-experience');
          const salaryEl = el.querySelector('.salary, .sal, .job-tuple-salary');
          const descEl = el.querySelector('.job-description, .desc, .job-tuple-desc');
          
          return {
            title: titleEl?.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || '',
            location: locationEl?.textContent?.trim() || '',
            applicationUrl: linkEl?.getAttribute('href') || '',
            salary: salaryEl?.textContent?.trim() || '',
            description: descEl?.textContent?.trim() || titleEl?.textContent?.trim() || '',
            requirements: experienceEl ? [experienceEl.textContent?.trim() || ''] : []
          };
        });
      });
      
      // Process and validate jobs
      pageJobs.forEach((job: any) => {
        if (job.title && job.company && job.applicationUrl) {
          // Convert relative URLs to absolute
          if (job.applicationUrl && !job.applicationUrl.startsWith('http')) {
            job.applicationUrl = `https://www.naukri.com${job.applicationUrl}`;
          }
          
          job.location = job.location || defaultLocation;
          job.source = 'Naukri.com';
          job.externalId = generateExternalId('naukri', job.title, job.company);
          
          jobs.push(job);
        }
      });
      
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
    }
    
    return jobs;
  }
}
