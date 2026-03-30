import puppeteer, { Browser, Page } from 'puppeteer';
import type { ScraperConfig, ScrapedJob } from './types.js';
import { validateJob } from './utils.js';

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected config: ScraperConfig;
  
  constructor(config: ScraperConfig) {
    this.config = config;
  }
  
  /**
   * Initialize browser with common settings
   */
  protected async initBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    return this.browser;
  }
  
  /**
   * Create new page with common settings
   */
  protected async createPage(): Promise<Page> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    // Set user agent and viewport to look like a real browser
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set additional headers to look more legitimate
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none'
    });
    
    // Add stealth behaviors
    await page.evaluateOnNewDocument(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Override chrome runtime with proper typing
      (window as any).chrome = {
        runtime: {},
      };
      
      // Override permissions with proper typing
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission } as any) :
          originalQuery(parameters)
      );
    });
    
    // Block unnecessary resources for faster scraping
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    return page;
  }
  
  /**
   * Rate limiting between requests with randomization
   */
  protected async delay(): Promise<void> {
    // Add random delay between requests to look more human
    const baseDelay = this.config.rateLimit;
    const randomDelay = Math.random() * 2000; // 0-2 seconds random
    const totalDelay = baseDelay + randomDelay;
    
    await new Promise(resolve => setTimeout(resolve, totalDelay));
  }
  
  /**
   * Safe page navigation with error handling
   */
  protected async safeNavigate(page: Page, url: string): Promise<boolean> {
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      return true;
    } catch (error) {
      console.error(`Failed to navigate to ${url}:`, error);
      return false;
    }
  }
  
  /**
   * Safe text extraction from selector
   */
  protected async safeText(page: Page, selector: string): Promise<string> {
    try {
      const element = await page.$(selector);
      return element ? await page.evaluate(el => el.textContent?.trim() || '', element) : '';
    } catch {
      return '';
    }
  }
  
  /**
   * Safe attribute extraction from selector
   */
  protected async safeAttribute(page: Page, selector: string, attribute: string): Promise<string> {
    try {
      const element = await page.$(selector);
      return element ? await page.evaluate((el, attr) => el.getAttribute(attr) || '', element, attribute) : '';
    } catch {
      return '';
    }
  }
  
  /**
   * Extract multiple items from selector list
   */
  protected async safeTextList(page: Page, selector: string): Promise<string[]> {
    try {
      return await page.$$eval(selector, elements => 
        elements.map(el => el.textContent?.trim() || '').filter(text => text.length > 0)
      );
    } catch {
      return [];
    }
  }
  
  /**
   * Close browser and cleanup
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
  
  /**
   * Abstract method to be implemented by specific scrapers
   */
  abstract scrape(): Promise<ScrapedJob[]>;
  
  /**
   * Validate and filter scraped jobs
   */
  protected validateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
    return jobs
      .map(job => validateJob(job))
      .filter((job): job is ScrapedJob => job !== null);
  }
}
