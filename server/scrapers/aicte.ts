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
      // Wait for page to load
      await page.waitForSelector('.internship-card, .job-card, .card, .internship-list', { timeout: 20000 });
      
      // Extract internship information
      const internships = await page.$$eval('.internship-card, .job-card, .card', (elements: any) => {
        return elements.map((el: any) => {
          const titleEl = el.querySelector('h3, .title, .internship-title');
          const companyEl = el.querySelector('.company, .organization, .org-name');
          const locationEl = el.querySelector('.location, .city, .place');
          const linkEl = el.querySelector('a, .apply-btn, .btn-primary');
          const descEl = el.querySelector('.description, .internship-desc, .job-desc');
          
          return {
            title: titleEl?.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || 'AICTE',
            location: locationEl?.textContent?.trim() || 'Multiple Locations',
            applicationUrl: linkEl?.getAttribute('href') || '',
            description: descEl?.textContent?.trim() || titleEl?.textContent?.trim() || '',
            source: 'AICTE Internship Portal'
          };
        });
      });
      
      // Process and validate internships
      internships.forEach((internship: any) => {
        if (internship.title && internship.applicationUrl) {
          // Convert relative URLs to absolute
          if (internship.applicationUrl && !internship.applicationUrl.startsWith('http')) {
            internship.applicationUrl = `https://internship.aicte-india.org${internship.applicationUrl}`;
          }
          
          internship.externalId = generateExternalId('aicte', internship.title, internship.company);
          jobs.push(internship);
        }
      });
      
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
