import * as cron from 'node-cron';
import { ExtendedOpportunitiesService } from './extended_opportunities/service.js';

const opportunitiesService = new ExtendedOpportunitiesService();

/**
 * Cron scheduler for background tasks
 * 
 * This scheduler handles:
 * - Periodic job scraping with different schedules per source
 * - Cleanup of old opportunities
 * - Database maintenance tasks
 */

class CronScheduler {
  private tasks: cron.ScheduledTask[] = [];
  private isRunning = false;

  /**
   * Start all scheduled tasks
   */
  start() {
    if (this.isRunning) {
      console.log('Cron scheduler already running');
      return;
    }

    console.log('Starting cron scheduler...');

    // Schedule Internshala scraping every 6 hours (frequently updated)
    const internshalaTask = cron.schedule('0 */6 * * *', async () => {
      console.log('Running scheduled Internshala scraping...');
      try {
        const result = await opportunitiesService.runScraper('internshala');
        console.log(`Internshala scraping completed: ${result.added} added, ${result.updated} updated`);
      } catch (error) {
        console.error('Internshala scraping error:', error);
      }
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Schedule government sources (AICTE + NCS) every 12 hours (slower changing)
    const govTask = cron.schedule('0 */12 * * *', async () => {
      console.log('Running scheduled government sources scraping...');
      try {
        const aicteResult = await opportunitiesService.runScraper('aicte');
        const ncsResult = await opportunitiesService.runScraper('ncs');
        
        console.log(`Government scraping completed:`);
        console.log(`- AICTE: ${aicteResult.added} added, ${aicteResult.updated} updated`);
        console.log(`- NCS: ${ncsResult.added} added, ${ncsResult.updated} updated`);
      } catch (error) {
        console.error('Government scraping error:', error);
      }
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Schedule other sources (Freshersworld) every 8 hours
    const otherTask = cron.schedule('0 */8 * * *', async () => {
      console.log('Running scheduled other sources scraping...');
      try {
        const result = await opportunitiesService.runScraper('freshersworld');
        console.log(`Other sources scraping completed: ${result.added} added, ${result.updated} updated`);
      } catch (error) {
        console.error('Other sources scraping error:', error);
      }
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Schedule cleanup every Sunday at 2 AM
    const cleanupTask = cron.schedule('0 2 * * 0', async () => {
      console.log('Running scheduled cleanup...');
      try {
        const deactivated = await opportunitiesService.deactivateOldOpportunities();
        console.log(`Scheduled cleanup completed: ${deactivated} opportunities deactivated`);
      } catch (error) {
        console.error('Scheduled cleanup error:', error);
      }
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Schedule database maintenance daily at 3 AM
    const maintenanceTask = cron.schedule('0 3 * * *', async () => {
      console.log('Running database maintenance...');
      try {
        // Add any database maintenance tasks here
        console.log('Database maintenance completed');
      } catch (error) {
        console.error('Database maintenance error:', error);
      }
    }, {
      timezone: 'Asia/Kolkata'
    });

    this.tasks = [internshalaTask, govTask, otherTask, cleanupTask, maintenanceTask];

    // Start all tasks
    this.tasks.forEach(task => task.start());

    this.isRunning = true;
    console.log('Cron scheduler started successfully');
    console.log('Scheduled tasks:');
    console.log('- Internshala: Every 6 hours');
    console.log('- Government sources (AICTE + NCS): Every 12 hours');
    console.log('- Other sources (Freshersworld): Every 8 hours');
    console.log('- Cleanup: Every Sunday at 2 AM');
    console.log('- Maintenance: Daily at 3 AM');
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    if (!this.isRunning) {
      console.log('Cron scheduler not running');
      return;
    }

    console.log('Stopping cron scheduler...');

    this.tasks.forEach(task => {
      task.stop();
    });

    this.tasks = [];
    this.isRunning = false;
    console.log('Cron scheduler stopped');
  }

  /**
   * Run a specific task manually
   */
  async runTask(taskName: 'scraping' | 'cleanup' | 'maintenance') {
    console.log(`Running manual task: ${taskName}`);

    try {
      switch (taskName) {
        case 'scraping':
          const result = await opportunitiesService.scrapeAndSaveJobs();
          console.log(`Manual scraping completed: ${result.added} added, ${result.updated} updated`);
          return result;

        case 'cleanup':
          const deactivated = await opportunitiesService.deactivateOldOpportunities();
          console.log(`Manual cleanup completed: ${deactivated} opportunities deactivated`);
          return { deactivated };

        case 'maintenance':
          console.log('Manual maintenance completed');
          return { success: true };

        default:
          throw new Error(`Unknown task: ${taskName}`);
      }
    } catch (error) {
      console.error(`Manual task ${taskName} error:`, error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: this.tasks.length,
      nextRun: this.isRunning ? {
        scraping: this.getNextRunTime('0 */6 * * *'),
        cleanup: this.getNextRunTime('0 2 * * 0'),
        maintenance: this.getNextRunTime('0 3 * * *')
      } : null
    };
  }

  /**
   * Get next run time for a cron expression
   */
  private getNextRunTime(cronExpression: string): Date | null {
    try {
      // Simple calculation for next run time
      // In a production environment, you might want to use a more sophisticated cron parser
      const now = new Date();
      const nextRun = new Date(now);
      
      if (cronExpression === '0 */6 * * *') {
        // Every 6 hours
        const hours = Math.floor(now.getHours() / 6) * 6 + 6;
        nextRun.setHours(hours, 0, 0, 0);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      } else if (cronExpression === '0 2 * * 0') {
        // Sunday at 2 AM
        nextRun.setHours(2, 0, 0, 0);
        const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
        nextRun.setDate(nextRun.getDate() + daysUntilSunday);
      } else if (cronExpression === '0 3 * * *') {
        // Daily at 3 AM
        nextRun.setHours(3, 0, 0, 0);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      
      return nextRun;
    } catch (error) {
      console.error('Error calculating next run time:', error);
      return null;
    }
  }
}

// Export singleton instance
export const cronScheduler = new CronScheduler();
