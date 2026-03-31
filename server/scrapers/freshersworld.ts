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
      // Wait for job listings to load with multiple fallback strategies
      let found = false;
      const selectors = [
        '.job-item, .job-list-container, .card, .job-card, .list-item',
        '[class*="job"], [class*="listing"], [class*="item"], [class*="card"]',
        'article, .item, .row, .listing, .post',
        'div[class*="job"], section[class*="job"], li[class*="item"]',
        'table tr, .table-row, .data-row'
      ];
      
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          found = true;
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!found) {
        console.log(`Freshersworld: Could not find job listings for ${url}, trying fallback`);
        // Fallback: extract all links that might be job postings
        const links = await page.$$eval('a[href]', (links: any) => {
          return links
            .filter((link: any) => {
              const text = link.textContent?.toLowerCase() || '';
              const href = link.href?.toLowerCase() || '';
              return text.includes('job') || text.includes('apply') || text.includes('walk') ||
                     href.includes('job') || href.includes('apply') || href.includes('position') ||
                     text.includes('vacancy') || href.includes('vacancy');
            })
            .map((link: any) => ({
              title: link.textContent?.trim() || '',
              applicationUrl: link.href,
              company: 'Unknown',
              location: categoryInfo?.location || 'Multiple Locations',
              salary: '',
              description: link.textContent?.trim() || '',
              postedDate: ''
            }));
        });
        
        links.forEach((link: any) => {
          if (link.title && link.applicationUrl) {
            link.externalId = generateExternalId('freshersworld', link.title, link.company);
            jobs.push(link);
          }
        });
        
        return jobs;
      }
      
      // Extract job information with comprehensive selectors
      const pageJobs = await page.$$eval('.job-item, .job-list-container, .card, .job-card, .list-item, [class*="job"], [class*="listing"], [class*="item"], [class*="card"], article, .item, .row, .listing, .post, div[class*="job"], section[class*="job"], li[class*="item"], table tr, .table-row, .data-row', (elements: any) => {
        return elements.map((el: any) => {
          const titleEl = el.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="heading"], strong, b, .text');
          const companyEl = el.querySelector('[class*="company"], [class*="org"], [class*="organization"], .name, .employer');
          const locationEl = el.querySelector('[class*="location"], [class*="city"], [class*="place"], .address, .venue');
          const linkEl = el.querySelector('a[href], [class*="apply"], [class*="btn"], button, [onclick]');
          const salaryEl = el.querySelector('[class*="salary"], [class*="package"], [class*="ctc"], [class*="pay"], .amount');
          const descEl = el.querySelector('[class*="description"], [class*="desc"], p, .content, .details, .summary');
          const postedEl = el.querySelector('[class*="date"], [class*="time"], [class*="posted"], .date, .time');
          
          const title = titleEl?.textContent?.trim() || 
                     el.getAttribute('title') || 
                     el.textContent?.trim() || '';
          
          return {
            title: title,
            company: companyEl?.textContent?.trim() || 'Unknown',
            location: locationEl?.textContent?.trim() || 'Multiple Locations',
            applicationUrl: linkEl?.getAttribute('href') || '',
            salary: salaryEl?.textContent?.trim() || '',
            description: descEl?.textContent?.trim() || title || '',
            postedDate: postedEl?.textContent?.trim() || ''
          };
        });
      });
      
      // Process and validate jobs
      console.log(`Freshersworld (${categoryInfo?.location || categoryInfo?.category}): Found ${pageJobs.length} raw jobs before validation`);
      pageJobs.forEach((job: any, index: number) => {
        console.log(`Freshersworld: Job ${index + 1}: "${job.title}" - Company: "${job.company}" - URL: "${job.applicationUrl}"`);
        
        if (job.title && job.company && job.applicationUrl) {
          // Convert relative URLs to absolute
          if (job.applicationUrl && !job.applicationUrl.startsWith('http')) {
            job.applicationUrl = `https://www.freshersworld.com${job.applicationUrl}`;
          }
          
          job.externalId = generateExternalId('freshersworld', job.title, job.company);
          jobs.push(job);
        } else {
          console.log(`Freshersworld: Skipping job due to missing data - Title: "${job.title}", Company: "${job.company}", URL: "${job.applicationUrl}"`);
        }
      });
      
      console.log(`Freshersworld (${categoryInfo?.location || categoryInfo?.category}): After processing, ${jobs.length} jobs ready for validation`);
      
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
    }
    
    return jobs;
  }
}
