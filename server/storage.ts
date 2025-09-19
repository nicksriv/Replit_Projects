import { 
  users, 
  courses, 
  revenueRecords, 
  payouts, 
  type User, 
  type InsertUser, 
  type Course, 
  type InsertCourse,
  type RevenueRecord,
  type InsertRevenueRecord,
  type Payout,
  type InsertPayout
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Course methods
  getCourse(id: number): Promise<Course | undefined>;
  getCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse, instructorId: number): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Revenue methods
  getRevenueRecords(instructorId: number): Promise<RevenueRecord[]>;
  createRevenueRecord(record: InsertRevenueRecord, instructorId: number): Promise<RevenueRecord>;
  getRevenueByPeriod(instructorId: number, startDate: Date, endDate: Date): Promise<RevenueRecord[]>;
  getTotalRevenue(instructorId: number): Promise<number>;
  
  // Payout methods
  getPayouts(instructorId: number): Promise<Payout[]>;
  createPayout(payout: InsertPayout, instructorId: number): Promise<Payout>;
  updatePayoutStatus(id: number, status: string, notes?: string): Promise<Payout | undefined>;
  getAvailableBalance(instructorId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private revenueRecords: Map<number, RevenueRecord>;
  private payouts: Map<number, Payout>;
  private currentUserId: number;
  private currentCourseId: number;
  private currentRevenueId: number;
  private currentPayoutId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.revenueRecords = new Map();
    this.payouts = new Map();
    this.currentUserId = 1;
    this.currentCourseId = 1;
    this.currentRevenueId = 1;
    this.currentPayoutId = 1;
    
    // Add some sample revenue data for demo
    this.seedSampleData();
  }
  
  private seedSampleData() {
    // Sample revenue records
    const sampleRevenue: RevenueRecord[] = [
      {
        id: 1,
        instructorId: 1,
        courseId: null,
        amount: "299.99",
        source: "course_sale",
        description: "Complete Web Development Course sale",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        id: 2,
        instructorId: 1,
        courseId: null,
        amount: "149.50",
        source: "course_sale", 
        description: "React Fundamentals Course sale",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: 3,
        instructorId: 1,
        courseId: null,
        amount: "89.99",
        source: "course_sale",
        description: "JavaScript Basics Course sale",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: 4,
        instructorId: 1,
        courseId: null,
        amount: "50.00",
        source: "bonus",
        description: "Performance bonus for high ratings",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      }
    ];
    
    sampleRevenue.forEach(record => {
      this.revenueRecords.set(record.id, record);
    });
    
    // Sample payout
    const samplePayout: Payout = {
      id: 1,
      instructorId: 1,
      amount: "450.00",
      status: "completed",
      paymentMethod: "paypal",
      accountDetails: "instructor@example.com",
      requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      processedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
      completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      notes: "Monthly payout processed successfully",
    };
    
    this.payouts.set(1, samplePayout);
    this.currentRevenueId = 5;
    this.currentPayoutId = 2;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Course methods
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async createCourse(insertCourse: InsertCourse, instructorId: number): Promise<Course> {
    const id = this.currentCourseId++;
    const course: Course = {
      ...insertCourse,
      id,
      price: insertCourse.price,
      instructorId,
      createdAt: new Date(),
      isPublished: insertCourse.isPublished ?? false,
      thumbnail: insertCourse.thumbnail || null,
    };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: number, updateData: Partial<Course>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    // Strip protected fields that should never be updated
    const { id: _id, createdAt: _createdAt, instructorId: _instructorId, ...safeUpdates } = updateData;
    
    const updatedCourse = { ...course, ...safeUpdates };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Revenue methods
  async getRevenueRecords(instructorId: number): Promise<RevenueRecord[]> {
    return Array.from(this.revenueRecords.values())
      .filter(record => record.instructorId === instructorId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createRevenueRecord(insertRecord: InsertRevenueRecord, instructorId: number): Promise<RevenueRecord> {
    const id = this.currentRevenueId++;
    const record: RevenueRecord = {
      ...insertRecord,
      id,
      instructorId,
      courseId: insertRecord.courseId || null,
      createdAt: new Date(),
    };
    this.revenueRecords.set(id, record);
    return record;
  }

  async getRevenueByPeriod(instructorId: number, startDate: Date, endDate: Date): Promise<RevenueRecord[]> {
    return Array.from(this.revenueRecords.values())
      .filter(record => 
        record.instructorId === instructorId &&
        record.createdAt &&
        new Date(record.createdAt) >= startDate &&
        new Date(record.createdAt) <= endDate
      );
  }

  async getTotalRevenue(instructorId: number): Promise<number> {
    const records = await this.getRevenueRecords(instructorId);
    return records.reduce((total, record) => total + parseFloat(record.amount || "0"), 0);
  }

  // Payout methods
  async getPayouts(instructorId: number): Promise<Payout[]> {
    return Array.from(this.payouts.values())
      .filter(payout => payout.instructorId === instructorId)
      .sort((a, b) => new Date(b.requestedAt!).getTime() - new Date(a.requestedAt!).getTime());
  }

  async createPayout(insertPayout: InsertPayout, instructorId: number): Promise<Payout> {
    const id = this.currentPayoutId++;
    const payout: Payout = {
      ...insertPayout,
      id,
      instructorId,
      status: "pending",
      requestedAt: new Date(),
      processedAt: null,
      completedAt: null,
    };
    this.payouts.set(id, payout);
    return payout;
  }

  async updatePayoutStatus(id: number, status: string, notes?: string): Promise<Payout | undefined> {
    const payout = this.payouts.get(id);
    if (!payout) return undefined;

    const updatedPayout = { 
      ...payout, 
      status,
      notes: notes || payout.notes,
      processedAt: status === "processing" ? new Date() : payout.processedAt,
      completedAt: status === "completed" ? new Date() : payout.completedAt,
    };
    
    this.payouts.set(id, updatedPayout);
    return updatedPayout;
  }

  async getAvailableBalance(instructorId: number): Promise<number> {
    const totalRevenue = await this.getTotalRevenue(instructorId);
    const payouts = await this.getPayouts(instructorId);
    
    // Include completed payouts and pending/processing payouts (held funds)
    const totalPayouts = payouts
      .filter(p => ["completed", "pending", "processing"].includes(p.status || ""))
      .reduce((total, payout) => total + parseFloat(payout.amount || "0"), 0);
    
    return Math.max(0, totalRevenue - totalPayouts);
  }
}

export const storage = new MemStorage();
