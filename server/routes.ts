import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";
import MemoryStore from "memorystore";
import { db } from "./db";
import { 
  loginSchema, 
  coordinatorRegisterSchema, 
  studentRegisterSchema,
  studentProfilePatchSchema,
  insertDriveSchema,
  insertResumeSchema,
  insertApplicationSchema,
  drives,
  students,
  applications,
  resumes,
  externalOpportunities,
  type Student,
} from "@shared/schema";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { eq, desc, sql, asc } from "drizzle-orm";
import { ScraperManager } from "./scrapers/index";
import {
  getOpportunities,
  searchOpportunities,
  getOpportunityById,
  refreshOpportunities,
  getOpportunitiesStats,
  cleanupOpportunities
} from './extended_opportunities/routes';


// Session type augmentation
declare module "express-session" {
  interface SessionData {
    user: {
      id: number;
      email: string;
      name: string;
      role: "coordinator" | "student";
      universityName?: string;
      rollNumber?: string;
      branch?: string;
      graduationYear?: number;
      cgpa?: string;
      activeBacklogs?: number;
      placementStatus?: string;
      coordinatorId?: number;
      inviteCode?: string;
    };
  }
}

function splitStudentName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function omitPassword<S extends { password: string }>(row: S) {
  const { password: _pw, ...rest } = row;
  return rest;
}

function computeProfileCompletion(s: Omit<Student, "password">): number {
  const checks = [
    !!(s.personalEmail?.trim()),
    !!(s.phone?.trim()),
    !!(s.whatsapp?.trim()),
    !!(s.linkedinUrl?.trim()),
    !!(s.portfolioUrl?.trim()),
    !!(s.professionalSummary?.trim()),
    !!(s.homeCity?.trim()),
    !!(s.willingToRelocate?.trim()),
    !!(s.preferredWorkCities?.trim()),
    s.tenthPercentage != null && String(s.tenthPercentage).length > 0,
    s.twelfthPercentage != null && String(s.twelfthPercentage).length > 0,
    !!(s.graduationGapYears?.trim()),
    !!(s.placementCategory?.trim()),
    !!(
      (s.certificationsText?.trim()) ||
      (s.achievementsText?.trim())
    ),
    (s.skillsProgramming?.length ?? 0) > 0,
    (s.skillsFrameworks?.length ?? 0) > 0,
    (s.skillsTools?.length ?? 0) > 0,
    !!(s.preferredRoleType?.trim()),
    !!(s.expectedCtcRange?.trim()),
    !!(s.preferredWorkMode?.trim()),
    !!(s.openToInternship?.trim()),
    !!(s.preferredIndustries?.trim()),
  ];
  const n = checks.filter(Boolean).length;
  return checks.length === 0 ? 0 : Math.round((n / checks.length) * 100);
}

async function setStudentSession(req: Request, student: Student) {
  const coordinator = await storage.getCoordinator(student.coordinatorId);
  req.session.user = {
    id: student.id,
    email: student.email,
    name: student.name,
    role: "student",
    rollNumber: student.rollNumber,
    branch: student.branch,
    graduationYear: student.graduationYear,
    cgpa: student.cgpa,
    activeBacklogs: student.activeBacklogs,
    placementStatus: student.placementStatus,
    coordinatorId: student.coordinatorId,
    universityName: coordinator?.universityName,
  };
}

// Middleware to check authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

// Helper function to safely get user from session
function getUser(req: Request) {
  if (!req.session.user) {
    throw new Error("User not authenticated");
  }
  return req.session.user;
}

function requireCoordinator(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user || req.session.user.role !== "coordinator") {
    return res.status(403).json({ message: "Coordinator access required" });
  }
  next();
}

function requireStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user || req.session.user.role !== "student") {
    return res.status(403).json({ message: "Student access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Session setup
  const MemoryStoreSession = MemoryStore(session);
  const sessionSecret = process.env.SESSION_SECRET;
  
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  
  app.get("/test-db", async (req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      res.send("DB Connected ✅");
    } catch (err) {
      console.error("DB ERROR:", err);
      res.send("DB Failed ❌");
    }
  });


  // ==================== AUTH ROUTES ====================
  
  // Get current user
  app.get("/api/auth/me", (req, res) => {
    if (req.session.user) {
      res.json({ user: req.session.user });
    } else {
      res.json({ user: null });
    }
  });

  // Coordinator registration
  app.post("/api/auth/register/coordinator", async (req, res) => {
    try {
      const data = coordinatorRegisterSchema.parse(req.body);
      
      // Check if email already exists
      const existingCoordinator = await storage.getCoordinatorByEmail(data.email);
      if (existingCoordinator) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create coordinator
      const coordinator = await storage.createCoordinator({
        ...data,
        password: hashedPassword
      });
      
      // Set session
      req.session.user = {
        id: coordinator.id,
        email: coordinator.email,
        name: coordinator.name,
        role: "coordinator",
        universityName: coordinator.universityName,
        inviteCode: coordinator.inviteCode
      };
      
      res.json({ 
        user: req.session.user,
        message: "Registration successful" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Student registration
  app.post("/api/auth/register/student", async (req, res) => {
    try {
      const data = studentRegisterSchema.parse(req.body);
      
      // Verify invite code
      const coordinator = await storage.getCoordinatorByInviteCode(data.inviteCode);
      if (!coordinator) {
        return res.status(400).json({ message: "Invalid invite code" });
      }
      
      // Check if email already exists
      const existingStudent = await storage.getStudentByEmail(data.email);
      if (existingStudent) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create student
      const student = await storage.createStudent({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        rollNumber: data.rollNumber,
        branch: data.branch,
        graduationYear: data.graduationYear,
        cgpa: data.cgpa.toString(),
        activeBacklogs: data.activeBacklogs,
        coordinatorId: coordinator.id
      });
      
      await setStudentSession(req, student);
      
      res.json({ 
        user: req.session.user,
        message: "Registration successful" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login (for both coordinator and student)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, role } = req.body;
      
      if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required" });
      }
      
      if (role === "coordinator") {
        const coordinator = await storage.getCoordinatorByEmail(email);
        if (!coordinator) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
        
        const validPassword = await bcrypt.compare(password, coordinator.password);
        if (!validPassword) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
        
        req.session.user = {
          id: coordinator.id,
          email: coordinator.email,
          name: coordinator.name,
          role: "coordinator",
          universityName: coordinator.universityName,
          inviteCode: coordinator.inviteCode
        };
      } else {
        const student = await storage.getStudentByEmail(email);
        if (!student) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
        
        const validPassword = await bcrypt.compare(password, student.password);
        if (!validPassword) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
        
        await setStudentSession(req, student);
      }
      
      res.json({ 
        user: req.session.user,
        message: "Login successful" 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // ==================== COORDINATOR ROUTES ====================

  // Get coordinator stats
  app.get("/api/coordinator/stats", requireCoordinator, async (req, res) => {
    try {
      const user = getUser(req);
      const coordinatorId = user.id;
      
      const students = await storage.getStudentsByCoordinator(coordinatorId);
      const drives = await storage.getDrivesByCoordinator(coordinatorId);
      const activeDrives = drives.filter(d => d.status === "Active");
      const placedStudents = students.filter(s => s.placementStatus === "Placed");
      
      // Calculate average package
      let totalPackage = 0;
      let packageCount = 0;
      placedStudents.forEach(s => {
        if (s.placedPackage) {
          totalPackage += parseFloat(s.placedPackage);
          packageCount++;
        }
      });
      const avgPackage = packageCount > 0 ? (totalPackage / packageCount).toFixed(1) : "0";
      
      res.json({
        activeDrives: activeDrives.length,
        totalStudents: students.length,
        placedStudents: placedStudents.length,
        placementRate: students.length > 0 ? Math.round((placedStudents.length / students.length) * 100) : 0,
        avgPackage,
        inviteCode: user.inviteCode
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Get all students for coordinator
  app.get("/api/coordinator/students", requireCoordinator, async (req, res) => {
    try {
      const user = getUser(req);
      const coordinatorId = user.id;
      
      // Optimized single query with LEFT JOIN to get application counts
      const studentsWithCounts = await db.select({
        id: students.id,
        email: students.email,
        name: students.name,
        rollNumber: students.rollNumber,
        branch: students.branch,
        graduationYear: students.graduationYear,
        cgpa: students.cgpa,
        activeBacklogs: students.activeBacklogs,
        placementStatus: students.placementStatus,
        placedCompany: students.placedCompany,
        placedPackage: students.placedPackage,
        coordinatorId: students.coordinatorId,
        createdAt: students.createdAt,
        registrationsCount: sql<number>`count(${applications.id})`
      })
      .from(students)
      .leftJoin(applications, eq(students.id, applications.studentId))
      .where(eq(students.coordinatorId, coordinatorId))
      .groupBy(students.id)
      .orderBy(desc(students.createdAt));
      
      res.json(studentsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  // Update student status
  app.patch("/api/coordinator/students/:id", requireCoordinator, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const { placementStatus, placedCompany, placedPackage } = req.body;
      const user = getUser(req);
      
      const student = await storage.getStudent(studentId);
      if (!student || student.coordinatorId !== user.id) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      const updated = await storage.updateStudent(studentId, {
        placementStatus,
        placedCompany,
        placedPackage: placedPackage?.toString()
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  // ==================== DRIVE ROUTES ====================

  // Get all drives for coordinator
  app.get("/api/drives", requireAuth, async (req, res) => {
    try {
      let coordinatorId: number;
      
      if (req.session.user!.role === "coordinator") {
        coordinatorId = req.session.user!.id;
      } else {
        coordinatorId = req.session.user!.coordinatorId!;
      }
      
      // Optimized single query with LEFT JOIN to get application counts
      const drivesWithCounts = await db.select({
        id: drives.id,
        companyName: drives.companyName,
        jobRole: drives.jobRole,
        ctcMin: drives.ctcMin,
        ctcMax: drives.ctcMax,
        jobDescription: drives.jobDescription,
        minCgpa: drives.minCgpa,
        maxBacklogs: drives.maxBacklogs,
        allowedBranches: drives.allowedBranches,
        registrationDeadline: drives.registrationDeadline,
        status: drives.status,
        coordinatorId: drives.coordinatorId,
        createdAt: drives.createdAt,
        registrationsCount: sql<number>`count(${applications.id})`
      })
      .from(drives)
      .leftJoin(applications, eq(drives.id, applications.driveId))
      .where(eq(drives.coordinatorId, coordinatorId))
      .groupBy(drives.id)
      .orderBy(desc(drives.createdAt));
      
      res.json(drivesWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get drives" });
    }
  });

  // Get single drive
  app.get("/api/drives/:id", requireAuth, async (req, res) => {
    try {
      const drive = await storage.getDrive(parseInt(req.params.id));
      if (!drive) {
        return res.status(404).json({ message: "Drive not found" });
      }
      
      const applications = await storage.getApplicationsByDrive(drive.id);
      
      res.json({
        ...drive,
        registrationsCount: applications.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get drive" });
    }
  });

  // Create drive (coordinator only)
  app.post("/api/drives", requireCoordinator, async (req, res) => {
    try {
      const data = insertDriveSchema.parse({
        ...req.body,
        coordinatorId: req.session.user!.id
      });
      
      const drive = await storage.createDrive(data);
      res.json(drive);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create drive error:", error);
      res.status(500).json({ message: "Failed to create drive" });
    }
  });

  // Update drive (coordinator only)
  app.patch("/api/drives/:id", requireCoordinator, async (req, res) => {
    try {
      const driveId = parseInt(req.params.id);
      const drive = await storage.getDrive(driveId);
      
      if (!drive || drive.coordinatorId !== req.session.user!.id) {
        return res.status(404).json({ message: "Drive not found" });
      }

      const updateDriveSchema = z.object({
        companyName: z.string().optional(),
        jobRole: z.string().optional(),
        ctcMin: z.string().optional(),
        ctcMax: z.string().optional(),
        jobDescription: z.string().optional(),
        minCgpa: z.string().optional(),
        maxBacklogs: z.number().int().min(0).optional(),
        allowedBranches: z.array(z.string()).optional(),
        registrationDeadline: z.coerce.date().optional(),
        status: z.enum(["Active", "Completed", "Cancelled"]).optional(),
      });

      const data = updateDriveSchema.parse(req.body);
      const updated = await storage.updateDrive(driveId, data);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update drive" });
    }
  });

  // Delete drive (coordinator only)
  app.delete("/api/drives/:id", requireCoordinator, async (req, res) => {
    try {
      const driveId = parseInt(req.params.id);
      const drive = await storage.getDrive(driveId);

      if (!drive || drive.coordinatorId !== req.session.user!.id) {
        return res.status(404).json({ message: "Drive not found" });
      }

      const success = await storage.deleteDrive(driveId);
      if (!success) {
        return res.status(404).json({ message: "Drive not found" });
      }

      res.json({ message: "Drive deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete drive" });
    }
  });


  // Get applications for a drive (coordinator only)
  app.get("/api/drives/:id/applications", requireCoordinator, async (req, res) => {
    try {
      const driveId = parseInt(req.params.id);
      const drive = await storage.getDrive(driveId);
      
      if (!drive || drive.coordinatorId !== req.session.user!.id) {
        return res.status(404).json({ message: "Drive not found" });
      }
      
      // Optimized single query with joins to get student and resume data
      const enrichedApplications = await db.select({
        id: applications.id,
        driveId: applications.driveId,
        studentId: applications.studentId,
        resumeId: applications.resumeId,
        status: applications.status,
        matchScore: applications.matchScore,
        notes: applications.notes,
        appliedAt: applications.appliedAt,
        studentName: students.name,
        studentRollNumber: students.rollNumber,
        studentBranch: students.branch,
        studentCgpa: students.cgpa,
        resumeName: resumes.name
      })
      .from(applications)
      .leftJoin(students, eq(applications.studentId, students.id))
      .leftJoin(resumes, eq(applications.resumeId, resumes.id))
      .where(eq(applications.driveId, driveId))
      .orderBy(desc(applications.appliedAt));
      
      // Transform the results to match expected format
      const transformedApplications = enrichedApplications.map(app => ({
        id: app.id,
        driveId: app.driveId,
        studentId: app.studentId,
        resumeId: app.resumeId,
        status: app.status,
        matchScore: app.matchScore,
        notes: app.notes,
        appliedAt: app.appliedAt,
        student: {
          id: app.studentId,
          name: app.studentName || "Unknown",
          rollNumber: app.studentRollNumber || "",
          branch: app.studentBranch || "",
          cgpa: app.studentCgpa || "0"
        },
        resumeName: app.resumeName || "Unknown"
      }));
      
      res.json(transformedApplications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get applications" });
    }
  });

  // Update application status (coordinator only)
  app.patch("/api/applications/:id/status", requireCoordinator, async (req, res) => {
    try {
      const { status } = req.body;
      const appId = parseInt(req.params.id);
      
      const application = await storage.getApplication(appId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Verify the drive belongs to this coordinator
      const drive = await storage.getDrive(application.driveId);
      if (!drive || drive.coordinatorId !== req.session.user!.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updated = await storage.updateApplication(appId, { status });
      
      // If selected, update student placement status
      if (status === "Selected") {
        await storage.updateStudent(application.studentId, {
          placementStatus: "Placed",
          placedCompany: drive.companyName,
          placedPackage: drive.ctcMax
        });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  // ==================== STUDENT ROUTES ====================

  // Get student stats
  app.get("/api/student/stats", requireStudent, async (req, res) => {
    try {
      const studentId = req.session.user!.id;
      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      const drives = await storage.getDrivesByCoordinator(student.coordinatorId);
      const applications = await storage.getApplicationsByStudent(studentId);
      
      // Calculate eligible drives
      const eligibleDrives = drives.filter(d => {
        return student.placementStatus !== "Opted Out" &&
          d.status === "Active" &&
          parseFloat(student.cgpa) >= parseFloat(d.minCgpa) &&
          student.activeBacklogs <= d.maxBacklogs &&
          d.allowedBranches.some(branch => branch.toLowerCase() === student.branch.toLowerCase()) &&
          new Date(d.registrationDeadline) > new Date(Date.now());
      });
      
      // Upcoming deadlines (within 7 days)
      const upcomingDeadlines = eligibleDrives.filter(d => {
        const days = Math.ceil((new Date(d.registrationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days <= 7;
      });
      
      res.json({
        eligibleDrives: eligibleDrives.length,
        applications: applications.length,
        upcomingDeadlines: upcomingDeadlines.length,
        student: {
          name: student.name,
          rollNumber: student.rollNumber,
          branch: student.branch,
          cgpa: student.cgpa,
          activeBacklogs: student.activeBacklogs,
          placementStatus: student.placementStatus
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Student profile (full record without password)
  app.get("/api/student/profile", requireStudent, async (req, res) => {
    try {
      const studentId = req.session.user!.id;
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      const pub = omitPassword(student);
      const names = splitStudentName(pub.name);
      res.json({
        ...pub,
        firstName: names.firstName,
        lastName: names.lastName,
        profileCompletion: computeProfileCompletion(pub),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to load profile" });
    }
  });

  app.patch("/api/student/profile", requireStudent, async (req, res) => {
    try {
      const studentId = req.session.user!.id;
      const current = await storage.getStudent(studentId);
      if (!current) {
        return res.status(404).json({ message: "Student not found" });
      }

      const data = studentProfilePatchSchema.parse(req.body);

      if (data.withdrawPlacement === true && current.placementStatus === "Placed") {
        return res.status(400).json({
          message:
            "You are marked as placed. Contact T&P if you need to change placement status.",
        });
      }

      const update: Partial<Student> = {};

      if (data.firstName !== undefined || data.lastName !== undefined) {
        const { firstName: f0, lastName: l0 } = splitStudentName(current.name);
        const f = data.firstName !== undefined ? data.firstName : f0;
        const l = data.lastName !== undefined ? data.lastName : l0;
        const combined = `${f} ${l}`.trim();
        if (combined) update.name = combined;
      }

      const str = (v: string | null | undefined) =>
        v === undefined ? undefined : v === null ? null : v.trim() === "" ? null : v.trim();

      if (data.personalEmail !== undefined) update.personalEmail = data.personalEmail ?? null;
      if (data.phone !== undefined) update.phone = str(data.phone);
      if (data.whatsapp !== undefined) update.whatsapp = str(data.whatsapp);
      if (data.linkedinUrl !== undefined) update.linkedinUrl = data.linkedinUrl ?? null;
      if (data.portfolioUrl !== undefined) update.portfolioUrl = data.portfolioUrl ?? null;
      if (data.professionalSummary !== undefined) {
        update.professionalSummary = data.professionalSummary === null ? null : str(data.professionalSummary);
      }
      if (data.homeCity !== undefined) update.homeCity = str(data.homeCity);
      if (data.willingToRelocate !== undefined) {
        update.willingToRelocate = str(data.willingToRelocate);
      }
      if (data.preferredWorkCities !== undefined) {
        update.preferredWorkCities = str(data.preferredWorkCities);
      }
      if (data.activeBacklogs !== undefined) update.activeBacklogs = data.activeBacklogs;

      if (data.tenthPercentage !== undefined) {
        update.tenthPercentage =
          data.tenthPercentage === null ? null : String(data.tenthPercentage);
      }
      if (data.twelfthPercentage !== undefined) {
        update.twelfthPercentage =
          data.twelfthPercentage === null ? null : String(data.twelfthPercentage);
      }

      if (data.graduationGapYears !== undefined) {
        update.graduationGapYears = str(data.graduationGapYears);
      }
      if (data.placementCategory !== undefined) {
        update.placementCategory = str(data.placementCategory);
      }
      if (data.certificationsText !== undefined) {
        update.certificationsText =
          data.certificationsText === null ? null : str(data.certificationsText);
      }
      if (data.achievementsText !== undefined) {
        update.achievementsText =
          data.achievementsText === null ? null : str(data.achievementsText);
      }

      if (data.skillsProgramming !== undefined) update.skillsProgramming = data.skillsProgramming;
      if (data.skillsFrameworks !== undefined) update.skillsFrameworks = data.skillsFrameworks;
      if (data.skillsTools !== undefined) update.skillsTools = data.skillsTools;

      if (data.preferredRoleType !== undefined) {
        update.preferredRoleType = str(data.preferredRoleType);
      }
      if (data.expectedCtcRange !== undefined) {
        update.expectedCtcRange = str(data.expectedCtcRange);
      }
      if (data.preferredWorkMode !== undefined) {
        update.preferredWorkMode = str(data.preferredWorkMode);
      }
      if (data.openToInternship !== undefined) {
        update.openToInternship = str(data.openToInternship);
      }
      if (data.preferredIndustries !== undefined) {
        update.preferredIndustries = str(data.preferredIndustries);
      }

      if (data.notifyNewDrives !== undefined) update.notifyNewDrives = data.notifyNewDrives;
      if (data.notifyApplicationStatus !== undefined) {
        update.notifyApplicationStatus = data.notifyApplicationStatus;
      }
      if (data.notifyDeadlines !== undefined) update.notifyDeadlines = data.notifyDeadlines;
      if (data.notifyInterviewTips !== undefined) {
        update.notifyInterviewTips = data.notifyInterviewTips;
      }
      if (data.notifyTpAnnouncements !== undefined) {
        update.notifyTpAnnouncements = data.notifyTpAnnouncements;
      }
      if (data.visibleToRecruiters !== undefined) {
        update.visibleToRecruiters = data.visibleToRecruiters;
      }
      if (data.showCgpaOnProfile !== undefined) {
        update.showCgpaOnProfile = data.showCgpaOnProfile;
      }
      if (data.showContactToCompanies !== undefined) {
        update.showContactToCompanies = data.showContactToCompanies;
      }

      if (data.withdrawPlacement === true) {
        update.placementStatus = "Opted Out";
      }

      const updated = await storage.updateStudent(studentId, update);
      if (!updated) {
        return res.status(404).json({ message: "Student not found" });
      }

      await setStudentSession(req, updated);
      const pub = omitPassword(updated);
      const names = splitStudentName(pub.name);

      res.json({
        profile: {
          ...pub,
          firstName: names.firstName,
          lastName: names.lastName,
          profileCompletion: computeProfileCompletion(pub),
        },
        user: req.session.user,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message ?? "Invalid data" });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get student's applications
  app.get("/api/student/applications", requireStudent, async (req, res) => {
    try {
      const studentId = req.session.user!.id;
      
      // Optimized single query with joins to get drive and resume data
      const enrichedApplications = await db.select({
        id: applications.id,
        driveId: applications.driveId,
        studentId: applications.studentId,
        resumeId: applications.resumeId,
        status: applications.status,
        matchScore: applications.matchScore,
        notes: applications.notes,
        appliedAt: applications.appliedAt,
        companyName: drives.companyName,
        jobRole: drives.jobRole,
        resumeName: resumes.name
      })
      .from(applications)
      .leftJoin(drives, eq(applications.driveId, drives.id))
      .leftJoin(resumes, eq(applications.resumeId, resumes.id))
      .where(eq(applications.studentId, studentId))
      .orderBy(desc(applications.appliedAt));
      
      // Transform the results to match expected format
      const transformedApplications = enrichedApplications.map(app => ({
        id: app.id,
        driveId: app.driveId,
        studentId: app.studentId,
        resumeId: app.resumeId,
        status: app.status,
        matchScore: app.matchScore,
        notes: app.notes,
        appliedAt: app.appliedAt,
        companyName: app.companyName || "Unknown",
        jobRole: app.jobRole || "Unknown",
        resumeName: app.resumeName || "Unknown"
      }));
      
      res.json(transformedApplications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get applications" });
    }
  });

  // Apply to drive
  app.post("/api/student/apply", requireStudent, async (req, res) => {
    try {
      // Input validation
      const applicationSchema = z.object({
        driveId: z.number().int().positive("Drive ID must be a positive integer"),
        resumeId: z.number().int().positive("Resume ID must be a positive integer"),
        notes: z.string().optional()
      });
      
      const validatedData = applicationSchema.parse(req.body);
      const { driveId, resumeId, notes } = validatedData;
      const studentId = req.session.user!.id;
      
      // Check if already applied
      const existing = await storage.getApplicationByStudentAndDrive(studentId, driveId);
      if (existing) {
        return res.status(400).json({ message: "Already applied to this drive" });
      }
      
      // Verify drive exists and is active
      const drive = await storage.getDrive(driveId);
      if (!drive) {
        return res.status(400).json({ message: "Drive not found" });
      }
      
      if (drive.status !== "Active") {
        return res.status(400).json({ message: "Drive not available" });
      }
      
      // Check deadline with proper timezone handling
      const now = new Date();
      const deadline = new Date(drive.registrationDeadline);
      // Adjust for timezone to ensure accurate comparison
      const timezoneOffset = deadline.getTimezoneOffset() * 60 * 1000;
      const localDeadline = new Date(deadline.getTime() + timezoneOffset);
      
      if (localDeadline <= now) {
        return res.status(400).json({ message: "Registration deadline has passed" });
      }
      
      // Verify resume belongs to student
      const resume = await storage.getResume(resumeId);
      if (!resume) {
        return res.status(400).json({ message: "Resume not found" });
      }
      
      if (resume.studentId !== studentId) {
        return res.status(400).json({ message: "Invalid resume" });
      }
      
      // Check eligibility
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      const studentCgpa = parseFloat(student.cgpa);
      const requiredCgpa = parseFloat(drive.minCgpa);
      
      if (studentCgpa < requiredCgpa) {
        return res.status(400).json({ message: "CGPA does not meet requirements" });
      }
      
      if (student.activeBacklogs > drive.maxBacklogs) {
        return res.status(400).json({ message: "Too many active backlogs" });
      }

      if (student.placementStatus === "Opted Out") {
        return res.status(403).json({
          message: "You have withdrawn from the placement season. Contact T&P to rejoin.",
        });
      }
      
      if (!drive.allowedBranches.some(branch => branch.toLowerCase() === student.branch.toLowerCase())) {
        return res.status(400).json({ message: "Branch not eligible for this drive" });
      }
      
      const application = await storage.createApplication({
        driveId,
        studentId,
        resumeId,
        notes
      });
      
      res.json(application);
    } catch (error) {
      let errorMessage = "Failed to apply to drive";
      if (error instanceof Error) {
        if (error.message.includes("already applied")) {
          errorMessage = "You have already applied to this drive";
        } else if (error.message.includes("not available")) {
          errorMessage = "This drive is not available for applications";
        } else if (error.message.includes("deadline")) {
          errorMessage = "The registration deadline has passed";
        } else if (error.message.includes("Invalid resume")) {
          errorMessage = "Invalid resume selected";
        } else if (error.message.includes("CGPA")) {
          errorMessage = "Your CGPA does not meet the requirements";
        } else if (error.message.includes("backlogs")) {
          errorMessage = "You have too many active backlogs";
        } else if (error.message.includes("Branch")) {
          errorMessage = "Your branch is not eligible for this drive";
        } else {
          errorMessage = error.message;
        }
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });

  // Withdraw application
  app.delete("/api/student/applications/:id", requireStudent, async (req, res) => {
    try {
      const appId = parseInt(req.params.id);
      const application = await storage.getApplication(appId);
      
      if (!application || application.studentId !== req.session.user!.id) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      if (application.status !== "Registered") {
        return res.status(400).json({ message: "Cannot withdraw after processing has started" });
      }
      
      await storage.deleteApplication(appId);
      res.json({ message: "Application withdrawn" });
    } catch (error) {
      res.status(500).json({ message: "Failed to withdraw application" });
    }
  });

  // ==================== RESUME ROUTES ====================

  // Get student's resumes
  app.get("/api/resumes", requireStudent, async (req, res) => {
    try {
      const resumes = await storage.getResumesByStudent(req.session.user!.id);
      // Don't send file content in list
      const resumeList = resumes.map(r => ({
        id: r.id,
        name: r.name,
        fileName: r.fileName,
        isDefault: r.isDefault,
        uploadedAt: r.uploadedAt
      }));
      res.json(resumeList);
    } catch (error) {
      res.status(500).json({ message: "Failed to get resumes" });
    }
  });

  // Upload resume
  app.post("/api/resumes", requireStudent, async (req, res) => {
    try {
      const { name, fileName, fileContent, isDefault } = req.body;
      
      if (!name || !fileName || !fileContent) {
        return res.status(400).json({ message: "Name, fileName, and fileContent are required" });
      }
      
      const resume = await storage.createResume({
        studentId: req.session.user!.id,
        name,
        fileName,
        fileContent,
        isDefault: isDefault || false
      });
      
      res.json({
        id: resume.id,
        name: resume.name,
        fileName: resume.fileName,
        isDefault: resume.isDefault,
        uploadedAt: resume.uploadedAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload resume" });
    }
  });

  // Get resume file content
  app.get("/api/resumes/:id/content", requireAuth, async (req, res) => {
    try {
      const resume = await storage.getResume(parseInt(req.params.id));
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Check access - student can view their own, coordinator can view their students'
      if (req.session.user!.role === "student" && resume.studentId !== req.session.user!.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      if (req.session.user!.role === "coordinator") {
        const student = await storage.getStudent(resume.studentId);
        if (!student || student.coordinatorId !== req.session.user!.id) {
          return res.status(403).json({ message: "Not authorized" });
        }
      }
      
      res.json({ fileContent: resume.fileContent });
    } catch (error) {
      res.status(500).json({ message: "Failed to get resume content" });
    }
  });

  // Set default resume
  app.patch("/api/resumes/:id/default", requireStudent, async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const success = await storage.setDefaultResume(req.session.user!.id, resumeId);
      
      if (!success) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      res.json({ message: "Default resume updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to set default resume" });
    }
  });

  // Delete resume
  app.delete("/api/resumes/:id", requireStudent, async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const user = getUser(req);
      const resume = await storage.getResume(resumeId);
      
      if (!resume || resume.studentId !== user.id) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Check if this resume is used in any applications and warn user
      const applications = await storage.getApplicationsByResume(resumeId);
      let warningMessage = "";
      if (applications.length > 0) {
        warningMessage = `Note: ${applications.length} application(s) using this resume will also be deleted.`;
      }
      
      const success = await storage.deleteResume(resumeId);
      if (success) {
        res.json({ 
          message: "Resume deleted successfully" + (warningMessage ? ". " + warningMessage : ""),
          warning: applications.length > 0 ? warningMessage : undefined
        });
      } else {
        res.status(500).json({ message: "Failed to delete resume" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete resume" });
    }
  });

  // ==================== AI ANALYSIS ROUTES ====================

  // Analyze resume against job description
  app.post("/api/analyze", requireStudent, async (req, res) => {
    try {
      // Input validation
      const analyzeSchema = z.object({
        applicationId: z.number().int().positive("Application ID must be a positive integer")
      });
      
      const validatedData = analyzeSchema.parse(req.body);
      const { applicationId } = validatedData;
      
      const application = await storage.getApplication(applicationId);
      if (!application || application.studentId !== req.session.user!.id) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const drive = await storage.getDrive(application.driveId);
      if (!drive) {
        return res.status(404).json({ message: "Drive not found" });
      }
      
      const resume = await storage.getResume(application.resumeId);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Check if we have a recent analysis
      const existingAnalysis = await storage.getAnalysisByApplication(applicationId);
      if (existingAnalysis) {
        return res.json({
          matchScore: existingAnalysis.matchScore,
          missingKeywords: existingAnalysis.missingKeywords,
          suggestions: existingAnalysis.suggestions
        });
      }
      
      // Use Gemini API for analysis
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "AI service not configured" });
      }
      
      const genAI = new GoogleGenAI({ apiKey });
      
      // Decode resume content (Base64 PDF - we'll extract text)
      // For now, we'll use a simplified analysis approach
      const prompt = `You are an expert career counselor and resume analyst. Analyze the following job description and provide feedback for a candidate.

Job Role: ${drive.jobRole}
Company: ${drive.companyName}
Job Description:
${drive.jobDescription}

Required Skills/Qualifications:
- Minimum CGPA: ${drive.minCgpa}
- Maximum Backlogs Allowed: ${drive.maxBacklogs}
- Eligible Branches: ${drive.allowedBranches.join(", ")}

Based on this job description, provide:
1. A match score from 0-100 (consider this is for a fresh graduate with the given qualifications)
2. 5-7 important keywords/skills that should be in the resume
3. 3-5 specific suggestions to improve the resume for this role

Respond in the following JSON format only:
{
  "matchScore": <number>,
  "missingKeywords": ["keyword1", "keyword2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...]
}`;

      const result = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt
      });
      
      let analysisResult;
      try {
        const text = result.text || "";
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        // Fallback to default analysis
        analysisResult = {
          matchScore: 70,
          missingKeywords: ["Technical Skills", "Projects", "Internship Experience", "Problem Solving", "Communication"],
          suggestions: [
            "Add relevant technical projects that demonstrate your skills",
            "Include quantifiable achievements where possible",
            "Highlight any internship or work experience"
          ]
        };
      }
      
      // Save analysis
      const analysis = await storage.createAnalysis(
        applicationId,
        analysisResult.matchScore,
        analysisResult.missingKeywords,
        analysisResult.suggestions
      );
      
      // Update application with match score
      await storage.updateApplication(applicationId, { matchScore: analysisResult.matchScore });
      
      res.json({
        matchScore: analysis.matchScore,
        missingKeywords: analysis.missingKeywords,
        suggestions: analysis.suggestions
      });
    } catch (error) {
      console.error("Error analyzing resume:", error);
      res.status(500).json({ message: "Failed to analyze resume" });
    }
  });

  // ==================== EXTERNAL OPPORTUNITIES ROUTES ====================

// Utility: sanitize input
const clean = (v: any): string | undefined => {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
};



// ==================== GET LIST ====================
app.get("/api/external-opportunities", async (req, res) => {
  try {
    let {
      jobType,
      location,
      source,
      search,
      region,
      limit = "50",
      offset = "0"
    } = req.query;

    // sanitize inputs
    jobType = clean(jobType);
    location = clean(location);
    source = clean(source);
    search = clean(search);
    region = clean(region);

    // normalize "all"
    if (jobType === "all") jobType = undefined;
    if (region === "all") region = undefined;

    const safeLimit = Math.min(parseInt(limit as string) || 50, 100);
    const safeOffset = Math.max(parseInt(offset as string) || 0, 0);

    const filters = {
      jobType: jobType as string | undefined,
      location: location as string | undefined,
      source: source as string | undefined,
      search: search as string | undefined,
      region: region as string | undefined,
      limit: safeLimit,
      offset: safeOffset
    };

    const opportunities = await storage.getExternalOpportunities(filters);

    // 🔥 FIXED: Return message when no jobs found for specific filter
    if (opportunities.length === 0 && (jobType || location || source || search || region)) {
      return res.json({
        message: "No jobs found matching your criteria. Try adjusting your filters.",
        opportunities: []
      });
    }

    res.json(opportunities);
  } catch (error) {
    console.error("Error fetching external opportunities:", error);
    res.status(500).json({
      message: "Failed to fetch external opportunities"
    });
  }
});

// ==================== GET BY ID ====================
app.get("/api/external-opportunities/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const opportunity = await storage.getOpportunityById(id);

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    res.json(opportunity);
  } catch (error) {
    console.error("Error fetching external opportunity:", error);
    res.status(500).json({
      message: "Failed to fetch external opportunity"
    });
  }
});

// ==================== REFRESH (NON-BLOCKING SCRAPER) ====================
app.post("/api/external-opportunities/refresh", async (req, res) => {
  try {
    console.log("External opportunities refresh triggered...");

    // Use the new service instead of direct scraper manager
    const { ExtendedOpportunitiesService } = await import('./extended_opportunities/service.js');
    const opportunitiesService = new ExtendedOpportunitiesService();
    
    // Run in background
    setImmediate(async () => {
      try {
        const result = await opportunitiesService.scrapeAndSaveJobs();
        console.log(`Background scraping completed: ${result.added} added, ${result.updated} updated`);
      } catch (error) {
        console.error("Background scraping error:", error);
      }
    });

    res.json({
      message: "External opportunities refresh started. New jobs will be available shortly.",
      status: "processing"
    });

  } catch (error) {
    console.error("Error triggering refresh:", error);
    res.status(500).json({
      message: "Failed to start refresh process"
    });
  }
});

// ==================== STATS (OPTIMIZED) ====================
app.get("/api/external-opportunities/stats", async (req, res) => {
  try {
    const data = await storage.getExternalOpportunities({
      limit: 5000
    });

    const stats = data.reduce(
      (acc, job) => {
        acc.total++;

        acc.bySource[job.source] =
          (acc.bySource[job.source] || 0) + 1;

        acc.byJobType[job.jobType] =
          (acc.byJobType[job.jobType] || 0) + 1;

        return acc;
      },
      {
        total: 0,
        bySource: {} as Record<string, number>,
        byJobType: {} as Record<string, number>
      }
    );

    res.json(stats);
  } catch (error) {
    console.error("Error fetching external opportunities stats:", error);
    res.status(500).json({
      message: "Failed to fetch external opportunities stats"
    });
  }
});

// GET /api/opportunities - List opportunities with filters
app.get("/api/opportunities", getOpportunities);

// GET /api/opportunities/search - Search opportunities
app.get("/api/opportunities/search", searchOpportunities);

// GET /api/opportunities/:id - Get opportunity details
app.get("/api/opportunities/:id", getOpportunityById);

// POST /api/opportunities/refresh - Trigger scraping (background)
app.post("/api/opportunities/refresh", refreshOpportunities);

// GET /api/opportunities/stats - Get statistics
app.get("/api/opportunities/stats", getOpportunitiesStats);

// POST /api/opportunities/cleanup - Cleanup old jobs (admin only)
app.post("/api/opportunities/cleanup", requireCoordinator, cleanupOpportunities);

return httpServer;
}
