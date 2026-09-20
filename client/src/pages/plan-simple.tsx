import Application from "@/api/app";
import { resolveBaseUrl } from "@/api/base";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Apple,
  Calendar,
  CheckCircle,
  ChevronRight,
  Circle,
  ClipboardList,
  Dumbbell,
  Loader2,
  Pill,
  Syringe,
  Target,
  Users,
} from "lucide-react";
import { useEffect, useState, useRef, useMemo, type ReactNode } from "react";

interface Filters {
  Type: string[];
  Level: string[];
  Terms: string[];
  Muscle: string[];
  Equipment: string[];
  Conditions: string[];
}

interface Exercise {
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

interface Section {
  Sets: number;
  Type: string;
  Section: string;
  Exercises: Exercise[];
}

interface WeeklyTask {
  date: string;
  day: string;
  progress: number;
  tasks: Task[];
}

interface DoseSchedule {
  Dose?: string;
  Title?: string;
  Frequency_Type?: string;
  Frequency_Days?: string[];
}

interface Task {
  Category?: "Activity" | "Supplement" | "Lifestyle" | "Diet" | "Medical Peptide Therapy" | string;
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
interface FileData {
  Title: string;
  Type: string;
  base64Data?: string;
  // Optional until received from the API
  Content: {
    url?: string;
    file_id?: string;
  };
}

const todayKey = new Date().toISOString().split("T")[0];

export default function Plan() {
  const [taskValues, setTaskValues] = useState<Record<string, number>>({});
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("today");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loadingTaskDetails, setLoadingTaskDetails] = useState(false);
  const [selectData, setSelectData] = useState<Exercise | null>(null);
  const [videoData, setVideoData] = useState<FileData[]>([]);
  const [selectIndexTitle, setSelectIndexTitle] = useState<{
    id: string | null;
    title: string | null;
  }>({
    id: null,
    title: null,
  });
  const [encodedMi, setEncodedMi] = useState<string>("");
  const dateScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEncodedMi(localStorage.getItem("encoded_mi") || "");
  }, []);
  const getYouTubeEmbedUrl = (url: string) => {
    const standardOrShortsRegExp =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?/;

    const match = url.match(standardOrShortsRegExp);

    if (match && match[1]) {
      // For standard videos and shorts, use the /embed/ path
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };
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

  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
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

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const handleGetTodayTasks = async () => {
    setIsLoading(true);
    Application.getTodayTasks()
      .then((res) => {
        const tasks: Task[] = res.data;
        setTodaysTasks(tasks);
        const initialValues: Record<string, number> = {};
        tasks.forEach((task: Task) => {
          initialValues[task.task_id] = task.Temp_value ?? 0;
        });
        setTaskValues(initialValues);
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res.response.data.detail,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  const handleGetWeeklyTasks = async () => {
    setIsLoading(true);
    Application.getWeeklyTasks()
      .then((res) => {
        setWeeklyTasks(res.data);
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res.response.data.detail,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  useEffect(() => {
    if (activeTab === "calendar") {
      handleGetWeeklyTasks();
    } else {
      handleGetTodayTasks();
    }
  }, [activeTab]);

  // Scroll to center when weekly tasks are loaded
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

  const handleCheckTask = (taskId: string) => {
    Application.checkTask({ task_id: taskId })
      .then(() => {
        toast({
          title: "Task Checked",
          description: "Your task has been checked.",
        });
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
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res.response.data.detail,
          variant: "destructive",
        });
      });
  };
  useEffect(() => {
    const encoded_mi = localStorage.getItem("encoded_mi");
    const fetchVideos = async () => {
      setIsLoading(true);
      const videoFiles = selectData?.Files?.filter(
        (file: any) =>
          file.Type?.split("/")[0] === "video" ||
          file.Type === "link" ||
          file.Type?.split("/")[0] === "image"
      );

      const videoPromises = videoFiles?.map((file: any) => {
        if (
          file.Type?.split("/")[0] === "video" ||
          file.Type?.split("/")[0] === "image"
        ) {
          return Application.showExerciseFile({
            file_id: file.Content.file_id,
            encoded_mi: encoded_mi || "",
          }).then((res) => ({
            Title: res.data.file_name,
            Type: res.data.file_type,
            Content: {
              file_id: file.Content.file_id,
              url: res.data.base_64_data,
            },
          }));
        } else if (file.Type === "link") {
          return Promise.resolve({
            Content: {
              file_id: file.Content.file_id,
              url: file.Content.url,
            },
            Title: file.Title,
            Type: "link",
          });
        }
      });

      const videos = await Promise.all(videoPromises as Promise<FileData>[]);
      setVideoData(videos as FileData[]);
      setIsLoading(false);
    };

    if (selectIndexTitle.id && selectData) {
      fetchVideos();
    }
  }, [selectIndexTitle.id, selectData]);

  const [openedWindow, setOpenedWindow] = useState<Window | null>(null);

  useEffect(() => {
    if (!openedWindow) return;

    const checkWindowClosed = setInterval(() => {
      if (openedWindow.closed) {
        if (activeTab === "today") {
          handleGetTodayTasks();
        } else {
          handleGetWeeklyTasks();
        }
        setOpenedWindow(null);
        clearInterval(checkWindowClosed);
      }
    }, 1000);

    return () => clearInterval(checkWindowClosed);
  }, [openedWindow]);

  const formatDateKey = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
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

  const isToday = (dateKey: string) => {
    return dateKey === todayKey;
  };

  const getTaskCompletionRate = (tasks: any[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((task) => task.Status).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const asStringList = (value?: string[] | string | null) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    const text = String(value).trim();
    return text ? [text] : [];
  };

  const formatDayList = (days?: string[]) => {
    if (!days?.length) return "";
    return days
      .map((day) =>
        day.length <= 3
          ? day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
          : day
      )
      .join(", ");
  };

  const formatScheduleLine = (task: Task) => {
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
  };

  const clientNotes = (task: Task) => asStringList(task.Client_Notes);

  const openTaskDetails = async (task: Task) => {
    setSelectedTask(task);
    if (!task.task_id || !encodedMi) return;
    setLoadingTaskDetails(true);
    try {
      const res = await Application.getTaskDetails({
        encoded_mi: encodedMi,
        task_id: task.task_id,
      });
      if (res?.data) {
        setSelectedTask((current) =>
          current?.task_id === task.task_id ? { ...current, ...res.data } : current
        );
      }
    } catch {
      // Keep the list payload if the details call fails.
    } finally {
      setLoadingTaskDetails(false);
    }
  };

  const renderTaskMeta = (task: Task) => {
    const times = asStringList(task.Times);
    const schedule = formatScheduleLine(task);
    if (!times.length && !schedule) return null;

    return (
      <div className="space-y-1.5">
        {times.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {times.map((time) => (
              <Badge
                key={time}
                variant="outline"
                className="border-0 bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {time}
              </Badge>
            ))}
          </div>
        )}
        {schedule && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{schedule}</p>
        )}
      </div>
    );
  };

  const renderDetailSection = (label: string, value?: ReactNode) => {
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
  };

  const getTaskIcon = (task: Task) => {
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
  };

  const getCategoryColor = (category?: string) => {
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
        return "bg-pink-500";
      case "Medical Peptide Therapy":
        return "bg-teal-500";
      default:
        return "bg-gray-500";
    }
  };

  const getCategoryBadgeClass = (category?: string) => {
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
        return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";
      case "Medical Peptide Therapy":
        return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const getProgressPercent = (task: Task) => {
    if (task.Category === "Lifestyle" && task.Value) {
      const current = taskValues[task.task_id] || 0;
      return Math.min((current / task.Value) * 100, 100);
    }
    return task.Status ? 100 : 0;
  };

  const updateTaskValue = (taskId: string, value: number) => {
    setTaskValues((prev) => ({
      ...prev,
      [taskId]: Number(value),
    }));
  };

  const renderTaskDetails = (task: Task, isCurrentDay: boolean) => {
    if (task.Task_Type === "Checkin") {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            {task.Questions_Count && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-pink-600 dark:text-pink-400">
                  Questions:
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {task.Questions_Count}
                </span>
              </div>
            )}
            {task.Estimated_time && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-pink-600 dark:text-pink-400">
                  Time:
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {task.Estimated_time}
                </span>
              </div>
            )}
          </div>
          {renderTaskMeta(task)}
          <Button
            variant={task.Status ? "default" : "outline"}
            size="sm"
            disabled={task.Status || !isCurrentDay}
            onClick={(event) => {
              event.stopPropagation();
              handleUpdateTaskStatus(task.task_id, true);
              if (!task.Status) {
                handleCheckTask(task.task_id);
              }
              const url = `${resolveBaseUrl()}/checkin/${encodedMi}/${task.task_id}`;
              const newWindow = window.open(url, "_blank");
              if (newWindow) {
                setOpenedWindow(newWindow);
              }
            }}
            className={`h-11 w-full rounded-xl text-sm font-medium !mt-4 !-mb-6 ${
              task.Status
                ? "bg-emerald-500 text-white opacity-50"
                : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            }`}
          >
            {task.Status ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Circle className="w-4 h-4 mr-2" />
            )}
            {task.Status ? "Completed" : "Start Check-in"}
          </Button>
        </div>
      );
    }

    switch (task.Category) {
      case "Diet":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-justify">
              {task.Instruction}
            </p>
            {task.Total_macros && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-orange-100 dark:bg-orange-900/20 p-2.5 rounded-xl flex items-start justify-between">
                  <div>
                    <div className="font-medium text-orange-800 dark:text-orange-300">
                      Carbs
                    </div>
                    <div className="text-orange-600 dark:text-orange-400">
                      {task.Total_macros.Carbs}g
                    </div>
                  </div>
                  <img
                    src="/icons/carbs-preview.svg"
                    alt=""
                    className="w-6 h-6"
                  />
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/20 p-2.5 rounded-xl flex items-start justify-between">
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
                    className="w-6 h-6"
                  />
                </div>
                <div className="bg-green-100 dark:bg-green-900/20 p-2.5 rounded-xl flex items-start justify-between">
                  <div>
                    <div className="font-medium text-green-800 dark:text-green-300">
                      Fats
                    </div>
                    <div className="text-green-600 dark:text-green-400">
                      {task.Total_macros.Fats}g
                    </div>
                  </div>
                  <img
                    src="/icons/fats-preview.svg"
                    alt=""
                    className="w-6 h-6"
                  />
                </div>
              </div>
            )}
            {task.Description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {task.Description}
              </p>
            )}
            {renderTaskMeta(task)}
          </div>
        );

      case "Supplement":
        return (
          <div className="space-y-2">
            {task.Dose && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  Dose:
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {task.Dose}
                </span>
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 text-justify">
              {task.Instruction}
            </p>
            {task.Description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {task.Description}
              </p>
            )}
            {renderTaskMeta(task)}
          </div>
        );

      case "Lifestyle":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-justify">
              {task.Instruction}
            </p>
            {task.Value && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    placeholder={`Enter ${task.Unit || "value"}`}
                    value={taskValues[task.task_id] || ""}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(e) =>
                      updateTaskValue(
                        task.task_id,
                        parseInt(e.target.value) > (task?.Value || 0)
                          ? task?.Value || 0
                          : parseInt(e.target.value)
                      )
                    }
                    className="h-11 flex-1 rounded-xl text-sm placeholder:text-sm"
                    disabled={task.Status}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    Target: {task.Value} {task.Unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercent(task)}%` }}
                  />
                </div>
              </div>
            )}
            {task.Description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {task.Description}
              </p>
            )}
            {renderTaskMeta(task)}
          </div>
        );

      case "Activity":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-justify">
              {task.Instruction}
            </p>
            {task.Sections
              ? task.Sections.map((section: Section, index: number) => (
                  <div
                    key={index}
                    className="border border-orange-200/60 dark:border-orange-700/30 rounded-xl p-3 bg-orange-50/30 dark:bg-orange-900/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-orange-800 dark:text-orange-300">
                        {section.Section}
                      </h5>
                      <Badge variant="secondary" className="text-xs">
                        {section.Sets} sets
                      </Badge>
                    </div>
                    {section.Exercises.map(
                      (exercise: Exercise, exIndex: number) => {
                        const completed = exercise.Status;
                        return (
                          <div key={exIndex} className="ml-2 space-y-1">
                            <div className="font-medium text-sm">
                              {exercise.Title}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {exercise.Description}
                            </div>
                            <div className="text-xs">
                              <span className="mr-3">
                                Reps: {exercise.Reps || "-"}
                              </span>

                              <span className="mr-3">
                                Rest:{" "}
                                {exercise.Rest ? exercise.Rest + "s" : "-"}
                              </span>

                              <span>Weight: {exercise.Weight || "-"}</span>
                            </div>
                            {exercise.Files && exercise.Files.length > 0 && (
                              <div
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (
                                    selectIndexTitle.id === exercise.task_id
                                  ) {
                                    setSelectIndexTitle({
                                      id: null,
                                      title: null,
                                    });
                                    setSelectData(null);
                                    setVideoData([]);
                                  } else {
                                    setSelectIndexTitle({
                                      id: exercise.task_id,
                                      title: exercise.Title,
                                    });
                                    setSelectData(exercise);
                                  }
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:underline text-xs cursor-pointer"
                              >
                                View Files
                              </div>
                            )}
                            {exercise.Files &&
                              exercise.Files.length > 0 &&
                              selectData &&
                              selectIndexTitle.id === exercise.task_id && (
                                <div className="space-y-2">
                                  {videoData.map((file, fileIndex: number) => {
                                    return (
                                      <div
                                        key={fileIndex}
                                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-800/50"
                                      >
                                        {file.Title && (
                                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {file.Title}
                                          </div>
                                        )}

                                        {videoData?.[0]?.Type?.split("/")[0] ===
                                        "video" ? (
                                          <video
                                            className="w-full h-48 rounded-md object-cover"
                                            controls
                                            preload="metadata"
                                          >
                                            <source
                                              src={file.Content.url}
                                              type="video/mp4"
                                            />
                                            Your browser does not support the
                                            video tag.
                                          </video>
                                        ) : videoData?.[0]?.Type?.split(
                                            "/"
                                          )[0] === "image" ? (
                                          <img
                                            src={file.Content.url}
                                            alt={file.Title || exercise.Title}
                                            className="w-full h-48 rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => {
                                              const url = file.Content.url;
                                              const newWindow = window.open(
                                                url,
                                                "_blank"
                                              );
                                              if (newWindow) {
                                                setOpenedWindow(newWindow);
                                              }
                                            }}
                                          />
                                        ) : (
                                          <div className="relative w-full h-48 rounded-md overflow-hidden">
                                            <iframe
                                              src={getYouTubeEmbedUrl(
                                                file.Content.url || ""
                                              )}
                                              key={file.Content.file_id}
                                              className="absolute inset-0 w-full h-full"
                                              frameBorder="0"
                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                              allowFullScreen
                                              title={
                                                file.Title || exercise.Title
                                              }
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            <Button
                              variant={completed ? "default" : "outline"}
                              size="sm"
                              disabled={!isCurrentDay}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (isCurrentDay) {
                                  if (activeTab === "today") {
                                    handleUpdateExerciseTaskStatus(
                                      exercise.task_id,
                                      !exercise.Status
                                    );
                                  } else {
                                    handleUpdateWeeklyExerciseTaskStatus(
                                      exercise.task_id,
                                      !exercise.Status
                                    );
                                  }
                                  if (completed) {
                                    handleUncheckTask(exercise.task_id);
                                  } else {
                                    handleCheckTask(exercise.task_id);
                                  }
                                }
                              }}
                              className={`h-11 w-full rounded-xl text-sm font-medium ${
                                completed
                                  ? "bg-emerald-500 text-white opacity-50"
                                  : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              }`}
                              style={{ marginBottom: "5px" }}
                            >
                              {completed ? (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              ) : (
                                <Circle className="w-4 h-4 mr-2" />
                              )}
                              {completed ? "Completed" : "Mark Complete"}
                            </Button>
                          </div>
                        );
                      }
                    )}
                  </div>
                ))
              : ""}
            {task.Activity_Location && (
              <div className="flex gap-1">
                {task.Activity_Location.map(
                  (location: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {location}
                    </Badge>
                  )
                )}
              </div>
            )}
            {task.Description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {task.Description}
              </p>
            )}
            {renderTaskMeta(task)}
          </div>
        );

      case "Medical Peptide Therapy":
        return (
          <div className="space-y-3">
            {(task.FDA_Status || task.fda_status) && (
              <Badge
                variant="outline"
                className="border-0 bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
              >
                {task.FDA_Status || task.fda_status}
              </Badge>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 text-justify">
              {task.Instruction}
            </p>
            {task.Dose_Schedules && task.Dose_Schedules.length > 0 && (
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
            {task.Description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {task.Description}
              </p>
            )}
            {renderTaskMeta(task)}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            {task.Instruction && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-justify">
                {task.Instruction}
              </p>
            )}
            {task.Description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {task.Description}
              </p>
            )}
            {renderTaskMeta(task)}
          </div>
        );
    }
  };

  const todayProgress = useMemo(() => {
    const total = todaysTasks.length;
    const completed = todaysTasks.filter((t) => t.Status).length;
    return {
      total,
      completed,
      percent: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [todaysTasks]);

  const handleTaskAction = (task: Task, completed: boolean, isCurrentDay: boolean) => {
    if (!isCurrentDay) return;

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

  const renderTaskCard = (task: Task, isCurrentDay: boolean) => {
    const TaskIcon = getTaskIcon(task);
    const completed = task.Status;

    return (
      <Card
        key={task.task_id}
        role="button"
        tabIndex={0}
        onClick={() => openTaskDetails(task)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openTaskDetails(task);
          }
        }}
        className={`cursor-pointer overflow-hidden rounded-2xl border-0 shadow-md transition-all ${
          completed
            ? "bg-white/70 dark:bg-gray-800/60"
            : "bg-white/95 dark:bg-gray-800/95"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${
                completed ? "bg-emerald-500" : getCategoryColor(task.Category)
              }`}
            >
              <TaskIcon className="h-5 w-5 text-white" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4
                    className={`text-sm font-semibold leading-snug ${
                      completed
                        ? "text-gray-400 line-through"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {task.Title}
                  </h4>
                  <Badge
                    variant="outline"
                    className={`mt-1.5 border-0 px-2 py-0.5 text-[10px] font-medium ${getCategoryBadgeClass(task.Category)}`}
                  >
                    {task.Category || task.Task_Type}
                  </Badge>
                </div>
                {completed ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                )}
              </div>

              <div className="mb-4">{renderTaskDetails(task, isCurrentDay)}</div>

              {task.Category !== "Activity" && task.Task_Type !== "Checkin" && (
                <Button
                  variant={completed ? "default" : "outline"}
                  disabled={!isCurrentDay}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTaskAction(task, completed, isCurrentDay);
                  }}
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
                  {completed
                    ? "Completed"
                    : task.Category === "Lifestyle"
                      ? "Save value"
                      : "Mark complete"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center rounded-2xl bg-white/60 px-6 py-12 text-center dark:bg-gray-800/40">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
        <Calendar className="h-8 w-8 text-blue-500/70 dark:text-blue-400/70" />
      </span>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {message}
      </p>
    </div>
  );

  const notes = selectedTask ? clientNotes(selectedTask) : [];
  const fdaStatus = selectedTask?.FDA_Status || selectedTask?.fda_status;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 pb-8 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900/20">
      <div className="mx-auto w-full max-w-md px-4 py-4">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
            <Target className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Your Plan
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Daily tasks & weekly calendar
            </p>
          </div>
        </div>

        {/* Today progress summary */}
        {activeTab === "today" && !isLoading && todaysTasks.length > 0 && (
          <Card className="mb-5 rounded-2xl border-0 bg-white/80 shadow-md dark:bg-gray-800/80">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Today&apos;s progress
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {todayProgress.completed} of {todayProgress.total} done
                  </p>
                </div>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {todayProgress.percent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${todayProgress.percent}%` }}
                />
              </div>
            </CardContent>
          </Card>
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

          <TabsContent value="today" className="mt-0 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-2xl bg-white/60 dark:bg-gray-800/40"
                  />
                ))}
              </div>
            ) : todaysTasks.length > 0 ? (
              todaysTasks.map((task) => renderTaskCard(task, true))
            ) : (
              renderEmptyState("No tasks for today yet")
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-0 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-20 animate-pulse rounded-2xl bg-white/60 dark:bg-gray-800/40" />
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-2xl bg-white/60 dark:bg-gray-800/40"
                  />
                ))}
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
                          className={`flex-shrink-0 rounded-2xl px-3 py-2.5 transition-all ${
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
                  const completionRate =
                    getTaskCompletionRate(selectedDayTasks);
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

                      <div className="space-y-3">
                        {selectedDayTasks.length > 0
                          ? selectedDayTasks.map((task) =>
                              renderTaskCard(task, isCurrentDay)
                            )
                          : renderEmptyState("No tasks for this date")}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Sheet
        open={Boolean(selectedTask)}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-3xl px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4"
        >
          {selectedTask && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="pr-8 text-base leading-snug">
                  {selectedTask.Title}
                </SheetTitle>
                <SheetDescription asChild>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`border-0 px-2 py-0.5 text-[10px] font-medium ${getCategoryBadgeClass(selectedTask.Category)}`}
                    >
                      {selectedTask.Category || selectedTask.Task_Type}
                    </Badge>
                    {fdaStatus && (
                      <Badge
                        variant="outline"
                        className="border-0 bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                      >
                        {fdaStatus}
                      </Badge>
                    )}
                  </div>
                </SheetDescription>
              </SheetHeader>

              {loadingTaskDetails && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading details
                </div>
              )}

              <div className="mt-5 space-y-4">
                {renderDetailSection("How to do it", selectedTask.Instruction)}
                {renderDetailSection("About this task", selectedTask.Description)}
                {selectedTask.Total_macros &&
                  renderDetailSection(
                    "Macros",
                    `${selectedTask.Total_macros.Carbs}g carbs · ${selectedTask.Total_macros.Protein}g protein · ${selectedTask.Total_macros.Fats}g fats`
                  )}
                {renderDetailSection("Dose", selectedTask.Dose)}
                {selectedTask.Value != null &&
                  renderDetailSection(
                    "Target",
                    `${selectedTask.Value} ${selectedTask.Unit || ""}`.trim()
                  )}
                {renderDetailSection("Schedule", formatScheduleLine(selectedTask))}
                {asStringList(selectedTask.Times).length > 0 &&
                  renderDetailSection(
                    "Time of day",
                    asStringList(selectedTask.Times).join(", ")
                  )}
                {renderDetailSection("Why this task", selectedTask.Based_On)}
                {notes.length > 0 &&
                  renderDetailSection(
                    "Notes",
                    <div className="space-y-2">
                      {notes.map((note) => (
                        <p key={note}>{note}</p>
                      ))}
                    </div>
                  )}
                {selectedTask.Dose_Schedules &&
                  selectedTask.Dose_Schedules.length > 0 &&
                  renderDetailSection(
                    "Dose schedule",
                    <div className="space-y-2">
                      {selectedTask.Dose_Schedules.map((schedule, index) => (
                        <div
                          key={`${schedule.Title || "dose"}-${index}`}
                          className="rounded-xl bg-teal-50 p-3 dark:bg-teal-900/20"
                        >
                          {schedule.Title && (
                            <p className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                              {schedule.Title}
                            </p>
                          )}
                          {schedule.Dose && <p>{schedule.Dose}</p>}
                          <p className="text-xs text-gray-500">
                            {[
                              schedule.Frequency_Type,
                              formatDayList(schedule.Frequency_Days),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                {selectedTask.Activity_Location &&
                  selectedTask.Activity_Location.length > 0 &&
                  renderDetailSection(
                    "Location",
                    selectedTask.Activity_Location.join(", ")
                  )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
