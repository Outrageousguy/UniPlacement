import { 
  type Coordinator, type InsertCoordinator,
  type Student, type InsertStudent,
  type Drive, type InsertDrive,
  type Resume, type InsertResume,
  type Application, type InsertApplication,
  type AIAnalysis,
  type ExternalOpportunity,
  coordinators, students, drives, resumes, applications, aiAnalyses, externalOpportunities
} from "@shared/schema";
import { NormalizedJob } from "./scrapers/types.js";
import { detectRegion } from "./scrapers/utils.js";
import { db, retryDb } from "./db";
import { eq, and, desc, asc, sql, ilike, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { inArray } from "drizzle-orm";

// ✅ STEP 1: Safe date parser function
function safeDate(date: any): Date {
  const d = new Date(date);

  if (!date || isNaN(d.getTime())) {
    return new Date(); // fallback to NOW
  }

  return d;
}

// 🔥 ADD QUALITY SCORE (GAME CHANGER)
function scoreJob(job: NormalizedJob): number {
  let score = 0;
  const text = `${job.title} ${job.description}`.toLowerCase();

  // Title quality
  if (job.title.length > 5) score += 1;
  if (job.title.toLowerCase().includes("engineer")) score += 2;

  // Description quality
  if (job.description.length > 100) score += 2;
  if (job.description.length > 300) score += 2;

  // Requirements
  if (job.requirements.length > 0) score += 2;

  // Links
  if (job.applicationUrl.includes("http")) score += 1;

  // Boost Indian relevance
  if (text.includes("india")) score += 3;

  // Penalize junk
  if (text.includes("visa required")) score -= 3;
  if (text.includes("unpaid")) score -= 5;

  return score;
}

export interface IStorage {
  // Coordinators
  getCoordinator(id: number): Promise<Coordinator | undefined>;
  getCoordinatorByEmail(email: string): Promise<Coordinator | undefined>;
  getCoordinatorByInviteCode(inviteCode: string): Promise<Coordinator | undefined>;
  createCoordinator(coordinator: InsertCoordinator): Promise<Coordinator>;
  
  // Students
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  getStudentsByCoordinator(coordinatorId: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, data: Partial<Student>): Promise<Student | undefined>;
  
  // Drives
  getDrive(id: number): Promise<Drive | undefined>;
  getDrivesByCoordinator(coordinatorId: number): Promise<Drive[]>;
  getActiveDrives(coordinatorId: number): Promise<Drive[]>;
  createDrive(drive: InsertDrive): Promise<Drive>;
  updateDrive(id: number, data: Partial<Drive>): Promise<Drive | undefined>;
  deleteDrive(id: number): Promise<boolean>;
  
  // Resumes
  getResume(id: number): Promise<Resume | undefined>;
  getResumesByStudent(studentId: number): Promise<Resume[]>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(id: number, data: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: number): Promise<boolean>;
  setDefaultResume(studentId: number, resumeId: number): Promise<boolean>;
  
  // Applications
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsByStudent(studentId: number): Promise<Application[]>;
  getApplicationsByDrive(driveId: number): Promise<Application[]>;
  getApplicationsByResume(resumeId: number): Promise<Application[]>;
  getApplicationByStudentAndDrive(studentId: number, driveId: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, data: Partial<Application>): Promise<Application | undefined>;
  deleteApplication(id: number): Promise<boolean>;
  
  // AI Analysis
  getAnalysisByApplication(applicationId: number): Promise<AIAnalysis | undefined>;
  createAnalysis(applicationId: number, matchScore: number, missingKeywords: string[], suggestions: string[]): Promise<AIAnalysis>;
  
  // External Opportunities
  saveJobs(jobs: any[]): Promise<void>;
  getExternalOpportunities(filters?: {
    jobType?: string;
    location?: string;
    source?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExternalOpportunity[]>;
  getOpportunityById(id: number): Promise<ExternalOpportunity | null>;
}

export class DatabaseStorage implements IStorage {
  // Coordinators
  async getCoordinator(id: number): Promise<Coordinator | undefined> {
    const [coordinator] = await retryDb(() => db.select().from(coordinators).where(eq(coordinators.id, id))) as Coordinator[];
    return coordinator;
  }

  async getCoordinatorByEmail(email: string): Promise<Coordinator | undefined> {
    const [coordinator] = await retryDb(() => db.select().from(coordinators).where(eq(coordinators.email, email))) as Coordinator[];
    return coordinator;
  }

  async getCoordinatorByInviteCode(inviteCode: string): Promise<Coordinator | undefined> {
    const [coordinator] = await retryDb(() => db.select().from(coordinators).where(eq(coordinators.inviteCode, inviteCode))) as Coordinator[];
    return coordinator;
  }

  async createCoordinator(coordinator: InsertCoordinator): Promise<Coordinator> {
    const inviteCode = this.generateInviteCode();
    const [created] = await (db.insert(coordinators).values({
      ...coordinator,
      inviteCode,
    }).returning()) as Coordinator[];
    return created;
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 3; i++) {
      if (i > 0) code += '-';
      for (let j = 0; j < 4; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    return code;
  }

  // Students
  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await retryDb(() => db.select().from(students).where(eq(students.id, id))) as Student[];
    return student;
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const [student] = await retryDb(() => db.select().from(students).where(eq(students.email, email))) as Student[];
    return student;
  }

  async getStudentsByCoordinator(coordinatorId: number): Promise<Student[]> {
    return (await retryDb(() => db.select().from(students).where(eq(students.coordinatorId, coordinatorId)).orderBy(desc(students.createdAt)))) as Student[];
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await (db.insert(students).values(student).returning()) as Student[];
    return created;
  }

  async updateStudent(id: number, data: Partial<Student>): Promise<Student | undefined> {
    const [updated] = await db.update(students).set(data).where(eq(students.id, id)).returning();
    return updated;
  }

  // Drives
  async getDrive(id: number): Promise<Drive | undefined> {
    const [drive] = await retryDb(() => db.select().from(drives).where(eq(drives.id, id))) as Drive[];
    return drive;
  }

  async getDrivesByCoordinator(coordinatorId: number): Promise<Drive[]> {
    return (await retryDb(() => db.select().from(drives).where(eq(drives.coordinatorId, coordinatorId)).orderBy(desc(drives.createdAt)))) as Drive[];
  }

  async getActiveDrives(coordinatorId: number): Promise<Drive[]> {
    return (await retryDb(() => db.select().from(drives)
      .where(and(
        eq(drives.coordinatorId, coordinatorId),
        eq(drives.status, "Active")
      ))
      .orderBy(desc(drives.createdAt)))) as Drive[];
  }

  async createDrive(drive: InsertDrive): Promise<Drive> {
    const [created] = await (db.insert(drives).values(drive).returning()) as Drive[];
    return created;
  }

  async updateDrive(id: number, data: Partial<Drive>): Promise<Drive | undefined> {
    const [updated] = await db.update(drives).set(data).where(eq(drives.id, id)).returning() as Drive[];
    return updated;
  }

  async deleteDrive(id: number): Promise<boolean> {
    await db.delete(applications).where(eq(applications.driveId, id));
    const result = await db.delete(drives).where(eq(drives.id, id)).returning();
    return Array.isArray(result) && result.length > 0;
  }

  
  // Resumes
  async getResume(id: number): Promise<Resume | undefined> {
    const [resume] = await retryDb(() => db.select().from(resumes).where(eq(resumes.id, id))) as Resume[];
    return resume;
  }

  async getResumesByStudent(studentId: number): Promise<Resume[]> {
    return (await retryDb(() => db.select().from(resumes).where(eq(resumes.studentId, studentId)).orderBy(desc(resumes.uploadedAt)))) as Resume[];
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    // If this is the first resume or isDefault is true, update other resumes
    if ((resume as any).isDefault) {
      await db.update(resumes)
        .set({ isDefault: false })
        .where(eq(resumes.studentId, (resume as any).studentId));
    }
    const [created] = await (db.insert(resumes).values(resume).returning()) as Resume[];
    return created;
  }

  async updateResume(id: number, data: Partial<Resume>): Promise<Resume | undefined> {
    const [updated] = await db.update(resumes).set(data).where(eq(resumes.id, id)).returning() as Resume[];
    return updated;
  }

  async deleteResume(id: number): Promise<boolean> {
    const result = await db.delete(resumes).where(eq(resumes.id, id)).returning();
    return Array.isArray(result) && result.length > 0;
  }

  async setDefaultResume(studentId: number, resumeId: number): Promise<boolean> {
    await db.update(resumes)
      .set({ isDefault: false })
      .where(eq(resumes.studentId, studentId));
    
    const [updated] = await db.update(resumes)
      .set({ isDefault: true })
      .where(and(eq(resumes.id, resumeId), eq(resumes.studentId, studentId)))
      .returning();
    
    return !!updated;
  }

  // Applications
  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id)) as Application[];
    return application;
  }

  async getApplicationsByStudent(studentId: number): Promise<Application[]> {
    return (await db.select().from(applications)
      .where(eq(applications.studentId, studentId))
      .orderBy(desc(applications.appliedAt))) as Application[];
  }

  async getApplicationsByDrive(driveId: number): Promise<Application[]> {
    return (await db.select().from(applications)
      .where(eq(applications.driveId, driveId))
      .orderBy(desc(applications.appliedAt))) as Application[];
  }

  async getApplicationsByResume(resumeId: number): Promise<Application[]> {
    return (await db.select().from(applications)
      .where(eq(applications.resumeId, resumeId))
      .orderBy(desc(applications.appliedAt))) as Application[];
  }

  async getApplicationByStudentAndDrive(studentId: number, driveId: number): Promise<Application | undefined> {
    const [application] = await (db.select().from(applications)
      .where(and(eq(applications.studentId, studentId), eq(applications.driveId, driveId)))) as Application[];
    return application;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [created] = await (db.insert(applications).values(application).returning()) as Application[];
    return created;
  }

  async updateApplication(id: number, data: Partial<Application>): Promise<Application | undefined> {
    const [updated] = await db.update(applications).set(data).where(eq(applications.id, id)).returning() as Application[];
    return updated;
  }

  async deleteApplication(id: number): Promise<boolean> {
    await db.delete(applications).where(eq(applications.id, id));
    const result = await db.delete(applications).where(eq(applications.id, id)).returning();
    return Array.isArray(result) && result.length > 0;
  }

  
  // AI Analysis
  async getAnalysisByApplication(applicationId: number): Promise<AIAnalysis | undefined> {
    const [analysis] = await db.select().from(aiAnalyses)
      .where(eq(aiAnalyses.applicationId, applicationId))
      .orderBy(desc(aiAnalyses.analyzedAt))
      .limit(1);
    return analysis;
  }

  async createAnalysis(applicationId: number, matchScore: number, missingKeywords: string[], suggestions: string[]): Promise<AIAnalysis> {
    const [created] = await db.insert(aiAnalyses).values({
      applicationId,
      matchScore,
      missingKeywords,
      suggestions,
    }).returning();
    return created;
  }

  // External Opportunities
async saveJobs(jobs: NormalizedJob[]): Promise<void> {
  console.log(`Saving ${jobs.length} jobs...`);

  const results = await Promise.allSettled(
    jobs.map(job => retryDb(() => this.upsertJob(job)))
  );

  const success = results.filter(r => r.status === "fulfilled").length;
  const failed = results.filter(r => r.status === "rejected").length;

  console.log(`Jobs saved: ${success}, failed: ${failed}`);

  if (failed > 0) {
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`Job ${i} failed:`, r.reason);
      }
    });
  }
}

