import {
   ResponseExtractor,
   responseExtractor
} from './response-extractor';
import type {
   TaskDescription,
   DailyTasks,
   WeeklyBreakdown,
   StructuredAIResponse,
   ExtractionMetadata,
   AIResponseWithMetadata,
   TaskData,
   MonthlyPlan,
   PlanTask,
   PartialAIResponse
} from './types';

// Export types
export type {
   TaskDescription,
   DailyTasks,
   WeeklyBreakdown,
   StructuredAIResponse,
   ExtractionMetadata,
   AIResponseWithMetadata,
   TaskData,
   MonthlyPlan,
   PlanTask,
   PartialAIResponse
};

// Export main functionality
export { ResponseExtractor, responseExtractor };

// Utility functions for frontend use
export function parseAIResponse(rawResponse: string, monthYear: string) {
   const extractor = new ResponseExtractor();
   const aiResponse = extractor.extractAllStructuredData(rawResponse);
   return extractor.convertToMonthlyPlan(aiResponse, monthYear);
}

export function extractSummary(rawResponse: string) {
   const extractor = new ResponseExtractor();
   return extractor.extractMonthlySummary(rawResponse);
}

export function validateAIResponse(response: any): response is AIResponseWithMetadata {
   return response &&
          typeof response === 'object' &&
          typeof response.rawContent === 'string' &&
          typeof response.structuredData === 'object' &&
          typeof response.metadata === 'object';
}