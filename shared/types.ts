// Course slide and lesson types
export interface CourseSlide {
  id: string;
  title: string;
  content: string[];
  type: 'intro' | 'content' | 'quiz' | 'summary';
  duration: number; // estimated minutes
  notes?: string;
  image?: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  description: string;
  slides: CourseSlide[];
  duration: number; // total minutes
  objectives: string[];
  keyTakeaways: string[];
}

export interface GeneratedCourseContent {
  lessons: CourseLesson[];
  totalDuration: number;
  outline: string;
  learningObjectives: string[];
  prerequisites: string[];
  targetAudience: string;
}

// Export formats
export interface SCORMPackage {
  manifest: string;
  content: string;
  assets: string[];
}

export interface PDFExportOptions {
  includeNotes: boolean;
  slidesPerPage: number;
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
}