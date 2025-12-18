import type { AIResponseWithMetadata } from '@testing-server/types';
import { responseExtractor } from '../lib/response-extractor';

/**
 * Handle AI service failure by returning proper error information
 */
export function handleAIServiceFailure(error: unknown): never {
   const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
   const isApiKeyMissing = errorMessage.includes('API key') || errorMessage.includes('OPENROUTER_API_KEY');

   if (isApiKeyMissing) {
      throw new Error('OpenRouter API key is not configured. Please set the OPENROUTER_API_KEY environment variable to enable AI plan generation.');
   }

   throw new Error(`AI plan generation service failed: ${errorMessage}. Please check your configuration and try again.`);
}

/**
 * Process AI response with robust extraction and fallback logic
 */
export function processAIResponse(rawResponse: { rawContent: string; metadata: { contentLength: number; format: 'json' | 'text' | 'mixed' } }): AIResponseWithMetadata {
   console.log(`Processing AI response, format: ${rawResponse.metadata.format}`);

   // Use response extractor to safely extract structured data
   const extractedData = responseExtractor.extractAllStructuredData(rawResponse.rawContent);

   console.log(`Extraction completed with confidence: ${extractedData.metadata.confidence}%`);
   console.log(`Extraction notes: ${extractedData.metadata.extractionNotes}`);

   if (extractedData.metadata.parsingErrors.length > 0) {
      console.warn('Parsing errors occurred:', extractedData.metadata.parsingErrors);
   }

   return extractedData;
}

/**
 * Create default tasks when extraction fails
 */
export function createDefaultTasks(planId: number): Array<{
   planId: number;
   taskDescription: string;
   focusArea: string;
   startTime: Date;
   endTime: Date;
   difficultyLevel: 'simple' | 'moderate' | 'advanced';
   schedulingReason: string;
   isCompleted: boolean;
}> {
   const now = new Date();
   const tasks = [];

   // Create simple default tasks for the next few days
   for (let i = 0; i < 5; i++) {
      const taskDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);

      tasks.push({
         planId,
         taskDescription: `Complete daily objectives - Day ${i + 1}`,
         focusArea: 'General',
         startTime: new Date(taskDate.setHours(9, 0, 0, 0)), // 9 AM
         endTime: new Date(taskDate.setHours(11, 0, 0, 0)), // 11 AM
         difficultyLevel: 'moderate' as const,
         schedulingReason: 'Default task created due to extraction failure',
         isCompleted: false
      });
   }

   return tasks;
}