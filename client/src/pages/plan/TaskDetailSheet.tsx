import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CheckCircle, Circle, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import ActivityMedia from "./ActivityMedia";
import {
  asStringList,
  clientNotes,
  collectActivityFiles,
  formatDayList,
  formatScheduleLine,
  getCategoryBadgeClass,
  getCategoryLabel,
  getLifestyleProgressPercent,
  getTaskGroupKey,
  isTaskCompleted,
  type Task,
} from "./taskDisplay";

function renderDetailSection(label: string, value?: ReactNode) {
  if (value == null || value === "") return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <div className="mt-1 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
        {value}
      </div>
    </div>
  );
}

interface TaskDetailSheetProps {
  task: Task | null;
  isCurrentDay: boolean;
  taskValues: Record<string, number>;
  onOpenChange: (open: boolean) => void;
  onTaskValueChange: (taskId: string, value: number) => void;
  onTaskAction: (task: Task, completed: boolean) => void;
  onStartCheckin: (task: Task) => void;
}

export default function TaskDetailSheet({
  task,
  isCurrentDay,
  taskValues,
  onOpenChange,
  onTaskValueChange,
  onTaskAction,
  onStartCheckin,
}: TaskDetailSheetProps) {
  const completed = task ? isTaskCompleted(task) : false;
  const notes = task ? clientNotes(task) : [];
  const fdaStatus = task?.FDA_Status || task?.fda_status;
  const categoryKey = task ? getTaskGroupKey(task) : "";
  const currentValue = task ? taskValues[task.task_id] || 0 : 0;
  const isCheckin = task?.Task_Type === "Checkin";
  const isLifestyle = task?.Category === "Lifestyle";
  const valueMatchesTarget =
    isLifestyle && currentValue === (task?.Value ?? 0);

  const footerLabel = () => {
    if (!task) return "";
    if (!isCurrentDay) return "View only";
    if (isCheckin) return completed ? "Completed" : "Start Check-in";
    if (isLifestyle) {
      if (completed) return "Completed";
      return valueMatchesTarget ? "Mark complete" : "Save value";
    }
    return completed ? "Completed" : "Mark complete";
  };

  const handleFooterClick = () => {
    if (!task || !isCurrentDay) return;
    if (isCheckin) {
      if (!completed) onStartCheckin(task);
      return;
    }
    onTaskAction(task, completed);
  };

  useEffect(() => {
    if (!task) {
      document.body.removeAttribute("data-task-sheet");
      return;
    }
    document.body.setAttribute("data-task-sheet", "open");
    return () => {
      document.body.removeAttribute("data-task-sheet");
    };
  }, [task]);

  return (
    <Sheet open={Boolean(task)} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[85dvh] w-full max-w-md flex-col gap-0 overflow-hidden rounded-t-3xl border-x-0 border-t border-gray-200/50 bg-white/95 p-0 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95 [&>button]:hidden"
      >
        {task && (
          <>
            <div className="flex flex-shrink-0 justify-center pb-1 pt-3">
              <span className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4 pt-1">
              <SheetHeader className="text-left">
                <div className="flex items-start justify-between gap-3">
                  <SheetTitle className="min-w-0 flex-1 text-base font-semibold leading-snug text-gray-900 dark:text-gray-100">
                    {task.Title}
                  </SheetTitle>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Close"
                      className="h-8 w-8 flex-shrink-0 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
                <SheetDescription asChild>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`border-0 px-2 py-0.5 text-[10px] font-medium ${getCategoryBadgeClass(categoryKey)}`}
                    >
                      {getCategoryLabel(categoryKey)}
                    </Badge>
                    {fdaStatus && (
                      <Badge
                        variant="outline"
                        className="border-0 bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                      >
                        {fdaStatus}
                      </Badge>
                    )}
                    {formatScheduleLine(task) && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatScheduleLine(task)}
                      </span>
                    )}
                    {asStringList(task.Times).length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {asStringList(task.Times).join(", ")}
                      </span>
                    )}
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-4">
                {renderDetailSection("How to do it", task.Instruction)}
                {renderDetailSection("Why this task", task.Based_On)}
                {renderDetailSection("About this task", task.Description)}
                {notes.length > 0 &&
                  renderDetailSection(
                    "Notes",
                    <div className="space-y-2">
                      {notes.map((note) => (
                        <p key={note}>{note}</p>
                      ))}
                    </div>
                  )}

                {task.Category === "Activity" && (
                  <>
                    <ActivityMedia files={collectActivityFiles(task)} />
                    {task.Sections?.map((section, index) => (
                      <div
                        key={`${section.Section}-${index}`}
                        className="rounded-xl border border-orange-200/60 bg-orange-50/30 p-3 dark:border-orange-700/30 dark:bg-orange-900/10"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <h5 className="font-medium text-orange-800 dark:text-orange-300">
                            {section.Section}
                          </h5>
                          <Badge variant="secondary" className="text-xs">
                            {section.Sets} sets
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {section.Exercises.map((exercise, exIndex) => (
                            <div
                              key={exercise.task_id || `${exercise.Title}-${exIndex}`}
                              className="space-y-1"
                            >
                              <div className="text-sm font-medium">
                                {exercise.Title}
                              </div>
                              {exercise.Description && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {exercise.Description}
                                </div>
                              )}
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="mr-3">
                                  Reps: {exercise.Reps || "-"}
                                </span>
                                <span className="mr-3">
                                  Rest: {exercise.Rest ? `${exercise.Rest}s` : "-"}
                                </span>
                                <span>Weight: {exercise.Weight || "-"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {task.Activity_Location &&
                      task.Activity_Location.length > 0 &&
                      renderDetailSection(
                        "Location",
                        task.Activity_Location.join(", ")
                      )}
                  </>
                )}

                {task.Category === "Diet" && task.Total_macros && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-start justify-between rounded-xl bg-orange-100 p-2.5 dark:bg-orange-900/20">
                      <div>
                        <div className="font-medium text-orange-800 dark:text-orange-300">
                          Carbs
                        </div>
                        <div className="text-orange-600 dark:text-orange-400">
                          {task.Total_macros.Carbs}g
                        </div>
                      </div>
                      <img src="/icons/carbs-preview.svg" alt="" className="h-6 w-6" />
                    </div>
                    <div className="flex items-start justify-between rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/20">
                      <div>
                        <div className="font-medium text-blue-800 dark:text-blue-300">
                          Protein
                        </div>
                        <div className="text-blue-600 dark:text-blue-400">
                          {task.Total_macros.Protein}g
                        </div>
                      </div>
                      <img
                        src="/icons/proteins-preview.svg"
                        alt=""
                        className="h-6 w-6"
                      />
                    </div>
                    <div className="flex items-start justify-between rounded-xl bg-green-100 p-2.5 dark:bg-green-900/20">
                      <div>
                        <div className="font-medium text-green-800 dark:text-green-300">
                          Fats
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                          {task.Total_macros.Fats}g
                        </div>
                      </div>
                      <img src="/icons/fats-preview.svg" alt="" className="h-6 w-6" />
                    </div>
                  </div>
                )}

                {task.Category === "Supplement" &&
                  renderDetailSection("Dose", task.Dose)}

                {task.Category === "Lifestyle" && task.Value != null && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        placeholder={`Enter ${task.Unit || "value"}`}
                        value={taskValues[task.task_id] || ""}
                        onChange={(event) =>
                          onTaskValueChange(
                            task.task_id,
                            parseInt(event.target.value) > (task.Value || 0)
                              ? task.Value || 0
                              : parseInt(event.target.value) || 0
                          )
                        }
                        className="h-11 flex-1 rounded-xl text-sm placeholder:text-sm"
                        disabled={completed || !isCurrentDay}
                      />
                      <span className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        Target: {task.Value} {task.Unit}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                        style={{
                          width: `${getLifestyleProgressPercent(task, currentValue)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {task.Category === "Medical Peptide Therapy" &&
                  task.Dose_Schedules &&
                  task.Dose_Schedules.length > 0 &&
                  renderDetailSection(
                    "Dose schedule",
                    <div className="space-y-2">
                      {task.Dose_Schedules.map((schedule, index) => {
                        const days = formatDayList(schedule.Frequency_Days);
                        const frequency = (schedule.Frequency_Type || "").trim();
                        return (
                          <div
                            key={`${schedule.Title || "dose"}-${index}`}
                            className="rounded-xl bg-teal-50/80 p-3 dark:bg-teal-900/20"
                          >
                            {schedule.Title && (
                              <p className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                                {schedule.Title}
                              </p>
                            )}
                            {schedule.Dose && (
                              <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-200">
                                {schedule.Dose}
                              </p>
                            )}
                            {(frequency || days) && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {[frequency, days].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                {isCheckin && (
                  <div className="flex items-center gap-4 text-sm">
                    {task.Questions_Count != null && (
                      <div>
                        <span className="font-medium text-pink-600 dark:text-pink-400">
                          Questions:{" "}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {task.Questions_Count}
                        </span>
                      </div>
                    )}
                    {task.Estimated_time && (
                      <div>
                        <span className="font-medium text-pink-600 dark:text-pink-400">
                          Time:{" "}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {task.Estimated_time}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-100/80 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] dark:border-gray-800/80">
              <Button
                variant={completed ? "default" : "outline"}
                disabled={!isCurrentDay || (isCheckin && completed)}
                onClick={handleFooterClick}
                className={`h-11 w-full rounded-xl text-sm font-medium ${
                  completed
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50"
                } ${!isCurrentDay ? "opacity-50" : ""}`}
              >
                {completed ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <Circle className="mr-2 h-4 w-4" />
                )}
                {footerLabel()}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
