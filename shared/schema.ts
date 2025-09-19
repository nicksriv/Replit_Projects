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

// Marketing Management
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // email, social, paid_ads, content, referral
  status: text("status").notNull().default("draft"), // draft, active, paused, completed, cancelled
  targetAudience: text("target_audience"), // JSON string for audience criteria
  budget: decimal("budget", { precision: 10, scale: 2 }),
  actualSpend: decimal("actual_spend", { precision: 10, scale: 2 }).default("0"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  goals: text("goals"), // JSON string for campaign goals and KPIs
  instructorId: integer("instructor_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const promotionalCodes = pgTable("promotional_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // percentage, fixed_amount, free_shipping, buy_one_get_one
  value: decimal("value", { precision: 10, scale: 2 }).notNull(), // Discount value or percentage
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"), // Total usage limit
  usageCount: integer("usage_count").default(0),
  userUsageLimit: integer("user_usage_limit").default(1), // Per user limit
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  applicableCourses: text("applicable_courses").array(), // Course IDs or "all"
  isActive: boolean("is_active").default(true),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id),
  instructorId: integer("instructor_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaignPerformance = pgTable("campaign_performance", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => marketingCampaigns.id),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  cost: decimal("cost", { precision: 10, scale: 2 }).default("0"),
  emailsSent: integer("emails_sent").default(0),
  emailsOpened: integer("emails_opened").default(0),
  emailsClicked: integer("emails_clicked").default(0),
  socialShares: integer("social_shares").default(0),
  socialEngagement: integer("social_engagement").default(0),
  referrals: integer("referrals").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(), // HTML email content
  recipientSegment: text("recipient_segment"), // JSON criteria for recipient selection
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  totalRecipients: integer("total_recipients").default(0),
  delivered: integer("delivered").default(0),
  bounced: integer("bounced").default(0),
  opened: integer("opened").default(0),
  clicked: integer("clicked").default(0),
  unsubscribed: integer("unsubscribed").default(0),
  status: text("status").default("draft"), // draft, scheduled, sending, sent, failed
  instructorId: integer("instructor_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialMediaPosts = pgTable("social_media_posts", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id),
  platform: text("platform").notNull(), // facebook, twitter, instagram, linkedin, youtube
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(), // Images, videos
  hashtags: text("hashtags").array(),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  externalPostId: text("external_post_id"), // Platform-specific post ID
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  clicks: integer("clicks").default(0),
  reach: integer("reach").default(0),
  impressions: integer("impressions").default(0),
  status: text("status").default("draft"), // draft, scheduled, published, failed
  instructorId: integer("instructor_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing Schemas
export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  instructorId: true,
  actualSpend: true,
}).extend({
  name: z.string().min(3, "Campaign name must be at least 3 characters").max(100, "Campaign name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  type: z.enum(["email", "social", "paid_ads", "content", "referral"]),
  status: z.enum(["draft", "active", "paused", "completed", "cancelled"]).optional(),
  targetAudience: z.string().optional(),
  budget: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Budget must be a valid positive number").optional(),
  goals: z.string().optional(),
});

export const insertPromotionalCodeSchema = createInsertSchema(promotionalCodes).omit({
  id: true,
  createdAt: true,
  instructorId: true,
  usageCount: true,
}).extend({
  code: z.string().min(3, "Code must be at least 3 characters").max(20, "Code must be less than 20 characters").regex(/^[A-Z0-9]+$/, "Code must contain only uppercase letters and numbers"),
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  type: z.enum(["percentage", "fixed_amount", "free_shipping", "buy_one_get_one"]),
  value: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Value must be a valid positive number"),
  minOrderAmount: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Minimum order amount must be a valid positive number").optional(),
  maxDiscount: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) > 0), "Maximum discount must be a valid positive number").optional(),
  usageLimit: z.number().positive().optional(),
  userUsageLimit: z.number().positive().optional(),
  applicableCourses: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  campaignId: z.number().positive().optional(),
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
  instructorId: true,
  sentAt: true,
  totalRecipients: true,
  delivered: true,
  bounced: true,
  opened: true,
  clicked: true,
  unsubscribed: true,
  status: true,
}).extend({
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200, "Subject must be less than 200 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  recipientSegment: z.string().optional(),
  campaignId: z.number().positive().optional(),
});

export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPosts).omit({
  id: true,
  createdAt: true,
  instructorId: true,
  publishedAt: true,
  externalPostId: true,
  likes: true,
  comments: true,
  shares: true,
  clicks: true,
  reach: true,
  impressions: true,
  status: true,
}).extend({
  platform: z.enum(["facebook", "twitter", "instagram", "linkedin", "youtube"]),
  content: z.string().min(10, "Content must be at least 10 characters").max(2000, "Content must be less than 2000 characters"),
  mediaUrls: z.array(z.string().url()).optional(),
  hashtags: z.array(z.string()).optional(),
  campaignId: z.number().positive().optional(),
});

export const updateMarketingCampaignSchema = insertMarketingCampaignSchema.partial();
export const updatePromotionalCodeSchema = insertPromotionalCodeSchema.partial().omit({
  code: true, // Never allow updating the code itself
});

export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type UpdateMarketingCampaign = z.infer<typeof updateMarketingCampaignSchema>;
export type InsertPromotionalCode = z.infer<typeof insertPromotionalCodeSchema>;
export type PromotionalCode = typeof promotionalCodes.$inferSelect;
export type UpdatePromotionalCode = z.infer<typeof updatePromotionalCodeSchema>;
export type CampaignPerformance = typeof campaignPerformance.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;

