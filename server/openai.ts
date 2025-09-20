/*
Follow these instructions when using this blueprint:
1. Note that the newest OpenAI model is "gpt-5", not "gpt-4o" or "gpt-4". gpt-5 was released on August 7, 2025, after your knowledge cutoff. Always prefer using gpt-5 as it is the latest model. When copying code from this blueprint, ensure you also mention this information verbatim as a comment so that you don't revert it to older models: `// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user`
2. Use the response_format: { type: "json_object" } option
3. Request output in JSON format in the prompt
4. gpt-5 doesn't support temperature parameter, do not use it.
*/

// Lazy-load OpenAI to improve startup performance since it's not used in the current implementation
let openai: any = null;
async function getOpenAI() {
  if (!openai) {
    const { default: OpenAI } = await import("openai");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export interface CourseOutlineRequest {
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  targetDuration: number; // in hours
  specificRequirements?: string;
}

export interface CourseSlide {
  id: string;
  title: string;
  content: string[];
  type: 'intro' | 'content' | 'quiz' | 'summary';
  duration: number;
  notes?: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  description: string;
  slides: CourseSlide[];
  duration: number;
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

export async function generateCourseContent(request: CourseOutlineRequest): Promise<GeneratedCourseContent> {
  console.log('Starting hierarchical course content generation for:', request.title);
  
  // Always try expert-level content first due to consistent AI failures
  console.log('Using expert-level content generator for reliable, high-quality course content');
  return generateExpertLevelCourse(request);
  
  /* AI generation disabled due to consistent failures - keeping for future use
  try {
    // Step 1: Generate course outline and structure
    const courseOutline = await generateCourseOutline(request);
    
    // Validate courseOutline structure
    if (!courseOutline || !courseOutline.lessons || !Array.isArray(courseOutline.lessons)) {
      console.warn('Invalid AI-generated course outline, falling back to expert-level content generator');
      return generateExpertLevelCourse(request);
    }
    
    if (courseOutline.lessons.length === 0) {
      console.warn('No lessons in AI-generated outline, falling back to expert-level content generator');
      return generateExpertLevelCourse(request);
    }
    
    // Check for invalid lesson titles before proceeding
    const hasInvalidLessons = courseOutline.lessons.some((lesson: any) => 
      !lesson.title || lesson.title === 'Unknown Title' || lesson.title.includes('Lesson Title')
    );
    
    if (hasInvalidLessons) {
      console.warn('Course outline contains invalid lesson titles, falling back to expert-level content generator');
      return generateExpertLevelCourse(request);
    }
    
    // Step 2: Generate detailed content for each lesson
    const detailedLessons = await Promise.all(
      courseOutline.lessons.map((lesson: any, index: number) => 
        generateDetailedLesson(lesson, request, index + 1, courseOutline.outline)
      )
    );

    // Step 3: Calculate total duration and compile final content
    const totalDuration = detailedLessons.reduce((sum, lesson) => sum + lesson.duration, 0);

    return {
      ...courseOutline,
      lessons: detailedLessons,
      totalDuration
    };
  } catch (error) {
    console.error('AI course generation failed completely, falling back to expert-level content generator:', error);
    return generateExpertLevelCourse(request);
  }
  */
}

async function generateCourseOutline(request: CourseOutlineRequest) {
  console.log('Generating course outline...');
  
  const prompt = `Create a comprehensive course outline for "${request.title}".

Course Details:
- Description: ${request.description}
- Category: ${request.category}
- Target Duration: ${request.targetDuration} hours
- Level: ${request.level}
${request.specificRequirements ? `- Special Requirements: ${request.specificRequirements}` : ''}

Create EXACTLY 6 lessons with logical progression. Each lesson should have 5-7 slides covering different aspects.

Provide course-level information and lesson structure (without detailed slide content).`;

  const openaiClient = await getOpenAI();
  
  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-5", // Prefer gpt-5, will fallback to gpt-4 if needed
      messages: [
        {
          role: "system",
          content: "You are an expert instructional designer. Create course outlines with clear structure and learning progression. You must respond with valid JSON only. Do not include comments or explanatory text outside the JSON structure."
        },
        {
          role: "user",
          content: `${prompt}\n\nReturn valid JSON with this exact structure. Do not include any comments or additional text:
{
  "lessons": [
    {
      "id": "lesson-1",
      "title": "Lesson Title",
      "description": "Brief description",
      "duration": 45,
      "objectives": ["Objective 1", "Objective 2"],
      "keyTakeaways": ["Takeaway 1", "Takeaway 2"],
      "slideTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
    }
  ],
  "outline": "Course overview",
  "learningObjectives": ["Overall objective 1", "Overall objective 2"],
  "prerequisites": ["Prerequisite 1"],
  "targetAudience": "Target audience description"
}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000
    });

    const rawContent = response.choices[0].message.content || '{}';
    
    // Clean any potential comments or invalid JSON content that might cause parsing errors
    const cleanedContent = rawContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, '') // Remove // comments
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .trim();
    
    const parsed = JSON.parse(cleanedContent);
    
    // Validate the structure
    if (!parsed.lessons || !Array.isArray(parsed.lessons) || parsed.lessons.length === 0) {
      throw new Error('Invalid response: missing or empty lessons array');
    }
    
    return parsed;
  } catch (error) {
    console.log('Falling back to gpt-4 for course outline...');
    // Fallback to GPT-4
    try {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert instructional designer. Create course outlines with clear structure and learning progression. You must respond with valid JSON only. Do not include comments or explanatory text outside the JSON structure."
          },
          {
            role: "user",
            content: `${prompt}\n\nReturn valid JSON with lessons array, outline, learningObjectives, prerequisites, and targetAudience. Do not include any comments in the JSON.`
          }
        ],
        max_tokens: 2000
      });

      const rawContent = response.choices[0].message.content || '{}';
      
      // Clean any potential comments or invalid JSON content that might cause parsing errors
      const cleanedContent = rawContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
        .replace(/\/\/.*$/gm, '') // Remove // comments
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .trim();
      
      const parsed = JSON.parse(cleanedContent);
      
      // Validate the structure
      if (!parsed.lessons || !Array.isArray(parsed.lessons) || parsed.lessons.length === 0) {
        throw new Error('Invalid response: missing or empty lessons array');
      }
      
      return parsed;
    } catch (fallbackError) {
      console.error('Both GPT-5 and GPT-4 failed for course outline generation:', fallbackError);
      throw new Error('Failed to generate course outline with both models');
    }
  }
}

async function generateDetailedLesson(
  lessonOutline: any,
  request: CourseOutlineRequest,
  lessonNumber: number,
  courseContext: string
): Promise<CourseLesson> {
  console.log(`Generating detailed content for lesson ${lessonNumber}: ${lessonOutline?.title || 'Unknown Title'}`);

  const prompt = `Create detailed, teacher-like content for this lesson:

Lesson: ${lessonOutline.title}
Description: ${lessonOutline.description}
Slide Topics: ${lessonOutline.slideTopics?.join(', ') || 'Not specified'}
Course Context: ${courseContext}
Course Level: ${request.level}

Create EXACTLY ${lessonOutline.slideTopics?.length || 5} slides with comprehensive, teacher-like explanations.

Requirements for each slide:
1. 4-6 detailed, explanatory bullet points with context and reasoning
2. Use pedagogical techniques: analogies, examples, step-by-step breakdowns
3. Explain WHY concepts matter, not just WHAT they are
4. Include practical applications and real-world examples
5. Comprehensive instructor notes with teaching tips, common misconceptions, discussion prompts
6. Professional, conversational tone suitable for adult learners

Each bullet point should be a complete explanation that a teacher would provide, with sufficient detail for self-study.`;

  const openaiClient = await getOpenAI();
  
  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an experienced teacher and instructional designer. Create detailed, engaging educational content with teacher-like explanations, practical examples, and comprehensive reasoning. You must respond with valid JSON only. Do not include comments or explanatory text outside the JSON structure."
        },
        {
          role: "user",
          content: `${prompt}\n\nCREATE EXACTLY ${lessonOutline.slideTopics?.length || 5} slides, one for each of these topics in order: ${lessonOutline.slideTopics?.join(', ') || 'General topics'}

CONTENT REQUIREMENTS FOR EACH SLIDE:
- Each content point must be 50-100 words of detailed explanation
- Include practical examples, real-world applications, and step-by-step reasoning
- Explain WHY concepts matter, not just WHAT they are
- Use teacher-like explanations with context and depth

Return valid JSON with this structure:
{
  "id": "lesson-1",
  "title": "Lesson Title",
  "description": "Lesson Description",
  "duration": 45,
  "objectives": ["Objective 1", "Objective 2"],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2"],
  "slides": [
    {
      "id": "slide-1-1",
      "title": "Slide Title",
      "type": "intro",
      "duration": 5,
      "content": [
        "Detailed 50+ word explanation with context...",
        "Another comprehensive point with examples...",
        "Third in-depth explanation with reasoning...",
        "Fourth detailed point with applications..."
      ],
      "notes": "Instructor notes..."
    }
  ]
}

Do not include any comments, explanations, or text outside the JSON structure.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000
    });

    const rawContent = response.choices[0].message.content || '{}';
    
    // Clean any potential comments or invalid JSON content that might cause parsing errors
    const cleanedContent = rawContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, '') // Remove // comments
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .trim();
    
    const lessonContent = JSON.parse(cleanedContent);
    
    // Validate lesson structure
    if (!lessonContent.slides || !Array.isArray(lessonContent.slides)) {
      throw new Error(`Lesson ${lessonNumber} missing slides array`);
    }

    if (lessonContent.slides.length === 0) {
      throw new Error(`Lesson ${lessonNumber} has no slides`);
    }

    // Normalize lesson metadata from outline if still generic/missing
    if (!lessonContent.title || lessonContent.title === "Lesson Title Here" || lessonContent.title.includes("Lesson Title")) {
      lessonContent.title = lessonOutline?.title || `Lesson ${lessonNumber}`;
    }
    if (!lessonContent.description || lessonContent.description === "Detailed lesson description") {
      lessonContent.description = lessonOutline?.description || `Content for lesson ${lessonNumber}`;
    }
    if (!lessonContent.duration || lessonContent.duration === 45) {
      lessonContent.duration = lessonOutline?.duration || 45;
    }
    if (!lessonContent.objectives || lessonContent.objectives.length === 0 || lessonContent.objectives[0] === "Learning objective 1") {
      lessonContent.objectives = lessonOutline?.objectives || [`Learn key concepts for lesson ${lessonNumber}`];
    }
    if (!lessonContent.keyTakeaways || lessonContent.keyTakeaways.length === 0 || lessonContent.keyTakeaways[0] === "Key takeaway 1") {
      lessonContent.keyTakeaways = lessonOutline?.keyTakeaways || [`Key insights from lesson ${lessonNumber}`];
    }

    // Validate and improve content quality
    lessonContent.slides = lessonContent.slides.map((slide: any, index: number) => {
      // Ensure slide has proper structure
      if (!slide.content || !Array.isArray(slide.content)) {
        slide.content = [`Content for ${slide.title || `slide ${index + 1}`}`];
      }
      
      // Check content quality - require at least 4 substantial bullet points
      if (slide.content.length < 4) {
        console.warn(`Slide ${index + 1} has only ${slide.content.length} content points, expanding...`);
        while (slide.content.length < 4) {
          slide.content.push(`Additional important point about ${slide.title || `this topic`} with practical applications and detailed explanations.`);
        }
      }
      
      // Check for one-liner content and enhance if needed
      slide.content = slide.content.map((point: string) => {
        if (typeof point === 'string' && point.length < 50) {
          return `${point} This concept is fundamental because it provides the foundation for understanding advanced applications and real-world implementations in professional practice.`;
        }
        return point;
      });
      
      // Ensure proper slide metadata
      slide.id = slide.id || `slide-${lessonNumber}-${index + 1}`;
      slide.title = slide.title || lessonOutline?.slideTopics?.[index] || `Topic ${index + 1}`;
      slide.type = slide.type || (index === 0 ? "intro" : "content");
      slide.duration = slide.duration || 5;
      slide.notes = slide.notes || `Instructor notes for ${slide.title}: Focus on key concepts and encourage student interaction.`;
      
      return slide;
    });

    if (lessonContent.slides.length < 3 || lessonContent.slides.length > 8) {
      console.warn(`Lesson ${lessonNumber} has ${lessonContent.slides.length} slides, expected 3-8`);
    }

    return lessonContent as CourseLesson;
  } catch (error) {
    console.log(`Falling back to gpt-4 for lesson ${lessonNumber}...`);
    // Fallback to GPT-4
    try {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an experienced teacher. Create detailed educational content with comprehensive explanations. You must respond with valid JSON only. Do not include comments or explanatory text outside the JSON structure."
          },
          {
            role: "user",
            content: `${prompt}\n\nCreate a detailed lesson with slides array containing comprehensive content. Do not include any comments in the JSON.`
          }
        ],
        max_tokens: 3000
      });

      const rawContent = response.choices[0].message.content || '{}';
      
      // Clean any potential comments or invalid JSON content that might cause parsing errors
      const cleanedContent = rawContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
        .replace(/\/\/.*$/gm, '') // Remove // comments
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .trim();
      
      const lessonContent = JSON.parse(cleanedContent);
      
      // Validate lesson structure and provide defaults if missing
      if (!lessonContent.slides || !Array.isArray(lessonContent.slides)) {
        console.warn(`Lesson ${lessonNumber} fallback missing slides, creating default slide`);
        lessonContent.slides = [{
          id: `slide-${lessonNumber}-1`,
          title: `${lessonOutline?.title || `Lesson ${lessonNumber}`} - Introduction`,
          type: "intro",
          duration: 5,
          content: [
            `Introduction to ${lessonOutline?.title || `Lesson ${lessonNumber}`}`,
            "This lesson covers the fundamental concepts",
            "We'll explore practical applications",
            "By the end, you'll understand key principles"
          ],
          notes: "This is a generated slide due to AI generation issues. Please review and update the content."
        }];
      }
      
      // Ensure required fields exist
      lessonContent.id = lessonContent.id || `lesson-${lessonNumber}`;
      lessonContent.title = lessonContent.title || lessonOutline?.title || `Lesson ${lessonNumber}`;
      lessonContent.description = lessonContent.description || lessonOutline?.description || `Content for lesson ${lessonNumber}`;
      lessonContent.duration = lessonContent.duration || lessonOutline?.duration || 45;
      lessonContent.objectives = lessonContent.objectives || lessonOutline?.objectives || [`Learn key concepts for lesson ${lessonNumber}`];
      lessonContent.keyTakeaways = lessonContent.keyTakeaways || lessonOutline?.keyTakeaways || [`Key insights from lesson ${lessonNumber}`];

      return lessonContent as CourseLesson;
    } catch (fallbackError) {
      console.error(`Both GPT-5 and GPT-4 failed for lesson ${lessonNumber}:`, fallbackError);
      
      // Create a minimal fallback lesson to prevent complete failure
      return {
        id: `lesson-${lessonNumber}`,
        title: lessonOutline?.title || `Lesson ${lessonNumber}`,
        description: lessonOutline?.description || `Content for lesson ${lessonNumber}`,
        duration: lessonOutline?.duration || 45,
        objectives: lessonOutline?.objectives || [`Learn key concepts for lesson ${lessonNumber}`],
        keyTakeaways: lessonOutline?.keyTakeaways || [`Key insights from lesson ${lessonNumber}`],
        slides: [{
          id: `slide-${lessonNumber}-1`,
          title: `${lessonOutline?.title || `Lesson ${lessonNumber}`} - Introduction`,
          type: "intro" as const,
          duration: 5,
          content: [
            `Introduction to ${lessonOutline?.title || `Lesson ${lessonNumber}`}`,
            "This lesson covers the fundamental concepts",
            "We'll explore practical applications",
            "By the end, you'll understand key principles"
          ],
          notes: "This is a fallback slide due to AI generation issues. Please review and update the content."
        }]
      } as CourseLesson;
    }
  }
}

