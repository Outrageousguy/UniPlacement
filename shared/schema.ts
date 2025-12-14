import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["coordinator", "student"]);
export const driveStatusEnum = pgEnum("drive_status", ["Active", "Completed", "Cancelled"]);
export const applicationStatusEnum = pgEnum("application_status", ["Registered", "Shortlisted", "Interview", "Selected", "Rejected"]);
export const placementStatusEnum = pgEnum("placement_status", ["Not Placed", "Placed", "Opted Out"]);

// Coordinators table
export const coordinators = pgTable("coordinators", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  universityName: text("university_name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Students table
export const students = pgTable("students", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  rollNumber: text("roll_number").notNull().unique(),
  branch: text("branch").notNull(),
  graduationYear: integer("graduation_year").notNull(),
  cgpa: decimal("cgpa", { precision: 3, scale: 2 }).notNull(),
  activeBacklogs: integer("active_backlogs").notNull().default(0),
  placementStatus: placementStatusEnum("placement_status").notNull().default("Not Placed"),
  placedCompany: text("placed_company"),
  placedPackage: decimal("placed_package", { precision: 5, scale: 2 }),
  coordinatorId: integer("coordinator_id").notNull().references(() => coordinators.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Drives table
export const drives = pgTable("drives", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyName: text("company_name").notNull(),
  jobRole: text("job_role").notNull(),
  ctcMin: decimal("ctc_min", { precision: 5, scale: 2 }).notNull(),
  ctcMax: decimal("ctc_max", { precision: 5, scale: 2 }).notNull(),
  jobDescription: text("job_description").notNull(),
  minCgpa: decimal("min_cgpa", { precision: 3, scale: 2 }).notNull(),
  maxBacklogs: integer("max_backlogs").notNull().default(0),
  allowedBranches: text("allowed_branches").array().notNull(),
  registrationDeadline: timestamp("registration_deadline").notNull(),
  status: driveStatusEnum("status").notNull().default("Active"),
  coordinatorId: integer("coordinator_id").notNull().references(() => coordinators.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Resumes table
export const resumes = pgTable("resumes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  fileContent: text("file_content").notNull(), // Base64 encoded PDF content
  isDefault: boolean("is_default").notNull().default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Applications table
export const applications = pgTable("applications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  driveId: integer("drive_id").notNull().references(() => drives.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  resumeId: integer("resume_id").notNull().references(() => resumes.id),
  status: applicationStatusEnum("status").notNull().default("Registered"),
  matchScore: integer("match_score"),
  notes: text("notes"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

// Discussions table
export const discussions = pgTable("discussions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  tags: text("tags").array().notNull().default([]),
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Discussion likes table
export const discussionLikes = pgTable("discussion_likes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  discussionId: integer("discussion_id").notNull().references(() => discussions.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Discussion replies table
export const discussionReplies = pgTable("discussion_replies", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  discussionId: integer("discussion_id").notNull().references(() => discussions.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages table (for student-to-student chat)
export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  senderId: integer("sender_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Analysis results table
export const aiAnalyses = pgTable("ai_analyses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  applicationId: integer("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  matchScore: integer("match_score").notNull(),
  missingKeywords: text("missing_keywords").array().notNull().default([]),
  suggestions: text("suggestions").array().notNull().default([]),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

// Relations
export const coordinatorsRelations = relations(coordinators, ({ many }) => ({
  students: many(students),
  drives: many(drives),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  coordinator: one(coordinators, {
    fields: [students.coordinatorId],
    references: [coordinators.id],
  }),
  resumes: many(resumes),
  applications: many(applications),
  discussions: many(discussions),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
}));

export const drivesRelations = relations(drives, ({ one, many }) => ({
  coordinator: one(coordinators, {
    fields: [drives.coordinatorId],
    references: [coordinators.id],
  }),
  applications: many(applications),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  student: one(students, {
    fields: [resumes.studentId],
    references: [students.id],
  }),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  drive: one(drives, {
    fields: [applications.driveId],
    references: [drives.id],
  }),
  student: one(students, {
    fields: [applications.studentId],
    references: [students.id],
  }),
  resume: one(resumes, {
    fields: [applications.resumeId],
    references: [resumes.id],
  }),
  aiAnalyses: many(aiAnalyses),
}));

export const discussionsRelations = relations(discussions, ({ one, many }) => ({
  author: one(students, {
    fields: [discussions.authorId],
    references: [students.id],
  }),
  replies: many(discussionReplies),
  likes: many(discussionLikes),
}));

export const discussionRepliesRelations = relations(discussionReplies, ({ one }) => ({
  discussion: one(discussions, {
    fields: [discussionReplies.discussionId],
    references: [discussions.id],
  }),
  author: one(students, {
    fields: [discussionReplies.authorId],
    references: [students.id],
  }),
}));

export const discussionLikesRelations = relations(discussionLikes, ({ one }) => ({
  discussion: one(discussions, {
    fields: [discussionLikes.discussionId],
    references: [discussions.id],
  }),
  student: one(students, {
    fields: [discussionLikes.studentId],
    references: [students.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(students, {
    fields: [messages.senderId],
    references: [students.id],
    relationName: "sentMessages",
  }),
  receiver: one(students, {
    fields: [messages.receiverId],
    references: [students.id],
    relationName: "receivedMessages",
  }),
}));

export const aiAnalysesRelations = relations(aiAnalyses, ({ one }) => ({
  application: one(applications, {
    fields: [aiAnalyses.applicationId],
    references: [applications.id],
  }),
}));

// Insert schemas - using pick instead of omit to avoid TypeScript issues
export const insertCoordinatorSchema = createInsertSchema(coordinators, {
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  universityName: z.string().min(2),
}).pick({
  email: true,
  password: true,
  name: true,
  universityName: true,
});

export const insertStudentSchema = createInsertSchema(students, {
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  rollNumber: z.string().min(2),
  branch: z.string().min(2),
  graduationYear: z.number().int().min(2020).max(2030),
  cgpa: z.string(),
  activeBacklogs: z.number().int().min(0),
  coordinatorId: z.number().int(),
}).pick({
  email: true,
  password: true,
  name: true,
  rollNumber: true,
  branch: true,
  graduationYear: true,
  cgpa: true,
  activeBacklogs: true,
  coordinatorId: true,
});

export const insertDriveSchema = createInsertSchema(drives, {
  companyName: z.string().min(2),
  jobRole: z.string().min(2),
  ctcMin: z.string(),
  ctcMax: z.string(),
  jobDescription: z.string().min(10),
  minCgpa: z.string(),
  maxBacklogs: z.number().int().min(0),
  allowedBranches: z.array(z.string()),
  registrationDeadline: z.coerce.date(),
  coordinatorId: z.number().int(),
}).pick({
  companyName: true,
  jobRole: true,
  ctcMin: true,
  ctcMax: true,
  jobDescription: true,
  minCgpa: true,
  maxBacklogs: true,
  allowedBranches: true,
  registrationDeadline: true,
  coordinatorId: true,
});

export const insertResumeSchema = createInsertSchema(resumes, {
  studentId: z.number().int(),
  name: z.string().min(1),
  fileName: z.string().min(1),
  fileContent: z.string(),
  isDefault: z.boolean(),
}).pick({
  studentId: true,
  name: true,
  fileName: true,
  fileContent: true,
  isDefault: true,
});

export const insertApplicationSchema = createInsertSchema(applications, {
  driveId: z.number().int(),
  studentId: z.number().int(),
  resumeId: z.number().int(),
  notes: z.string().optional(),
}).pick({
  driveId: true,
  studentId: true,
  resumeId: true,
  notes: true,
});

export const insertDiscussionSchema = createInsertSchema(discussions, {
  title: z.string().min(3),
  content: z.string().min(10),
  authorId: z.number().int(),
  tags: z.array(z.string()),
}).pick({
  title: true,
  content: true,
  authorId: true,
  tags: true,
});

export const insertDiscussionReplySchema = createInsertSchema(discussionReplies, {
  discussionId: z.number().int(),
  authorId: z.number().int(),
  content: z.string().min(1),
}).pick({
  discussionId: true,
  authorId: true,
  content: true,
});

export const insertMessageSchema = createInsertSchema(messages, {
  senderId: z.number().int(),
  receiverId: z.number().int(),
  content: z.string().min(1),
}).pick({
  senderId: true,
  receiverId: true,
  content: true,
});

// Types
export type InsertCoordinator = z.infer<typeof insertCoordinatorSchema>;
export type Coordinator = typeof coordinators.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertDrive = z.infer<typeof insertDriveSchema>;
export type Drive = typeof drives.$inferSelect;

export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;
export type Discussion = typeof discussions.$inferSelect;

export type InsertDiscussionReply = z.infer<typeof insertDiscussionReplySchema>;
export type DiscussionReply = typeof discussionReplies.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type AIAnalysis = typeof aiAnalyses.$inferSelect;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const coordinatorRegisterSchema = insertCoordinatorSchema.extend({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  universityName: z.string().min(2, "University name must be at least 2 characters"),
});

export const studentRegisterSchema = insertStudentSchema.extend({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  rollNumber: z.string().min(2, "Roll number is required"),
  branch: z.string().min(2, "Branch is required"),
  graduationYear: z.coerce.number().min(2020).max(2030),
  cgpa: z.coerce.number().min(0).max(10),
  activeBacklogs: z.coerce.number().min(0).default(0),
  inviteCode: z.string().min(1, "Invite code is required"),
}).omit({ coordinatorId: true });

export type LoginData = z.infer<typeof loginSchema>;
export type CoordinatorRegisterData = z.infer<typeof coordinatorRegisterSchema>;
export type StudentRegisterData = z.infer<typeof studentRegisterSchema>;
