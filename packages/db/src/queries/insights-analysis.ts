import { upsertProductivityInsight } from "./productivity-insights";
import { getUserActivitiesForAnalysis } from "./user-activity";

export async function recalculateInsights(userId: string) {
  // 1. Query userActivityHistory for the last 3-6 months
  const activities = await getUserActivitiesForAnalysis(userId, 3);

  // 2. Run analysis functions
  const insights = analyzeActivityData(activities);

  // 3. Upsert new insights into userProductivityInsights
  const updatedInsights = [];

  // Insert Peak Energy Hours insight
  if (insights.peakEnergyHours) {
    const peakEnergyInsight = await upsertProductivityInsight(
      userId,
      'PeakEnergy',
      { peakHours: insights.peakEnergyHours }
    );
    updatedInsights.push(peakEnergyInsight);
  }

  // Insert Completion Rate insight
  if (insights.weeklyCompletionRate !== undefined) {
    const completionRateInsight = await upsertProductivityInsight(
      userId,
      'CompletionRate',
      { rate: insights.weeklyCompletionRate }
    );
    updatedInsights.push(completionRateInsight);
  }

  // Insert Session Duration insight
  if (insights.preferredTaskDuration) {
    const sessionDurationInsight = await upsertProductivityInsight(
      userId,
      'SessionDuration',
      { preferredMinutes: insights.preferredTaskDuration }
    );
    updatedInsights.push(sessionDurationInsight);
  }

  // Insert Challenges insight
  if (insights.challenges || insights.taskTypeSuccessRates) {
    const challengesInsight = await upsertProductivityInsight(
      userId,
      'Challenges',
      {
        challenges: insights.challenges || [],
        taskTypeSuccessRates: insights.taskTypeSuccessRates || {}
      }
    );
    updatedInsights.push(challengesInsight);
  }

  return updatedInsights;
}

function analyzeActivityData(activities: any[]) {
  if (activities.length === 0) {
    return {
      peakEnergyHours: '9:00-11:00',
      preferredTaskDuration: 60,
      weeklyCompletionRate: 0.85,
      taskTypeSuccessRates: {},
      productivityPatterns: {},
      challenges: []
    };
  }

  // Calculate 7-day rolling completion rate
  const completedTasks = activities.filter(a => a.durationDeviation !== null).length;
  const weeklyCompletionRate = activities.length > 0 ? completedTasks / activities.length : 0;

  // Identify peak energy hours based on completion times
  const hourlyCompletion = activities.reduce((acc: any, activity) => {
    const hour = new Date(activity.actualEndTime || activity.loggedAt).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const peakHour = Object.keys(hourlyCompletion).reduce((a, b) =>
    hourlyCompletion[parseInt(a)] > hourlyCompletion[parseInt(b)] ? a : b
  );

  // Calculate preferred task duration
  const durations = activities
    .filter(a => a.durationDeviation !== null && a.actualStartTime && a.actualEndTime)
    .map(a => {
      const actualDuration = new Date(a.actualEndTime).getTime() - new Date(a.actualStartTime).getTime();
      return actualDuration / (1000 * 60); // Convert to minutes
    });

  const preferredTaskDuration = durations.length > 0
    ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    : 60;

  // Identify challenges based on completion patterns
  const challenges = [];
  if (weeklyCompletionRate < 0.5) {
    challenges.push('Low completion rate - consider reducing task complexity or increasing time allocations');
  }
  if (preferredTaskDuration < 30) {
    challenges.push('Very short task durations - may indicate interruptions or context switching');
  }

  return {
    peakEnergyHours: `${peakHour}:00-${parseInt(peakHour) + 2}:00`,
    preferredTaskDuration,
    weeklyCompletionRate: Math.round(weeklyCompletionRate * 100) / 100,
    taskTypeSuccessRates: {},
    productivityPatterns: {},
    challenges
  };
}