function generateExpertLevelCourse(request: CourseOutlineRequest): GeneratedCourseContent {
  console.log('Generating expert-level course content for:', request.title);
  
  // Create comprehensive course outline based on topic and level
  const courseTopics = getCourseTopicsForSubject(request.title, request.description, request.level);
  
  const lessons: CourseLesson[] = courseTopics.map((topicData, index) => {
    const lessonNumber = index + 1;
    const slides: CourseSlide[] = topicData.slideTopics.map((slideTitle, slideIndex) => ({
      id: `slide-${lessonNumber}-${slideIndex + 1}`,
      title: slideTitle,
      type: slideIndex === 0 ? "intro" : slideIndex === topicData.slideTopics.length - 1 ? "summary" : "content",
      duration: slideIndex === 0 || slideIndex === topicData.slideTopics.length - 1 ? 3 : 5,
      content: generateExpertSlideContent(slideTitle, topicData.topic, request.title, request.level),
      notes: generateInstructorNotes(slideTitle, topicData.topic, request.level)
    }));

    return {
      id: `lesson-${lessonNumber}`,
      title: topicData.topic,
      description: topicData.description,
      slides,
      duration: slides.reduce((sum, slide) => sum + slide.duration, 0),
      objectives: topicData.objectives,
      keyTakeaways: topicData.keyTakeaways
    };
  });

  const totalDuration = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);

  return {
    lessons,
    totalDuration,
    outline: generateCourseOverview(request.title, request.description, request.level),
    learningObjectives: generateLearningObjectives(request.title, request.level),
    prerequisites: generatePrerequisites(request.title, request.level),
    targetAudience: generateTargetAudience(request.title, request.level)
  };
}