// Settings Management
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  theme: text("theme").default("light"), // light, dark, system
  language: text("language").default("en"), // en, es, fr, de, etc.
  timezone: text("timezone").default("UTC"),
  dateFormat: text("date_format").default("MM/dd/yyyy"),
  timeFormat: text("time_format").default("12h"), // 12h, 24h
  currency: text("currency").default("USD"),
  autoSave: boolean("auto_save").default(true),
  compactView: boolean("compact_view").default(false),
  showTutorials: boolean("show_tutorials").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  marketingEmails: boolean("marketing_emails").default(false),
  courseUpdates: boolean("course_updates").default(true),
  newEnrollments: boolean("new_enrollments").default(true),
  paymentAlerts: boolean("payment_alerts").default(true),
  systemUpdates: boolean("system_updates").default(true),
  weeklyReports: boolean("weekly_reports").default(true),
  monthlyReports: boolean("monthly_reports").default(false),
  reminderFrequency: text("reminder_frequency").default("daily"), // none, daily, weekly
  quietHoursStart: text("quiet_hours_start"), // 22:00
  quietHoursEnd: text("quiet_hours_end"), // 08:00
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const instructorSettings = pgTable("instructor_settings", {
  id: serial("id").primaryKey(),
  instructorId: integer("instructor_id").references(() => users.id),
  defaultCoursePrice: decimal("default_course_price", { precision: 10, scale: 2 }).default("99.99"),
  defaultCourseDuration: integer("default_course_duration").default(8), // hours
  defaultCourseLevel: text("default_course_level").default("beginner"),
  autoPublishCourses: boolean("auto_publish_courses").default(false),
  allowCourseDiscounts: boolean("allow_course_discounts").default(true),
  maxDiscountPercentage: integer("max_discount_percentage").default(50),
  payoutMethod: text("payout_method").default("bank_transfer"), // bank_transfer, paypal, stripe
  payoutFrequency: text("payout_frequency").default("monthly"), // weekly, bi_weekly, monthly
  taxId: text("tax_id"),
  businessName: text("business_name"),
  businessAddress: text("business_address"),
  websiteUrl: text("website_url"),
  socialMediaLinks: text("social_media_links").array(),
  bio: text("bio"),
  expertise: text("expertise").array(),
  yearsOfExperience: integer("years_of_experience"),
  autoReplyEnabled: boolean("auto_reply_enabled").default(false),
  autoReplyMessage: text("auto_reply_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const privacySettings = pgTable("privacy_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  profileVisibility: text("profile_visibility").default("public"), // public, private, instructors_only
  showEmail: boolean("show_email").default(false),
  showPhoneNumber: boolean("show_phone_number").default(false),
  allowContactFromStudents: boolean("allow_contact_from_students").default(true),
  allowContactFromInstructors: boolean("allow_contact_from_instructors").default(true),
  showEnrollmentHistory: boolean("show_enrollment_history").default(true),
  showProgressToInstructors: boolean("show_progress_to_instructors").default(true),
  allowCertificateSharing: boolean("allow_certificate_sharing").default(true),
  allowReviews: boolean("allow_reviews").default(true),
  allowMessaging: boolean("allow_messaging").default(true),
  dataRetentionPeriod: integer("data_retention_period").default(365), // days
  allowAnalytics: boolean("allow_analytics").default(true),
  allowTargetedAds: boolean("allow_targeted_ads").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Settings Schemas
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string().min(2).max(5),
  timezone: z.string().min(1),
  dateFormat: z.string().min(1),
  timeFormat: z.enum(["12h", "24h"]),
  currency: z.string().length(3),
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  reminderFrequency: z.enum(["none", "daily", "weekly"]),
  quietHoursStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  quietHoursEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

export const insertInstructorSettingsSchema = createInsertSchema(instructorSettings).omit({
  id: true,
  instructorId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  defaultCoursePrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Price must be a valid positive number"),
  defaultCourseDuration: z.number().min(1).max(200),
  defaultCourseLevel: z.enum(["beginner", "intermediate", "advanced"]),
  maxDiscountPercentage: z.number().min(0).max(100),
  payoutMethod: z.enum(["bank_transfer", "paypal", "stripe"]),
  payoutFrequency: z.enum(["weekly", "bi_weekly", "monthly"]),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  socialMediaLinks: z.array(z.string().url()).optional(),
  expertise: z.array(z.string()).optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
});

export const insertPrivacySettingsSchema = createInsertSchema(privacySettings).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  profileVisibility: z.enum(["public", "private", "instructors_only"]),
  dataRetentionPeriod: z.number().min(30).max(3650), // 30 days to 10 years
});

export const updateUserPreferencesSchema = insertUserPreferencesSchema.partial();
export const updateNotificationSettingsSchema = insertNotificationSettingsSchema.partial();
export const updateInstructorSettingsSchema = insertInstructorSettingsSchema.partial();
export const updatePrivacySettingsSchema = insertPrivacySettingsSchema.partial();

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type UpdateNotificationSettings = z.infer<typeof updateNotificationSettingsSchema>;
export type InsertInstructorSettings = z.infer<typeof insertInstructorSettingsSchema>;
export type InstructorSettings = typeof instructorSettings.$inferSelect;
export type UpdateInstructorSettings = z.infer<typeof updateInstructorSettingsSchema>;
export type InsertPrivacySettings = z.infer<typeof insertPrivacySettingsSchema>;
export type PrivacySettings = typeof privacySettings.$inferSelect;
export type UpdatePrivacySettings = z.infer<typeof updatePrivacySettingsSchema>;
