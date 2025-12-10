import Application from "@/api/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Apple,
  Calendar,
  CheckCircle,
  Circle,
  ClipboardList,
  Dumbbell,
  Pill,
  Users,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

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

interface Task {
  Category: "Activity" | "Supplement" | "Lifestyle" | "Diet";
  Description: string;
  Instruction: string;
  Sections?: Section[];
  Task_Type: "Action" | "Checkin";
  Times: string[];
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
  useEffect(() => {
    todaysTasks.forEach((task) => {
      setTaskValues((prev) => ({
        ...prev,
        [task.task_id]: task.Temp_value || 0,
      }));
    });
  }, [todaysTasks]);

  const handleGetTodayTasks = async () => {
    setIsLoading(true);
    Application.getTodayTasks()
      .then((res) => {
        setTodaysTasks(res.data);
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
      // case "Test":
      //   return ClipboardList;
      default:
        return ClipboardList;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Diet":
        return "bg-green-500";
      case "Supplement":
        return "bg-blue-500";
      case "Lifestyle":
        return "bg-purple-500";
      case "Activity":
        return "bg-orange-500";
      case "Test":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
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
    setTaskValues({
      ...taskValues,
      [taskId]: Number(value),
    });
  };

  const renderTaskDetails = (task: Task, isCurrentDay: boolean) => {
    switch (task.Category) {
      case "Diet":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-justify">
              {task.Instruction}
            </p>
            {task.Total_macros && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded flex items-start justify-between">
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
                <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded flex items-start justify-between">
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
                <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded flex items-start justify-between">
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
          </div>
        );

      case "Supplement":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Dose:
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {task.Dose}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-justify">
              {task.Instruction}
            </p>
            {task.Description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {task.Description}
              </p>
            )}
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
                    onChange={(e) =>
                      updateTaskValue(
                        task.task_id,
                        parseInt(e.target.value) > (task?.Value || 0)
                          ? task?.Value || 0
                          : parseInt(e.target.value)
                      )
                    }
                    className="flex-1 h-9 text-xs placeholder:text-xs  placeholder:font-normal"
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
                    className="border border-orange-200 dark:border-orange-700/30 rounded-lg p-3"
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
                                onClick={() => {
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
                              onClick={() => {
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
                              className={`w-full ${
                                completed
                                  ? "bg-emerald-500 hover:bg-emerald-600 text-white opacity-50 cursor-not-allowed"
                                  : "hover:bg-green-50 dark:hover:bg-green-900/20"
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
          </div>
        );

      // case "Test":
      //   return ClipboardList;
      default:
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
            <Button
              variant={task.Status ? "default" : "outline"}
              size="sm"
              disabled={task.Status || !isCurrentDay}
              onClick={() => {
                handleUpdateTaskStatus(task.task_id, true);
                if (!task.Status) {
                  handleCheckTask(task.task_id);
                }
                const url = `https://holisticare-develop.vercel.app/checkin/${encodedMi}/${task.task_id}`;
                const newWindow = window.open(url, "_blank");
                if (newWindow) {
                  setOpenedWindow(newWindow);
                }
              }}
              className={`w-full !mt-4 !-mb-6 ${
                task.Status
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white opacity-50 cursor-not-allowed"
                  : "hover:bg-green-50 dark:hover:bg-green-900/20"
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

      // default:
      //   return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-thin bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Action Plans
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-light">
            Complete daily tasks and track your calendar
          </p>
        </div>

        {/* Tabs for Today vs Calendar */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Today's Tasks
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            {/* Today's Tasks Content */}
            <div className="space-y-4">
              {todaysTasks.map((task) => {
                const TaskIcon = getTaskIcon(task);
                const completed = task.Status;

                return (
                  <Card
                    key={task.task_id}
                    className="bg-gradient-to-br from-white/90 to-green-50/60 dark:from-gray-800/90 dark:to-green-900/20 border border-green-200/30 dark:border-green-700/20 shadow-lg backdrop-blur-sm"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            completed
                              ? "bg-emerald-500"
                              : getCategoryColor(task.Category)
                          }`}
                        >
                          <TaskIcon className="w-5 h-5 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="mb-3">
                            <h4
                              className={`text-sm font-medium ${
                                completed
                                  ? "text-gray-500 line-through"
                                  : "text-gray-800 dark:text-gray-200"
                              }`}
                            >
                              {task.Title}
                            </h4>
                            <Badge variant="outline" className="text-xs mt-1">
                              {task.Category || task.Task_Type}
                            </Badge>
                          </div>

                          {/* Task Details */}
                          <div className="mb-4">
                            {renderTaskDetails(task, true)}
                          </div>

                          {/* Task Action Button */}
                          {task.Category !== "Activity" &&
                            task.Task_Type !== "Checkin" && (
                              <Button
                                variant={completed ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (
                                    (task.Category === "Lifestyle" &&
                                      taskValues[task.task_id] ===
                                        task.Value) ||
                                    task.Category !== "Lifestyle"
                                  ) {
                                    handleUpdateTaskStatus(
                                      task.task_id,
                                      !task.Status,
                                      taskValues[task.task_id] || 0
                                    );
                                  } else if (
                                    task.Category === "Lifestyle" &&
                                    completed &&
                                    taskValues[task.task_id] !== task.Value
                                  ) {
                                    handleUpdateTaskStatus(
                                      task.task_id,
                                      !task.Status,
                                      taskValues[task.task_id] || 0
                                    );
                                  }
                                  if (task.Category === "Lifestyle") {
                                    handleUpdateValue(
                                      task.task_id,
                                      taskValues[task.task_id] || 0
                                    );
                                  }
                                  if (
                                    (task.Category === "Lifestyle" &&
                                      taskValues[task.task_id] ===
                                        task.Value) ||
                                    task.Category !== "Lifestyle"
                                  ) {
                                    if (completed) {
                                      handleUncheckTask(task.task_id);
                                    } else {
                                      handleCheckTask(task.task_id);
                                    }
                                  } else if (
                                    task.Category === "Lifestyle" &&
                                    completed &&
                                    taskValues[task.task_id] !== task.Value
                                  ) {
                                    handleUncheckTask(task.task_id);
                                  }
                                }}
                                className={`w-full ${
                                  completed
                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                    : "hover:bg-green-50 dark:hover:bg-green-900/20"
                                }`}
                              >
                                {completed ? (
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                ) : (
                                  <Circle className="w-4 h-4 mr-2" />
                                )}
                                {completed
                                  ? "Completed"
                                  : task.Category === "Lifestyle"
                                  ? "Save Value"
                                  : "Mark Complete"}
                              </Button>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {todaysTasks.length === 0 && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src="/icons/calendar-2.svg"
                    alt="No tasks"
                    className="w-[80px] mx-auto"
                  />
                  <div className="text-center text-gray-700 dark:text-gray-400">
                    No tasks for today yet
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            {/* Date Picker - Horizontal Row */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 text-center">
                Select a Date
              </h3>
              <div
                ref={dateScrollRef}
                className="flex gap-2 overflow-x-auto overflow-y-hidden pb-2 justify-start touch-pan-x cursor-grab select-none"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#E5E5E5 transparent",
                }}
              >
                {getDateRange().map((dateInfo) => {
                  const isCurrentDay = isToday(dateInfo.key);
                  const isSelected = selectedDate === dateInfo.key;
                  const dayTasks =
                    weeklyTasks.find((task) => task.date === dateInfo.key)
                      ?.tasks || [];
                  const completionRate = getTaskCompletionRate(dayTasks);

                  return (
                    <button
                      key={dateInfo.key}
                      onClick={() => setSelectedDate(dateInfo.key)}
                      className={`flex-shrink-0 p-3 rounded-2xl border-2 transition-all duration-200 min-w-[80px] ${
                        isSelected
                          ? isCurrentDay
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : isCurrentDay
                          ? "border-green-300 bg-green-50/50 dark:bg-green-900/10 hover:border-green-400"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${
                            isSelected
                              ? isCurrentDay
                                ? "text-green-700 dark:text-green-300"
                                : "text-blue-700 dark:text-blue-300"
                              : isCurrentDay
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {dateInfo.date}
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            isSelected
                              ? isCurrentDay
                                ? "text-green-600 dark:text-green-400"
                                : "text-blue-600 dark:text-blue-400"
                              : isCurrentDay
                              ? "text-green-500 dark:text-green-500"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {dateInfo.weekday}
                        </div>
                        {isCurrentDay && (
                          <div className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                            Today
                          </div>
                        )}
                        {/* Progress indicator */}
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${
                                completionRate === 100
                                  ? "bg-green-500"
                                  : completionRate > 50
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                              }`}
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Tasks */}
            <div className="space-y-4">
              {(() => {
                const selectedDayTasks =
                  weeklyTasks.find((task) => task.date === selectedDate)
                    ?.tasks || [];
                const completionRate = getTaskCompletionRate(selectedDayTasks);
                const isCurrentDay = isToday(selectedDate);
                const selectedDateObj = new Date(selectedDate + "T00:00:00");

                return (
                  <>
                    {/* Selected Day Header */}
                    <div className="mb-6">
                      <h4
                        className={`text-xl font-medium text-center mb-4 ${
                          isCurrentDay
                            ? "text-green-700 dark:text-green-300"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {selectedDateObj.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                        {isCurrentDay && (
                          <span className="ml-2 text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded">
                            Today
                          </span>
                        )}
                      </h4>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            completionRate === 100
                              ? "bg-green-500"
                              : completionRate > 50
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                          }`}
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Tasks for selected day */}
                    <div className="space-y-4">
                      {weeklyTasks
                        .find((task) => task.date === selectedDate)
                        ?.tasks.map((task) => {
                          const TaskIcon = getTaskIcon(task);
                          const completed = task.Status;

                          return (
                            <Card
                              key={task.task_id}
                              className="bg-gradient-to-br from-white/90 to-green-50/60 dark:from-gray-800/90 dark:to-green-900/20 border border-green-200/30 dark:border-green-700/20 shadow-lg backdrop-blur-sm"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                      completed
                                        ? "bg-emerald-500"
                                        : getCategoryColor(task.Category)
                                    }`}
                                  >
                                    <TaskIcon className="w-5 h-5 text-white" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="mb-3">
                                      <h4
                                        className={`text-sm font-medium ${
                                          completed
                                            ? "text-gray-500 line-through"
                                            : "text-gray-800 dark:text-gray-200"
                                        }`}
                                      >
                                        {task.Title}
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className="text-xs mt-1"
                                      >
                                        {task.Category || task.Task_Type}
                                      </Badge>
                                    </div>

                                    {/* Task Details */}
                                    <div className="mb-4">
                                      {renderTaskDetails(task, isCurrentDay)}
                                    </div>

                                    {/* Task Action Button */}
                                    {task.Category !== "Activity" &&
                                      task.Task_Type !== "Checkin" && (
                                        <Button
                                          variant={
                                            completed ? "default" : "outline"
                                          }
                                          size="sm"
                                          disabled={!isCurrentDay}
                                          onClick={() => {
                                            if (
                                              (task.Category === "Lifestyle" &&
                                                taskValues[task.task_id] ===
                                                  task.Value) ||
                                              task.Category !== "Lifestyle"
                                            ) {
                                              handleUpdateTaskStatus(
                                                task.task_id,
                                                !task.Status,
                                                taskValues[task.task_id] || 0
                                              );
                                            } else if (
                                              task.Category === "Lifestyle" &&
                                              completed &&
                                              taskValues[task.task_id] !==
                                                task.Value
                                            ) {
                                              handleUpdateTaskStatus(
                                                task.task_id,
                                                !task.Status,
                                                taskValues[task.task_id] || 0
                                              );
                                            }
                                            if (task.Category === "Lifestyle") {
                                              handleUpdateValue(
                                                task.task_id,
                                                taskValues[task.task_id] || 0
                                              );
                                            }
                                            if (
                                              (task.Category === "Lifestyle" &&
                                                taskValues[task.task_id] ===
                                                  task.Value) ||
                                              task.Category !== "Lifestyle"
                                            ) {
                                              if (completed) {
                                                handleUncheckTask(task.task_id);
                                              } else {
                                                handleCheckTask(task.task_id);
                                              }
                                            } else if (
                                              task.Category === "Lifestyle" &&
                                              completed &&
                                              taskValues[task.task_id] !==
                                                task.Value
                                            ) {
                                              handleUncheckTask(task.task_id);
                                            }
                                          }}
                                          className={`w-full ${
                                            completed
                                              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                              : "hover:bg-green-50 dark:hover:bg-green-900/20"
                                          }`}
                                        >
                                          {completed ? (
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                          ) : (
                                            <Circle className="w-4 h-4 mr-2" />
                                          )}
                                          {completed
                                            ? "Completed"
                                            : task.Category === "Lifestyle"
                                            ? "Save Value"
                                            : "Mark Complete"}
                                        </Button>
                                      )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      {selectedDayTasks.length === 0 && (
                        <div className="flex flex-col items-center gap-2">
                          <img
                            src="/icons/calendar-2.svg"
                            alt="No tasks"
                            className="w-[80px] mx-auto"
                          />
                          <div className="text-center text-gray-700 dark:text-gray-400">
                            No tasks for this date yet
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