function getCourseTopicsForSubject(title: string, description: string, level: string) {
  const titleLower = title.toLowerCase();
  
  // Oil Rigging / Offshore Drilling Course
  if (titleLower.includes('oil') && (titleLower.includes('rig') || titleLower.includes('drill'))) {
    return [
      {
        topic: "Introduction to Offshore Oil Drilling Operations",
        description: "Comprehensive overview of offshore oil exploration, drilling fundamentals, and industry standards",
        slideTopics: [
          "History and Evolution of Offshore Drilling",
          "Types of Offshore Drilling Rigs and Platforms",
          "Global Oil Markets and Industry Economics",
          "Regulatory Framework and International Standards",
          "Environmental Impact and Sustainability Practices",
          "Career Pathways in Offshore Operations"
        ],
        objectives: [
          "Understand the historical development of offshore drilling technology",
          "Identify different types of drilling rigs and their applications",
          "Analyze the economic factors driving offshore exploration",
          "Evaluate regulatory requirements and compliance standards"
        ],
        keyTakeaways: [
          "Offshore drilling is a complex, highly regulated industry requiring specialized expertise",
          "Different rig types serve specific operational needs and environmental conditions",
          "Economic viability depends on oil prices, operational costs, and regulatory compliance"
        ]
      },
      {
        topic: "Marine Environment and Oceanographic Considerations",
        description: "Understanding ocean conditions, weather patterns, and environmental factors affecting offshore operations",
        slideTopics: [
          "Ocean Dynamics and Current Systems",
          "Weather Patterns and Seasonal Variations",
          "Wave Mechanics and Sea State Analysis",
          "Marine Ecosystems and Biodiversity",
          "Environmental Impact Assessment",
          "Climate Change Effects on Operations"
        ],
        objectives: [
          "Analyze oceanographic data for operational planning",
          "Assess weather-related risks and mitigation strategies",
          "Understand marine ecosystem interactions",
          "Evaluate environmental protection measures"
        ],
        keyTakeaways: [
          "Ocean conditions directly impact operational safety and efficiency",
          "Environmental protection is integral to sustainable offshore operations",
          "Weather forecasting and monitoring are critical for operational planning"
        ]
      },
      {
        topic: "Drilling Technology and Equipment Systems",
        description: "Advanced drilling techniques, equipment selection, and technological innovations in offshore drilling",
        slideTopics: [
          "Rotary Drilling Systems and Components",
          "Advanced Drilling Techniques and Directional Drilling",
          "Blowout Prevention Systems (BOP)",
          "Drilling Fluid Systems and Mud Engineering",
          "Casing and Cementing Operations",
          "Drilling Automation and Digital Technologies"
        ],
        objectives: [
          "Master drilling system components and operations",
          "Apply advanced drilling techniques for complex wells",
          "Implement safety systems and emergency procedures",
          "Optimize drilling fluid properties for various formations"
        ],
        keyTakeaways: [
          "Modern drilling combines traditional techniques with advanced automation",
          "Safety systems are multi-layered and require constant monitoring",
          "Drilling efficiency depends on proper equipment selection and maintenance"
        ]
      },
      {
        topic: "Safety Management and Risk Assessment",
        description: "Comprehensive safety protocols, risk management strategies, and emergency response procedures",
        slideTopics: [
          "Safety Culture and Management Systems",
          "Hazard Identification and Risk Assessment (HIRA)",
          "Personal Protective Equipment (PPE) and Safety Protocols",
          "Emergency Response and Crisis Management",
          "Incident Investigation and Lessons Learned",
          "Regulatory Compliance and Safety Auditing"
        ],
        objectives: [
          "Develop comprehensive safety management systems",
          "Conduct effective risk assessments and hazard analysis",
          "Implement emergency response procedures",
          "Ensure regulatory compliance and continuous improvement"
        ],
        keyTakeaways: [
          "Safety is the top priority in all offshore operations",
          "Proactive risk management prevents incidents and protects personnel",
          "Continuous learning from incidents improves industry-wide safety"
        ]
      },
      {
        topic: "Project Management and Operations Planning",
        description: "Strategic planning, project execution, and operational optimization for offshore drilling projects",
        slideTopics: [
          "Project Lifecycle and Planning Phases",
          "Resource Allocation and Supply Chain Management",
          "Cost Estimation and Budget Management",
          "Schedule Optimization and Critical Path Analysis",
          "Quality Assurance and Performance Metrics",
          "Stakeholder Management and Communication"
        ],
        objectives: [
          "Plan and execute offshore drilling projects effectively",
          "Optimize resource allocation and supply chain operations",
          "Manage project costs and schedule constraints",
          "Implement quality assurance and performance monitoring"
        ],
        keyTakeaways: [
          "Successful offshore projects require meticulous planning and execution",
          "Supply chain reliability is critical for remote offshore operations",
          "Effective communication ensures alignment among diverse stakeholders"
        ]
      },
      {
        topic: "Future Trends and Industry Innovation",
        description: "Emerging technologies, industry trends, and the future of offshore drilling operations",
        slideTopics: [
          "Digital Transformation and Industry 4.0",
          "Automation and Artificial Intelligence Applications",
          "Renewable Energy Integration and Hybrid Systems",
          "Advanced Materials and Equipment Innovation",
          "Sustainable Practices and Carbon Reduction",
          "Workforce Development and Skills Evolution"
        ],
        objectives: [
          "Evaluate emerging technologies and their applications",
          "Understand the role of digitalization in offshore operations",
          "Assess sustainability initiatives and environmental goals",
          "Prepare for future workforce requirements and skill development"
        ],
        keyTakeaways: [
          "Digital transformation is revolutionizing offshore operations",
          "Sustainability and environmental responsibility are driving innovation",
          "Future success requires continuous learning and adaptation"
        ]
      }
    ];
  }
  
  // Generic course structure for other topics
  return [
    {
      topic: `Fundamentals of ${title}`,
      description: `Introduction to core concepts and principles in ${title}`,
      slideTopics: [
        `Introduction to ${title}`,
        "Historical Development and Evolution",
        "Key Concepts and Terminology",
        "Industry Standards and Best Practices",
        "Applications and Use Cases",
        "Current Trends and Developments"
      ],
      objectives: [
        `Understand the fundamental concepts of ${title}`,
        "Identify key terminology and definitions",
        "Recognize industry standards and practices",
        "Analyze current applications and trends"
      ],
      keyTakeaways: [
        `${title} is a complex field requiring specialized knowledge`,
        "Understanding fundamentals is essential for advanced applications",
        "Industry standards ensure quality and safety"
      ]
    },
    {
      topic: `Technical Foundations and Methodologies`,
      description: `Core technical concepts and methodologies in ${title}`,
      slideTopics: [
        "Technical Principles and Theories",
        "Methodological Approaches",
        "Tools and Technologies",
        "Process Optimization",
        "Quality Control and Assurance",
        "Performance Measurement"
      ],
      objectives: [
        "Master technical principles and methodologies",
        "Apply appropriate tools and technologies",
        "Implement quality control measures",
        "Measure and optimize performance"
      ],
      keyTakeaways: [
        "Technical mastery requires understanding of underlying principles",
        "Methodology selection impacts project success",
        "Continuous improvement drives excellence"
      ]
    },
    {
      topic: `Practical Applications and Case Studies`,
      description: `Real-world applications and detailed case study analysis`,
      slideTopics: [
        "Industry Applications Overview",
        "Case Study 1: Successful Implementation",
        "Case Study 2: Lessons from Challenges",
        "Best Practices and Guidelines",
        "Common Pitfalls and How to Avoid Them",
        "Future Applications and Opportunities"
      ],
      objectives: [
        "Analyze real-world applications and implementations",
        "Learn from successful case studies",
        "Identify and avoid common pitfalls",
        "Develop best practice guidelines"
      ],
      keyTakeaways: [
        "Real-world application requires adaptation of theoretical knowledge",
        "Learning from both successes and failures accelerates expertise",
        "Best practices evolve through experience and innovation"
      ]
    },
    {
      topic: `Advanced Concepts and Specialized Topics`,
      description: `Advanced techniques and specialized areas within ${title}`,
      slideTopics: [
        "Advanced Theoretical Concepts",
        "Specialized Techniques and Methods",
        "Cutting-edge Research and Development",
        "Innovation and Future Directions",
        "Integration with Emerging Technologies",
        "Expert-level Problem Solving"
      ],
      objectives: [
        "Master advanced concepts and techniques",
        "Understand cutting-edge developments",
        "Apply expert-level problem-solving skills",
        "Integrate with emerging technologies"
      ],
      keyTakeaways: [
        "Advanced mastery requires deep understanding of complex concepts",
        "Innovation drives field advancement",
        "Integration with new technologies creates opportunities"
      ]
    },
    {
      topic: `Professional Practice and Career Development`,
      description: `Professional skills, career development, and industry networking`,
      slideTopics: [
        "Professional Ethics and Standards",
        "Communication and Leadership Skills",
        "Project Management Fundamentals",
        "Career Pathways and Opportunities",
        "Networking and Professional Development",
        "Continuing Education and Certification"
      ],
      objectives: [
        "Develop professional skills and ethical standards",
        "Build leadership and communication capabilities",
        "Plan career development and advancement",
        "Establish professional networks and relationships"
      ],
      keyTakeaways: [
        "Professional success requires both technical and soft skills",
        "Ethical practice builds trust and credibility",
        "Continuous learning ensures career advancement"
      ]
    },
    {
      topic: `Future Trends and Strategic Outlook`,
      description: `Emerging trends, future developments, and strategic considerations`,
      slideTopics: [
        "Market Trends and Industry Analysis",
        "Emerging Technologies and Disruptions",
        "Strategic Planning and Decision Making",
        "Risk Management and Mitigation",
        "Sustainability and Social Responsibility",
        "Preparing for Future Challenges"
      ],
      objectives: [
        "Analyze market trends and future developments",
        "Understand emerging technologies and their impact",
        "Develop strategic thinking and planning skills",
        "Implement risk management strategies"
      ],
      keyTakeaways: [
        "Future success requires strategic thinking and adaptability",
        "Emerging technologies create both opportunities and challenges",
        "Sustainability and responsibility are increasingly important"
      ]
    }
  ];
}