private async upsertJob(job: NormalizedJob): Promise<void> {
  if (!job.title || !job.company || !job.applicationUrl) return;

  // 🚨 EXTRA HARDENING: Ensure postedDate exists
  if (!job.postedDate) {
    job.postedDate = new Date();
  }

  const now = new Date();
  const region = detectRegion(job.location || '', job.description || '');

  // 🔥 USE IT in upsertJob
  const qualityScore = scoreJob(job);
  if (qualityScore < 3) return; // ❌ DROP LOW QUALITY

  // ✅ 2. DEDUPLICATION (CRITICAL)
  const duplicate = await db
    .select()
    .from(externalOpportunities)
    .where(
      and(
        ilike(externalOpportunities.title, `%${job.title}%`),
        ilike(externalOpportunities.company, `%${job.company}%`)
      )
    )
    .limit(1);

  if (duplicate.length > 0) return; // ❌ SKIP DUPLICATE

  // ✅ 6. ADD FRESHNESS FILTER (HUGE UX BOOST)
  const daysOld =
    (Date.now() - safeDate(job.postedDate).getTime()) /
    (1000 * 60 * 60 * 24);

  if (daysOld > 30) return; // ❌ drop old jobs

  const existing = await db
    .select()
    .from(externalOpportunities)
    .where(eq(externalOpportunities.externalId, job.externalId))
    .limit(1);

  // 🔥 FINAL INSERT (READY TO PASTE)
  if (existing.length === 0) {
    await db.insert(externalOpportunities).values({
      externalId: job.externalId,
      title: job.title,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      description: job.description,
      requirements: job.requirements,
      applicationUrl: job.applicationUrl,
      source: job.source,
      postedDate: safeDate(job.postedDate), // ✅ FIX
      region,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });

    return;
  }

  const current = existing[0];

  // ✅ STEP 3: OPTIONAL (BEST PRACTICE) - Safe comparison
  const existingDate = safeDate(current.postedDate).getTime();
  const newDate = safeDate(job.postedDate).getTime();

  const shouldUpdate =
    !current.isActive ||
    current.title !== job.title ||
    current.company !== job.company ||
    current.location !== job.location ||
    existingDate !== newDate;

  if (!shouldUpdate) return;

  // 🔥 FINAL UPDATE
  await db
    .update(externalOpportunities)
    .set({
      title: job.title,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      description: job.description,
      requirements: job.requirements,
      applicationUrl: job.applicationUrl,
      postedDate: safeDate(job.postedDate), // ✅ FIX
      region,
      isActive: true,
      updatedAt: now
    })
    .where(eq(externalOpportunities.externalId, job.externalId));
}

