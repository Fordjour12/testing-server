import { db } from "../index";
import { eq } from "drizzle-orm";
import { planTasks } from "../schema";

export async function createPlanTask(data: {
  planId: number;
  taskDescription: string;
  focusArea: string;
  startTime: Date;
  endTime: Date;
  difficultyLevel: 'simple' | 'moderate' | 'advanced';
  schedulingReason: string;
  isCompleted?: boolean;
}) {
  const [newTask] = await db.insert(planTasks)
    .values(data)
    .returning();
  return newTask;
}

export async function createPlanTasks(tasks: Array<{
  planId: number;
  taskDescription: string;
  focusArea: string;
  startTime: Date;
  endTime: Date;
  difficultyLevel: 'simple' | 'moderate' | 'advanced';
  schedulingReason: string;
  isCompleted?: boolean;
}>) {
  return await db.insert(planTasks).values(tasks).returning();
}

export async function getTasksByPlanId(planId: number) {
  return await db
    .select()
    .from(planTasks)
    .where(eq(planTasks.planId, planId))
    .orderBy(planTasks.startTime);
}

export async function updateTaskStatus(
  taskId: number,
  isCompleted: boolean,
  completedAt?: Date | null
) {
  const [updatedTask] = await db
    .update(planTasks)
    .set({
      isCompleted,
      completedAt: isCompleted ? (completedAt || new Date()) : null
    })
    .where(eq(planTasks.id, taskId))
    .returning();
  return updatedTask;
}

export async function getTaskById(taskId: number) {
  const [task] = await db
    .select({
      id: planTasks.id,
      planId: planTasks.planId,
      taskDescription: planTasks.taskDescription,
      focusArea: planTasks.focusArea,
      startTime: planTasks.startTime,
      endTime: planTasks.endTime,
      difficultyLevel: planTasks.difficultyLevel,
      schedulingReason: planTasks.schedulingReason,
      isCompleted: planTasks.isCompleted,
      completedAt: planTasks.completedAt
    })
    .from(planTasks)
    .where(eq(planTasks.id, taskId))
    .limit(1);
  return task;
}

export async function getTaskWithUserId(taskId: number) {
  const { monthlyPlans } = await import("../schema/monthly-plans");

  const result = await db
    .select({
      taskId: planTasks.id,
      planId: planTasks.planId,
      taskDescription: planTasks.taskDescription,
      focusArea: planTasks.focusArea,
      startTime: planTasks.startTime,
      endTime: planTasks.endTime,
      difficultyLevel: planTasks.difficultyLevel,
      schedulingReason: planTasks.schedulingReason,
      isCompleted: planTasks.isCompleted,
      completedAt: planTasks.completedAt,
      userId: monthlyPlans.userId
    })
    .from(planTasks)
    .innerJoin(monthlyPlans, eq(planTasks.planId, monthlyPlans.id))
    .where(eq(planTasks.id, taskId))
    .limit(1);

  return result[0];
}