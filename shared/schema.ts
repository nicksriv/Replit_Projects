import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  password: text("password").notNull(),
  role: text("role").default("student"), // student, instructor, admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, "password">;

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  level: text("level").notNull(), // beginner, intermediate, advanced
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in hours
  thumbnail: text("thumbnail"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  instructorId: integer("instructor_id").references(() => users.id),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  instructorId: true,
}).extend({
  // Add validation rules
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  category: z.string().min(1, "Category is required"),
  level: z.enum(["beginner", "intermediate", "advanced"], { required_error: "Level is required" }),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Price must be a valid positive number"),
  duration: z.number().min(1, "Duration must be at least 1 hour").max(200, "Duration must be less than 200 hours"),
  thumbnail: z.string().url().optional().or(z.literal("")),
  isPublished: z.boolean().optional(),
});

export const updateCourseSchema = insertCourseSchema.partial().omit({
  // Never allow updating these protected fields
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type UpdateCourse = z.infer<typeof updateCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Revenue Tracking
export const revenueRecords = pgTable("revenue_records", {
  id: serial("id").primaryKey(),
  instructorId: integer("instructor_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  source: text("source", { enum: ["course_sale", "subscription", "bonus"] }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payout Management
export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  instructorId: integer("instructor_id").references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).default("pending"),
  paymentMethod: text("payment_method", { enum: ["bank_transfer", "paypal", "stripe"] }),
  accountDetails: text("account_details"), // JSON string for payment details
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

// Revenue Record Schemas
export const insertRevenueRecordSchema = createInsertSchema(revenueRecords).omit({
  id: true,
  createdAt: true,
  instructorId: true,
}).extend({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a valid positive number"),
  source: z.enum(["course_sale", "subscription", "bonus"], { required_error: "Source is required" }),
  description: z.string().optional(),
});

// Payout Schemas  
export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  instructorId: true,
  requestedAt: true,
  processedAt: true,
  completedAt: true,
  status: true,
}).extend({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 50, "Minimum payout amount is $50"),
  paymentMethod: z.enum(["bank_transfer", "paypal", "stripe"], { required_error: "Payment method is required" }),
  accountDetails: z.string().min(1, "Account details are required"),
  notes: z.string().optional(),
});

export const updatePayoutSchema = z.object({
  status: z.enum(["pending", "processing", "completed", "failed"], { required_error: "Status is required" }),
  notes: z.string().optional(),
});

export type InsertRevenueRecord = z.infer<typeof insertRevenueRecordSchema>;
export type RevenueRecord = typeof revenueRecords.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type UpdatePayout = z.infer<typeof updatePayoutSchema>;
export type Payout = typeof payouts.$inferSelect;

// Learner Management
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  instructorId: integer("instructor_id").notNull().references(() => users.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0"), // Percentage 0-100
  completedAt: timestamp("completed_at"),
  lastActivityAt: timestamp("last_activity_at"),
  status: text("status", { enum: ["active", "completed", "dropped", "suspended"] }).default("active"),
  notes: text("notes"), // Instructor notes about the student
});

export const studentProgress = pgTable("student_progress", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => enrollments.id),
  lessonId: text("lesson_id"), // Could reference lessons table if it existed
  lessonTitle: text("lesson_title"),
  progressType: text("progress_type", { enum: ["started", "completed", "quiz_passed", "assignment_submitted"] }),
  completedAt: timestamp("completed_at").defaultNow(),
  score: decimal("score", { precision: 5, scale: 2 }), // For quizzes/assignments
  timeSpent: integer("time_spent"), // Minutes spent on lesson
});

export const studentCommunications = pgTable("student_communications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id),
  instructorId: integer("instructor_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  subject: text("subject"),
  message: text("message"),
  type: text("type", { enum: ["announcement", "private_message", "feedback", "reminder"] }),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Enrollment Schemas
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
  instructorId: true,
}).extend({
  studentId: z.number().positive("Student ID is required"),
  courseId: z.number().positive("Course ID is required"),
  progress: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Progress must be between 0 and 100").optional(),
  status: z.enum(["active", "completed", "dropped", "suspended"]).optional(),
  notes: z.string().optional(),
});

export const updateEnrollmentSchema = insertEnrollmentSchema.partial().omit({
  studentId: true,
  courseId: true,
});