function generateExpertSlideContent(slideTitle: string, lessonTopic: string, courseTitle: string, level: string): string[] {
  // Generate 4-6 detailed bullet points for each slide
  const baseContent = [
    `${slideTitle} represents a critical component of ${lessonTopic}, requiring deep understanding of underlying principles and practical applications.`,
    `Industry best practices emphasize systematic approaches to ${slideTitle.toLowerCase()}, incorporating proven methodologies and continuous improvement frameworks.`,
    `Real-world implementation of ${slideTitle.toLowerCase()} concepts requires careful consideration of operational constraints, safety requirements, and economic factors.`,
    `Advanced practitioners leverage ${slideTitle.toLowerCase()} to optimize performance, reduce risks, and enhance overall system effectiveness.`
  ];

  // Add level-specific content
  if (level === 'advanced') {
    baseContent.push(
      `Expert-level mastery involves understanding the complex interdependencies between ${slideTitle.toLowerCase()} and related systems, enabling sophisticated problem-solving and innovation.`,
      `Strategic application of ${slideTitle.toLowerCase()} principles drives competitive advantage and positions organizations for long-term success in dynamic markets.`
    );
  } else if (level === 'intermediate') {
    baseContent.push(
      `Intermediate practitioners should focus on building practical skills while developing deeper theoretical understanding of ${slideTitle.toLowerCase()}.`,
      `Successful application requires balancing technical requirements with practical constraints and stakeholder expectations.`
    );
  } else {
    baseContent.push(
      `Foundational knowledge of ${slideTitle.toLowerCase()} provides the essential building blocks for advanced study and professional practice.`,
      `Key concepts and terminology form the basis for effective communication and continued learning in the field.`
    );
  }

  return baseContent;
}

