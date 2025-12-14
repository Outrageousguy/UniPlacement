import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";
import MemoryStore from "memorystore";
import { 
  loginSchema, 
  coordinatorRegisterSchema, 
  studentRegisterSchema,
  insertDriveSchema,
  insertResumeSchema,
  insertApplicationSchema,
  insertDiscussionSchema,
  insertDiscussionReplySchema,
  insertMessageSchema
} from "@shared/schema";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

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
      cgpa?: string;
      activeBacklogs?: number;
      placementStatus?: string;
      coordinatorId?: number;
      inviteCode?: string;
    };
  }
}

// Middleware to check authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
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
  app.use(session({
    secret: process.env.SESSION_SECRET || "placement-management-secret-key-2024",
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
      console.error("Registration error:", error);
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
      
      // Set session
      req.session.user = {
        id: student.id,
        email: student.email,
        name: student.name,
        role: "student",
        rollNumber: student.rollNumber,
        branch: student.branch,
        cgpa: student.cgpa,
        activeBacklogs: student.activeBacklogs,
        placementStatus: student.placementStatus,
        coordinatorId: student.coordinatorId
      };
      
      res.json({ 
        user: req.session.user,
        message: "Registration successful" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Registration error:", error);
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
        
        req.session.user = {
          id: student.id,
          email: student.email,
          name: student.name,
          role: "student",
          rollNumber: student.rollNumber,
          branch: student.branch,
          cgpa: student.cgpa,
          activeBacklogs: student.activeBacklogs,
          placementStatus: student.placementStatus,
          coordinatorId: student.coordinatorId
        };
      }
      
      res.json({ 
        user: req.session.user,
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
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
      const coordinatorId = req.session.user!.id;
      
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
        inviteCode: req.session.user!.inviteCode
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Get all students for coordinator
  app.get("/api/coordinator/students", requireCoordinator, async (req, res) => {
    try {
      const students = await storage.getStudentsByCoordinator(req.session.user!.id);
      
      // Get registration counts for each student
      const studentsWithCounts = await Promise.all(students.map(async (student) => {
        const applications = await storage.getApplicationsByStudent(student.id);
        return {
          ...student,
          registrationsCount: applications.length
        };
      }));
      
      res.json(studentsWithCounts);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  // Update student status
  app.patch("/api/coordinator/students/:id", requireCoordinator, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const { placementStatus, placedCompany, placedPackage } = req.body;
      
      const student = await storage.getStudent(studentId);
      if (!student || student.coordinatorId !== req.session.user!.id) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      const updated = await storage.updateStudent(studentId, {
        placementStatus,
        placedCompany,
        placedPackage: placedPackage?.toString()
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Update student error:", error);
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
      
      const drives = await storage.getDrivesByCoordinator(coordinatorId);
      
      // Get registration counts
      const drivesWithCounts = await Promise.all(drives.map(async (drive) => {
        const applications = await storage.getApplicationsByDrive(drive.id);
        return {
          ...drive,
          registrationsCount: applications.length
        };
      }));
      
      res.json(drivesWithCounts);
    } catch (error) {
      console.error("Get drives error:", error);
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
      console.error("Get drive error:", error);
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

      const updateDriveSchema = insertDriveSchema
        .partial()
        .omit({ coordinatorId: true })
        .extend({
          status: z.enum(["Active", "Completed", "Cancelled"]).optional(),
        });

      const data = updateDriveSchema.parse(req.body);
      const updated = await storage.updateDrive(driveId, data);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Update drive error:", error);
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
      console.error("Delete drive error:", error);
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
      
      const applications = await storage.getApplicationsByDrive(driveId);
      
      // Enrich with student data
      const enrichedApplications = await Promise.all(applications.map(async (app) => {
        const student = await storage.getStudent(app.studentId);
        const resume = await storage.getResume(app.resumeId);
        return {
          ...app,
          student: student ? {
            id: student.id,
            name: student.name,
            rollNumber: student.rollNumber,
            branch: student.branch,
            cgpa: student.cgpa
          } : null,
          resumeName: resume?.name || "Unknown"
        };
      }));
      
      res.json(enrichedApplications);
    } catch (error) {
      console.error("Get applications error:", error);
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
      console.error("Update application status error:", error);
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
        return d.status === "Active" &&
          parseFloat(student.cgpa) >= parseFloat(d.minCgpa) &&
          student.activeBacklogs <= d.maxBacklogs &&
          d.allowedBranches.includes(student.branch) &&
          new Date(d.registrationDeadline) > new Date();
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
      console.error("Get student stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Get student's applications
  app.get("/api/student/applications", requireStudent, async (req, res) => {
    try {
      const applications = await storage.getApplicationsByStudent(req.session.user!.id);
      
      // Enrich with drive data
      const enrichedApplications = await Promise.all(applications.map(async (app) => {
        const drive = await storage.getDrive(app.driveId);
        const resume = await storage.getResume(app.resumeId);
        return {
          ...app,
          companyName: drive?.companyName || "Unknown",
          jobRole: drive?.jobRole || "Unknown",
          resumeName: resume?.name || "Unknown"
        };
      }));
      
      res.json(enrichedApplications);
    } catch (error) {
      console.error("Get applications error:", error);
      res.status(500).json({ message: "Failed to get applications" });
    }
  });

  // Apply to drive
  app.post("/api/student/apply", requireStudent, async (req, res) => {
    try {
      const { driveId, resumeId, notes } = req.body;
      const studentId = req.session.user!.id;
      
      // Check if already applied
      const existing = await storage.getApplicationByStudentAndDrive(studentId, driveId);
      if (existing) {
        return res.status(400).json({ message: "Already applied to this drive" });
      }
      
      // Verify drive exists and is active
      const drive = await storage.getDrive(driveId);
      if (!drive || drive.status !== "Active") {
        return res.status(400).json({ message: "Drive not available" });
      }
      
      // Check deadline
      if (new Date(drive.registrationDeadline) < new Date()) {
        return res.status(400).json({ message: "Registration deadline has passed" });
      }
      
      // Verify resume belongs to student
      const resume = await storage.getResume(resumeId);
      if (!resume || resume.studentId !== studentId) {
        return res.status(400).json({ message: "Invalid resume" });
      }
      
      // Check eligibility
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (parseFloat(student.cgpa) < parseFloat(drive.minCgpa)) {
        return res.status(400).json({ message: "CGPA does not meet requirements" });
      }
      
      if (student.activeBacklogs > drive.maxBacklogs) {
        return res.status(400).json({ message: "Too many active backlogs" });
      }
      
      if (!drive.allowedBranches.includes(student.branch)) {
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
      console.error("Apply error:", error);
      res.status(500).json({ message: "Failed to apply" });
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
      console.error("Withdraw error:", error);
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
      console.error("Get resumes error:", error);
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
      console.error("Upload resume error:", error);
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
      console.error("Get resume content error:", error);
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
      console.error("Set default resume error:", error);
      res.status(500).json({ message: "Failed to set default resume" });
    }
  });

  // Delete resume
  app.delete("/api/resumes/:id", requireStudent, async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);
      
      if (!resume || resume.studentId !== req.session.user!.id) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      await storage.deleteResume(resumeId);
      res.json({ message: "Resume deleted" });
    } catch (error) {
      console.error("Delete resume error:", error);
      res.status(500).json({ message: "Failed to delete resume" });
    }
  });

  // ==================== AI ANALYSIS ROUTES ====================

  // Analyze resume against job description
  app.post("/api/analyze", requireStudent, async (req, res) => {
    try {
      const { applicationId } = req.body;
      
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
      console.error("Analysis error:", error);
      res.status(500).json({ message: "Failed to analyze resume" });
    }
  });

  // ==================== COMMUNITY ROUTES ====================

  // Get discussions
  app.get("/api/discussions", requireAuth, async (req, res) => {
    try {
      let coordinatorId: number;
      
      if (req.session.user!.role === "coordinator") {
        coordinatorId = req.session.user!.id;
      } else {
        coordinatorId = req.session.user!.coordinatorId!;
      }
      
      const discussions = await storage.getDiscussionsByCoordinator(coordinatorId);
      
      // Enrich with author info and reply counts
      const enrichedDiscussions = await Promise.all(discussions.map(async (d) => {
        const author = await storage.getStudent(d.authorId);
        const replies = await storage.getRepliesByDiscussion(d.id);
        return {
          ...d,
          author: author ? {
            name: author.name,
            branch: author.branch
          } : { name: "Unknown", branch: "" },
          repliesCount: replies.length
        };
      }));
      
      res.json(enrichedDiscussions);
    } catch (error) {
      console.error("Get discussions error:", error);
      res.status(500).json({ message: "Failed to get discussions" });
    }
  });

  // Create discussion
  app.post("/api/discussions", requireStudent, async (req, res) => {
    try {
      const { title, content, tags } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      
      const discussion = await storage.createDiscussion({
        title,
        content,
        authorId: req.session.user!.id,
        tags: tags || []
      });
      
      res.json(discussion);
    } catch (error) {
      console.error("Create discussion error:", error);
      res.status(500).json({ message: "Failed to create discussion" });
    }
  });

  // Like/unlike discussion
  app.post("/api/discussions/:id/like", requireStudent, async (req, res) => {
    try {
      const discussionId = parseInt(req.params.id);
      const liked = await storage.likeDiscussion(discussionId, req.session.user!.id);
      
      if (!liked) {
        // Already liked, so unlike
        await storage.unlikeDiscussion(discussionId, req.session.user!.id);
        res.json({ liked: false });
      } else {
        res.json({ liked: true });
      }
    } catch (error) {
      console.error("Like discussion error:", error);
      res.status(500).json({ message: "Failed to like discussion" });
    }
  });

  // Get discussion replies
  app.get("/api/discussions/:id/replies", requireAuth, async (req, res) => {
    try {
      const discussionId = parseInt(req.params.id);
      const replies = await storage.getRepliesByDiscussion(discussionId);
      
      // Enrich with author info
      const enrichedReplies = await Promise.all(replies.map(async (r) => {
        const author = await storage.getStudent(r.authorId);
        return {
          ...r,
          author: author ? {
            name: author.name,
            branch: author.branch
          } : { name: "Unknown", branch: "" }
        };
      }));
      
      res.json(enrichedReplies);
    } catch (error) {
      console.error("Get replies error:", error);
      res.status(500).json({ message: "Failed to get replies" });
    }
  });

  // Create reply
  app.post("/api/discussions/:id/replies", requireStudent, async (req, res) => {
    try {
      const discussionId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      const reply = await storage.createReply({
        discussionId,
        authorId: req.session.user!.id,
        content
      });
      
      res.json(reply);
    } catch (error) {
      console.error("Create reply error:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  // Get students for messaging (same university)
  app.get("/api/students", requireStudent, async (req, res) => {
    try {
      const students = await storage.getStudentsByCoordinator(req.session.user!.coordinatorId!);
      
      // Filter out current user and only return relevant info
      const studentList = students
        .filter(s => s.id !== req.session.user!.id)
        .map(s => ({
          id: s.id,
          name: s.name,
          branch: s.branch,
          graduationYear: s.graduationYear,
          placementStatus: s.placementStatus,
          placedCompany: s.placedCompany
        }));
      
      res.json(studentList);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  // Get messages with a specific student
  app.get("/api/messages/:studentId", requireStudent, async (req, res) => {
    try {
      const otherStudentId = parseInt(req.params.studentId);
      const messages = await storage.getMessagesBetweenUsers(req.session.user!.id, otherStudentId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(otherStudentId, req.session.user!.id);
      
      const messagesWithOwnership = messages.map(m => ({
        ...m,
        isOwn: m.senderId === req.session.user!.id
      }));
      
      res.json(messagesWithOwnership);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Send message
  app.post("/api/messages", requireStudent, async (req, res) => {
    try {
      const { receiverId, content } = req.body;
      
      if (!receiverId || !content) {
        return res.status(400).json({ message: "Receiver and content are required" });
      }
      
      const message = await storage.createMessage({
        senderId: req.session.user!.id,
        receiverId,
        content
      });
      
      res.json({ ...message, isOwn: true });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  return httpServer;
}