// Communication Schemas
export const insertCommunicationSchema = createInsertSchema(studentCommunications).omit({
  id: true,
  sentAt: true,
  readAt: true,
  instructorId: true,
}).extend({
  studentId: z.number().positive("Student ID is required"),
  courseId: z.number().positive("Course ID is required").optional(),
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
  type: z.enum(["announcement", "private_message", "feedback", "reminder"]),
});

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type UpdateEnrollment = z.infer<typeof updateEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type StudentProgress = typeof studentProgress.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type StudentCommunication = typeof studentCommunications.$inferSelect;

// Skills Management
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // technical, soft, domain-specific
  level: text("level").notNull(), // beginner, intermediate, advanced, expert
  prerequisites: text("prerequisites").array(), // Array of skill names or IDs
  instructorId: integer("instructor_id").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const skillAssessments = pgTable("skill_assessments", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // quiz, practical, project, peer_review
  questions: text("questions").notNull(), // JSON string of questions
  passingScore: decimal("passing_score", { precision: 5, scale: 2 }).notNull(),
  timeLimit: integer("time_limit"), // in minutes
  maxAttempts: integer("max_attempts").default(3),
  instructorId: integer("instructor_id").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studentSkillProgress = pgTable("student_skill_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  instructorId: integer("instructor_id").notNull().references(() => users.id),
  currentLevel: text("current_level").notNull().default("beginner"), // beginner, intermediate, advanced, expert
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  assessmentsPassed: integer("assessments_passed").default(0),
  totalAssessments: integer("total_assessments").default(0),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  skillAchievedAt: timestamp("skill_achieved_at"), // When they completed/mastered the skill
  notes: text("notes"),
});

export const skillAttempts = pgTable("skill_attempts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  assessmentId: integer("assessment_id").notNull().references(() => skillAssessments.id),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  answers: text("answers").notNull(), // JSON string of student answers
  passed: boolean("passed").default(false),
  timeSpent: integer("time_spent"), // in minutes
  attemptedAt: timestamp("attempted_at").defaultNow(),
  feedback: text("feedback"),
});

// Skills Schemas
export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
  instructorId: true,
}).extend({
  name: z.string().min(2, "Skill name must be at least 2 characters").max(100, "Skill name must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  category: z.enum(["technical", "soft", "domain-specific"]),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  prerequisites: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const insertSkillAssessmentSchema = createInsertSchema(skillAssessments).omit({
  id: true,
  createdAt: true,
  instructorId: true,
}).extend({
  skillId: z.number().positive("Skill ID is required"),
  name: z.string().min(3, "Assessment name must be at least 3 characters").max(100, "Assessment name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  type: z.enum(["quiz", "practical", "project", "peer_review"]),
  questions: z.string().min(1, "Questions are required"),
  passingScore: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, "Passing score must be between 0 and 100"),
  timeLimit: z.number().positive().optional(),
  maxAttempts: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const insertStudentSkillProgressSchema = createInsertSchema(studentSkillProgress).omit({
  id: true,
  instructorId: true,
}).extend({
  studentId: z.number().positive("Student ID is required"),
  skillId: z.number().positive("Skill ID is required"),
  currentLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  progressPercentage: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Progress must be between 0 and 100").optional(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
});

export const insertSkillAttemptSchema = createInsertSchema(skillAttempts).omit({
  id: true,
  attemptedAt: true,
}).extend({
  studentId: z.number().positive("Student ID is required"),
  assessmentId: z.number().positive("Assessment ID is required"),
  score: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, "Score must be between 0 and 100"),
  answers: z.string().min(1, "Answers are required"),
  timeSpent: z.number().positive().optional(),
  feedback: z.string().max(1000, "Feedback must be less than 1000 characters").optional(),
});

export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertSkillAssessment = z.infer<typeof insertSkillAssessmentSchema>;
export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type InsertStudentSkillProgress = z.infer<typeof insertStudentSkillProgressSchema>;
export type StudentSkillProgress = typeof studentSkillProgress.$inferSelect;
export type InsertSkillAttempt = z.infer<typeof insertSkillAttemptSchema>;
export type SkillAttempt = typeof skillAttempts.$inferSelect;
