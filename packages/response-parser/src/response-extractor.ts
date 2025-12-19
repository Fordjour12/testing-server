import type {
   StructuredAIResponse,
   WeeklyBreakdown,
   TaskDescription,
   ExtractionMetadata,
   TaskData,
   AIResponseWithMetadata,
   MonthlyPlan
} from './types';

export class ResponseExtractor {
   /**
    * Main extraction method that tries multiple strategies
    */
   extractAllStructuredData(rawResponse: string): AIResponseWithMetadata {
      const metadata: ExtractionMetadata = {
         confidence: 0,
         extractionNotes: '',
         detectedFormat: this.detectFormat(rawResponse),
         parsingErrors: [],
         missingFields: []
      };

      let structuredData: StructuredAIResponse = {};

      try {
         // Strategy 1: Try JSON parsing first
         const jsonData = this.tryJsonExtraction(rawResponse);
         if (jsonData) {
            structuredData = jsonData;
            metadata.confidence = 90;
            metadata.extractionNotes = 'Successfully parsed as JSON';
            return { rawContent: rawResponse, structuredData, metadata };
         }
      } catch (error) {
         metadata.parsingErrors.push(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Strategy 2: Try pattern-based extraction for key fields
      try {
         const patternData = this.extractByPatterns(rawResponse);
         structuredData = { ...structuredData, ...patternData };
         metadata.confidence = Math.max(metadata.confidence, 60);
         metadata.extractionNotes += metadata.extractionNotes ? '; ' : '';
         metadata.extractionNotes += 'Partially extracted using pattern matching';
      } catch (error) {
         metadata.parsingErrors.push(`Pattern extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Strategy 3: Fallback to basic text analysis
      try {
         const fallbackData = this.extractByTextAnalysis(rawResponse);
         structuredData = { ...structuredData, ...fallbackData };
         metadata.confidence = Math.max(metadata.confidence, 30);
         metadata.extractionNotes += metadata.extractionNotes ? '; ' : '';
         metadata.extractionNotes += 'Basic text analysis fallback';
      } catch (error) {
         metadata.parsingErrors.push(`Text analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Identify missing critical fields
      const criticalFields = ['monthly_summary'];
      metadata.missingFields = criticalFields.filter(field => !structuredData[field as keyof StructuredAIResponse]);

      return {
         rawContent: rawResponse,
         structuredData,
         metadata
      };
   }

   /**
    * Extract monthly summary with multiple strategies
    */
   extractMonthlySummary(rawResponse: string): string {
      // Strategy 1: JSON extraction
      const jsonMatch = rawResponse.match(/"monthly_summary"\s*:\s*"([^"]+)"/);
      if (jsonMatch && jsonMatch[1]) {
         return jsonMatch[1];
      }

      // Strategy 2: Look for summary patterns
      const summaryPatterns = [
         /(?:monthly summary|overview|summary)[:\s]*([^\n]+)/i,
         /(?:this month|for this month)[:\s]*([^\n]+)/i,
         /^([A-Z][^.!?]*[.!?])/m // First complete sentence
      ];

      for (const pattern of summaryPatterns) {
         const match = rawResponse.match(pattern);
         if (match && match[1] && match[1].length > 20) {
            return match[1].trim();
         }
      }

      // Strategy 3: Extract first meaningful paragraph
      const paragraphs = rawResponse.split('\n\n').filter(p => p.trim().length > 50);
      if (paragraphs.length > 0) {
         const firstParagraph = paragraphs[0];
         if (firstParagraph) {
            return firstParagraph.trim().substring(0, 200) + '...';
         }
      }

      return 'Summary could not be extracted';
   }

   /**
    * Convert extracted AI response to MonthlyPlan format for frontend
    */
   convertToMonthlyPlan(aiResponse: AIResponseWithMetadata, monthYear: string): MonthlyPlan {
      const { structuredData, metadata } = aiResponse;
      const tasks = this.extractTasksFromBreakdown(structuredData.weekly_breakdown || []);

      return {
         id: `temp-${Date.now()}`, // Temporary ID for unsaved plans
         title: `${monthYear} Plan`,
         month: monthYear,
         goals: structuredData.weekly_breakdown?.flatMap(week => week.goals) || [],
         tasks: tasks.map((task, index) => ({
            id: `task-${index}`,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority,
            category: task.category,
            estimatedHours: task.estimatedHours,
            completed: false
         })),
         totalTasks: tasks.length,
         estimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
         confidence: metadata.confidence,
         extractionNotes: metadata.extractionNotes
      };
   }

   /**
    * Extract weekly breakdown from response
    */
   extractWeeklyBreakdown(rawResponse: string): WeeklyBreakdown[] {
      const breakdown: WeeklyBreakdown[] = [];

      // Strategy 1: JSON extraction
      try {
         const weeklyMatch = rawResponse.match(/"weekly_breakdown"\s*:\s*\[([\s\S]*?)\]/);
         if (weeklyMatch) {
            const jsonStr = `"weekly_breakdown": [${weeklyMatch[1]}]`;
            const parsed = JSON.parse(jsonStr);
            if (parsed && Array.isArray(parsed.weekly_breakdown)) {
               return parsed.weekly_breakdown;
            }
         }
      } catch (error) {
         console.warn('Failed to extract weekly breakdown from JSON:', error);
      }

      // Strategy 2: Pattern-based week extraction
      const weekPatterns = [
         /week\s*(\d+)[\s\S]*?focus[:\s]*([^\n]+)/gi,
         /week\s*(\d+)[\s\S]*?goals[:\s]*([^\n]+)/gi
      ];

      const weeks = new Map<number, Partial<WeeklyBreakdown>>();

      for (const pattern of weekPatterns) {
         let match;
         while ((match = pattern.exec(rawResponse)) !== null) {
            const weekNum = parseInt(match[1] || '1');
            if (!weeks.has(weekNum)) {
               weeks.set(weekNum, { week: weekNum, focus: '', goals: [], daily_tasks: {} });
            }
         }
      }

      // Convert to array and fill missing data
      weeks.forEach((weekData, weekNum) => {
         breakdown.push({
            week: weekNum,
            focus: weekData.focus || `Week ${weekNum} focus`,
            goals: weekData.goals || ['Complete weekly objectives'],
            daily_tasks: this.extractDailyTasks(rawResponse, weekNum)
         });
      });

      return breakdown.length > 0 ? breakdown : this.generateDefaultBreakdown();
   }

   /**
    * Extract daily tasks for a specific week
    */
   private extractDailyTasks(rawResponse: string, _weekNumber: number): { [day: string]: TaskDescription[] } {
      const dailyTasks: { [day: string]: TaskDescription[] } = {};
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      // Initialize empty tasks for each day
      days.forEach(day => {
         dailyTasks[day] = [];
      });

      // Try to extract tasks for each day
      days.forEach(day => {
         const dayPattern = new RegExp(`${day}[:\\s]*([\\s\\S]*?)(?=Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|$)`, 'i');
         const dayMatch = rawResponse.match(dayPattern);

         if (dayMatch && dayMatch[1]) {
            const tasks = this.parseTasksFromText(dayMatch[1], day);
            dailyTasks[day] = tasks;
         }
      });

      return dailyTasks;
   }

   /**
    * Parse tasks from text content
    */
   private parseTasksFromText(text: string, day: string): TaskDescription[] {
      const tasks: TaskDescription[] = [];
      const lines = text.split('\n').filter(line => line.trim());

      lines.forEach((line, _index) => {
         // Look for task patterns
         const taskPatterns = [
            /[-*•]\s*(.+?)(?:\s*\((\d+[hm])\))?/, // Bullet points with time
            /^\d+\.\s*(.+?)(?:\s*\((\d+[hm])\))?/, // Numbered items with time
            /^(.+?)(?:\s*\((\d+[hm])\))$/m // Simple lines with time
         ];

         for (const pattern of taskPatterns) {
            const match = line.match(pattern);
            if (match && match[1] && match[1].length > 10) {
               const duration = match[2] || '2h';
               const hours = parseInt(duration) || 2;

               tasks.push({
                  task_description: match[1].trim(),
                  focus_area: 'General',
                  start_time: '09:00',
                  end_time: `${9 + hours}:00`,
                  difficulty_level: hours <= 1 ? 'simple' : hours <= 3 ? 'moderate' : 'advanced',
                  scheduling_reason: `Scheduled for ${day}`
               });
               break;
            }
         }
      });

      // If no tasks found, create a default task
      if (tasks.length === 0) {
         tasks.push({
            task_description: `Complete ${day} objectives`,
            focus_area: 'General',
            start_time: '09:00',
            end_time: '11:00',
            difficulty_level: 'moderate',
            scheduling_reason: `Default task for ${day}`
         });
      }

      return tasks;
   }

   /**
    * Extract tasks from weekly breakdown for database storage
    */
   extractTasksFromBreakdown(breakdown: WeeklyBreakdown[]): TaskData[] {
      const tasks: TaskData[] = [];

      breakdown.forEach(week => {
         Object.entries(week.daily_tasks).forEach(([day, dayTasks]) => {
            dayTasks.forEach((task, _index) => {
               const taskDate = this.calculateTaskDate(week.week, day);

               tasks.push({
                  title: task.task_description,
                  description: task.scheduling_reason,
                  dueDate: taskDate,
                  priority: task.difficulty_level === 'advanced' ? 'High' :
                            task.difficulty_level === 'moderate' ? 'Medium' : 'Low',
                  category: task.focus_area,
                  estimatedHours: this.calculateHours(task.start_time, task.end_time),
                  weekNumber: week.week,
                  dayOfWeek: day
               });
            });
         });
      });

      return tasks;
   }

   /**
    * Try JSON extraction from raw response
    */
   private tryJsonExtraction(rawResponse: string): StructuredAIResponse | null {
      try {
         // First try direct JSON parsing
         return JSON.parse(rawResponse);
      } catch {
         // Try to extract JSON from within text
         const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
         if (jsonMatch) {
            try {
               return JSON.parse(jsonMatch[0]);
            } catch {
               return null;
            }
         }
         return null;
      }
   }

   /**
    * Extract data using regex patterns
    */
   private extractByPatterns(rawResponse: string): Partial<StructuredAIResponse> {
      const result: Partial<StructuredAIResponse> = {};

      // Extract monthly summary
      result.monthly_summary = this.extractMonthlySummary(rawResponse);

      // Extract weekly breakdown
      result.weekly_breakdown = this.extractWeeklyBreakdown(rawResponse);

      // Extract other fields using patterns
      const personalizationMatch = rawResponse.match(/personalization[_\s]notes?[:\s]*([^\n]+)/i);
      if (personalizationMatch && personalizationMatch[1]) {
         result.personalization_notes = [personalizationMatch[1].trim()];
      }

      return result;
   }

   /**
    * Basic text analysis for fallback extraction
    */
   private extractByTextAnalysis(rawResponse: string): Partial<StructuredAIResponse> {
      return {
         monthly_summary: this.extractMonthlySummary(rawResponse),
         weekly_breakdown: this.generateDefaultBreakdown()
      };
   }

   /**
    * Detect response format
    */
   private detectFormat(rawResponse: string): 'json' | 'text' | 'mixed' {
      const trimmed = rawResponse.trim();

      // Check if it starts with JSON
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
         try {
            JSON.parse(trimmed);
            return 'json';
         } catch {
            return 'mixed';
         }
      }

      // Check if it contains JSON structures
      if (trimmed.includes('"') && trimmed.includes(':')) {
         return 'mixed';
      }

      return 'text';
   }

   /**
    * Generate default weekly breakdown
    */
   private generateDefaultBreakdown(): WeeklyBreakdown[] {
      return [
         {
            week: 1,
            focus: 'Foundation and Planning',
            goals: ['Set up weekly structure', 'Establish core habits'],
            daily_tasks: {
               Monday: [{
                  task_description: 'Plan week objectives',
                  focus_area: 'Planning',
                  start_time: '09:00',
                  end_time: '10:00',
                  difficulty_level: 'simple',
                  scheduling_reason: 'Weekly planning session'
               }],
               Tuesday: [{
                  task_description: 'Focus on primary goals',
                  focus_area: 'Core Objectives',
                  start_time: '09:00',
                  end_time: '11:00',
                  difficulty_level: 'moderate',
                  scheduling_reason: 'Main goal work'
               }],
               Wednesday: [{
                  task_description: 'Progress review and adjustment',
                  focus_area: 'Review',
                  start_time: '09:00',
                  end_time: '10:00',
                  difficulty_level: 'simple',
                  scheduling_reason: 'Mid-week check-in'
               }],
               Thursday: [{
                  task_description: 'Continue core objectives',
                  focus_area: 'Core Objectives',
                  start_time: '09:00',
                  end_time: '11:00',
                  difficulty_level: 'moderate',
                  scheduling_reason: 'Goal progression'
               }],
               Friday: [{
                  task_description: 'Weekly completion and review',
                  focus_area: 'Review',
                  start_time: '09:00',
                  end_time: '10:00',
                  difficulty_level: 'simple',
                  scheduling_reason: 'End-of-week assessment'
               }],
               Saturday: [{
                  task_description: 'Rest and reflection',
                  focus_area: 'Personal',
                  start_time: '10:00',
                  end_time: '11:00',
                  difficulty_level: 'simple',
                  scheduling_reason: 'Weekend recovery'
               }],
               Sunday: [{
                  task_description: 'Plan next week',
                  focus_area: 'Planning',
                  start_time: '19:00',
                  end_time: '20:00',
                  difficulty_level: 'simple',
                  scheduling_reason: 'Weekly preparation'
               }]
            }
         }
      ];
   }

   /**
    * Calculate task date based on week number and day
    */
   private calculateTaskDate(weekNumber: number, day: string): string {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekStart = new Date(startOfMonth.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);

      const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day);
      const taskDate = new Date(weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000);

      return taskDate.toISOString().split('T')[0] || '';
   }

   /**
    * Calculate hours from start and end time
    */
   private calculateHours(startTime: string, endTime: string): number {
      const [startHour] = startTime.split(':').map(Number);
      const [endHour] = endTime.split(':').map(Number);
      return (endHour || 0) - (startHour || 0);
   }
}

// Export singleton instance
export const responseExtractor = new ResponseExtractor();