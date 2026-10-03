import { Calendar } from "lucide-react";
import { useMemo, useState } from "react";
import TaskRow from "./TaskRow";
import {
  filterTasksByStatus,
  groupTasks,
  isTaskCompleted,
  type Task,
  type TaskStatusFilter,
} from "./taskDisplay";

const FILTERS: { id: TaskStatusFilter; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "done", label: "Done" },
  { id: "all", label: "All" },
];

interface TaskGroupListProps {
  tasks: Task[];
  isCurrentDay: boolean;
  emptyMessage: string;
  onOpenTask: (task: Task) => void;
  onCheckTask: (task: Task, completed: boolean) => void;
  onStartCheckin: (task: Task) => void;
}

export default function TaskGroupList({
  tasks,
  isCurrentDay,
  emptyMessage,
  onOpenTask,
  onCheckTask,
  onStartCheckin,
}: TaskGroupListProps) {
  const [filter, setFilter] = useState<TaskStatusFilter>("todo");

  const filtered = useMemo(
    () => filterTasksByStatus(tasks, filter),
    [tasks, filter]
  );
  const groups = useMemo(() => groupTasks(filtered), [filtered]);

  const emptyCopy =
    tasks.length === 0
      ? emptyMessage
      : filter === "todo"
        ? "Nothing left to do"
        : filter === "done"
          ? "No completed tasks yet"
          : emptyMessage;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white/80 text-gray-600 dark:bg-gray-800/80 dark:text-gray-300"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-white/60 px-6 py-12 text-center dark:bg-gray-800/40">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
            <Calendar className="h-8 w-8 text-blue-500/70 dark:text-blue-400/70" />
          </span>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {emptyCopy}
          </p>
        </div>
      ) : (
        <div className="ui-stagger space-y-4">
          {groups.map((group) => (
            <section key={group.key}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.tasks.map((task, index) => (
                  <TaskRow
                    key={task.task_id || `${task.Title}-${index}`}
                    task={task}
                    isCurrentDay={isCurrentDay}
                    onOpen={() => onOpenTask(task)}
                    onCheck={() => onCheckTask(task, isTaskCompleted(task))}
                    onStartCheckin={() => onStartCheckin(task)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
