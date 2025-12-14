import { 
  type Coordinator, type InsertCoordinator,
  type Student, type InsertStudent,
  type Drive, type InsertDrive,
  type Resume, type InsertResume,
  type Application, type InsertApplication,
  type Discussion, type InsertDiscussion,
  type DiscussionReply, type InsertDiscussionReply,
  type Message, type InsertMessage,
  type AIAnalysis,
  coordinators, students, drives, resumes, applications, discussions, discussionReplies, discussionLikes, messages, aiAnalyses
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, ilike } from "drizzle-orm";
import { randomUUID } from "crypto";

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
  getApplicationByStudentAndDrive(studentId: number, driveId: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, data: Partial<Application>): Promise<Application | undefined>;
  deleteApplication(id: number): Promise<boolean>;
  
  // Discussions
  getDiscussion(id: number): Promise<Discussion | undefined>;
  getDiscussionsByCoordinator(coordinatorId: number): Promise<Discussion[]>;
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  likeDiscussion(discussionId: number, studentId: number): Promise<boolean>;
  unlikeDiscussion(discussionId: number, studentId: number): Promise<boolean>;
  
  // Discussion Replies
  getRepliesByDiscussion(discussionId: number): Promise<DiscussionReply[]>;
  createReply(reply: InsertDiscussionReply): Promise<DiscussionReply>;
  
  // Messages
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<boolean>;
  
  // AI Analysis
  getAnalysisByApplication(applicationId: number): Promise<AIAnalysis | undefined>;
  createAnalysis(applicationId: number, matchScore: number, missingKeywords: string[], suggestions: string[]): Promise<AIAnalysis>;
}

export class DatabaseStorage implements IStorage {
  // Coordinators
  async getCoordinator(id: number): Promise<Coordinator | undefined> {
    const [coordinator] = await db.select().from(coordinators).where(eq(coordinators.id, id));
    return coordinator;
  }

  async getCoordinatorByEmail(email: string): Promise<Coordinator | undefined> {
    const [coordinator] = await db.select().from(coordinators).where(eq(coordinators.email, email));
    return coordinator;
  }

  async getCoordinatorByInviteCode(inviteCode: string): Promise<Coordinator | undefined> {
    const [coordinator] = await db.select().from(coordinators).where(eq(coordinators.inviteCode, inviteCode));
    return coordinator;
  }