async getExternalOpportunities(filters: {
  jobType?: string;
  location?: string;
  source?: string;
  search?: string;
  region?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<ExternalOpportunity[]> {

  const { jobType, location, source, search, region, limit = 50, offset = 0 } = filters;

  const conditions = [
    eq(externalOpportunities.isActive, true),
  ];

  // 🔥 FIXED: Only filter when specific region requested
  if (region) {
    if (region === "india") {
      conditions.push(eq(externalOpportunities.region, "india"));
    } else if (region === "global") {
      conditions.push(eq(externalOpportunities.region, "global"));
    }
    // Note: "restricted" jobs are never shown
  } else {
    // Default: show both india and global jobs
    const regionFilter = or(
      eq(externalOpportunities.region, "india"),
      eq(externalOpportunities.region, "global")
    );
    
    if (regionFilter) {
      conditions.push(regionFilter);
    }
  }

  if (jobType) {
    conditions.push(eq(externalOpportunities.jobType, jobType as any));
  }

  if (location) {
    conditions.push(
      ilike(externalOpportunities.location, `%${location}%`)
    );
  }

  if (source) {
    conditions.push(eq(externalOpportunities.source, source));
  }

  // FIXED SAFE SEARCH (no unsafe ! operator)
  if (search) {
    const q = `%${search}%`;

    const searchCondition = or(
      ilike(externalOpportunities.title, q),
      ilike(externalOpportunities.company, q),
      ilike(externalOpportunities.description, q)
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  return db
    .select()
    .from(externalOpportunities)
    .where(and(...conditions))
    .orderBy(
      desc(sql`CASE WHEN region = 'india' THEN 1 ELSE 0 END`),
      desc(sql`LENGTH(description)`),
      desc(externalOpportunities.postedDate)
    )
    .limit(limit)
    .offset(offset);
}

async getOpportunityById(id: number): Promise<ExternalOpportunity | null> {
  const result = await db
    .select()
    .from(externalOpportunities)
    .where(eq(externalOpportunities.id, id))
    .limit(1);

  return result[0] ?? null;
}
}

export const storage = new DatabaseStorage();