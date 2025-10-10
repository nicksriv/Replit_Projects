// YouTube Knowledge Base Storage Implementation
// Add these methods to the MemStorage class in storage.ts

import type {
  YoutubeAnalysis,
  InsertYoutubeAnalysis,
  YoutubeChunk,
  InsertYoutubeChunk,
  YoutubeQuestion,
  InsertYoutubeQuestion
} from "@shared/schema";

// Add these private properties to MemStorage class:
// private youtubeAnalysesMap: Map<number, YoutubeAnalysis>;
// private youtubeChunksMap: Map<number, YoutubeChunk>;
// private youtubeQuestionsMap: Map<number, YoutubeQuestion>;
// private currentYoutubeAnalysisId: number;
// private currentYoutubeChunkId: number;
// private currentYoutubeQuestionId: number;

// Add to constructor initialization:
// this.youtubeAnalysesMap = new Map();
// this.youtubeChunksMap = new Map();
// this.youtubeQuestionsMap = new Map();
// this.currentYoutubeAnalysisId = 1;
// this.currentYoutubeChunkId = 1;
// this.currentYoutubeQuestionId = 1;

// Add these methods to MemStorage class:

export const youtubeStorageMethods = `
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
`;
