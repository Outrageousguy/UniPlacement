import { BaseScraper } from './base.js';
import type { ScrapedJob } from './types.js';
import { generateExternalId } from './utils.js';

export class AICTEScraper extends BaseScraper {
  constructor() {
    super({
      name: 'AICTE',
      baseUrl: 'https://aicte-india.org',
      rateLimit: 3000, // 3 seconds between requests
      enabled: true
    });
  }
  
  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    let page;
    
    try {
      page = await this.createPage();
      
      // AICTE internship portal
      const internshipJobs = await this.scrapeAICTEInternships(page);
      jobs.push(...internshipJobs);
      
    } catch (error) {
      console.error('AICTE scraper error:', error);
    } finally {
      if (page) {
        await page.close();
      }
    }
    
    return this.validateJobs(jobs);
  }
  
  private async scrapeAICTEInternships(page: any): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    // AICTE internship portal URL
    const url = 'https://internship.aicte-india.org/';
    
    if (!(await this.safeNavigate(page, url))) {
      return jobs;
    }
    
    try {
      // Wait for page to load with multiple fallback strategies
      let found = false;
      const selectors = [
        '.internship-card, .job-card, .card, .internship-list',
        '[class*="internship"], [class*="job"], [class*="card"], [class*="list"], [class*="item"]',
        'article, .item, .row, .listing',
        'div[class*="intern"], div[class*="job"], section[class*="card"], li[class*="item"]',
        'table tr, .table-row, .data-row',
        '.container > div, .main > div, .content > div'
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
        console.log('AICTE: Could not find job listings, trying to extract all links');
        // Fallback: extract all links that might be job postings
        const links = await page.$$eval('a[href]', (links: any) => {
          return links
            .filter((link: any) => {
              const text = link.textContent?.toLowerCase() || '';
              const href = link.href?.toLowerCase() || '';
              return text.includes('internship') || text.includes('apply') || 
                     href.includes('internship') || href.includes('apply') ||
                     text.includes('opportunity') || href.includes('opportunity');
            })
            .map((link: any) => ({
              title: link.textContent?.trim() || '',
              applicationUrl: link.href,
              company: 'AICTE',
              location: 'Multiple Locations',
              description: link.textContent?.trim() || ''
            }));
        });
        
        links.forEach((link: any) => {
          if (link.title && link.applicationUrl) {
            link.externalId = generateExternalId('aicte', link.title, link.company);
            jobs.push(link);
          }
        });
        
        return jobs;
      }
      
      // Extract internship information with comprehensive selectors
      const internships = await page.$$eval('.internship-card, .job-card, .card, [class*="internship"], [class*="job"], [class*="card"], [class*="list"], article, .item, .row, div[class*="intern"], div[class*="job"], section[class*="card"], li[class*="item"], table tr, .listing', (elements: any) => {
        return elements.map((el: any) => {
          const titleEl = el.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="heading"], strong, b, .text');
          const companyEl = el.querySelector('[class*="company"], [class*="org"], [class*="organization"], .name, .employer');
          const locationEl = el.querySelector('[class*="location"], [class*="city"], [class*="place"], .address, .venue');
          const linkEl = el.querySelector('a[href], [class*="apply"], [class*="btn"], button, [onclick]');
          const descEl = el.querySelector('[class*="description"], [class*="desc"], p, .content, .details, .summary');
          
          const title = titleEl?.textContent?.trim() || 
                     el.getAttribute('title') || 
                     el.textContent?.trim() || '';
          
          return {
            title: title,
            company: companyEl?.textContent?.trim() || 'AICTE',
            location: locationEl?.textContent?.trim() || 'Multiple Locations',
            applicationUrl: linkEl?.getAttribute('href') || '',
            description: descEl?.textContent?.trim() || title || ''
          };
        });
      });
      
      // Process and validate internships
      console.log(`AICTE: Found ${internships.length} raw internships before validation`);
      internships.forEach((internship: any, index: number) => {
        console.log(`AICTE: Internship ${index + 1}: "${internship.title}" - Company: "${internship.company}" - URL: "${internship.applicationUrl}"`);
        
        if (internship.title && internship.applicationUrl) {
          // Convert relative URLs to absolute
          if (internship.applicationUrl && !internship.applicationUrl.startsWith('http')) {
            internship.applicationUrl = `https://internship.aicte-india.org${internship.applicationUrl}`;
          }
          
          internship.externalId = generateExternalId('aicte', internship.title, internship.company);
          jobs.push(internship);
        } else {
          console.log(`AICTE: Skipping internship due to missing data - Title: "${internship.title}", URL: "${internship.applicationUrl}"`);
        }
      });
      
      console.log(`AICTE: After processing, ${jobs.length} internships ready for validation`);
      
    } catch (error) {
      console.error('Error scraping AICTE internships:', error);
      
      // Fallback: Try to get basic information from the page
      try {
        const fallbackJobs = await this.extractFallbackJobs(page);
        jobs.push(...fallbackJobs);
      } catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError);
      }
    }
    
    return jobs;
  }
  
  private async extractFallbackJobs(page: any): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    // Try to find any links that might be job/internship postings
    const links = await page.$$eval('a[href]', (elements: any) => {
      return elements
        .map((el: any) => ({
          text: el.textContent?.trim() || '',
          href: el.getAttribute('href') || ''
        }))
        .filter((link: any) => 
          link.text && 
          (link.text.toLowerCase().includes('intern') || 
           link.text.toLowerCase().includes('training') ||
           link.text.toLowerCase().includes('program')) &&
          link.href
        );
    });
    
    links.forEach((link: any) => {
      if (link.text && link.href) {
        const job: ScrapedJob = {
          title: link.text,
          company: 'AICTE',
          location: 'Multiple Locations',
          description: link.text,
          applicationUrl: link.href.startsWith('http') ? link.href : `https://internship.aicte-india.org${link.href}`,
          source: 'AICTE Internship Portal',
          externalId: generateExternalId('aicte', link.text, 'AICTE')
        };
        jobs.push(job);
      }
    });
    
    return jobs;
  }
}