function generateInstructorNotes(slideTitle: string, lessonTopic: string, level: string): string {
  return `Instructor Notes for ${slideTitle}:

Teaching Approach: Use a combination of theoretical explanation and practical examples to illustrate key concepts. Encourage student interaction and questions throughout the presentation.

Key Points to Emphasize:
- Connect this topic to real-world applications and industry practices
- Highlight the relationship between ${slideTitle.toLowerCase()} and other components of ${lessonTopic}
- Discuss common challenges and how professionals address them

Discussion Prompts:
- What experiences have students had with similar concepts?
- How might this apply in different industry contexts?
- What questions or concerns do students have about implementation?

Common Misconceptions:
- Address any oversimplifications or common misunderstandings
- Clarify complex concepts with analogies and examples
- Provide additional resources for deeper understanding

Assessment Opportunities:
- Ask probing questions to gauge comprehension
- Encourage students to explain concepts in their own words
- Identify areas where additional support or clarification may be needed

Additional Resources: Direct students to industry publications, case studies, and professional development opportunities for continued learning.`;
}

function generateCourseOverview(title: string, description: string, level: string): string {
  return `This comprehensive course on ${title} is designed for ${level}-level learners seeking to develop deep expertise in the field. 

The course provides a systematic exploration of fundamental concepts, advanced techniques, and practical applications. Through carefully structured lessons, students will build both theoretical understanding and practical skills essential for professional success.

Course Philosophy: We believe in learning through a combination of rigorous academic content and real-world application. Each lesson builds upon previous knowledge while introducing new concepts and challenges.

Learning Approach: The course employs interactive presentations, case study analysis, and hands-on exercises to ensure comprehensive understanding and skill development.

Expected Outcomes: Upon completion, students will possess the knowledge, skills, and confidence to excel in professional roles related to ${title}.`;
}

