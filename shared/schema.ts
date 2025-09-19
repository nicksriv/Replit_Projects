import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
