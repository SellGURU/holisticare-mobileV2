import Application from "@/api/app";
import QuestionnairePlayer from "@/components/questionnaire/QuestionnairePlayer";
import {
  BrandProgressBar,
  BrandWashCard,
  PAGE_SHELL,
  PageHeader,
  useBrandColors,
} from "@/components/layout/page-chrome";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTodayTasksQuery, useWeeklyTasksQuery } from "@/hooks/queries";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, CheckCircle, Target } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import TaskDetailSheet from "./plan/TaskDetailSheet";
import TaskGroupList from "./plan/TaskGroupList";
import {
  activityExercises,
  getTaskCompletionRate,
  isTaskCompleted,
  remainingByCategory,
  todayKey,
  type Task,
  type WeeklyTask,
} from "./plan/taskDisplay";

export default function Plan() {
  const { primary: brandColor } = useBrandColors();

  const [taskValues, setTaskValues] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("today");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeCheckin, setActiveCheckin] = useState<Task | null>(null);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const dateScrollRef = useRef<HTMLDivElement>(null);

  const handleUpdateTaskStatus = (
    taskId: string,
    status: boolean,
    value?: number
  ) => {
    setTodaysTasks((prev) =>
      prev.map((task) =>
        task.task_id === taskId
          ? { ...task, Status: status, Temp_value: value }
          : task
      )
    );
  };
  const handleUpdateExerciseTaskStatus = (
    exerciseId: string,
    status: boolean
  ) => {
    setTodaysTasks((prev) =>
      prev.map((task) =>
        task.Sections?.some((section) =>
          section.Exercises?.some((e) => e.task_id === exerciseId)
        )
          ? {
              ...task,
              Sections: task.Sections?.map((section) => ({
                ...section,
                Exercises: section.Exercises?.map((e) =>
                  e.task_id === exerciseId ? { ...e, Status: status } : e
                ),
              })),
            }
          : task
      )
    );
  };

  const handleUpdateWeeklyTaskStatus = (taskId: string, status: boolean) => {
    setWeeklyTasks((prev) =>
      prev.map((task) =>
        task.tasks.find((t) => t.task_id === taskId)
          ? {
              ...task,
              tasks: task.tasks.map((t) =>
                t.task_id === taskId ? { ...t, Status: status } : t
              ),
            }
          : task
      )
    );
  };
  const handleUpdateWeeklyExerciseTaskStatus = (
    taskId: string,
    status: boolean
  ) => {
    setWeeklyTasks((prev) =>
      prev.map((task) =>
        task.tasks?.some((t) =>
          t.Sections?.some((section) =>
            section.Exercises?.some((e) => e.task_id === taskId)
          )
        )
          ? {
              ...task,
              tasks: task.tasks.map((t) => ({
                ...t,
                Sections: t.Sections?.map((section) => ({
                  ...section,
                  Exercises: section.Exercises?.map((e) =>
                    e.task_id === taskId ? { ...e, Status: status } : e
                  ),
                })),
              })),
            }
          : task
      )
    );
  };

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const todayQuery = useTodayTasksQuery(activeTab === "today");
  const weeklyQuery = useWeeklyTasksQuery(activeTab === "calendar");
  const isLoading =
    activeTab === "today"
      ? todayQuery.isPending && todayQuery.data === undefined
      : weeklyQuery.isPending && weeklyQuery.data === undefined;

  useEffect(() => {
    if (!todayQuery.data) return;
    const tasks = todayQuery.data as Task[];
    setTodaysTasks(tasks);
    const initialValues: Record<string, number> = {};
    tasks.forEach((task: Task) => {
      initialValues[task.task_id] = task.Temp_value ?? 0;
    });
    setTaskValues((prev) => ({ ...initialValues, ...prev }));
  }, [todayQuery.data]);

  useEffect(() => {
    if (weeklyQuery.data) {
      setWeeklyTasks(weeklyQuery.data as WeeklyTask[]);
    }
  }, [weeklyQuery.data]);

  useEffect(() => {
    if (
      activeTab === "calendar" &&
      weeklyTasks.length > 0 &&
      dateScrollRef.current
    ) {
      const scrollContainer = dateScrollRef.current;
      const scrollWidth = scrollContainer.scrollWidth;
      const clientWidth = scrollContainer.clientWidth;
      const scrollTo = (scrollWidth - clientWidth) / 2;
      scrollContainer.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  }, [weeklyTasks, activeTab]);

  const visibleTasks =
    activeTab === "today"
      ? todaysTasks
      : weeklyTasks.find((day) => day.date === selectedDate)?.tasks ?? [];

  useEffect(() => {
    if (!selectedTask) return;
    const next = visibleTasks.find((task) => task.task_id === selectedTask.task_id);
    if (next) setSelectedTask(next);
  }, [visibleTasks, selectedTask?.task_id]);

  useEffect(() => {
    if (!activeCheckin) {
      document.body.removeAttribute("data-questionnaire");
      return;
    }
    document.body.setAttribute("data-questionnaire", "open");
    return () => {
      document.body.removeAttribute("data-questionnaire");
    };
  }, [activeCheckin]);

  const invalidatePlanTasks = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.todayTasks });
    void queryClient.invalidateQueries({ queryKey: queryKeys.weeklyTasks });
  };

  const handleCheckTask = (taskId: string) => {
    Application.checkTask({ task_id: taskId })
      .then(() => {
        toast({
          title: "Task Checked",
          description: "Your task has been checked.",
        });
        invalidatePlanTasks();
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res.response.data.detail,
          variant: "destructive",
        });
      });
  };
  const handleUncheckTask = (taskId: string) => {
    Application.uncheckTask({ task_id: taskId })
      .then(() => {
        toast({
          title: "Task Unchecked",
          description: "Your task has been unchecked.",
        });
        invalidatePlanTasks();
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res.response.data.detail,
          variant: "destructive",
        });
      });
  };

  const handleUpdateValue = (taskId: string, value: number) => {
    Application.updateValue({ task_id: taskId, temp_value: value })
      .then(() => {
        toast({
          title: "Value Updated",
          description: "Your value has been updated.",
        });
        invalidatePlanTasks();
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res.response.data.detail,
          variant: "destructive",
        });
      });
  };

  const getDateRange = () => {
    const today = new Date();
    const dates: { key: string; date: string; weekday: string }[] = [];
    weeklyTasks.forEach((task) => {
      const date = new Date(today);
      date.setDate(today.getDate() + parseInt(task.day));
      dates.push({
        key: task.date,
        date: task.date.split("-")[2],
        weekday: task.day,
      });
    });
    return dates;
  };

  const isToday = (dateKey: string) => dateKey === todayKey;

  const updateTaskValue = (taskId: string, value: number) => {
    setTaskValues((prev) => ({
      ...prev,
      [taskId]: Number(value),
    }));
  };

  const todayProgress = useMemo(() => {
    const total = todaysTasks.length;
    const completed = todaysTasks.filter((t) => isTaskCompleted(t)).length;
    return {
      total,
      completed,
      percent: total ? Math.round((completed / total) * 100) : 0,
      remaining: remainingByCategory(todaysTasks),
    };
  }, [todaysTasks]);

  const handleTaskAction = (task: Task, completed: boolean, isCurrentDay: boolean) => {
    if (!isCurrentDay) return;

    if (task.Category === "Activity") {
      const exerciseIds = activityExercises(task)
        .map((exercise) => exercise.task_id)
        .filter(Boolean);
      const ids = exerciseIds.length
        ? exerciseIds
        : task.task_id
          ? [task.task_id]
          : [];
      if (!ids.length) return;

      const nextStatus = !completed;
      ids.forEach((id) => {
        if (exerciseIds.includes(id)) {
          if (activeTab === "today") {
            handleUpdateExerciseTaskStatus(id, nextStatus);
          } else {
            handleUpdateWeeklyExerciseTaskStatus(id, nextStatus);
          }
        } else {
          handleUpdateTaskStatus(id, nextStatus);
          if (activeTab === "calendar") {
            handleUpdateWeeklyTaskStatus(id, nextStatus);
          }
        }
      });

      Promise.all(
        ids.map((id) =>
          nextStatus
            ? Application.checkTask({ task_id: id })
            : Application.uncheckTask({ task_id: id })
        )
      )
        .then(() => {
          toast({
            title: nextStatus ? "Task Checked" : "Task Unchecked",
            description: nextStatus
              ? "Your task has been checked."
              : "Your task has been unchecked.",
          });
          invalidatePlanTasks();
        })
        .catch((res) => {
          toast({
            title: "Error",
            description: res.response?.data?.detail || "Could not update the task.",
            variant: "destructive",
          });
        });
      return;
    }

    const currentValue = taskValues[task.task_id] ?? 0;
    const isLifestyle = task.Category === "Lifestyle";
    const valueMatchesTarget = currentValue === (task.Value ?? 0);

    const updateStatus = (id: string, status: boolean, value?: number) => {
      handleUpdateTaskStatus(id, status, value);
      if (activeTab === "calendar") {
        handleUpdateWeeklyTaskStatus(id, status);
      }
    };

    if (!isLifestyle) {
      updateStatus(task.task_id, !task.Status, currentValue);
      if (completed) handleUncheckTask(task.task_id);
      else handleCheckTask(task.task_id);
    } else {
      handleUpdateValue(task.task_id, currentValue);
      if (valueMatchesTarget) {
        const newCompleted = !completed;
        updateStatus(task.task_id, newCompleted, currentValue);
        if (newCompleted) handleCheckTask(task.task_id);
        else handleUncheckTask(task.task_id);
      } else {
        updateStatus(task.task_id, false, currentValue);
        if (completed) handleUncheckTask(task.task_id);
      }
    }
  };

  const selectedDayIsToday =
    activeTab === "today" ? true : isToday(selectedDate);

  const renderLoadingRows = (count: number) => (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-2xl bg-white/60 dark:bg-gray-800/40"
        />
      ))}
    </div>
  );

  return (
    <div className={PAGE_SHELL}>
      <div className="mx-auto w-full max-w-md px-4 py-4">
        <PageHeader
          icon={Target}
          eyebrow="Daily plan"
          title="Your Plan"
          subtitle={new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
          percent={activeTab === "today" ? todayProgress.percent : 0}
        />

        {activeTab === "today" && !isLoading && todaysTasks.length > 0 && (
          <BrandWashCard percent={todayProgress.percent} className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Today&apos;s progress
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {todayProgress.completed} of {todayProgress.total} done
                </p>
                {todayProgress.remaining && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {todayProgress.remaining}
                  </p>
                )}
              </div>
              <span className="text-2xl font-bold" style={{ color: brandColor }}>
                {todayProgress.percent}%
              </span>
            </div>
            <BrandProgressBar percent={todayProgress.percent} />
          </BrandWashCard>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-5 grid h-11 w-full grid-cols-2 rounded-xl bg-gray-100/80 p-1 dark:bg-gray-800/80">
            <TabsTrigger
              value="today"
              className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Today
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
            >
              <Calendar className="mr-1.5 h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-0">
            {isLoading ? (
              renderLoadingRows(4)
            ) : (
              <TaskGroupList
                tasks={todaysTasks}
                isCurrentDay
                emptyMessage="No tasks for today yet"
                onOpenTask={setSelectedTask}
                onCheckTask={(task, completed) =>
                  handleTaskAction(task, completed, true)
                }
                onStartCheckin={setActiveCheckin}
              />
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-0 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-20 animate-pulse rounded-2xl bg-white/60 dark:bg-gray-800/40" />
                {renderLoadingRows(2)}
              </div>
            ) : (
              <>
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Select a day
                  </p>
                  <div
                    ref={dateScrollRef}
                    className="flex gap-2 overflow-x-auto pb-1 touch-pan-x"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {getDateRange().map((dateInfo) => {
                      const isCurrentDay = isToday(dateInfo.key);
                      const isSelected = selectedDate === dateInfo.key;
                      const dayTasks =
                        weeklyTasks.find((t) => t.date === dateInfo.key)
                          ?.tasks || [];
                      const completionRate = getTaskCompletionRate(dayTasks);

                      return (
                        <button
                          key={dateInfo.key}
                          type="button"
                          onClick={() => setSelectedDate(dateInfo.key)}
                          className={`ui-press flex-shrink-0 rounded-2xl px-3 py-2.5 transition-all ${
                            isSelected
                              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md"
                              : isCurrentDay
                                ? "bg-emerald-50 ring-2 ring-emerald-400/50 dark:bg-emerald-900/20"
                                : "bg-white/90 dark:bg-gray-800/90"
                          } min-w-[4.5rem]`}
                        >
                          <div className="text-center">
                            <div
                              className={`text-lg font-bold ${
                                isSelected
                                  ? "text-white"
                                  : "text-gray-900 dark:text-gray-100"
                              }`}
                            >
                              {dateInfo.date}
                            </div>
                            <div
                              className={`text-[10px] font-medium ${
                                isSelected
                                  ? "text-blue-100"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {dateInfo.weekday}
                            </div>
                            {isCurrentDay && !isSelected && (
                              <div className="mt-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Today
                              </div>
                            )}
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                              <div
                                className={`h-full rounded-full ${
                                  isSelected ? "bg-white/80" : "bg-emerald-500"
                                }`}
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(() => {
                  const selectedDayTasks =
                    weeklyTasks.find((t) => t.date === selectedDate)?.tasks ||
                    [];
                  const completionRate = getTaskCompletionRate(selectedDayTasks);
                  const isCurrentDay = isToday(selectedDate);
                  const selectedDateObj = new Date(selectedDate + "T00:00:00");

                  return (
                    <>
                      <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-gray-800/80">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {selectedDateObj.toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            {isCurrentDay && (
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                Today — you can complete tasks
                              </span>
                            )}
                            {!isCurrentDay && (
                              <span className="text-xs text-gray-400">
                                View only
                              </span>
                            )}
                          </div>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {completionRate}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>

                      <TaskGroupList
                        tasks={selectedDayTasks}
                        isCurrentDay={isCurrentDay}
                        emptyMessage="No tasks for this date"
                        onOpenTask={setSelectedTask}
                        onCheckTask={(task, completed) =>
                          handleTaskAction(task, completed, isCurrentDay)
                        }
                        onStartCheckin={setActiveCheckin}
                      />
                    </>
                  );
                })()}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TaskDetailSheet
        task={selectedTask}
        isCurrentDay={selectedDayIsToday}
        taskValues={taskValues}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
        onTaskValueChange={updateTaskValue}
        onTaskAction={(task, completed) =>
          handleTaskAction(task, completed, selectedDayIsToday)
        }
        onStartCheckin={(task) => {
          setSelectedTask(null);
          setActiveCheckin(task);
        }}
      />

      {activeCheckin &&
        createPortal(
          <QuestionnairePlayer
            mode="checkin"
            uniqueId={activeCheckin.task_id}
            title={activeCheckin.Title}
            onClose={() => setActiveCheckin(null)}
            onSaved={() => {
              handleUpdateTaskStatus(activeCheckin.task_id, true);
              handleCheckTask(activeCheckin.task_id);
            }}
            onSubmitted={() => setActiveCheckin(null)}
          />,
          document.body
        )}
    </div>
  );
}
