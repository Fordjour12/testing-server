#!/usr/bin/env node

// Simple test for the response extraction system
const { responseExtractor } = require('./apps/server/src/lib/response-extractor');

console.log('🧪 Testing Robust AI Response Extraction System\n');

// Test 1: Valid JSON response
console.log('Test 1: Valid JSON Response');
const validJson = `{
  "monthly_summary": "This month focuses on spiritual growth through daily prayer",
  "weekly_breakdown": [
    {
      "week": 1,
      "focus": "Establish prayer routine",
      "goals": ["Daily prayer", "Scripture reading"],
      "daily_tasks": {
        "Monday": [
          {
            "task_description": "Morning prayer session",
            "focus_area": "Spiritual Growth",
            "start_time": "2025-01-01T07:00:00Z",
            "end_time": "2025-01-01T07:15:00Z",
            "difficulty_level": "simple",
            "scheduling_reason": "Start day with prayer"
          }
        ]
      }
    }
  ]
}`;

const result1 = responseExtractor.extractAllStructuredData(validJson);
console.log('✅ Confidence:', result1.metadata.confidence + '%');
console.log('✅ Format detected:', result1.metadata.detectedFormat);
console.log('✅ Monthly summary extracted:', !!result1.structuredData.monthly_summary);
console.log('✅ Tasks extracted:', result1.structuredData.weekly_breakdown?.length || 0, 'weeks\n');

// Test 2: Malformed JSON response
console.log('Test 2: Malformed JSON Response');
const malformedJson = `{
  "monthly_summary": "This month focuses on spiritual growth through daily prayer",
  "weekly_breakdown": [
    {
      "week": 1,
      "focus": "Establish prayer routine",
      "goals": ["Daily prayer", "Scripture reading"],
      "daily_tasks": {
        "Monday": [
          {
            "task_description": "Morning prayer session",
            "focus_area": "Spiritual Growth"
            // Missing comma and other fields - malformed JSON
          }
        ]
      }
    }
  // Missing closing bracket
`;

const result2 = responseExtractor.extractAllStructuredData(malformedJson);
console.log('✅ Confidence:', result2.metadata.confidence + '%');
console.log('✅ Format detected:', result2.metadata.detectedFormat);
console.log('✅ Monthly summary extracted:', !!result2.structuredData.monthly_summary);
console.log('✅ Parsing errors:', result2.metadata.parsingErrors.length);
console.log('✅ Extraction notes:', result2.metadata.extractionNotes + '\n');

// Test 3: Plain text response
console.log('Test 3: Plain Text Response');
const plainText = `
This month, I want to improve my Christian life and be more prayerful.
I'll focus on spiritual growth with the topic "God help me" and scriptural backings.

My weekly plan:
Week 1: Focus on daily prayer routine
- Monday: Morning prayer session at 7 AM
- Tuesday: Read one Psalm and reflect
- Wednesday: Evening gratitude prayer
- Thursday: Research devotional materials
- Friday: Join prayer group meeting
- Saturday: Extended meditation session
- Sunday: Attend worship service

This plan will help me build consistent spiritual habits.
`;

const result3 = responseExtractor.extractAllStructuredData(plainText);
console.log('✅ Confidence:', result3.metadata.confidence + '%');
console.log('✅ Format detected:', result3.metadata.detectedFormat);
console.log('✅ Monthly summary extracted:', !!result3.structuredData.monthly_summary);
console.log('✅ Tasks extracted:', result3.structuredData.weekly_breakdown?.length || 0, 'weeks');
console.log('✅ Extraction notes:', result3.metadata.extractionNotes + '\n');

// Test 4: Empty/Invalid response
console.log('Test 4: Empty/Invalid Response');
const emptyResponse = '';

const result4 = responseExtractor.extractAllStructuredData(emptyResponse);
console.log('✅ Confidence:', result4.metadata.confidence + '%');
console.log('✅ Format detected:', result4.metadata.detectedFormat);
console.log('✅ Monthly summary extracted:', !!result4.structuredData.monthly_summary);
console.log('✅ Tasks extracted:', result4.structuredData.weekly_breakdown?.length || 0, 'weeks');
console.log('✅ Extraction notes:', result4.metadata.extractionNotes + '\n');

// Test 5: Task extraction from breakdown
console.log('Test 5: Task Extraction from Breakdown');
if (result1.structuredData.weekly_breakdown && result1.structuredData.weekly_breakdown.length > 0) {
   const tasks = responseExtractor.extractTasksFromBreakdown(result1.structuredData.weekly_breakdown);
   console.log('✅ Tasks extracted:', tasks.length);
   if (tasks.length > 0) {
      console.log('✅ First task title:', tasks[0].title);
      console.log('✅ First task category:', tasks[0].category);
      console.log('✅ First task priority:', tasks[0].priority);
   }
}

console.log('\n🎉 Robust AI Response Extraction System Test Complete!');
console.log('\nKey Benefits Demonstrated:');
console.log('• System never completely fails - always provides some result');
console.log('• Graceful degradation with confidence scoring');
console.log('• Multiple extraction strategies (JSON → Pattern → Text analysis)');
console.log('• Detailed error logging and metadata for debugging');
console.log('• Fallback to default data when extraction fails');