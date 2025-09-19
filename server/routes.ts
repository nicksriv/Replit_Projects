import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCourseSchema, 
  updateCourseSchema, 
  insertPayoutSchema, 
  updatePayoutSchema,
  insertEnrollmentSchema,
  updateEnrollmentSchema,
  insertCommunicationSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);

  return httpServer;
}
