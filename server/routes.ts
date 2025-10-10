import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { log } from "./vite";
import { generateCourseContent, type CourseOutlineRequest } from "./openai";
import { createSCORMPackage, createCoursePDF } from "./exports";
import { CourseLesson } from "@shared/types";
import { analyzeYouTubeVideo, answerQuestion } from "./youtube";
import { 
  insertCourseSchema, 
  updateCourseSchema, 
  insertPayoutSchema, 
  updatePayoutSchema,
  insertEnrollmentSchema,
  updateEnrollmentSchema,
  insertCommunicationSchema,
  insertSkillSchema,
  insertSkillAssessmentSchema,
  insertMarketingCampaignSchema,
  updateMarketingCampaignSchema,
  insertPromotionalCodeSchema,
  updatePromotionalCodeSchema,
  insertEmailCampaignSchema,
  insertSocialMediaPostSchema,
  insertUserPreferencesSchema,
  updateUserPreferencesSchema,
  insertNotificationSettingsSchema,
  updateNotificationSettingsSchema,
  insertInstructorSettingsSchema,
  updateInstructorSettingsSchema,
  insertPrivacySettingsSchema,
  updatePrivacySettingsSchema,
  insertDocumentationArticleSchema,
  updateDocumentationArticleSchema,
  insertFaqEntrySchema,
  updateFaqEntrySchema,
  insertSupportTicketSchema,
  updateSupportTicketSchema,
  insertTicketMessageSchema,
  insertLiveClassSchema,
  updateLiveClassSchema,
  insertRecordedVideoSchema,
  updateRecordedVideoSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment monitoring
  app.get("/health", async (req, res) => {
    try {
      // Test database connectivity by trying to get a simple count
      await storage.getCourses();
      
      res.status(200).json({ 
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development"
      });
    } catch (error) {
      log(`Health check failed: ${error}`);
      res.status(503).json({ 
        status: "unhealthy",
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development"
      });
    }
  });

  // Course Routes
  
  // Get all courses
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  // Get single course
  app.get("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }
      
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  // Create new course
  app.post("/api/courses", async (req, res) => {
    try {
      const result = insertCourseSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error);
        return res.status(400).json({ error: errorMessage.toString() });
      }

      // For now, use a dummy instructor ID (1)
      const instructorId = 1;
      const course = await storage.createCourse(result.data, instructorId);
      res.status(201).json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  // Generate AI course content
  app.post("/api/courses/generate", async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(3).max(100),
        description: z.string().min(10).max(500),
        category: z.string().min(1),
        level: z.enum(["beginner", "intermediate", "advanced"]),
        targetDuration: z.number().min(1).max(20),
        specificRequirements: z.string().optional(),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error);
        return res.status(400).json({ error: errorMessage.toString() });
      }

      const courseRequest: CourseOutlineRequest = result.data;
      const generatedContent = await generateCourseContent(courseRequest);

      res.json(generatedContent);
    } catch (error) {
      log(`Course generation failed: ${error}`);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate course content" 
      });
    }
  });

  // Export course as SCORM package
  app.get("/api/courses/:id/export/scorm", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }
      
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      // Parse the generated content from the course
      let lessons: CourseLesson[] = [];
      if (course.slidesData) {
        try {
          const parsedData = JSON.parse(course.slidesData);
          lessons = parsedData.lessons || [];
        } catch (error) {
          console.error('Failed to parse course slides data:', error);
        }
      }
      
      // Fallback to generatedContent if slidesData is not available
      if (lessons.length === 0 && (course as any).generatedContent?.lessons) {
        lessons = (course as any).generatedContent.lessons;
      }
      
      if (lessons.length === 0) {
        return res.status(400).json({ error: "Course has no content to export" });
      }
      
      const scormBuffer = await createSCORMPackage(course, lessons);
      
      const filename = `${course.title.replace(/[^a-zA-Z0-9]/g, '_')}_SCORM.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', scormBuffer.length);
      
      res.send(scormBuffer);
    } catch (error) {
      log(`SCORM export failed: ${error}`);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to export SCORM package" 
      });
    }
  });

  // Export course as PDF
  app.get("/api/courses/:id/export/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }
      
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      // Parse the generated content from the course
      let lessons: CourseLesson[] = [];
      if (course.slidesData) {
        try {
          const parsedData = JSON.parse(course.slidesData);
          lessons = parsedData.lessons || [];
        } catch (error) {
          console.error('Failed to parse course slides data:', error);
        }
      }
      
      // Fallback to generatedContent if slidesData is not available
      if (lessons.length === 0 && (course as any).generatedContent?.lessons) {
        lessons = (course as any).generatedContent.lessons;
      }
      
      if (lessons.length === 0) {
        return res.status(400).json({ error: "Course has no content to export" });
      }
      
      const pdfBuffer = await createCoursePDF(course, lessons);
      
      const filename = `${course.title.replace(/[^a-zA-Z0-9]/g, '_')}_Slides.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      log(`PDF export failed: ${error}`);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to export PDF" 
      });
    }
  });

  // Create course with AI-generated content
  app.post("/api/courses/create-with-ai", async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(3).max(100),
        description: z.string().min(10).max(500),
        category: z.string().min(1),
        level: z.enum(["beginner", "intermediate", "advanced"]),
        price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0),
        targetDuration: z.number().min(1).max(20),
        specificRequirements: z.string().optional(),
        thumbnail: z.string().url().optional().or(z.literal("")),
        isPublished: z.boolean().optional(),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error);
        return res.status(400).json({ error: errorMessage.toString() });
      }

      const data = result.data;
      const instructorId = 1; // TODO: Get from session

      // Generate AI content
      const courseRequest: CourseOutlineRequest = {
        title: data.title,
        description: data.description,
        category: data.category,
        level: data.level,
        targetDuration: data.targetDuration,
        specificRequirements: data.specificRequirements,
      };

      const generatedContent = await generateCourseContent(courseRequest);

      // Create course with AI-generated content
      const courseData = {
        title: data.title,
        description: data.description,
        category: data.category,
        level: data.level,
        price: data.price,
        duration: Math.round(generatedContent.totalDuration / 60), // Convert minutes to hours
        thumbnail: data.thumbnail || "",
        isPublished: data.isPublished || false,
        aiGenerated: true,
        contentType: "slide_based" as const,
        slidesData: JSON.stringify(generatedContent),
        totalLessons: generatedContent.lessons.length,
        estimatedMinutes: generatedContent.totalDuration,
      };

      const course = await storage.createCourse(courseData, instructorId);
      res.status(201).json({ course, generatedContent });
    } catch (error) {
      log(`AI course creation failed: ${error}`);
      
      // Check if it's an OpenAI quota/rate limit error
      if (error instanceof Error && (error.message.includes('quota') || error.message.includes('rate limit'))) {
        res.status(429).json({ 
          error: "OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits, or try again later.",
          type: "quota_exceeded"
        });
      } else {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : "Failed to create AI-powered course" 
        });
      }
    }
  });

  // Update course
  app.put("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      const result = updateCourseSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error);
        return res.status(400).json({ error: errorMessage.toString() });
      }

      const course = await storage.updateCourse(id, result.data);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  // Delete course
  app.delete("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      const deleted = await storage.deleteCourse(id);
      if (!deleted) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  // Revenue Routes
  app.get("/api/revenue", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from session
      const records = await storage.getRevenueRecords(instructorId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue records" });
    }
  });

  app.get("/api/revenue/total", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from session
      const total = await storage.getTotalRevenue(instructorId);
      res.json({ total });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate total revenue" });
    }
  });

  app.get("/api/revenue/balance", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from session
      const balance = await storage.getAvailableBalance(instructorId);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate available balance" });
    }
  });

  // Payout Routes
  app.get("/api/payouts", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from session
      const payouts = await storage.getPayouts(instructorId);
      res.json(payouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payouts" });
    }
  });

  app.post("/api/payouts", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from session
      
      const result = insertPayoutSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error);
        return res.status(400).json({ error: errorMessage.toString() });
      }

      // Check if instructor has sufficient balance
      const availableBalance = await storage.getAvailableBalance(instructorId);
      const requestedAmount = parseFloat(result.data.amount);
      
      if (requestedAmount > availableBalance) {
        return res.status(400).json({ 
          error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Requested: $${requestedAmount.toFixed(2)}` 
        });
      }

      const payout = await storage.createPayout(result.data, instructorId);
      res.status(201).json(payout);
    } catch (error) {
      res.status(500).json({ error: "Failed to create payout request" });
    }
  });

  app.patch("/api/payouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid payout ID" });
      }

      const result = updatePayoutSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error);
        return res.status(400).json({ error: errorMessage.toString() });
      }

      // Validate state transitions
      const existingPayout = await storage.getPayouts(1); // TODO: Get instructorId from session
      const currentPayout = existingPayout.find(p => p.id === id);
      if (!currentPayout) {
        return res.status(404).json({ error: "Payout not found" });
      }

      const validTransitions: Record<string, string[]> = {
        "pending": ["processing", "failed"],
        "processing": ["completed", "failed"],
        "completed": [], // Terminal state
        "failed": ["pending"], // Allow retry
      };

      const allowedStatuses = validTransitions[currentPayout.status || "pending"] || [];
      if (!allowedStatuses.includes(result.data.status)) {
        return res.status(400).json({ 
          error: `Invalid status transition from ${currentPayout.status} to ${result.data.status}` 
        });
      }

      const payout = await storage.updatePayoutStatus(id, result.data.status, result.data.notes);
      res.json(payout);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payout status" });
    }
  });

  // Learner Management Routes
  app.get("/api/enrollments", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from session
      const enrollments = await storage.getEnrollments(instructorId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from session
      
      const result = insertEnrollmentSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error);
        return res.status(400).json({ error: errorMessage.toString() });
      }

      const enrollment = await storage.createEnrollment(result.data, instructorId);
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create enrollment" });
    }
  });

  app.patch("/api/enrollments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid enrollment ID" });
      }

      const result = updateEnrollmentSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error);
        return res.status(400).json({ error: errorMessage.toString() });
      }

      const enrollment = await storage.updateEnrollment(id, result.data);
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }

      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update enrollment" });
    }
  });

  app.delete("/api/enrollments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid enrollment ID" });
      }

      const deleted = await storage.deleteEnrollment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Enrollment not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete enrollment" });
    }
  });

  // Student Communications Routes
  app.get("/api/communications", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from session
      const communications = await storage.getCommunications(instructorId);
      res.json(communications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch communications" });
    }
  });

  app.post("/api/communications", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from session
      
      const result = insertCommunicationSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error);
        return res.status(400).json({ error: errorMessage.toString() });
      }

      const communication = await storage.sendCommunication(result.data, instructorId);
      res.status(201).json(communication);
    } catch (error) {
      res.status(500).json({ error: "Failed to send communication" });
    }
  });

  app.patch("/api/communications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid communication ID" });
      }

      const communication = await storage.markCommunicationAsRead(id);
      if (!communication) {
        return res.status(404).json({ error: "Communication not found" });
      }

      res.json(communication);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark communication as read" });
    }
  });

  app.patch("/api/communications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid communication ID" });
      }

      const communication = await storage.markCommunicationAsRead(id);
      if (!communication) {
        return res.status(404).json({ error: "Communication not found" });
      }

      res.json(communication);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark communication as read" });
    }
  });

  // Skills Management Routes
  app.get("/api/skills", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from auth session
      const skills = await storage.getSkills(instructorId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });

  app.post("/api/skills", async (req, res) => {
    try {
      const validatedData = insertSkillSchema.parse(req.body);
      const instructorId = 1; // TODO: Get from auth session
      
      const skill = await storage.createSkill(validatedData, instructorId);
      res.status(201).json(skill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create skill" });
    }
  });

  app.patch("/api/skills/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid skill ID" });
      }

      const validatedData = insertSkillSchema.partial().parse(req.body);
      const skill = await storage.updateSkill(id, validatedData);
      
      if (!skill) {
        return res.status(404).json({ error: "Skill not found" });
      }

      res.json(skill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update skill" });
    }
  });

  app.delete("/api/skills/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid skill ID" });
      }

      const success = await storage.deleteSkill(id);
      if (!success) {
        return res.status(404).json({ error: "Skill not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete skill" });
    }
  });

  // Student Skill Progress Routes
  app.get("/api/student-skill-progress", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from auth session
      const progress = await storage.getStudentSkillProgress(instructorId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student skill progress" });
    }
  });

  app.patch("/api/student-skill-progress/:studentId/:skillId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const skillId = parseInt(req.params.skillId);
      
      if (isNaN(studentId) || isNaN(skillId)) {
        return res.status(400).json({ error: "Invalid student or skill ID" });
      }

      const instructorId = 1; // TODO: Get from auth session
      const updateSchema = z.object({
        currentLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
        progressPercentage: z.string().refine((val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num >= 0 && num <= 100;
        }, "Progress must be between 0 and 100").optional(),
        notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
      });

      const validatedData = updateSchema.parse(req.body);
      const progress = await storage.updateStudentSkillProgress(studentId, skillId, validatedData, instructorId);
      res.json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update student skill progress" });
    }
  });

  // Skill Assessments Routes
  app.get("/api/skills/:skillId/assessments", async (req, res) => {
    try {
      const skillId = parseInt(req.params.skillId);
      if (isNaN(skillId)) {
        return res.status(400).json({ error: "Invalid skill ID" });
      }

      const assessments = await storage.getSkillAssessments(skillId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skill assessments" });
    }
  });

  app.post("/api/skill-assessments", async (req, res) => {
    try {
      const validatedData = insertSkillAssessmentSchema.parse(req.body);
      const instructorId = 1; // TODO: Get from auth session
      
      const assessment = await storage.createSkillAssessment(validatedData, instructorId);
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create skill assessment" });
    }
  });

  // Marketing Campaign Routes
  app.get("/api/marketing-campaigns", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from auth session
      const campaigns = await storage.getMarketingCampaigns(instructorId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch marketing campaigns" });
    }
  });

  app.get("/api/marketing-campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const campaign = await storage.getMarketingCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch marketing campaign" });
    }
  });

  app.post("/api/marketing-campaigns", async (req, res) => {
    try {
      const validatedData = insertMarketingCampaignSchema.parse(req.body);
      const instructorId = 1; // TODO: Get from auth session
      
      const campaign = await storage.createMarketingCampaign(validatedData, instructorId);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create marketing campaign" });
    }
  });

  app.put("/api/marketing-campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const validatedData = updateMarketingCampaignSchema.parse(req.body);
      const campaign = await storage.updateMarketingCampaign(id, validatedData);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update marketing campaign" });
    }
  });

  app.delete("/api/marketing-campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const deleted = await storage.deleteMarketingCampaign(id);
      if (!deleted) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete marketing campaign" });
    }
  });

  // Promotional Code Routes
  app.get("/api/promotional-codes", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from auth session
      const codes = await storage.getPromotionalCodes(instructorId);
      res.json(codes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch promotional codes" });
    }
  });

  app.get("/api/promotional-codes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid promotional code ID" });
      }

      const code = await storage.getPromotionalCode(id);
      if (!code) {
        return res.status(404).json({ error: "Promotional code not found" });
      }

      res.json(code);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch promotional code" });
    }
  });

  app.get("/api/promotional-codes/by-code/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const promoCode = await storage.getPromotionalCodeByCode(code);
      
      if (!promoCode) {
        return res.status(404).json({ error: "Promotional code not found" });
      }

      res.json(promoCode);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch promotional code" });
    }
  });

  app.post("/api/promotional-codes", async (req, res) => {
    try {
      const validatedData = insertPromotionalCodeSchema.parse(req.body);
      const instructorId = 1; // TODO: Get from auth session
      
      const code = await storage.createPromotionalCode(validatedData, instructorId);
      res.status(201).json(code);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create promotional code" });
    }
  });

  app.put("/api/promotional-codes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid promotional code ID" });
      }

      const validatedData = updatePromotionalCodeSchema.parse(req.body);
      const code = await storage.updatePromotionalCode(id, validatedData);
      
      if (!code) {
        return res.status(404).json({ error: "Promotional code not found" });
      }

      res.json(code);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update promotional code" });
    }
  });

  app.delete("/api/promotional-codes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid promotional code ID" });
      }

      const deleted = await storage.deletePromotionalCode(id);
      if (!deleted) {
        return res.status(404).json({ error: "Promotional code not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete promotional code" });
    }
  });

  // Campaign Performance Routes
  app.get("/api/campaigns/:campaignId/performance", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const performance = await storage.getCampaignPerformance(campaignId);
      res.json(performance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaign performance" });
    }
  });

  // Email Campaign Routes
  app.get("/api/email-campaigns", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from auth session
      const campaigns = await storage.getEmailCampaigns(instructorId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email campaigns" });
    }
  });

  app.post("/api/email-campaigns", async (req, res) => {
    try {
      const validatedData = insertEmailCampaignSchema.parse(req.body);
      const instructorId = 1; // TODO: Get from auth session
      
      const campaign = await storage.createEmailCampaign(validatedData, instructorId);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create email campaign" });
    }
  });

  // Social Media Post Routes
  app.get("/api/social-media-posts", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from auth session
      const posts = await storage.getSocialMediaPosts(instructorId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch social media posts" });
    }
  });

  app.post("/api/social-media-posts", async (req, res) => {
    try {
      const validatedData = insertSocialMediaPostSchema.parse(req.body);
      const instructorId = 1; // TODO: Get from auth session
      
      const post = await storage.createSocialMediaPost(validatedData, instructorId);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create social media post" });
    }
  });

  // Settings Routes
  
  // User Preferences Routes
  app.get("/api/user-preferences", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth session
      let preferences = await storage.getUserPreferences(userId);
      
      // Return computed defaults if none exist (without persisting)
      if (!preferences) {
        const defaultPrefs = {
          id: 0, // Temporary ID for frontend
          userId,
          theme: "light" as const,
          language: "en",
          timezone: "UTC",
          dateFormat: "MM/dd/yyyy",
          timeFormat: "12h" as const,
          currency: "USD",
          autoSave: true,
          compactView: false,
          showTutorials: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        preferences = defaultPrefs;
      }
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });

  app.put("/api/user-preferences", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth session
      const validatedData = updateUserPreferencesSchema.parse(req.body);
      
      // Try to update existing preferences
      let preferences = await storage.updateUserPreferences(userId, validatedData);
      
      // If no existing preferences, create them
      if (!preferences) {
        const defaultPrefs = {
          theme: "light" as const,
          language: "en",
          timezone: "UTC",
          dateFormat: "MM/dd/yyyy",
          timeFormat: "12h" as const,
          currency: "USD",
          autoSave: true,
          compactView: false,
          showTutorials: true,
          ...validatedData, // Override with provided values
        };
        preferences = await storage.createUserPreferences(defaultPrefs, userId);
      }
      
      res.json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update user preferences" });
    }
  });

  // Notification Settings Routes
  app.get("/api/notification-settings", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth session
      let settings = await storage.getNotificationSettings(userId);
      
      // Return computed defaults if none exist (without persisting)
      if (!settings) {
        const defaultSettings = {
          id: 0, // Temporary ID for frontend
          userId,
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          marketingEmails: false,
          courseUpdates: true,
          newEnrollments: true,
          paymentAlerts: true,
          systemUpdates: true,
          weeklyReports: true,
          monthlyReports: false,
          reminderFrequency: "daily" as const,
          quietHoursStart: null,
          quietHoursEnd: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        settings = defaultSettings;
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  app.put("/api/notification-settings", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth session
      const validatedData = updateNotificationSettingsSchema.parse(req.body);
      
      // Try to update existing settings
      let settings = await storage.updateNotificationSettings(userId, validatedData);
      
      // If no existing settings, create them
      if (!settings) {
        const defaultSettings = {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          marketingEmails: false,
          courseUpdates: true,
          newEnrollments: true,
          paymentAlerts: true,
          systemUpdates: true,
          weeklyReports: true,
          monthlyReports: false,
          reminderFrequency: "daily" as const,
          ...validatedData, // Override with provided values
        };
        settings = await storage.createNotificationSettings(defaultSettings, userId);
      }
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // Instructor Settings Routes
  app.get("/api/instructor-settings", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from auth session
      let settings = await storage.getInstructorSettings(instructorId);
      
      // Return computed defaults if none exist (without persisting)
      if (!settings) {
        const defaultSettings = {
          id: 0, // Temporary ID for frontend
          instructorId,
          defaultCoursePrice: "99.99",
          defaultCourseDuration: 8,
          defaultCourseLevel: "beginner" as const,
          autoPublishCourses: false,
          allowCourseDiscounts: true,
          maxDiscountPercentage: 50,
          payoutMethod: "bank_transfer" as const,
          payoutFrequency: "monthly" as const,
          taxId: null,
          businessName: null,
          businessAddress: null,
          websiteUrl: null,
          socialMediaLinks: null,
          bio: null,
          expertise: null,
          yearsOfExperience: null,
          autoReplyEnabled: false,
          autoReplyMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        settings = defaultSettings;
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch instructor settings" });
    }
  });

  app.put("/api/instructor-settings", async (req, res) => {
    try {
      const instructorId = 1; // TODO: Get from auth session
      const validatedData = updateInstructorSettingsSchema.parse(req.body);
      
      // Try to update existing settings
      let settings = await storage.updateInstructorSettings(instructorId, validatedData);
      
      // If no existing settings, create them
      if (!settings) {
        const defaultSettings = {
          defaultCoursePrice: "99.99",
          defaultCourseDuration: 8,
          defaultCourseLevel: "beginner" as const,
          autoPublishCourses: false,
          allowCourseDiscounts: true,
          maxDiscountPercentage: 50,
          payoutMethod: "bank_transfer" as const,
          payoutFrequency: "monthly" as const,
          autoReplyEnabled: false,
          ...validatedData, // Override with provided values
        };
        settings = await storage.createInstructorSettings(defaultSettings, instructorId);
      }
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update instructor settings" });
    }
  });

  // Privacy Settings Routes
  app.get("/api/privacy-settings", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth session
      let settings = await storage.getPrivacySettings(userId);
      
      // Return computed defaults if none exist (without persisting)
      if (!settings) {
        const defaultSettings = {
          id: 0, // Temporary ID for frontend
          userId,
          profileVisibility: "public" as const,
          showEmail: false,
          showPhoneNumber: false,
          allowContactFromStudents: true,
          allowContactFromInstructors: true,
          showEnrollmentHistory: true,
          showProgressToInstructors: true,
          allowCertificateSharing: true,
          allowReviews: true,
          allowMessaging: true,
          dataRetentionPeriod: 365,
          allowAnalytics: true,
          allowTargetedAds: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        settings = defaultSettings;
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch privacy settings" });
    }
  });

  app.put("/api/privacy-settings", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth session
      const validatedData = updatePrivacySettingsSchema.parse(req.body);
      
      // Try to update existing settings
      let settings = await storage.updatePrivacySettings(userId, validatedData);
      
      // If no existing settings, create them
      if (!settings) {
        const defaultSettings = {
          profileVisibility: "public" as const,
          showEmail: false,
          showPhoneNumber: false,
          allowContactFromStudents: true,
          allowContactFromInstructors: true,
          showEnrollmentHistory: true,
          showProgressToInstructors: true,
          allowCertificateSharing: true,
          allowReviews: true,
          allowMessaging: true,
          dataRetentionPeriod: 365,
          allowAnalytics: true,
          allowTargetedAds: false,
          ...validatedData, // Override with provided values
        };
        settings = await storage.createPrivacySettings(defaultSettings, userId);
      }
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update privacy settings" });
    }
  });

  // Help & Support Routes

  // Documentation Articles Routes
  app.get("/api/documentation", async (req, res) => {
    try {
      const category = req.query.category as string;
      let articles;
      
      if (category) {
        articles = await storage.getDocumentationArticlesByCategory(category);
      } else {
        articles = await storage.getDocumentationArticles();
      }
      
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documentation articles" });
    }
  });

  app.get("/api/documentation/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid article ID" });
      }
      
      const article = await storage.getDocumentationArticle(id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      // Increment views when article is accessed
      await storage.incrementArticleViews(id);
      
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.post("/api/documentation", async (req, res) => {
    try {
      const authorId = 1; // TODO: Get from auth session
      const validatedData = insertDocumentationArticleSchema.parse(req.body);
      
      const article = await storage.createDocumentationArticle(validatedData, authorId);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  app.put("/api/documentation/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid article ID" });
      }
      
      const validatedData = updateDocumentationArticleSchema.parse(req.body);
      const article = await storage.updateDocumentationArticle(id, validatedData);
      
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      res.json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/documentation/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid article ID" });
      }
      
      const success = await storage.deleteDocumentationArticle(id);
      if (!success) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  app.post("/api/documentation/:id/rate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid article ID" });
      }
      
      const { helpful } = req.body;
      if (typeof helpful !== "boolean") {
        return res.status(400).json({ error: "helpful must be a boolean" });
      }
      
      await storage.rateArticleHelpful(id, helpful);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to rate article" });
    }
  });

  // FAQ Routes
  app.get("/api/faq", async (req, res) => {
    try {
      const category = req.query.category as string;
      let faqs;
      
      if (category) {
        faqs = await storage.getFaqEntriesByCategory(category);
      } else {
        faqs = await storage.getFaqEntries();
      }
      
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FAQ entries" });
    }
  });

  app.get("/api/faq/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid FAQ ID" });
      }
      
      const faq = await storage.getFaqEntry(id);
      if (!faq) {
        return res.status(404).json({ error: "FAQ not found" });
      }
      
      // Increment views when FAQ is accessed
      await storage.incrementFaqViews(id);
      
      res.json(faq);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FAQ" });
    }
  });

  app.post("/api/faq", async (req, res) => {
    try {
      const validatedData = insertFaqEntrySchema.parse(req.body);
      const faq = await storage.createFaqEntry(validatedData);
      res.status(201).json(faq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });

  app.put("/api/faq/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid FAQ ID" });
      }
      
      const validatedData = updateFaqEntrySchema.parse(req.body);
      const faq = await storage.updateFaqEntry(id, validatedData);
      
      if (!faq) {
        return res.status(404).json({ error: "FAQ not found" });
      }
      
      res.json(faq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  });

  app.delete("/api/faq/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid FAQ ID" });
      }
      
      const success = await storage.deleteFaqEntry(id);
      if (!success) {
        return res.status(404).json({ error: "FAQ not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });

  app.post("/api/faq/:id/rate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid FAQ ID" });
      }
      
      const { helpful } = req.body;
      if (typeof helpful !== "boolean") {
        return res.status(400).json({ error: "helpful must be a boolean" });
      }
      
      await storage.rateFaqHelpful(id, helpful);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to rate FAQ" });
    }
  });

  // Support Tickets Routes
  app.get("/api/support-tickets", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth session
      const tickets = await storage.getSupportTickets(userId);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch support tickets" });
    }
  });

  app.get("/api/support-tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ticket ID" });
      }
      
      const ticket = await storage.getSupportTicket(id);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });

  app.post("/api/support-tickets", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth session
      const validatedData = insertSupportTicketSchema.parse(req.body);
      
      const ticket = await storage.createSupportTicket(validatedData, userId);
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create support ticket" });
    }
  });

  app.put("/api/support-tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ticket ID" });
      }
      
      const validatedData = updateSupportTicketSchema.parse(req.body);
      const ticket = await storage.updateSupportTicket(id, validatedData);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });

  app.delete("/api/support-tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ticket ID" });
      }
      
      const success = await storage.deleteSupportTicket(id);
      if (!success) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete ticket" });
    }
  });

  // Ticket Messages Routes
  app.get("/api/support-tickets/:ticketId/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: "Invalid ticket ID" });
      }
      
      const messages = await storage.getTicketMessages(ticketId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ticket messages" });
    }
  });

  app.post("/api/support-tickets/:ticketId/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: "Invalid ticket ID" });
      }
      
      const userId = 1; // TODO: Get from auth session
      const validatedData = insertTicketMessageSchema.parse(req.body);
      
      const message = await storage.createTicketMessage(validatedData, ticketId, userId, false);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Live Classes Routes
  
  // Get all live classes (optionally filter by instructor)
  app.get("/api/live-classes", async (req, res) => {
    try {
      const instructorId = req.query.instructorId ? parseInt(req.query.instructorId as string) : undefined;
      const classes = await storage.getLiveClasses(instructorId);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch live classes" });
    }
  });

  // Get a specific live class
  app.get("/api/live-classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid class ID" });
      }
      
      const liveClass = await storage.getLiveClass(id);
      if (!liveClass) {
        return res.status(404).json({ error: "Live class not found" });
      }
      
      res.json(liveClass);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch live class" });
    }
  });

  // Create a new live class
  app.post("/api/live-classes", async (req, res) => {
    try {
      const validatedData = insertLiveClassSchema.parse(req.body);
      const instructorId = 1; // TODO: Get from authenticated user
      const liveClass = await storage.createLiveClass(validatedData, instructorId);
      res.status(201).json(liveClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      res.status(500).json({ error: "Failed to create live class" });
    }
  });

  // Update a live class
  app.put("/api/live-classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid class ID" });
      }
      
      const validatedData = updateLiveClassSchema.parse(req.body);
      const liveClass = await storage.updateLiveClass(id, validatedData);
      
      if (!liveClass) {
        return res.status(404).json({ error: "Live class not found" });
      }
      
      res.json(liveClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      res.status(500).json({ error: "Failed to update live class" });
    }
  });

  // Delete a live class
  app.delete("/api/live-classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid class ID" });
      }
      
      const deleted = await storage.deleteLiveClass(id);
      if (!deleted) {
        return res.status(404).json({ error: "Live class not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete live class" });
    }
  });

  // Recorded Videos Routes
  
  // Get all recorded videos (optionally filter by instructor)
  app.get("/api/recorded-videos", async (req, res) => {
    try {
      const instructorId = req.query.instructorId ? parseInt(req.query.instructorId as string) : undefined;
      const videos = await storage.getRecordedVideos(instructorId);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recorded videos" });
    }
  });

  // Get a specific recorded video
  app.get("/api/recorded-videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid video ID" });
      }
      
      const video = await storage.getRecordedVideo(id);
      if (!video) {
        return res.status(404).json({ error: "Recorded video not found" });
      }
      
      // Increment view count
      await storage.incrementVideoViews(id);
      
      res.json(video);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recorded video" });
    }
  });

  // Create a new recorded video
  app.post("/api/recorded-videos", async (req, res) => {
    try {
      const validatedData = insertRecordedVideoSchema.parse(req.body);
      const instructorId = 1; // TODO: Get from authenticated user
      const video = await storage.createRecordedVideo(validatedData, instructorId);
      res.status(201).json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      res.status(500).json({ error: "Failed to create recorded video" });
    }
  });

  // Update a recorded video
  app.put("/api/recorded-videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid video ID" });
      }
      
      const validatedData = updateRecordedVideoSchema.parse(req.body);
      const video = await storage.updateRecordedVideo(id, validatedData);
      
      if (!video) {
        return res.status(404).json({ error: "Recorded video not found" });
      }
      
      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      res.status(500).json({ error: "Failed to update recorded video" });
    }
  });

  // Delete a recorded video
  app.delete("/api/recorded-videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid video ID" });
      }
      
      const deleted = await storage.deleteRecordedVideo(id);
      if (!deleted) {
        return res.status(404).json({ error: "Recorded video not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recorded video" });
    }
  });

  // YouTube Knowledge Base Routes
  
  // Analyze YouTube video
  app.post("/api/youtube/analyze", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "YouTube URL is required" });
      }

      const userId = 1; // TODO: Get from authenticated user
      const result = await analyzeYouTubeVideo(url, storage, userId);
      
      res.status(201).json(result);
    } catch (error) {
      console.error("YouTube analysis error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to analyze YouTube video" 
      });
    }
  });

  // Get YouTube analysis
  app.get("/api/youtube/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }

      const analysis = await storage.getYoutubeAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      const questions = await storage.getYoutubeQuestions(id);
      
      res.json({ ...analysis, questions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  // Ask question about YouTube video
  app.post("/api/youtube/:id/chat", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }

      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const result = await answerQuestion(id, question, storage);
      
      res.json(result);
    } catch (error) {
      console.error("Question answering error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to answer question" 
      });
    }
  });

  // Get all YouTube analyses for a user
  app.get("/api/youtube", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from authenticated user
      const analyses = await storage.getYoutubeAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analyses" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
