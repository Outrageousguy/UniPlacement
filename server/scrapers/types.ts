export interface NormalizedJob {
  id: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  applicationUrl: string;
  salary?: string;
  jobType: 'internship' | 'full-time' | 'part-time' | 'remote';
  source: string;
  postedDate: Date;
  deadline?: Date;
  region: 'india' | 'global' | 'restricted';
  field?: string;
  mode?: 'remote' | 'onsite' | 'hybrid';
  isGovernment?: boolean;
  isUrgent?: boolean;
  isNew?: boolean;
}

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements?: string[];
  applicationUrl: string;
  salary?: string;
  postedDate?: string | Date;
  deadline?: string | Date;
  source: string;
  externalId: string;
}

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  rateLimit: number; // ms between requests
  enabled: boolean;
}

export type JobField = 'CS' | 'Electrical' | 'Mechanical' | 'Civil' | 'Chemical' | 'Other';
export type JobMode = 'remote' | 'onsite' | 'hybrid';
