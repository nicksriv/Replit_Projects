import JSZip from "jszip";
import puppeteer from "puppeteer";
import { CourseLesson, CourseSlide } from "@shared/types";
import { Course } from "@shared/schema";

// HTML/XML escaping utility
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (match: string) => {
    const escapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return escapeMap[match];
  });
}

function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (match: string) => {
    const escapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    };
    return escapeMap[match];
  });
}

// SCORM Package Export
export async function createSCORMPackage(course: Course, lessons: CourseLesson[]): Promise<Buffer> {
  const zip = new JSZip();
  
  // Create SCORM manifest
  const manifest = createSCORMManifest(course, lessons);
  zip.file("imsmanifest.xml", manifest);
  
  // Create main HTML content
  const htmlContent = createSCORMHTML(course, lessons);
  zip.file("index.html", htmlContent);
  
  // Create JavaScript for SCORM API
  const scormJS = createSCORMJavaScript();
  zip.file("scorm.js", scormJS);
  
  // Create CSS for styling
  const scormCSS = createSCORMCSS();
  zip.file("styles.css", scormCSS);
  
  // Generate the ZIP file
  return await zip.generateAsync({ type: "nodebuffer" });
}

function createSCORMManifest(course: Course, lessons: CourseLesson[]): string {
  const courseId = `course_${course.id}`;
  const totalDuration = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${courseId}" version="1.0" 
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" 
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  
  <organizations default="${courseId}_org">
    <organization identifier="${courseId}_org">
      <title>${escapeXml(course.title)}</title>
      ${lessons.map((lesson, index) => `
      <item identifier="lesson_${index + 1}" identifierref="resource_${index + 1}">
        <title>${escapeXml(lesson.title)}</title>
        <adlcp:masteryscore>80</adlcp:masteryscore>
      </item>`).join('')}
    </organization>
  </organizations>
  
  <resources>
    ${lessons.map((lesson, index) => `
    <resource identifier="resource_${index + 1}" type="webcontent" adlcp:scormtype="sco" href="index.html#lesson${index + 1}">
      <file href="index.html"/>
      <file href="scorm.js"/>
      <file href="styles.css"/>
    </resource>`).join('')}
  </resources>
</manifest>`;
}

function createSCORMHTML(course: Course, lessons: CourseLesson[]): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(course.title)}</title>
  <link rel="stylesheet" href="styles.css">
  <script src="scorm.js"></script>
</head>
<body>
  <div class="course-container">
    <header class="course-header">
      <h1>${escapeHtml(course.title)}</h1>
      <p class="course-description">${escapeHtml(course.description)}</p>
      <div class="course-meta">
        <span class="level">Level: ${course.level}</span>
        <span class="duration">Duration: ${course.duration} hours</span>
        <span class="category">Category: ${escapeHtml(course.category)}</span>
      </div>
    </header>
    
    <nav class="course-navigation">
      <h2>Course Content</h2>
      <ul class="lesson-list">
        ${lessons.map((lesson, lessonIndex) => `
        <li class="lesson-item">
          <a href="#lesson${lessonIndex + 1}" class="lesson-link" onclick="showLesson(${lessonIndex})">
            ${escapeHtml(lesson.title)}
          </a>
          <ul class="slide-list">
            ${lesson.slides.map((slide, slideIndex) => `
            <li class="slide-item">
              <a href="#lesson${lessonIndex + 1}-slide${slideIndex + 1}" onclick="showSlide(${lessonIndex}, ${slideIndex})">
                ${escapeHtml(slide.title)}
              </a>
            </li>`).join('')}
          </ul>
        </li>`).join('')}
      </ul>
    </nav>
    
    <main class="course-content">
      ${lessons.map((lesson, lessonIndex) => `
      <section id="lesson${lessonIndex + 1}" class="lesson" style="display: ${lessonIndex === 0 ? 'block' : 'none'}">
        <div class="lesson-header">
          <h2>${escapeHtml(lesson.title)}</h2>
          <p class="lesson-description">${escapeHtml(lesson.description)}</p>
          <div class="lesson-objectives">
            <h3>Learning Objectives:</h3>
            <ul>
              ${lesson.objectives.map(obj => `<li>${escapeHtml(obj)}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <div class="slides-container">
          ${lesson.slides.map((slide, slideIndex) => `
          <div id="lesson${lessonIndex + 1}-slide${slideIndex + 1}" class="slide" style="display: ${slideIndex === 0 ? 'block' : 'none'}">
            <h3 class="slide-title">${escapeHtml(slide.title)}</h3>
            <div class="slide-content">
              ${slide.content.map(content => `<p class="content-point">${escapeHtml(content)}</p>`).join('')}
            </div>
            ${slide.notes ? `<div class="slide-notes"><strong>Notes:</strong> ${escapeHtml(slide.notes)}</div>` : ''}
            
            <div class="slide-navigation">
              ${slideIndex > 0 ? `<button onclick="previousSlide(${lessonIndex}, ${slideIndex})" class="nav-btn prev-btn">Previous</button>` : ''}
              ${slideIndex < lesson.slides.length - 1 ? `<button onclick="nextSlide(${lessonIndex}, ${slideIndex})" class="nav-btn next-btn">Next</button>` : ''}
              ${slideIndex === lesson.slides.length - 1 && lessonIndex < lessons.length - 1 ? `<button onclick="nextLesson(${lessonIndex})" class="nav-btn next-lesson-btn">Next Lesson</button>` : ''}
            </div>
          </div>`).join('')}
        </div>
        
        <div class="lesson-summary">
          <h3>Key Takeaways:</h3>
          <ul>
            ${lesson.keyTakeaways.map(takeaway => `<li>${escapeHtml(takeaway)}</li>`).join('')}
          </ul>
        </div>
      </section>`).join('')}
    </main>
  </div>
  
  <script>
    // Initialize SCORM
    if (typeof scormAPI !== 'undefined') {
      scormAPI.initialize();
    }
    
    let currentLesson = 0;
    let currentSlide = 0;
    
    function showLesson(lessonIndex) {
      document.querySelectorAll('.lesson').forEach(lesson => lesson.style.display = 'none');
      document.getElementById('lesson' + (lessonIndex + 1)).style.display = 'block';
      currentLesson = lessonIndex;
      currentSlide = 0;
      showSlide(lessonIndex, 0);
      
      if (typeof scormAPI !== 'undefined') {
        scormAPI.setProgress(lessonIndex, ${lessons.length});
      }
    }
    
    function showSlide(lessonIndex, slideIndex) {
      const lessonElement = document.getElementById('lesson' + (lessonIndex + 1));
      lessonElement.querySelectorAll('.slide').forEach(slide => slide.style.display = 'none');
      document.getElementById('lesson' + (lessonIndex + 1) + '-slide' + (slideIndex + 1)).style.display = 'block';
      currentSlide = slideIndex;
    }
    
    function nextSlide(lessonIndex, slideIndex) {
      showSlide(lessonIndex, slideIndex + 1);
    }
    
    function previousSlide(lessonIndex, slideIndex) {
      showSlide(lessonIndex, slideIndex - 1);
    }
    
    function nextLesson(lessonIndex) {
      showLesson(lessonIndex + 1);
    }
    
    // Handle completion
    window.addEventListener('beforeunload', function() {
      if (typeof scormAPI !== 'undefined') {
        scormAPI.complete();
      }
    });
  </script>
</body>
</html>`;
}

function createSCORMJavaScript(): string {
  return `// SCORM API Wrapper
var scormAPI = {
  initialized: false,
  apiHandle: null,
  
  initialize: function() {
    this.apiHandle = this.findAPI(window);
    if (this.apiHandle) {
      var result = this.apiHandle.LMSInitialize("");
      if (result.toString() === "true") {
        this.initialized = true;
        this.apiHandle.LMSSetValue("cmi.core.lesson_status", "incomplete");
        this.apiHandle.LMSCommit("");
      }
    }
    return this.initialized;
  },
  
  findAPI: function(win) {
    var findAttempts = 0;
    var findAttemptLimit = 500;
    
    while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
      findAttempts++;
      if (findAttempts > findAttemptLimit) {
        return null;
      }
      win = win.parent;
    }
    return win.API;
  },
  
  setProgress: function(current, total) {
    if (this.initialized && this.apiHandle) {
      var progress = Math.round((current / total) * 100);
      this.apiHandle.LMSSetValue("cmi.core.lesson_location", current.toString());
      this.apiHandle.LMSSetValue("cmi.core.score.raw", progress.toString());
      this.apiHandle.LMSCommit("");
    }
  },
  
  complete: function() {
    if (this.initialized && this.apiHandle) {
      this.apiHandle.LMSSetValue("cmi.core.lesson_status", "completed");
      this.apiHandle.LMSCommit("");
      this.apiHandle.LMSFinish("");
    }
  }
};`;
}

function createSCORMCSS(): string {
  return `/* SCORM Package Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

.course-container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.course-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.course-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.course-description {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  opacity: 0.9;
}

.course-meta {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.course-meta span {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.course-navigation {
  background: #f8f9fa;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.course-navigation h2 {
  margin-bottom: 1rem;
  color: #495057;
}

.lesson-list {
  list-style: none;
}

.lesson-item {
  margin-bottom: 1rem;
}

.lesson-link {
  display: block;
  padding: 0.75rem 1rem;
  background: #6c757d;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-weight: 500;
  transition: background 0.3s ease;
}

.lesson-link:hover {
  background: #5a6268;
}

.slide-list {
  list-style: none;
  margin-top: 0.5rem;
  margin-left: 1rem;
}

.slide-item {
  margin-bottom: 0.25rem;
}

.slide-item a {
  display: block;
  padding: 0.5rem 1rem;
  background: #e9ecef;
  color: #495057;
  text-decoration: none;
  border-radius: 3px;
  font-size: 0.9rem;
  transition: background 0.3s ease;
}

.slide-item a:hover {
  background: #dee2e6;
}

.course-content {
  flex: 1;
  padding: 2rem;
}

.lesson {
  max-width: 800px;
  margin: 0 auto;
}

.lesson-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.lesson-header h2 {
  font-size: 2rem;
  color: #495057;
  margin-bottom: 1rem;
}

.lesson-description {
  font-size: 1.1rem;
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.lesson-objectives {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.lesson-objectives h3 {
  color: #495057;
  margin-bottom: 1rem;
}

.lesson-objectives ul {
  margin-left: 1.5rem;
}

.lesson-objectives li {
  margin-bottom: 0.5rem;
  color: #6c757d;
}

.slides-container {
  margin: 2rem 0;
}

.slide {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.slide-title {
  font-size: 1.5rem;
  color: #495057;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.slide-content {
  margin-bottom: 1.5rem;
}

.content-point {
  margin-bottom: 1rem;
  padding-left: 1rem;
  border-left: 3px solid #007bff;
  line-height: 1.7;
  color: #495057;
}

.slide-notes {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 5px;
  padding: 1rem;
  margin-top: 1.5rem;
  color: #856404;
}

.slide-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.nav-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.prev-btn {
  background: #6c757d;
  color: white;
}

.prev-btn:hover {
  background: #5a6268;
}

.next-btn, .next-lesson-btn {
  background: #007bff;
  color: white;
}

.next-btn:hover, .next-lesson-btn:hover {
  background: #0056b3;
}

.lesson-summary {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
}

.lesson-summary h3 {
  color: #155724;
  margin-bottom: 1rem;
}

.lesson-summary ul {
  margin-left: 1.5rem;
}

.lesson-summary li {
  margin-bottom: 0.5rem;
  color: #155724;
}

@media (max-width: 768px) {
  .course-header {
    padding: 1.5rem;
  }
  
  .course-header h1 {
    font-size: 2rem;
  }
  
  .course-meta {
    gap: 1rem;
  }
  
  .course-content {
    padding: 1rem;
  }
  
  .slide {
    padding: 1.5rem;
  }
  
  .slide-navigation {
    flex-direction: column;
    gap: 1rem;
  }
}`;
}

// PDF Export
export async function createCoursePDF(course: Course, lessons: CourseLesson[]): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Generate HTML content for PDF
    const htmlContent = createPDFHTML(course, lessons);
    
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Generate PDF with slide-like formatting
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function createPDFHTML(course: Course, lessons: CourseLesson[]): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(course.title)} - Course Slides</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 20mm 15mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.4;
      color: #333;
      background: white;
    }
    
    .slide {
      width: 100%;
      height: 210mm;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      page-break-inside: avoid;
      padding: 30px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border: 3px solid #4a90e2;
      position: relative;
    }
    
    .slide:last-child {
      page-break-after: auto;
    }
    
    .slide-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 30px;
      margin: -30px -30px 30px -30px;
      border-radius: 8px 8px 0 0;
    }
    
    .course-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .lesson-title {
      font-size: 18px;
      opacity: 0.9;
      font-weight: 500;
    }
    
    .slide-title {
      font-size: 32px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 30px;
      text-align: center;
      border-bottom: 3px solid #4a90e2;
      padding-bottom: 15px;
    }
    
    .slide-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .content-point {
      background: white;
      margin-bottom: 20px;
      padding: 20px 25px;
      border-radius: 8px;
      border-left: 5px solid #4a90e2;
      font-size: 16px;
      line-height: 1.6;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .slide-footer {
      margin-top: auto;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #666;
    }
    
    .slide-number {
      background: #4a90e2;
      color: white;
      padding: 5px 15px;
      border-radius: 15px;
      font-weight: 600;
    }
    
    .slide-duration {
      color: #888;
    }
    
    .title-slide {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      justify-content: center;
      align-items: center;
    }
    
    .title-slide .slide-header {
      background: transparent;
      margin: 0;
      padding: 0;
    }
    
    .title-slide .course-title {
      font-size: 48px;
      margin-bottom: 20px;
    }
    
    .course-description {
      font-size: 20px;
      margin-bottom: 30px;
      opacity: 0.9;
      max-width: 800px;
    }
    
    .course-meta {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 40px;
    }
    
    .meta-item {
      background: rgba(255, 255, 255, 0.2);
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 16px;
    }
    
    .lesson-overview {
      background: #f8f9fa;
      border: 3px solid #4a90e2;
    }
    
    .lesson-overview .slide-content {
      justify-content: flex-start;
    }
    
    .objectives-section, .takeaways-section {
      background: white;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 5px solid #28a745;
    }
    
    .objectives-section h3, .takeaways-section h3 {
      color: #28a745;
      font-size: 20px;
      margin-bottom: 15px;
    }
    
    .objectives-list, .takeaways-list {
      list-style: none;
    }
    
    .objectives-list li, .takeaways-list li {
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
      font-size: 14px;
      position: relative;
      padding-left: 25px;
    }
    
    .objectives-list li:before, .takeaways-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #28a745;
      font-weight: bold;
    }
    
    .slide-notes {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 5px;
      padding: 15px;
      margin-top: 20px;
      font-size: 14px;
      color: #856404;
    }
  </style>
</head>
<body>
  <!-- Title Slide -->
  <div class="slide title-slide">
    <div class="slide-header">
      <div class="course-title">${escapeHtml(course.title)}</div>
    </div>
    <div class="slide-content">
      <div class="course-description">${escapeHtml(course.description)}</div>
      <div class="course-meta">
        <div class="meta-item">Level: ${escapeHtml(course.level)}</div>
        <div class="meta-item">Duration: ${course.duration} hours</div>
        <div class="meta-item">Category: ${escapeHtml(course.category)}</div>
      </div>
    </div>
    <div class="slide-footer">
      <div></div>
      <div class="slide-number">1</div>
    </div>
  </div>
  
  ${lessons.map((lesson, lessonIndex) => {
    let slideCounter = 2; // Start from 2 after title slide
    
    // Lesson overview slide
    const overviewSlide = `
    <div class="slide lesson-overview">
      <div class="slide-header">
        <div class="course-title">${escapeHtml(course.title)}</div>
        <div class="lesson-title">Lesson ${lessonIndex + 1}</div>
      </div>
      <div class="slide-title">${escapeHtml(lesson.title)}</div>
      <div class="slide-content">
        <div style="font-size: 18px; text-align: center; margin-bottom: 30px; color: #666;">
          ${escapeHtml(lesson.description)}
        </div>
        <div class="objectives-section">
          <h3>Learning Objectives</h3>
          <ul class="objectives-list">
            ${lesson.objectives.map(obj => `<li>${escapeHtml(obj)}</li>`).join('')}
          </ul>
        </div>
        <div class="takeaways-section">
          <h3>Key Takeaways</h3>
          <ul class="takeaways-list">
            ${lesson.keyTakeaways.map(takeaway => `<li>${escapeHtml(takeaway)}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="slide-footer">
        <div class="slide-duration">Lesson Duration: ${lesson.duration} minutes</div>
        <div class="slide-number">${slideCounter++}</div>
      </div>
    </div>`;
    
    // Individual slides
    const contentSlides = lesson.slides.map((slide, slideIndex) => `
    <div class="slide">
      <div class="slide-header">
        <div class="course-title">${escapeHtml(course.title)}</div>
        <div class="lesson-title">Lesson ${lessonIndex + 1}: ${escapeHtml(lesson.title)}</div>
      </div>
      <div class="slide-title">${escapeHtml(slide.title)}</div>
      <div class="slide-content">
        ${slide.content.map(content => `<div class="content-point">${escapeHtml(content)}</div>`).join('')}
        ${slide.notes ? `<div class="slide-notes"><strong>Notes:</strong> ${escapeHtml(slide.notes)}</div>` : ''}
      </div>
      <div class="slide-footer">
        <div class="slide-duration">Duration: ${slide.duration} minutes</div>
        <div class="slide-number">${slideCounter++}</div>
      </div>
    </div>`).join('');
    
    return overviewSlide + contentSlides;
  }).join('')}
</body>
</html>`;
}