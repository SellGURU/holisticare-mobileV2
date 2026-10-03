import { CheckCircle, Circle } from "lucide-react";
import {
  getCategoryColor,
  getOneLineMeta,
  getTaskGroupKey,
  getTaskIcon,
  isTaskCompleted,
  type Task,
} from "./taskDisplay";

interface TaskRowProps {
  task: Task;
  isCurrentDay: boolean;
  onOpen: () => void;
  onCheck: () => void;
  onStartCheckin?: () => void;
}

export default function TaskRow({
  task,
  isCurrentDay,
  onOpen,
  onCheck,
  onStartCheckin,
}: TaskRowProps) {
  const completed = isTaskCompleted(task);
  const TaskIcon = getTaskIcon(task);
  const meta = getOneLineMeta(task);
  const isCheckin = task.Task_Type === "Checkin";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={`ui-press flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 shadow-sm transition-all ${
        completed
          ? "bg-white/60 dark:bg-gray-800/50"
          : "bg-white/95 dark:bg-gray-800/95"
      }`}
    >
      <span
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${
          completed ? "bg-emerald-500" : getCategoryColor(getTaskGroupKey(task))
        }`}
      >
        <TaskIcon className="h-5 w-5 text-white" />
      </span>

      <div className="min-w-0 flex-1 text-left">
        <h4
          className={`truncate text-sm font-semibold leading-snug ${
            completed
              ? "text-gray-400 line-through"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {task.Title}
        </h4>
        {meta && (
          <p
            className={`mt-0.5 truncate text-xs ${
              completed
                ? "text-gray-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {meta}
          </p>
        )}
      </div>

      {isCheckin ? (
        isCurrentDay && !completed && onStartCheckin ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onStartCheckin();
            }}
            className="q-press flex-shrink-0 rounded-full bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
          >
            Start
          </button>
        ) : completed ? (
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-500" />
        ) : null
      ) : (
        <button
          type="button"
          aria-label={
            completed
              ? `Mark ${task.Title} incomplete`
              : `Complete ${task.Title}`
          }
          disabled={!isCurrentDay}
          onClick={(event) => {
            event.stopPropagation();
            onCheck();
          }}
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
            !isCurrentDay ? "opacity-40" : ""
          }`}
        >
          {completed ? (
            <CheckCircle className="h-6 w-6 text-emerald-500" />
          ) : (
            <Circle className="h-6 w-6 text-gray-300 dark:text-gray-500" />
          )}
        </button>
      )}
    </div>
  );
}
