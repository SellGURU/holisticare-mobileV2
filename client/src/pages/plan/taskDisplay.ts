import {
  Apple,
  ClipboardList,
  Dumbbell,
  Pill,
  Syringe,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface Filters {
  Type: string[];
  Level: string[];
  Terms: string[];
  Muscle: string[];
  Equipment: string[];
  Conditions: string[];
}

export interface Exercise {
  Base_Score: number;
  Description: string;
  Exercise_Filters: Filters;
  Exercise_Location: string[];
  Files: {
    Type: string;
    Title: string;
    Content: {
      url: string;
      file_id: string;
    };
  }[];
  Instruction: string;
  Reps: string;
  Rest: string;
  Status: boolean;
  Title: string;
  Updated_at: string;
  Weight: string;
  task_id: string;
}

export interface Section {
  Sets: number;
  Type: string;
  Section: string;
  Exercises: Exercise[];
}

export interface WeeklyTask {
  date: string;
  day: string;
  progress: number;
  tasks: Task[];
}

export interface DoseSchedule {
  Dose?: string;
  Title?: string;
  Frequency_Type?: string;
  Frequency_Days?: string[];
}

export interface Task {
  Category?:
    | "Activity"
    | "Supplement"
    | "Lifestyle"
    | "Diet"
    | "Medical Peptide Therapy"
    | string;
  Description?: string;
  Instruction?: string;
  Sections?: Section[];
  Task_Type: "Action" | "Checkin" | string;
  Times?: string[];
  Title: string;
  Estimated_time?: string;
  Questions_Count?: number;
  Status: boolean;
  Updated_at: string;
  task_id: string;
  Dose?: string;
  Temp_value?: number;
  Unit?: string;
  Value?: number;
  Total_macros?: { Fats: number; Carbs: number; Protein: number };
  Activity_Location?: string[];
  Activity_Filters?: Filters;
  Based_On?: string;
  Client_Notes?: string[];
  Frequency_Type?: string;
  Frequency_Dates?: string[];
  Repeat_Days?: string[];
  Dose_Schedules?: DoseSchedule[];
  FDA_Status?: string;
  fda_status?: string;
}

export interface FileData {
  Title: string;
  Type: string;
  base64Data?: string;
  Content: {
    url?: string;
    file_id?: string;
  };
}

export type ExerciseFileKind = "video" | "image" | "link" | "other";
export type TaskStatusFilter = "todo" | "done" | "all";

export const CATEGORY_ORDER = [
  "Activity",
  "Diet",
  "Supplement",
  "Lifestyle",
  "Medical Peptide Therapy",
  "Check-in",
] as const;

export const todayKey = new Date().toISOString().split("T")[0];

export function getFileKind(file?: {
  Type?: string;
  Title?: string;
}): ExerciseFileKind {
  const title = (file?.Title || "").toLowerCase();
  const type = (file?.Type || "").toLowerCase();
  if (title.includes("youtube") || type === "link") return "link";
  if (type.startsWith("video")) return "video";
  if (type.startsWith("image")) return "image";
  return "other";
}

export function hasExerciseFiles(
  files?: Exercise["Files"] | null
): files is Exercise["Files"] {
  return Array.isArray(files) && files.length > 0;
}

export function activityExercises(task: Task): Exercise[] {
  return (task.Sections ?? []).flatMap((section) => section.Exercises ?? []);
}

export function collectActivityFiles(task: Task): Exercise["Files"] {
  const files = activityExercises(task).flatMap(
    (exercise) => exercise.Files ?? []
  );
  const seen = new Set<string>();
  return files.filter((file) => {
    const key = file.Content?.file_id || file.Content?.url || file.Title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isTaskCompleted(task: Task): boolean {
  if (task.Category === "Activity") {
    const exercises = activityExercises(task);
    if (exercises.length > 0) {
      return exercises.every((exercise) => exercise.Status);
    }
  }
  return Boolean(task.Status);
}

export function asStringList(value?: string[] | string | null) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  const text = String(value).trim();
  return text ? [text] : [];
}

export function formatDayList(days?: string[]) {
  if (!days?.length) return "";
  return days
    .map((day) =>
      day.length <= 3
        ? day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
        : day
    )
    .join(", ");
}

export function formatScheduleLine(task: Task) {
  const frequency = (task.Frequency_Type || "").trim();
  const days = formatDayList(
    asStringList(task.Frequency_Dates).length
      ? asStringList(task.Frequency_Dates)
      : asStringList(task.Repeat_Days)
  );
  if (frequency && days) {
    return `${frequency.charAt(0).toUpperCase()}${frequency.slice(1)} · ${days}`;
  }
  if (frequency) {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  }
  return days;
}

export function clientNotes(task: Task) {
  return asStringList(task.Client_Notes);
}

export function getTaskGroupKey(task: Task) {
  if (task.Task_Type === "Checkin") return "Check-in";
  return task.Category || "Other";
}

export function getCategoryLabel(key?: string) {
  if (key === "Medical Peptide Therapy") return "Peptide";
  return key || "Other";
}

export function getTaskIcon(task: Task): LucideIcon {
  if (task.Task_Type === "Checkin") return ClipboardList;
  switch (task.Category) {
    case "Diet":
      return Apple;
    case "Supplement":
      return Pill;
    case "Lifestyle":
      return Users;
    case "Activity":
      return Dumbbell;
    case "Medical Peptide Therapy":
      return Syringe;
    default:
      return ClipboardList;
  }
}

export function getCategoryColor(category?: string) {
  switch (category) {
    case "Diet":
      return "bg-emerald-500";
    case "Supplement":
      return "bg-blue-500";
    case "Lifestyle":
      return "bg-purple-500";
    case "Activity":
      return "bg-orange-500";
    case "Test":
    case "Check-in":
      return "bg-pink-500";
    case "Medical Peptide Therapy":
      return "bg-teal-500";
    default:
      return "bg-gray-500";
  }
}

export function getCategoryBadgeClass(category?: string) {
  switch (category) {
    case "Diet":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "Supplement":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "Lifestyle":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    case "Activity":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "Test":
    case "Check-in":
      return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";
    case "Medical Peptide Therapy":
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  }
}

export function getOneLineMeta(task: Task) {
  const parts: string[] = [];
  const schedule = formatScheduleLine(task);
  if (schedule) parts.push(schedule);

  if (task.Task_Type === "Checkin") {
    if (task.Questions_Count) parts.push(`${task.Questions_Count} questions`);
    if (task.Estimated_time) parts.push(String(task.Estimated_time));
    return parts.join(" · ");
  }

  switch (task.Category) {
    case "Activity": {
      const exercises = activityExercises(task);
      const firstWithReps = exercises.find((exercise) => exercise.Reps);
      if (firstWithReps?.Reps) {
        parts.push(`${firstWithReps.Reps} reps`);
      } else if (exercises.length) {
        parts.push(
          `${exercises.length} exercise${exercises.length === 1 ? "" : "s"}`
        );
      }
      break;
    }
    case "Supplement":
      if (task.Dose) parts.push(task.Dose);
      break;
    case "Diet":
      if (task.Total_macros) {
        parts.push(
          `${task.Total_macros.Protein}g P · ${task.Total_macros.Carbs}g C · ${task.Total_macros.Fats}g F`
        );
      }
      break;
    case "Lifestyle":
      if (task.Value != null) {
        parts.push(`Target ${task.Value} ${task.Unit || ""}`.trim());
      }
      break;
    case "Medical Peptide Therapy": {
      const dose = task.Dose_Schedules?.[0]?.Dose || task.Dose;
      if (dose) parts.push(dose);
      break;
    }
    default:
      if (task.Dose) parts.push(task.Dose);
  }

  const times = asStringList(task.Times);
  if (times.length && !schedule) parts.push(times.join(", "));

  return parts.filter(Boolean).join(" · ");
}

function sortTodoFirst(tasks: Task[]) {
  return [...tasks].sort(
    (a, b) => Number(isTaskCompleted(a)) - Number(isTaskCompleted(b))
  );
}

export function filterTasksByStatus(tasks: Task[], filter: TaskStatusFilter) {
  if (filter === "todo") return tasks.filter((task) => !isTaskCompleted(task));
  if (filter === "done") return tasks.filter((task) => isTaskCompleted(task));
  return tasks;
}

export function groupTasks(tasks: Task[]) {
  const buckets = new Map<string, Task[]>();
  tasks.forEach((task) => {
    const key = getTaskGroupKey(task);
    const list = buckets.get(key) ?? [];
    list.push(task);
    buckets.set(key, list);
  });

  const known = CATEGORY_ORDER.filter((key) => buckets.has(key)).map((key) => ({
    key,
    label: getCategoryLabel(key),
    tasks: sortTodoFirst(buckets.get(key) ?? []),
  }));

  const extras = Array.from(buckets.keys())
    .filter(
      (key) => !CATEGORY_ORDER.includes(key as (typeof CATEGORY_ORDER)[number])
    )
    .map((key) => ({
      key,
      label: getCategoryLabel(key),
      tasks: sortTodoFirst(buckets.get(key) ?? []),
    }));

  return [...known, ...extras];
}

export function remainingByCategory(tasks: Task[]) {
  const remaining = tasks.filter((task) => !isTaskCompleted(task));
  if (!remaining.length) return "";

  const counts = new Map<string, number>();
  remaining.forEach((task) => {
    const label = getCategoryLabel(getTaskGroupKey(task));
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return `${Array.from(counts.entries())
    .map(([label, count]) => `${count} ${label}`)
    .join(" · ")} remaining`;
}

export function getLifestyleProgressPercent(
  task: Task,
  currentValue: number
) {
  if (task.Category === "Lifestyle" && task.Value) {
    return Math.min((currentValue / task.Value) * 100, 100);
  }
  return isTaskCompleted(task) ? 100 : 0;
}

export function getTaskCompletionRate(tasks: Task[]) {
  if (!tasks.length) return 0;
  const completed = tasks.filter((task) => isTaskCompleted(task)).length;
  return Math.round((completed / tasks.length) * 100);
}
