// Export library functions
export { OpenRouterService, getOpenRouterService, isConfigured } from './lib/openrouter';
export { responseExtractor } from './lib/response-extractor';

// Re-export types from shared types package
export type {
   StructuredAIResponse,
   WeeklyBreakdown,
   TaskDescription,
   ExtractionMetadata,
   TaskData,
   AIResponseWithMetadata,
   Priority,
   Complexity,
   WeekendFocus
} from '@testing-server/types';

// Export services
export {
   processAIResponse,
   createDefaultTasks,
   handleAIServiceFailure
} from './services/plan-generation';

export {
   generatePlan,
   confirmPlan
} from './services/hybrid-plan-generation';

export type {
   GeneratePlanInput,
   GeneratePlanResult,
   GeneratePlanError
} from './services/hybrid-plan-generation';

// Export routers
export { planRouter } from './routers/plan';
export { servicesRouter } from './routers/services';
export { calendarRouter } from './routers/calendar';