  async createCoordinator(coordinator: InsertCoordinator): Promise<Coordinator> {
    const inviteCode = this.generateInviteCode();
    const [created] = await db.insert(coordinators).values({
      ...coordinator,
      inviteCode,
    }).returning();
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
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.email, email));
    return student;
  }

  async getStudentsByCoordinator(coordinatorId: number): Promise<Student[]> {
    return db.select().from(students).where(eq(students.coordinatorId, coordinatorId)).orderBy(desc(students.createdAt));
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(students).values(student).returning();
    return created;
  }

  async updateStudent(id: number, data: Partial<Student>): Promise<Student | undefined> {
    const [updated] = await db.update(students).set(data).where(eq(students.id, id)).returning();
    return updated;
  }

  // Drives
  async getDrive(id: number): Promise<Drive | undefined> {
    const [drive] = await db.select().from(drives).where(eq(drives.id, id));
    return drive;
  }

  async getDrivesByCoordinator(coordinatorId: number): Promise<Drive[]> {
    return db.select().from(drives).where(eq(drives.coordinatorId, coordinatorId)).orderBy(desc(drives.createdAt));
  }

  async getActiveDrives(coordinatorId: number): Promise<Drive[]> {
    return db.select().from(drives)
      .where(and(
        eq(drives.coordinatorId, coordinatorId),
        eq(drives.status, "Active")
      ))
      .orderBy(desc(drives.createdAt));
  }

  async createDrive(drive: InsertDrive): Promise<Drive> {
    const [created] = await db.insert(drives).values(drive).returning();
    return created;
  }

  async updateDrive(id: number, data: Partial<Drive>): Promise<Drive | undefined> {
    const [updated] = await db.update(drives).set(data).where(eq(drives.id, id)).returning();
    return updated;
  }

  async deleteDrive(id: number): Promise<boolean> {
    await db.delete(applications).where(eq(applications.driveId, id));
    const result = await db.delete(drives).where(eq(drives.id, id)).returning();
    return result.length > 0;
  }

  
  // Resumes
  async getResume(id: number): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    return resume;
  }

  async getResumesByStudent(studentId: number): Promise<Resume[]> {
    return db.select().from(resumes).where(eq(resumes.studentId, studentId)).orderBy(desc(resumes.uploadedAt));
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    // If this is the first resume or isDefault is true, update other resumes
    if (resume.isDefault) {
      await db.update(resumes)
        .set({ isDefault: false })
        .where(eq(resumes.studentId, resume.studentId));
    }
    const [created] = await db.insert(resumes).values(resume).returning();
    return created;
  }

  async updateResume(id: number, data: Partial<Resume>): Promise<Resume | undefined> {
    const [updated] = await db.update(resumes).set(data).where(eq(resumes.id, id)).returning();
    return updated;
  }

  async deleteResume(id: number): Promise<boolean> {
    const result = await db.delete(resumes).where(eq(resumes.id, id)).returning();
    return result.length > 0;
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
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application;
  }

  async getApplicationsByStudent(studentId: number): Promise<Application[]> {
    return db.select().from(applications)
      .where(eq(applications.studentId, studentId))
      .orderBy(desc(applications.appliedAt));
  }

  async getApplicationsByDrive(driveId: number): Promise<Application[]> {
    return db.select().from(applications)
      .where(eq(applications.driveId, driveId))
      .orderBy(desc(applications.appliedAt));
  }

  async getApplicationByStudentAndDrive(studentId: number, driveId: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications)
      .where(and(eq(applications.studentId, studentId), eq(applications.driveId, driveId)));
    return application;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [created] = await db.insert(applications).values(application).returning();
    return created;
  }

  async updateApplication(id: number, data: Partial<Application>): Promise<Application | undefined> {
    const [updated] = await db.update(applications).set(data).where(eq(applications.id, id)).returning();
    return updated;
  }

  async deleteApplication(id: number): Promise<boolean> {
    const result = await db.delete(applications).where(eq(applications.id, id)).returning();
    return result.length > 0;
  }

  // Discussions
  async getDiscussion(id: number): Promise<Discussion | undefined> {
    const [discussion] = await db.select().from(discussions).where(eq(discussions.id, id));
    return discussion;
  }

  async getDiscussionsByCoordinator(coordinatorId: number): Promise<Discussion[]> {
    // Get discussions from students belonging to this coordinator
    const studentIds = await db.select({ id: students.id })
      .from(students)
      .where(eq(students.coordinatorId, coordinatorId));
    
    if (studentIds.length === 0) return [];
    
    const ids = studentIds.map(s => s.id);
    return db.select().from(discussions)
      .where(sql`${discussions.authorId} = ANY(${ids})`)
      .orderBy(desc(discussions.createdAt));
  }

  async createDiscussion(discussion: InsertDiscussion): Promise<Discussion> {
    const [created] = await db.insert(discussions).values(discussion).returning();
    return created;
  }

  async likeDiscussion(discussionId: number, studentId: number): Promise<boolean> {
    // Check if already liked
    const [existing] = await db.select().from(discussionLikes)
      .where(and(eq(discussionLikes.discussionId, discussionId), eq(discussionLikes.studentId, studentId)));
    
    if (existing) return false;

    await db.insert(discussionLikes).values({ discussionId, studentId });
    await db.update(discussions)
      .set({ likesCount: sql`${discussions.likesCount} + 1` })
      .where(eq(discussions.id, discussionId));
    
    return true;
  }

  async unlikeDiscussion(discussionId: number, studentId: number): Promise<boolean> {
    const result = await db.delete(discussionLikes)
      .where(and(eq(discussionLikes.discussionId, discussionId), eq(discussionLikes.studentId, studentId)))
      .returning();
    
    if (result.length > 0) {
      await db.update(discussions)
        .set({ likesCount: sql`${discussions.likesCount} - 1` })
        .where(eq(discussions.id, discussionId));
      return true;
    }
    return false;
  }

  // Discussion Replies
  async getRepliesByDiscussion(discussionId: number): Promise<DiscussionReply[]> {
    return db.select().from(discussionReplies)
      .where(eq(discussionReplies.discussionId, discussionId))
      .orderBy(asc(discussionReplies.createdAt));
  }

  async createReply(reply: InsertDiscussionReply): Promise<DiscussionReply> {
    const [created] = await db.insert(discussionReplies).values(reply).returning();
    return created;
  }

  // Messages
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return db.select().from(messages)
      .where(sql`
        (${messages.senderId} = ${userId1} AND ${messages.receiverId} = ${userId2})
        OR (${messages.senderId} = ${userId2} AND ${messages.receiverId} = ${userId1})
      `)
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<boolean> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.senderId, senderId),
        eq(messages.receiverId, receiverId),
        eq(messages.isRead, false)
      ));
    return true;
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
}

export const storage = new DatabaseStorage();
