import { 
  users, 
  courses, 
  revenueRecords, 
  payouts,
  enrollments,
  studentCommunications,
  type User, 
  type InsertUser, 
  type PublicUser,
  type Course, 
  type InsertCourse,
  type RevenueRecord,
  type InsertRevenueRecord,
  type Payout,
  type InsertPayout,
  type Enrollment,
  type InsertEnrollment,
  type UpdateEnrollment,
  type StudentCommunication,
  type InsertCommunication
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
  
  // Learner Management methods
  getEnrollments(instructorId: number): Promise<(Enrollment & { student: PublicUser; course: Course })[]>;
  getEnrollmentsByStudent(studentId: number): Promise<(Enrollment & { course: Course })[]>;
  createEnrollment(enrollment: InsertEnrollment, instructorId: number): Promise<Enrollment>;
  updateEnrollment(id: number, updates: UpdateEnrollment): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<boolean>;
  
  // Student Communications
  getCommunications(instructorId: number): Promise<(StudentCommunication & { student: PublicUser; course?: Course })[]>;
  sendCommunication(communication: InsertCommunication, instructorId: number): Promise<StudentCommunication>;
  markCommunicationAsRead(id: number): Promise<StudentCommunication | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private revenueRecords: Map<number, RevenueRecord>;
  private payouts: Map<number, Payout>;
  private enrollments: Map<number, Enrollment>;
  private communications: Map<number, StudentCommunication>;
  private currentUserId: number;
  private currentCourseId: number;
  private currentRevenueId: number;
  private currentPayoutId: number;
  private currentEnrollmentId: number;
  private currentCommunicationId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.revenueRecords = new Map();
    this.payouts = new Map();
    this.enrollments = new Map();
    this.communications = new Map();
    this.currentUserId = 1;
    this.currentCourseId = 1;
    this.currentRevenueId = 1;
    this.currentPayoutId = 1;
    this.currentEnrollmentId = 1;
    this.currentCommunicationId = 1;
    
    // Add some sample data for demo
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
    
    // Sample students/users
    const sampleStudents: User[] = [
      {
        id: 2,
        username: "sarah_student",
        email: "sarah@example.com",
        role: "student",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
      {
        id: 3,
        username: "mike_learner",
        email: "mike@example.com", 
        role: "student",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
      {
        id: 4,
        username: "emma_dev",
        email: "emma@example.com",
        role: "student", 
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      }
    ];
    
    sampleStudents.forEach(student => {
      this.users.set(student.id, student);
    });
    
    // Sample enrollments
    const sampleEnrollments: Enrollment[] = [
      {
        id: 1,
        studentId: 2,
        courseId: 1, // Will be created when courses are added
        instructorId: 1,
        enrolledAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        progress: "75.50",
        completedAt: null,
        lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: "active",
        notes: "Excellent progress, very engaged student",
      },
      {
        id: 2,
        studentId: 3,
        courseId: 1,
        instructorId: 1,
        enrolledAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        progress: "45.25",
        completedAt: null,
        lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: "active",
        notes: "Needs additional support with advanced topics",
      },
      {
        id: 3,
        studentId: 4,
        courseId: 1,
        instructorId: 1,
        enrolledAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
        progress: "100.00",
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        lastActivityAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "completed",
        notes: "Completed with excellent scores, provided great feedback",
      }
    ];
    
    sampleEnrollments.forEach(enrollment => {
      this.enrollments.set(enrollment.id, enrollment);
    });
    
    // Sample communications
    const sampleCommunications: StudentCommunication[] = [
      {
        id: 1,
        studentId: 2,
        instructorId: 1,
        courseId: 1,
        subject: "Great progress on Module 3!",
        message: "Hi Sarah, I noticed you've been making excellent progress on the JavaScript fundamentals module. Your understanding of async/await is particularly impressive. Keep up the great work!",
        type: "feedback",
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: 2,
        studentId: 3,
        instructorId: 1,
        courseId: 1,
        subject: "Additional Resources for React Hooks",
        message: "Hi Mike, I've noticed you might benefit from some additional practice with React Hooks. I've added some extra resources to the course materials that should help clarify the concepts. Feel free to reach out if you have any questions!",
        type: "private_message",
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        readAt: null,
      },
      {
        id: 3,
        studentId: 4,
        instructorId: 1,
        courseId: 1,
        subject: "Congratulations on Course Completion!",
        message: "Emma, congratulations on completing the Web Development course! Your final project was outstanding and showed real mastery of the concepts. I'd love to stay in touch and hear about your future projects.",
        type: "feedback",
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        readAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      }
    ];
    
    sampleCommunications.forEach(communication => {
      this.communications.set(communication.id, communication);
    });
    
    this.currentUserId = 5;
    this.currentEnrollmentId = 4;
    this.currentCommunicationId = 4;
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

  // Helper method to sanitize user data
  private sanitizeUser(user: User): PublicUser {
    const { password, ...publicUser } = user;
    return publicUser;
  }

  // Learner Management methods
  async getEnrollments(instructorId: number): Promise<(Enrollment & { student: PublicUser; course: Course })[]> {
    const enrollments = Array.from(this.enrollments.values())
      .filter(enrollment => enrollment.instructorId === instructorId)
      .sort((a, b) => new Date(b.enrolledAt!).getTime() - new Date(a.enrolledAt!).getTime());
      
    return enrollments.map(enrollment => {
      const student = this.users.get(enrollment.studentId);
      const course = this.courses.get(enrollment.courseId);
      return {
        ...enrollment,
        student: student ? this.sanitizeUser(student) : student!,
        course: course!,
      };
    }).filter(item => item.student && item.course);
  }

  async getEnrollmentsByStudent(studentId: number): Promise<(Enrollment & { course: Course })[]> {
    const enrollments = Array.from(this.enrollments.values())
      .filter(enrollment => enrollment.studentId === studentId)
      .sort((a, b) => new Date(b.enrolledAt!).getTime() - new Date(a.enrolledAt!).getTime());
      
    return enrollments.map(enrollment => {
      const course = this.courses.get(enrollment.courseId);
      return {
        ...enrollment,
        course: course!,
      };
    }).filter(item => item.course);
  }

  async createEnrollment(insertEnrollment: InsertEnrollment, instructorId: number): Promise<Enrollment> {
    const id = this.currentEnrollmentId++;
    const enrollment: Enrollment = {
      ...insertEnrollment,
      id,
      instructorId,
      enrolledAt: new Date(),
      completedAt: null,
      lastActivityAt: new Date(),
      progress: insertEnrollment.progress || "0",
      status: insertEnrollment.status || "active",
    };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  async updateEnrollment(id: number, updates: UpdateEnrollment): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, ...updates };
    
    // Auto-complete if progress reaches 100%
    if (updates.progress && parseFloat(updates.progress) >= 100 && !updatedEnrollment.completedAt) {
      updatedEnrollment.completedAt = new Date();
      updatedEnrollment.status = "completed";
    }
    
    // Update last activity
    updatedEnrollment.lastActivityAt = new Date();
    
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    return this.enrollments.delete(id);
  }

  // Student Communications methods
  async getCommunications(instructorId: number): Promise<(StudentCommunication & { student: PublicUser; course?: Course })[]> {
    const communications = Array.from(this.communications.values())
      .filter(comm => comm.instructorId === instructorId)
      .sort((a, b) => new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime());
      
    return communications.map(communication => {
      const student = this.users.get(communication.studentId);
      const course = communication.courseId ? this.courses.get(communication.courseId) : undefined;
      return {
        ...communication,
        student: student ? this.sanitizeUser(student) : student!,
        course,
      };
    }).filter(item => item.student);
  }

  async sendCommunication(insertCommunication: InsertCommunication, instructorId: number): Promise<StudentCommunication> {
    const id = this.currentCommunicationId++;
    const communication: StudentCommunication = {
      ...insertCommunication,
      id,
      instructorId,
      sentAt: new Date(),
      readAt: null,
    };
    this.communications.set(id, communication);
    return communication;
  }

  async markCommunicationAsRead(id: number): Promise<StudentCommunication | undefined> {
    const communication = this.communications.get(id);
    if (!communication) return undefined;
    
    const updatedCommunication = { ...communication, readAt: new Date() };
    this.communications.set(id, updatedCommunication);
    return updatedCommunication;
  }
}

export const storage = new MemStorage();
