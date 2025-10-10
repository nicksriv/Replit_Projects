import { 
  users, 
  courses, 
  revenueRecords, 
  payouts,
  enrollments,
  studentCommunications,
  skills,
  skillAssessments,
  studentSkillProgress,
  skillAttempts,
  marketingCampaigns,
  promotionalCodes,
  campaignPerformance,
  emailCampaigns,
  socialMediaPosts,
  userPreferences,
  notificationSettings,
  instructorSettings,
  privacySettings,
  documentationArticles,
  faqEntries,
  supportTickets,
  ticketMessages,
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
  type InsertCommunication,
  type Skill,
  type InsertSkill,
  type SkillAssessment,
  type InsertSkillAssessment,
  type StudentSkillProgress,
  type InsertStudentSkillProgress,
  type SkillAttempt,
  type InsertSkillAttempt,
  type MarketingCampaign,
  type InsertMarketingCampaign,
  type UpdateMarketingCampaign,
  type PromotionalCode,
  type InsertPromotionalCode,
  type UpdatePromotionalCode,
  type CampaignPerformance,
  type EmailCampaign,
  type InsertEmailCampaign,
  type SocialMediaPost,
  type InsertSocialMediaPost,
  type UserPreferences,
  type InsertUserPreferences,
  type UpdateUserPreferences,
  type NotificationSettings,
  type InsertNotificationSettings,
  type UpdateNotificationSettings,
  type InstructorSettings,
  type InsertInstructorSettings,
  type UpdateInstructorSettings,
  type PrivacySettings,
  type InsertPrivacySettings,
  type UpdatePrivacySettings,
  type DocumentationArticle,
  type InsertDocumentationArticle,
  type UpdateDocumentationArticle,
  type FaqEntry,
  type InsertFaqEntry,
  type UpdateFaqEntry,
  type SupportTicket,
  type InsertSupportTicket,
  type UpdateSupportTicket,
  type TicketMessage,
  type InsertTicketMessage,
  liveClasses,
  recordedVideos,
  youtubeAnalyses,
  youtubeChunks,
  youtubeQuestions,
  type LiveClass,
  type InsertLiveClass,
  type UpdateLiveClass,
  type RecordedVideo,
  type InsertRecordedVideo,
  type UpdateRecordedVideo,
  type YoutubeAnalysis,
  type InsertYoutubeAnalysis,
  type YoutubeChunk,
  type InsertYoutubeChunk,
  type YoutubeQuestion,
  type InsertYoutubeQuestion
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
  
  // Skills Management methods
  getSkills(instructorId: number): Promise<Skill[]>;
  getSkill(id: number): Promise<Skill | undefined>;
  createSkill(skill: InsertSkill, instructorId: number): Promise<Skill>;
  updateSkill(id: number, updates: Partial<Skill>): Promise<Skill | undefined>;
  deleteSkill(id: number): Promise<boolean>;
  
  // Skill Assessments
  getSkillAssessments(skillId: number): Promise<SkillAssessment[]>;
  getSkillAssessment(id: number): Promise<SkillAssessment | undefined>;
  createSkillAssessment(assessment: InsertSkillAssessment, instructorId: number): Promise<SkillAssessment>;
  updateSkillAssessment(id: number, updates: Partial<SkillAssessment>): Promise<SkillAssessment | undefined>;
  deleteSkillAssessment(id: number): Promise<boolean>;
  
  // Student Skill Progress
  getStudentSkillProgress(instructorId: number): Promise<(StudentSkillProgress & { student: PublicUser; skill: Skill })[]>;
  getStudentSkillProgressByStudent(studentId: number): Promise<(StudentSkillProgress & { skill: Skill })[]>;
  updateStudentSkillProgress(studentId: number, skillId: number, updates: Partial<StudentSkillProgress>, instructorId: number): Promise<StudentSkillProgress | undefined>;
  
  // Skill Attempts
  getSkillAttempts(assessmentId: number): Promise<(SkillAttempt & { student: PublicUser })[]>;
  recordSkillAttempt(attempt: InsertSkillAttempt): Promise<SkillAttempt>;
  getStudentAttemptHistory(studentId: number, assessmentId: number): Promise<SkillAttempt[]>;
  
  // Marketing Campaign methods
  getMarketingCampaigns(instructorId: number): Promise<MarketingCampaign[]>;
  getMarketingCampaign(id: number): Promise<MarketingCampaign | undefined>;
  createMarketingCampaign(campaign: InsertMarketingCampaign, instructorId: number): Promise<MarketingCampaign>;
  updateMarketingCampaign(id: number, updates: UpdateMarketingCampaign): Promise<MarketingCampaign | undefined>;
  deleteMarketingCampaign(id: number): Promise<boolean>;
  
  // Promotional Code methods
  getPromotionalCodes(instructorId: number): Promise<PromotionalCode[]>;
  getPromotionalCode(id: number): Promise<PromotionalCode | undefined>;
  getPromotionalCodeByCode(code: string): Promise<PromotionalCode | undefined>;
  createPromotionalCode(code: InsertPromotionalCode, instructorId: number): Promise<PromotionalCode>;
  updatePromotionalCode(id: number, updates: UpdatePromotionalCode): Promise<PromotionalCode | undefined>;
  deletePromotionalCode(id: number): Promise<boolean>;
  incrementCodeUsage(id: number): Promise<PromotionalCode | undefined>;
  
  // Campaign Performance methods
  getCampaignPerformance(campaignId: number): Promise<CampaignPerformance[]>;
  recordCampaignPerformance(data: Omit<CampaignPerformance, 'id' | 'createdAt'>): Promise<CampaignPerformance>;
  
  // Email Campaign methods
  getEmailCampaigns(instructorId: number): Promise<EmailCampaign[]>;
  getEmailCampaign(id: number): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign, instructorId: number): Promise<EmailCampaign>;
  updateEmailCampaign(id: number, updates: Partial<EmailCampaign>): Promise<EmailCampaign | undefined>;
  deleteEmailCampaign(id: number): Promise<boolean>;
  
  // Social Media Post methods
  getSocialMediaPosts(instructorId: number): Promise<SocialMediaPost[]>;
  getSocialMediaPost(id: number): Promise<SocialMediaPost | undefined>;
  createSocialMediaPost(post: InsertSocialMediaPost, instructorId: number): Promise<SocialMediaPost>;
  updateSocialMediaPost(id: number, updates: Partial<SocialMediaPost>): Promise<SocialMediaPost | undefined>;
  deleteSocialMediaPost(id: number): Promise<boolean>;
  
  // Settings methods
  
  // User Preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences, userId: number): Promise<UserPreferences>;
  updateUserPreferences(userId: number, updates: UpdateUserPreferences): Promise<UserPreferences | undefined>;
  
  // Notification Settings
  getNotificationSettings(userId: number): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings, userId: number): Promise<NotificationSettings>;
  updateNotificationSettings(userId: number, updates: UpdateNotificationSettings): Promise<NotificationSettings | undefined>;
  
  // Instructor Settings
  getInstructorSettings(instructorId: number): Promise<InstructorSettings | undefined>;
  createInstructorSettings(settings: InsertInstructorSettings, instructorId: number): Promise<InstructorSettings>;
  updateInstructorSettings(instructorId: number, updates: UpdateInstructorSettings): Promise<InstructorSettings | undefined>;
  
  // Privacy Settings
  getPrivacySettings(userId: number): Promise<PrivacySettings | undefined>;
  createPrivacySettings(settings: InsertPrivacySettings, userId: number): Promise<PrivacySettings>;
  updatePrivacySettings(userId: number, updates: UpdatePrivacySettings): Promise<PrivacySettings | undefined>;
  
  // Help & Support - Documentation Articles
  getDocumentationArticles(): Promise<DocumentationArticle[]>;
  getDocumentationArticle(id: number): Promise<DocumentationArticle | undefined>;
  getDocumentationArticlesByCategory(category: string): Promise<DocumentationArticle[]>;
  createDocumentationArticle(article: InsertDocumentationArticle, authorId: number): Promise<DocumentationArticle>;
  updateDocumentationArticle(id: number, updates: UpdateDocumentationArticle): Promise<DocumentationArticle | undefined>;
  deleteDocumentationArticle(id: number): Promise<boolean>;
  incrementArticleViews(id: number): Promise<void>;
  rateArticleHelpful(id: number, helpful: boolean): Promise<void>;
  
  // Help & Support - FAQ Entries
  getFaqEntries(): Promise<FaqEntry[]>;
  getFaqEntry(id: number): Promise<FaqEntry | undefined>;
  getFaqEntriesByCategory(category: string): Promise<FaqEntry[]>;
  createFaqEntry(entry: InsertFaqEntry): Promise<FaqEntry>;
  updateFaqEntry(id: number, updates: UpdateFaqEntry): Promise<FaqEntry | undefined>;
  deleteFaqEntry(id: number): Promise<boolean>;
  incrementFaqViews(id: number): Promise<void>;
  rateFaqHelpful(id: number, helpful: boolean): Promise<void>;
  
  // Help & Support - Support Tickets
  getSupportTickets(userId?: number): Promise<SupportTicket[]>;
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  createSupportTicket(ticket: InsertSupportTicket, userId: number): Promise<SupportTicket>;
  updateSupportTicket(id: number, updates: UpdateSupportTicket): Promise<SupportTicket | undefined>;
  deleteSupportTicket(id: number): Promise<boolean>;
  
  // Help & Support - Ticket Messages
  getTicketMessages(ticketId: number): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage, ticketId: number, userId: number, isFromSupport?: boolean): Promise<TicketMessage>;
  
  // Live Classes methods
  getLiveClasses(instructorId?: number): Promise<LiveClass[]>;
  getLiveClass(id: number): Promise<LiveClass | undefined>;
  createLiveClass(liveClass: InsertLiveClass, instructorId: number): Promise<LiveClass>;
  updateLiveClass(id: number, updates: UpdateLiveClass): Promise<LiveClass | undefined>;
  deleteLiveClass(id: number): Promise<boolean>;
  
  // Recorded Videos methods
  getRecordedVideos(instructorId?: number): Promise<RecordedVideo[]>;
  getRecordedVideo(id: number): Promise<RecordedVideo | undefined>;
  createRecordedVideo(video: InsertRecordedVideo, instructorId: number): Promise<RecordedVideo>;
  updateRecordedVideo(id: number, updates: UpdateRecordedVideo): Promise<RecordedVideo | undefined>;
  deleteRecordedVideo(id: number): Promise<boolean>;
  incrementVideoViews(id: number): Promise<void>;
  
  // YouTube Knowledge Base methods
  getYoutubeAnalyses(userId: number): Promise<YoutubeAnalysis[]>;
  getYoutubeAnalysis(id: number): Promise<YoutubeAnalysis | undefined>;
  createYoutubeAnalysis(analysis: InsertYoutubeAnalysis, userId: number): Promise<YoutubeAnalysis>;
  getYoutubeChunks(analysisId: number): Promise<YoutubeChunk[]>;
  createYoutubeChunk(chunk: InsertYoutubeChunk): Promise<YoutubeChunk>;
  getYoutubeQuestions(analysisId: number): Promise<YoutubeQuestion[]>;
  createYoutubeQuestion(question: InsertYoutubeQuestion): Promise<YoutubeQuestion>;
  getYoutubeTranslations(analysisId: number): Promise<YoutubeTranslation[]>;
  getYoutubeTranslation(analysisId: number, languageCode: string): Promise<YoutubeTranslation | undefined>;
  createYoutubeTranslation(translation: InsertYoutubeTranslation): Promise<YoutubeTranslation>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private revenueRecords: Map<number, RevenueRecord>;
  private payouts: Map<number, Payout>;
  private enrollments: Map<number, Enrollment>;
  private communications: Map<number, StudentCommunication>;
  private skills: Map<number, Skill>;
  private skillAssessments: Map<number, SkillAssessment>;
  private studentSkillProgress: Map<number, StudentSkillProgress>;
  private skillAttempts: Map<number, SkillAttempt>;
  private marketingCampaigns: Map<number, MarketingCampaign>;
  private promotionalCodes: Map<number, PromotionalCode>;
  private campaignPerformance: Map<number, CampaignPerformance>;
  private emailCampaigns: Map<number, EmailCampaign>;
  private socialMediaPosts: Map<number, SocialMediaPost>;
  private userPreferences: Map<number, UserPreferences>;
  private notificationSettings: Map<number, NotificationSettings>;
  private instructorSettings: Map<number, InstructorSettings>;
  private privacySettings: Map<number, PrivacySettings>;
  private documentationArticles: Map<number, DocumentationArticle>;
  private faqEntries: Map<number, FaqEntry>;
  private supportTickets: Map<number, SupportTicket>;
  private ticketMessages: Map<number, TicketMessage>;
  private liveClassesMap: Map<number, LiveClass>;
  private recordedVideosMap: Map<number, RecordedVideo>;
  private youtubeAnalysesMap: Map<number, YoutubeAnalysis>;
  private youtubeChunksMap: Map<number, YoutubeChunk>;
  private youtubeQuestionsMap: Map<number, YoutubeQuestion>;
  private youtubeTranslationsMap: Map<number, YoutubeTranslation>;
  private currentUserId: number;
  private currentCourseId: number;
  private currentRevenueId: number;
  private currentPayoutId: number;
  private currentEnrollmentId: number;
  private currentCommunicationId: number;
  private currentSkillId: number;
  private currentSkillAssessmentId: number;
  private currentStudentSkillProgressId: number;
  private currentSkillAttemptId: number;
  private currentMarketingCampaignId: number;
  private currentPromotionalCodeId: number;
  private currentCampaignPerformanceId: number;
  private currentEmailCampaignId: number;
  private currentSocialMediaPostId: number;
  private currentUserPreferencesId: number;
  private currentNotificationSettingsId: number;
  private currentInstructorSettingsId: number;
  private currentPrivacySettingsId: number;
  private currentDocumentationArticleId: number;
  private currentFaqEntryId: number;
  private currentSupportTicketId: number;
  private currentTicketMessageId: number;
  private currentLiveClassId: number;
  private currentRecordedVideoId: number;
  private currentYoutubeAnalysisId: number;
  private currentYoutubeChunkId: number;
  private currentYoutubeQuestionId: number;
  private currentYoutubeTranslationId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.revenueRecords = new Map();
    this.payouts = new Map();
    this.enrollments = new Map();
    this.communications = new Map();
    this.skills = new Map();
    this.skillAssessments = new Map();
    this.studentSkillProgress = new Map();
    this.skillAttempts = new Map();
    this.marketingCampaigns = new Map();
    this.promotionalCodes = new Map();
    this.campaignPerformance = new Map();
    this.emailCampaigns = new Map();
    this.socialMediaPosts = new Map();
    this.userPreferences = new Map();
    this.notificationSettings = new Map();
    this.instructorSettings = new Map();
    this.privacySettings = new Map();
    this.documentationArticles = new Map();
    this.faqEntries = new Map();
    this.supportTickets = new Map();
    this.ticketMessages = new Map();
    this.liveClassesMap = new Map();
    this.recordedVideosMap = new Map();
    this.youtubeAnalysesMap = new Map();
    this.youtubeChunksMap = new Map();
    this.youtubeQuestionsMap = new Map();
    this.youtubeTranslationsMap = new Map();
    this.currentUserId = 1;
    this.currentCourseId = 1;
    this.currentRevenueId = 1;
    this.currentPayoutId = 1;
    this.currentEnrollmentId = 1;
    this.currentCommunicationId = 1;
    this.currentSkillId = 1;
    this.currentSkillAssessmentId = 1;
    this.currentStudentSkillProgressId = 1;
    this.currentSkillAttemptId = 1;
    this.currentMarketingCampaignId = 1;
    this.currentPromotionalCodeId = 1;
    this.currentCampaignPerformanceId = 1;
    this.currentEmailCampaignId = 1;
    this.currentSocialMediaPostId = 1;
    this.currentUserPreferencesId = 1;
    this.currentNotificationSettingsId = 1;
    this.currentInstructorSettingsId = 1;
    this.currentPrivacySettingsId = 1;
    this.currentDocumentationArticleId = 1;
    this.currentFaqEntryId = 1;
    this.currentSupportTicketId = 1;
    this.currentTicketMessageId = 1;
    this.currentLiveClassId = 1;
    this.currentRecordedVideoId = 1;
    this.currentYoutubeAnalysisId = 1;
    this.currentYoutubeChunkId = 1;
    this.currentYoutubeQuestionId = 1;
    this.currentYoutubeTranslationId = 1;
    
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
        password: "demo_password",
        role: "student",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
      {
        id: 3,
        username: "mike_learner",
        email: "mike@example.com",
        password: "demo_password", 
        role: "student",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
      {
        id: 4,
        username: "emma_dev",
        email: "emma@example.com",
        password: "demo_password",
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
    
    // Sample skills data
    const sampleSkills: Skill[] = [
      {
        id: 1,
        name: "React Fundamentals",
        description: "Understanding of core React concepts including components, hooks, and state management",
        category: "technical",
        level: "intermediate",
        prerequisites: ["JavaScript", "HTML", "CSS"],
        instructorId: 1,
        isActive: true,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      },
      {
        id: 2,
        name: "Problem Solving",
        description: "Ability to break down complex problems and develop systematic solutions",
        category: "soft",
        level: "advanced",
        prerequisites: [],
        instructorId: 1,
        isActive: true,
        createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      },
      {
        id: 3,
        name: "Node.js Backend Development",
        description: "Server-side development with Node.js, Express, and database integration",
        category: "technical",
        level: "advanced",
        prerequisites: ["JavaScript", "API Design"],
        instructorId: 1,
        isActive: true,
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      }
    ];

    sampleSkills.forEach(skill => {
      this.skills.set(skill.id, skill);
    });

    // Sample student skill progress
    const sampleProgress: StudentSkillProgress[] = [
      {
        id: 1,
        studentId: 2,
        skillId: 1,
        instructorId: 1,
        currentLevel: "intermediate",
        progressPercentage: "85.0",
        assessmentsPassed: 2,
        totalAssessments: 3,
        lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        skillAchievedAt: null,
        notes: "Strong grasp of hooks, needs work on context API",
      },
      {
        id: 2,
        studentId: 3,
        skillId: 1,
        instructorId: 1,
        currentLevel: "beginner",
        progressPercentage: "45.0",
        assessmentsPassed: 1,
        totalAssessments: 3,
        lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        skillAchievedAt: null,
        notes: "Making steady progress, benefits from additional practice",
      }
    ];

    sampleProgress.forEach(progress => {
      this.studentSkillProgress.set(progress.id, progress);
    });

    this.currentUserId = 5;
    this.currentEnrollmentId = 4;
    this.currentCommunicationId = 4;
    this.currentSkillId = 4;
    this.currentStudentSkillProgressId = 3;
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
    const course = this.courses.get(id);
    
    if (!course) {
      return undefined;
    }
    
    // If it's an AI-generated course with slides data, parse the JSON and add generatedContent
    if (course.aiGenerated && course.slidesData) {
      try {
        const generatedContent = JSON.parse(course.slidesData);
        return {
          ...course,
          generatedContent
        } as Course & { generatedContent: any };
      } catch (error) {
        console.error('Failed to parse slides data for course', id, error);
        return course;
      }
    }
    return course;
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

  // Skills Management methods
  async getSkills(instructorId: number): Promise<Skill[]> {
    return Array.from(this.skills.values())
      .filter(skill => skill.instructorId === instructorId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getSkill(id: number): Promise<Skill | undefined> {
    return this.skills.get(id);
  }

  async createSkill(insertSkill: InsertSkill, instructorId: number): Promise<Skill> {
    const id = this.currentSkillId++;
    const skill: Skill = {
      ...insertSkill,
      id,
      instructorId,
      createdAt: new Date(),
    };
    this.skills.set(id, skill);
    return skill;
  }

  async updateSkill(id: number, updates: Partial<Skill>): Promise<Skill | undefined> {
    const skill = this.skills.get(id);
    if (!skill) return undefined;

    const updatedSkill = { ...skill, ...updates };
    this.skills.set(id, updatedSkill);
    return updatedSkill;
  }

  async deleteSkill(id: number): Promise<boolean> {
    return this.skills.delete(id);
  }

  // Skill Assessments methods
  async getSkillAssessments(skillId: number): Promise<SkillAssessment[]> {
    return Array.from(this.skillAssessments.values())
      .filter(assessment => assessment.skillId === skillId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getSkillAssessment(id: number): Promise<SkillAssessment | undefined> {
    return this.skillAssessments.get(id);
  }

  async createSkillAssessment(insertAssessment: InsertSkillAssessment, instructorId: number): Promise<SkillAssessment> {
    const id = this.currentSkillAssessmentId++;
    const assessment: SkillAssessment = {
      ...insertAssessment,
      id,
      instructorId,
      createdAt: new Date(),
    };
    this.skillAssessments.set(id, assessment);
    return assessment;
  }

  async updateSkillAssessment(id: number, updates: Partial<SkillAssessment>): Promise<SkillAssessment | undefined> {
    const assessment = this.skillAssessments.get(id);
    if (!assessment) return undefined;

    const updatedAssessment = { ...assessment, ...updates };
    this.skillAssessments.set(id, updatedAssessment);
    return updatedAssessment;
  }

  async deleteSkillAssessment(id: number): Promise<boolean> {
    return this.skillAssessments.delete(id);
  }

  // Student Skill Progress methods
  async getStudentSkillProgress(instructorId: number): Promise<(StudentSkillProgress & { student: PublicUser; skill: Skill })[]> {
    const progress = Array.from(this.studentSkillProgress.values())
      .filter(progress => progress.instructorId === instructorId)
      .sort((a, b) => new Date(b.lastActivityAt!).getTime() - new Date(a.lastActivityAt!).getTime());
      
    return progress.map(progress => {
      const student = this.users.get(progress.studentId);
      const skill = this.skills.get(progress.skillId);
      return {
        ...progress,
        student: student ? this.sanitizeUser(student) : student!,
        skill: skill!,
      };
    }).filter(item => item.student && item.skill);
  }

  async getStudentSkillProgressByStudent(studentId: number): Promise<(StudentSkillProgress & { skill: Skill })[]> {
    const progress = Array.from(this.studentSkillProgress.values())
      .filter(progress => progress.studentId === studentId)
      .sort((a, b) => new Date(b.lastActivityAt!).getTime() - new Date(a.lastActivityAt!).getTime());
      
    return progress.map(progress => {
      const skill = this.skills.get(progress.skillId);
      return {
        ...progress,
        skill: skill!,
      };
    }).filter(item => item.skill);
  }

  async updateStudentSkillProgress(studentId: number, skillId: number, updates: Partial<StudentSkillProgress>, instructorId: number): Promise<StudentSkillProgress | undefined> {
    const existing = Array.from(this.studentSkillProgress.values())
      .find(p => p.studentId === studentId && p.skillId === skillId);

    if (existing) {
      const updatedProgress = { ...existing, ...updates, lastActivityAt: new Date() };
      this.studentSkillProgress.set(existing.id, updatedProgress);
      return updatedProgress;
    } else {
      // Create new progress record
      const id = this.currentStudentSkillProgressId++;
      const newProgress: StudentSkillProgress = {
        id,
        studentId,
        skillId,
        instructorId,
        currentLevel: "beginner",
        progressPercentage: "0",
        assessmentsPassed: 0,
        totalAssessments: 0,
        lastActivityAt: new Date(),
        skillAchievedAt: null,
        notes: null,
        ...updates,
      };
      this.studentSkillProgress.set(id, newProgress);
      return newProgress;
    }
  }

  // Skill Attempts methods
  async getSkillAttempts(assessmentId: number): Promise<(SkillAttempt & { student: PublicUser })[]> {
    const attempts = Array.from(this.skillAttempts.values())
      .filter(attempt => attempt.assessmentId === assessmentId)
      .sort((a, b) => new Date(b.attemptedAt!).getTime() - new Date(a.attemptedAt!).getTime());
      
    return attempts.map(attempt => {
      const student = this.users.get(attempt.studentId);
      return {
        ...attempt,
        student: student ? this.sanitizeUser(student) : student!,
      };
    }).filter(item => item.student);
  }

  async recordSkillAttempt(insertAttempt: InsertSkillAttempt): Promise<SkillAttempt> {
    const id = this.currentSkillAttemptId++;
    const attempt: SkillAttempt = {
      ...insertAttempt,
      id,
      attemptedAt: new Date(),
    };
    this.skillAttempts.set(id, attempt);
    return attempt;
  }

  async getStudentAttemptHistory(studentId: number, assessmentId: number): Promise<SkillAttempt[]> {
    return Array.from(this.skillAttempts.values())
      .filter(attempt => attempt.studentId === studentId && attempt.assessmentId === assessmentId)
      .sort((a, b) => new Date(b.attemptedAt!).getTime() - new Date(a.attemptedAt!).getTime());
  }

  // Marketing Campaign methods
  async getMarketingCampaigns(instructorId: number): Promise<MarketingCampaign[]> {
    return Array.from(this.marketingCampaigns.values())
      .filter(campaign => campaign.instructorId === instructorId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getMarketingCampaign(id: number): Promise<MarketingCampaign | undefined> {
    return this.marketingCampaigns.get(id);
  }

  async createMarketingCampaign(insertCampaign: InsertMarketingCampaign, instructorId: number): Promise<MarketingCampaign> {
    const id = this.currentMarketingCampaignId++;
    const campaign: MarketingCampaign = {
      ...insertCampaign,
      id,
      instructorId,
      actualSpend: "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.marketingCampaigns.set(id, campaign);
    return campaign;
  }

  async updateMarketingCampaign(id: number, updates: UpdateMarketingCampaign): Promise<MarketingCampaign | undefined> {
    const campaign = this.marketingCampaigns.get(id);
    if (!campaign) return undefined;

    const updatedCampaign = { ...campaign, ...updates, updatedAt: new Date() };
    this.marketingCampaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteMarketingCampaign(id: number): Promise<boolean> {
    return this.marketingCampaigns.delete(id);
  }

  // Promotional Code methods
  async getPromotionalCodes(instructorId: number): Promise<PromotionalCode[]> {
    return Array.from(this.promotionalCodes.values())
      .filter(code => code.instructorId === instructorId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getPromotionalCode(id: number): Promise<PromotionalCode | undefined> {
    return this.promotionalCodes.get(id);
  }

  async getPromotionalCodeByCode(code: string): Promise<PromotionalCode | undefined> {
    return Array.from(this.promotionalCodes.values())
      .find(promo => promo.code === code && promo.isActive);
  }

  async createPromotionalCode(insertCode: InsertPromotionalCode, instructorId: number): Promise<PromotionalCode> {
    const id = this.currentPromotionalCodeId++;
    const promotionalCode: PromotionalCode = {
      ...insertCode,
      id,
      instructorId,
      usageCount: 0,
      createdAt: new Date(),
    };
    this.promotionalCodes.set(id, promotionalCode);
    return promotionalCode;
  }

  async updatePromotionalCode(id: number, updates: UpdatePromotionalCode): Promise<PromotionalCode | undefined> {
    const code = this.promotionalCodes.get(id);
    if (!code) return undefined;

    const updatedCode = { ...code, ...updates };
    this.promotionalCodes.set(id, updatedCode);
    return updatedCode;
  }

  async deletePromotionalCode(id: number): Promise<boolean> {
    return this.promotionalCodes.delete(id);
  }

  async incrementCodeUsage(id: number): Promise<PromotionalCode | undefined> {
    const code = this.promotionalCodes.get(id);
    if (!code) return undefined;

    const updatedCode = { ...code, usageCount: code.usageCount + 1 };
    this.promotionalCodes.set(id, updatedCode);
    return updatedCode;
  }

  // Campaign Performance methods
  async getCampaignPerformance(campaignId: number): Promise<CampaignPerformance[]> {
    return Array.from(this.campaignPerformance.values())
      .filter(performance => performance.campaignId === campaignId)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
  }

  async recordCampaignPerformance(data: Omit<CampaignPerformance, 'id' | 'createdAt'>): Promise<CampaignPerformance> {
    const id = this.currentCampaignPerformanceId++;
    const performance: CampaignPerformance = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.campaignPerformance.set(id, performance);
    return performance;
  }

  // Email Campaign methods
  async getEmailCampaigns(instructorId: number): Promise<EmailCampaign[]> {
    return Array.from(this.emailCampaigns.values())
      .filter(campaign => campaign.instructorId === instructorId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getEmailCampaign(id: number): Promise<EmailCampaign | undefined> {
    return this.emailCampaigns.get(id);
  }

  async createEmailCampaign(insertCampaign: InsertEmailCampaign, instructorId: number): Promise<EmailCampaign> {
    const id = this.currentEmailCampaignId++;
    const campaign: EmailCampaign = {
      ...insertCampaign,
      id,
      instructorId,
      totalRecipients: 0,
      delivered: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      unsubscribed: 0,
      status: "draft",
      sentAt: null,
      createdAt: new Date(),
    };
    this.emailCampaigns.set(id, campaign);
    return campaign;
  }

  async updateEmailCampaign(id: number, updates: Partial<EmailCampaign>): Promise<EmailCampaign | undefined> {
    const campaign = this.emailCampaigns.get(id);
    if (!campaign) return undefined;

    const updatedCampaign = { ...campaign, ...updates };
    this.emailCampaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteEmailCampaign(id: number): Promise<boolean> {
    return this.emailCampaigns.delete(id);
  }

  // Social Media Post methods
  async getSocialMediaPosts(instructorId: number): Promise<SocialMediaPost[]> {
    return Array.from(this.socialMediaPosts.values())
      .filter(post => post.instructorId === instructorId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getSocialMediaPost(id: number): Promise<SocialMediaPost | undefined> {
    return this.socialMediaPosts.get(id);
  }

  async createSocialMediaPost(insertPost: InsertSocialMediaPost, instructorId: number): Promise<SocialMediaPost> {
    const id = this.currentSocialMediaPostId++;
    const post: SocialMediaPost = {
      ...insertPost,
      id,
      instructorId,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      reach: 0,
      impressions: 0,
      status: "draft",
      publishedAt: null,
      externalPostId: null,
      createdAt: new Date(),
    };
    this.socialMediaPosts.set(id, post);
    return post;
  }

  async updateSocialMediaPost(id: number, updates: Partial<SocialMediaPost>): Promise<SocialMediaPost | undefined> {
    const post = this.socialMediaPosts.get(id);
    if (!post) return undefined;

    const updatedPost = { ...post, ...updates };
    this.socialMediaPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteSocialMediaPost(id: number): Promise<boolean> {
    return this.socialMediaPosts.delete(id);
  }

  // Settings methods
  
  // User Preferences methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values())
      .find(prefs => prefs.userId === userId);
  }

  async createUserPreferences(insertPreferences: InsertUserPreferences, userId: number): Promise<UserPreferences> {
    const id = this.currentUserPreferencesId++;
    const preferences: UserPreferences = {
      ...insertPreferences,
      id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userPreferences.set(id, preferences);
    return preferences;
  }

  async updateUserPreferences(userId: number, updates: UpdateUserPreferences): Promise<UserPreferences | undefined> {
    const existing = Array.from(this.userPreferences.values())
      .find(prefs => prefs.userId === userId);
    
    if (!existing) return undefined;

    const updatedPreferences = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.userPreferences.set(existing.id, updatedPreferences);
    return updatedPreferences;
  }

  // Notification Settings methods
  async getNotificationSettings(userId: number): Promise<NotificationSettings | undefined> {
    return Array.from(this.notificationSettings.values())
      .find(settings => settings.userId === userId);
  }

  async createNotificationSettings(insertSettings: InsertNotificationSettings, userId: number): Promise<NotificationSettings> {
    const id = this.currentNotificationSettingsId++;
    const settings: NotificationSettings = {
      ...insertSettings,
      id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notificationSettings.set(id, settings);
    return settings;
  }

  async updateNotificationSettings(userId: number, updates: UpdateNotificationSettings): Promise<NotificationSettings | undefined> {
    const existing = Array.from(this.notificationSettings.values())
      .find(settings => settings.userId === userId);
    
    if (!existing) return undefined;

    const updatedSettings = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.notificationSettings.set(existing.id, updatedSettings);
    return updatedSettings;
  }

  // Instructor Settings methods
  async getInstructorSettings(instructorId: number): Promise<InstructorSettings | undefined> {
    return Array.from(this.instructorSettings.values())
      .find(settings => settings.instructorId === instructorId);
  }

  async createInstructorSettings(insertSettings: InsertInstructorSettings, instructorId: number): Promise<InstructorSettings> {
    const id = this.currentInstructorSettingsId++;
    const settings: InstructorSettings = {
      ...insertSettings,
      id,
      instructorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.instructorSettings.set(id, settings);
    return settings;
  }

  async updateInstructorSettings(instructorId: number, updates: UpdateInstructorSettings): Promise<InstructorSettings | undefined> {
    const existing = Array.from(this.instructorSettings.values())
      .find(settings => settings.instructorId === instructorId);
    
    if (!existing) return undefined;

    const updatedSettings = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.instructorSettings.set(existing.id, updatedSettings);
    return updatedSettings;
  }

  // Privacy Settings methods
  async getPrivacySettings(userId: number): Promise<PrivacySettings | undefined> {
    return Array.from(this.privacySettings.values())
      .find(settings => settings.userId === userId);
  }

  async createPrivacySettings(insertSettings: InsertPrivacySettings, userId: number): Promise<PrivacySettings> {
    const id = this.currentPrivacySettingsId++;
    const settings: PrivacySettings = {
      ...insertSettings,
      id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.privacySettings.set(id, settings);
    return settings;
  }

  async updatePrivacySettings(userId: number, updates: UpdatePrivacySettings): Promise<PrivacySettings | undefined> {
    const existing = Array.from(this.privacySettings.values())
      .find(settings => settings.userId === userId);
    
    if (!existing) return undefined;

    const updatedSettings = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.privacySettings.set(existing.id, updatedSettings);
    return updatedSettings;
  }

  // Help & Support - Documentation Articles methods
  async getDocumentationArticles(): Promise<DocumentationArticle[]> {
    return Array.from(this.documentationArticles.values())
      .filter(article => article.isPublished)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDocumentationArticle(id: number): Promise<DocumentationArticle | undefined> {
    return this.documentationArticles.get(id);
  }

  async getDocumentationArticlesByCategory(category: string): Promise<DocumentationArticle[]> {
    return Array.from(this.documentationArticles.values())
      .filter(article => article.isPublished && article.category === category)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createDocumentationArticle(insertArticle: InsertDocumentationArticle, authorId: number): Promise<DocumentationArticle> {
    const id = this.currentDocumentationArticleId++;
    const article: DocumentationArticle = {
      ...insertArticle,
      id,
      authorId,
      views: 0,
      helpful: 0,
      notHelpful: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.documentationArticles.set(id, article);
    return article;
  }

  async updateDocumentationArticle(id: number, updates: UpdateDocumentationArticle): Promise<DocumentationArticle | undefined> {
    const existing = this.documentationArticles.get(id);
    if (!existing) return undefined;

    const updatedArticle = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.documentationArticles.set(id, updatedArticle);
    return updatedArticle;
  }

  async deleteDocumentationArticle(id: number): Promise<boolean> {
    return this.documentationArticles.delete(id);
  }

  async incrementArticleViews(id: number): Promise<void> {
    const article = this.documentationArticles.get(id);
    if (article) {
      article.views++;
      this.documentationArticles.set(id, article);
    }
  }

  async rateArticleHelpful(id: number, helpful: boolean): Promise<void> {
    const article = this.documentationArticles.get(id);
    if (article) {
      if (helpful) {
        article.helpful++;
      } else {
        article.notHelpful++;
      }
      this.documentationArticles.set(id, article);
    }
  }

  // Help & Support - FAQ Entries methods
  async getFaqEntries(): Promise<FaqEntry[]> {
    return Array.from(this.faqEntries.values())
      .filter(entry => entry.isPublished)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async getFaqEntry(id: number): Promise<FaqEntry | undefined> {
    return this.faqEntries.get(id);
  }

  async getFaqEntriesByCategory(category: string): Promise<FaqEntry[]> {
    return Array.from(this.faqEntries.values())
      .filter(entry => entry.isPublished && entry.category === category)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async createFaqEntry(insertEntry: InsertFaqEntry): Promise<FaqEntry> {
    const id = this.currentFaqEntryId++;
    const entry: FaqEntry = {
      ...insertEntry,
      id,
      views: 0,
      helpful: 0,
      notHelpful: 0,
      orderIndex: insertEntry.orderIndex || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.faqEntries.set(id, entry);
    return entry;
  }

  async updateFaqEntry(id: number, updates: UpdateFaqEntry): Promise<FaqEntry | undefined> {
    const existing = this.faqEntries.get(id);
    if (!existing) return undefined;

    const updatedEntry = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.faqEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteFaqEntry(id: number): Promise<boolean> {
    return this.faqEntries.delete(id);
  }

  async incrementFaqViews(id: number): Promise<void> {
    const entry = this.faqEntries.get(id);
    if (entry) {
      entry.views++;
      this.faqEntries.set(id, entry);
    }
  }

  async rateFaqHelpful(id: number, helpful: boolean): Promise<void> {
    const entry = this.faqEntries.get(id);
    if (entry) {
      if (helpful) {
        entry.helpful++;
      } else {
        entry.notHelpful++;
      }
      this.faqEntries.set(id, entry);
    }
  }

  // Help & Support - Support Tickets methods
  async getSupportTickets(userId?: number): Promise<SupportTicket[]> {
    const tickets = Array.from(this.supportTickets.values());
    if (userId) {
      return tickets.filter(ticket => ticket.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    return this.supportTickets.get(id);
  }

  async createSupportTicket(insertTicket: InsertSupportTicket, userId: number): Promise<SupportTicket> {
    const id = this.currentSupportTicketId++;
    const ticket: SupportTicket = {
      ...insertTicket,
      id,
      userId,
      assignedToId: null,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
    };
    this.supportTickets.set(id, ticket);
    return ticket;
  }

  async updateSupportTicket(id: number, updates: UpdateSupportTicket): Promise<SupportTicket | undefined> {
    const existing = this.supportTickets.get(id);
    if (!existing) return undefined;

    const updatedTicket = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date(),
      resolvedAt: updates.status === "resolved" || updates.status === "closed" ? new Date() : existing.resolvedAt
    };
    this.supportTickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async deleteSupportTicket(id: number): Promise<boolean> {
    // Also delete associated messages
    const messages = Array.from(this.ticketMessages.values())
      .filter(message => message.ticketId === id);
    messages.forEach(message => this.ticketMessages.delete(message.id));
    
    return this.supportTickets.delete(id);
  }

  // Help & Support - Ticket Messages methods
  async getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
    return Array.from(this.ticketMessages.values())
      .filter(message => message.ticketId === ticketId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createTicketMessage(insertMessage: InsertTicketMessage, ticketId: number, userId: number, isFromSupport: boolean = false): Promise<TicketMessage> {
    const id = this.currentTicketMessageId++;
    const message: TicketMessage = {
      ...insertMessage,
      id,
      ticketId,
      userId,
      isFromSupport,
      createdAt: new Date(),
    };
    this.ticketMessages.set(id, message);
    
    // Update ticket's updatedAt when a new message is added
    const ticket = this.supportTickets.get(ticketId);
    if (ticket) {
      ticket.updatedAt = new Date();
      this.supportTickets.set(ticketId, ticket);
    }
    
    return message;
  }

  // Live Classes methods
  async getLiveClasses(instructorId?: number): Promise<LiveClass[]> {
    const classes = Array.from(this.liveClassesMap.values());
    if (instructorId !== undefined) {
      return classes.filter(c => c.instructorId === instructorId);
    }
    return classes;
  }

  async getLiveClass(id: number): Promise<LiveClass | undefined> {
    return this.liveClassesMap.get(id);
  }

  async createLiveClass(insertClass: InsertLiveClass, instructorId: number): Promise<LiveClass> {
    const id = this.currentLiveClassId++;
    const liveClass: LiveClass = {
      ...insertClass,
      id,
      instructorId,
      scheduledAt: typeof insertClass.scheduledAt === 'string' ? new Date(insertClass.scheduledAt) : insertClass.scheduledAt,
      status: insertClass.status || "scheduled",
      courseId: insertClass.courseId || null,
      meetingUrl: insertClass.meetingUrl || null,
      maxParticipants: insertClass.maxParticipants || null,
      recordingUrl: insertClass.recordingUrl || null,
      createdAt: new Date(),
    };
    this.liveClassesMap.set(id, liveClass);
    return liveClass;
  }

  async updateLiveClass(id: number, updates: UpdateLiveClass): Promise<LiveClass | undefined> {
    const existing = this.liveClassesMap.get(id);
    if (!existing) return undefined;

    const updatedClass = { 
      ...existing, 
      ...updates,
      scheduledAt: updates.scheduledAt 
        ? (typeof updates.scheduledAt === 'string' ? new Date(updates.scheduledAt) : updates.scheduledAt)
        : existing.scheduledAt
    };
    this.liveClassesMap.set(id, updatedClass);
    return updatedClass;
  }

  async deleteLiveClass(id: number): Promise<boolean> {
    return this.liveClassesMap.delete(id);
  }

  // Recorded Videos methods
  async getRecordedVideos(instructorId?: number): Promise<RecordedVideo[]> {
    const videos = Array.from(this.recordedVideosMap.values());
    if (instructorId !== undefined) {
      return videos.filter(v => v.instructorId === instructorId);
    }
    return videos;
  }

  async getRecordedVideo(id: number): Promise<RecordedVideo | undefined> {
    return this.recordedVideosMap.get(id);
  }

  async createRecordedVideo(insertVideo: InsertRecordedVideo, instructorId: number): Promise<RecordedVideo> {
    const id = this.currentRecordedVideoId++;
    const video: RecordedVideo = {
      ...insertVideo,
      id,
      instructorId,
      courseId: insertVideo.courseId || null,
      thumbnail: insertVideo.thumbnail || null,
      fileSize: insertVideo.fileSize || null,
      isPublished: insertVideo.isPublished !== undefined ? insertVideo.isPublished : false,
      views: 0,
      uploadedAt: new Date(),
    };
    this.recordedVideosMap.set(id, video);
    return video;
  }

  async updateRecordedVideo(id: number, updates: UpdateRecordedVideo): Promise<RecordedVideo | undefined> {
    const existing = this.recordedVideosMap.get(id);
    if (!existing) return undefined;

    const updatedVideo = { ...existing, ...updates };
    this.recordedVideosMap.set(id, updatedVideo);
    return updatedVideo;
  }

  async deleteRecordedVideo(id: number): Promise<boolean> {
    return this.recordedVideosMap.delete(id);
  }

  async incrementVideoViews(id: number): Promise<void> {
    const video = this.recordedVideosMap.get(id);
    if (video) {
      video.views = (video.views || 0) + 1;
      this.recordedVideosMap.set(id, video);
    }
  }

  // YouTube Knowledge Base implementations
  async getYoutubeAnalyses(userId: number): Promise<YoutubeAnalysis[]> {
    return Array.from(this.youtubeAnalysesMap.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getYoutubeAnalysis(id: number): Promise<YoutubeAnalysis | undefined> {
    return this.youtubeAnalysesMap.get(id);
  }

  async createYoutubeAnalysis(analysis: InsertYoutubeAnalysis, userId: number): Promise<YoutubeAnalysis> {
    const id = this.currentYoutubeAnalysisId++;
    const newAnalysis: YoutubeAnalysis = {
      ...analysis,
      id,
      userId,
      createdAt: new Date(),
    };
    this.youtubeAnalysesMap.set(id, newAnalysis);
    return newAnalysis;
  }

  async getYoutubeChunks(analysisId: number): Promise<YoutubeChunk[]> {
    return Array.from(this.youtubeChunksMap.values())
      .filter(c => c.analysisId === analysisId)
      .sort((a, b) => (a.chunkIndex || 0) - (b.chunkIndex || 0));
  }

  async createYoutubeChunk(chunk: InsertYoutubeChunk): Promise<YoutubeChunk> {
    const id = this.currentYoutubeChunkId++;
    const newChunk: YoutubeChunk = {
      ...chunk,
      id,
    };
    this.youtubeChunksMap.set(id, newChunk);
    return newChunk;
  }

  async getYoutubeQuestions(analysisId: number): Promise<YoutubeQuestion[]> {
    return Array.from(this.youtubeQuestionsMap.values())
      .filter(q => q.analysisId === analysisId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createYoutubeQuestion(question: InsertYoutubeQuestion): Promise<YoutubeQuestion> {
    const id = this.currentYoutubeQuestionId++;
    const newQuestion: YoutubeQuestion = {
      ...question,
      id,
      createdAt: new Date(),
    };
    this.youtubeQuestionsMap.set(id, newQuestion);
    return newQuestion;
  }

  async getYoutubeTranslations(analysisId: number): Promise<YoutubeTranslation[]> {
    return Array.from(this.youtubeTranslationsMap.values())
      .filter(t => t.analysisId === analysisId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getYoutubeTranslation(analysisId: number, languageCode: string): Promise<YoutubeTranslation | undefined> {
    return Array.from(this.youtubeTranslationsMap.values())
      .find(t => t.analysisId === analysisId && t.languageCode === languageCode);
  }

  async createYoutubeTranslation(translation: InsertYoutubeTranslation): Promise<YoutubeTranslation> {
    const id = this.currentYoutubeTranslationId++;
    const newTranslation: YoutubeTranslation = {
      ...translation,
      id,
      createdAt: new Date(),
    };
    this.youtubeTranslationsMap.set(id, newTranslation);
    return newTranslation;
  }
}

export const storage = new MemStorage();
