import { db } from "../index";
import { userActivityHistory } from "../schema";
import { getTaskWithUserId } from "./plan-tasks";

export async function logActivity(taskId: number) {
  try {
    // Get the task to log activity for
    const task = await getTaskWithUserId(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    // Insert record into userActivityHistory
    const [activity] = await db.insert(userActivityHistory).values({
      userId: task.userId,
      taskId: task.taskId,
      actualStartTime: task.startTime,
      actualEndTime: new Date(),
      durationDeviation: 0, // Calculate based on actual data
      wasCompleted: true
    }).returning();

    return activity;

  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}

export async function logActivityWithDetails(
  taskId: number,
  completionDetails: {
    actualDuration?: number;
    completedAt?: Date;
  }
) {
  try {
    const task = await getTaskWithUserId(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    // Calculate duration deviation (planned vs actual time)
    const plannedDuration = new Date(task.endTime).getTime() - new Date(task.startTime).getTime();
    const actualDuration = completionDetails.actualDuration || plannedDuration;
    const durationDeviation = actualDuration - plannedDuration;

    // Insert record into userActivityHistory
    const [activity] = await db.insert(userActivityHistory).values({
      userId: task.userId,
      taskId: task.taskId,
      actualStartTime: task.startTime,
      actualEndTime: completionDetails.completedAt || new Date(),
      durationDeviation,
      wasCompleted: true
    }).returning();

    return activity;

  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}