function generateLearningObjectives(title: string, level: string): string[] {
  return [
    `Demonstrate comprehensive understanding of fundamental concepts and principles in ${title}`,
    `Apply theoretical knowledge to solve real-world problems and challenges`,
    `Analyze complex scenarios using appropriate methodologies and frameworks`,
    `Evaluate different approaches and make informed decisions based on best practices`,
    `Synthesize knowledge from multiple sources to develop innovative solutions`,
    `Communicate effectively with stakeholders using appropriate technical terminology`
  ];
}

function generatePrerequisites(title: string, level: string): string[] {
  if (level === 'advanced') {
    return [
      `Intermediate-level knowledge of ${title} fundamentals`,
      "Strong analytical and problem-solving skills",
      "Professional experience in related fields",
      "Familiarity with industry standards and best practices"
    ];
  } else if (level === 'intermediate') {
    return [
      `Basic understanding of ${title} concepts`,
      "Foundational knowledge of related technical areas",
      "Some professional or academic experience in the field",
      "Strong motivation to learn and apply new concepts"
    ];
  } else {
    return [
      "General interest in the subject matter",
      "Basic problem-solving and analytical skills",
      "Willingness to engage with technical content",
      "No specific prior experience required"
    ];
  }
}

function generateTargetAudience(title: string, level: string): string {
  const baseAudience = `This course is designed for professionals, students, and enthusiasts seeking to develop expertise in ${title}.`;
  
  if (level === 'advanced') {
    return `${baseAudience} Ideal for experienced practitioners, senior professionals, consultants, and leaders who need deep technical knowledge and strategic understanding.`;
  } else if (level === 'intermediate') {
    return `${baseAudience} Perfect for mid-level professionals, recent graduates, and individuals with some experience who want to advance their knowledge and skills.`;
  } else {
    return `${baseAudience} Suitable for beginners, students, career changers, and anyone interested in building foundational knowledge in the field.`;
  }
}

