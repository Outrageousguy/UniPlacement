import { convert } from 'html-to-text';
import type { ScrapedJob, JobField, JobMode } from './types.js';

/**
 * Normalize text for comparison
 * Removes punctuation, normalizes whitespace, converts to lowercase
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate text similarity (simple implementation)
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);
  
  if (normalized1 === normalized2) return 1.0;
  
  // Simple Jaccard similarity for near-matches
  const words1 = new Set(normalized1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalized2.split(' ').filter(w => w.length > 2));
  
  const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
  const union = new Set([...Array.from(words1), ...Array.from(words2)]);
  
  return intersection.size / union.size;
}

/**
 * Extract first meaningful sentence from text
 */
function extractFirstSentence(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return sentences.length > 0 ? sentences[0].trim() : text;
}

/**
 * Clean HTML content and extract plain text
 * Removes script/style tags, normalizes whitespace, extracts meaningful sentences
 */
export function cleanText(html: string, maxLength: number = 200): string {
  if (!html) return '';
  
  const plainText = convert(html, {
    wordwrap: false,
    selectors: [
      { selector: 'script', format: 'skip' },
      { selector: 'style', format: 'skip' },
      { selector: 'nav', format: 'skip' },
      { selector: 'footer', format: 'skip' },
      { selector: 'header', format: 'skip' }
    ]
  });
  
  // Normalize whitespace
  const cleaned = plainText
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  // Try to extract first meaningful sentence
  const firstSentence = extractFirstSentence(cleaned);
  
  // If sentence is longer than maxLength, truncate gracefully
  if (firstSentence.length <= maxLength) return firstSentence;
  
  // Truncate at word boundary
  const truncated = firstSentence.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  const lastPunctuationIndex = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  // Prefer ending at punctuation if it's close to the length limit
  if (lastPunctuationIndex > maxLength * 0.7 && lastPunctuationIndex < maxLength) {
    return truncated.substring(0, lastPunctuationIndex + 1);
  }
  
  return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) + '...' : truncated + '...';
}

/**
 * Detect job field based on title and description keywords
 */
export function detectField(title: string, description: string): JobField {
  const text = `${title} ${description}`.toLowerCase();
  
  const fieldKeywords = {
    'CS': ['software', 'developer', 'programmer', 'coding', 'computer', 'it', 'data science', 'ai', 'machine learning', 'web', 'frontend', 'backend', 'full stack', 'devops', 'cloud', 'python', 'java', 'javascript', 'react', 'angular', 'node'],
    'Electrical': ['electrical', 'electronics', 'vlsi', 'embedded', 'circuit', 'power systems', 'control systems', 'telecommunication'],
    'Mechanical': ['mechanical', 'manufacturing', 'automotive', 'thermal', 'design', 'cad', 'cam', 'production', 'automobile'],
    'Civil': ['civil', 'construction', 'structural', 'architecture', 'urban planning', 'infrastructure', 'building'],
    'Chemical': ['chemical', 'petrochemical', 'pharmaceutical', 'process', 'refinery', 'polymer']
  };
  
  for (const [field, keywords] of Object.entries(fieldKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return field as JobField;
    }
  }
  
  return 'Other';
}

/**
 * Detect job work mode based on description keywords
 */
export function detectMode(description: string): JobMode {
  const text = description.toLowerCase();
  
  if (text.includes('remote') || text.includes('work from home') || text.includes('wfh')) {
    return 'remote';
  }
  
  if (text.includes('hybrid') || text.includes('partial remote')) {
    return 'hybrid';
  }
  
  return 'onsite';
}

/**
 * Detect job type based on title keywords
 */
export function detectType(title: string): 'internship' | 'full-time' | 'part-time' | 'remote' {
  const text = title.toLowerCase();
  
  if (text.includes('intern') || text.includes('trainee') || text.includes('internship')) {
    return 'internship';
  }
  
  if (text.includes('part time') || text.includes('part-time')) {
    return 'part-time';
  }
  
  if (text.includes('remote') && !text.includes('intern')) {
    return 'remote';
  }
  
  return 'full-time';
}

/**
 * Detect if opportunity is from government source
 */
export function detectGovernment(source: string, title: string = ''): boolean {
  const govKeywords = ['government', 'gov', 'psu', 'public sector', 'ministry', 'department'];
  const govSources = ['aicte', 'national career service', 'gov.in', 'nic.in'];
  
  const sourceText = source.toLowerCase();
  const titleText = title.toLowerCase();
  
  return govKeywords.some(keyword => sourceText.includes(keyword) || titleText.includes(keyword)) ||
         govSources.some(govSource => sourceText.includes(govSource));
}

/**
 * Detect if job is India-focused
 */
export function detectRegion(location: string, description: string): 'india' | 'global' | 'restricted' {
  const text = `${location} ${description}`.toLowerCase();
  
  const indiaKeywords = ['india', 'mumbai', 'delhi', 'bangalore', 'pune', 'hyderabad', 'chennai', 'kolkata', 'gwalior', 'jaipur', 'lucknow', 'bengaluru'];
  const restrictedKeywords = ['visa required', 'h1b', 'green card', 'us citizens only', 'uk only'];
  
  if (restrictedKeywords.some(keyword => text.includes(keyword))) {
    return 'restricted';
  }
  
  if (indiaKeywords.some(keyword => text.includes(keyword))) {
    return 'india';
  }
  
  return 'global';
}

/**
 * Generate unique external ID for deduplication
 */
export function generateExternalId(source: string, title: string, company: string): string {
  const combined = `${source}-${title}-${company}`.toLowerCase();
  return Buffer.from(combined).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

/**
 * Validate and normalize job data
 */
export function validateJob(job: ScrapedJob): ScrapedJob | null {
  if (!job.title || !job.company || !job.applicationUrl) {
    return null;
  }
  
  // Clean and validate URL
  try {
    new URL(job.applicationUrl);
  } catch {
    return null;
  }
  
  return {
    ...job,
    title: job.title.trim(),
    company: job.company.trim(),
    location: job.location?.trim() || 'Location not specified',
    description: cleanText(job.description),
    requirements: job.requirements || [],
    source: job.source.trim()
  };
}