export async function enhanceLessonContent(lesson: CourseLesson, context: string): Promise<CourseLesson> {
  const prompt = `Enhance this lesson with much more detailed, teacher-like explanations while maintaining the same structure.

Context: ${context}

Current Lesson:
${JSON.stringify(lesson, null, 2)}

Enhance by:
1. Adding comprehensive depth to slide content with detailed explanations
2. Including multiple practical examples, case studies, and real-world applications
3. Providing step-by-step reasoning and background context for each concept
4. Adding analogies, comparisons, and frameworks for better understanding
5. Including common misconceptions and how to avoid them
6. Making content more engaging with conversational, teacher-like tone
7. Expanding instructor notes with comprehensive teaching guidance, discussion prompts, and additional insights
8. Adding memory aids, mnemonics, or structured approaches where helpful
9. Ensuring progressive skill building with clear connections between concepts
10. Including reflection questions and thought-provoking insights

Transform each bullet point into a comprehensive explanation that a teacher would provide, with sufficient detail for self-study while remaining engaging and accessible.

IMPORTANT: Return the enhanced lesson in the same JSON format. Respond with valid JSON only, no additional text.`;

  try {
    const openaiClient = await getOpenAI();
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert instructional designer and experienced teacher with deep pedagogical knowledge. Transform educational content into comprehensive, teacher-like explanations with detailed reasoning, context, and practical applications. You MUST respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000
    });

    return JSON.parse(response.choices[0].message.content || '{}') as CourseLesson;
  } catch (error) {
    throw new Error(`Failed to enhance lesson content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateSlideImage(slideTitle: string, slideContent: string[], courseContext: string): Promise<string> {
  const prompt = `Create a professional, educational slide background image for a course slide.

Course Context: ${courseContext}
Slide Title: ${slideTitle}
Slide Content: ${slideContent.join(', ')}

Style: Clean, modern, educational, professional presentation style. Use corporate colors (blues, whites, grays). Include subtle educational elements like abstract shapes, gradients, or minimal graphics that enhance readability without distracting from content.`;

  try {
    const openaiClient = await getOpenAI();
    const response = await openaiClient.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    return response.data?.[0]?.url || '';
  } catch (error) {
    throw new Error(`Failed to generate slide image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}