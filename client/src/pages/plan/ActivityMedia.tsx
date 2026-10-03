import Application from "@/api/app";
import { useEffect, useState } from "react";
import {
  getFileKind,
  hasExerciseFiles,
  type Exercise,
  type FileData,
} from "./taskDisplay";

function getYouTubeEmbedUrl(url: string) {
  const standardOrShortsRegExp =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?/;
  const match = url.match(standardOrShortsRegExp);
  if (match?.[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
}

async function resolveFiles(
  files?: Exercise["Files"] | null
): Promise<FileData[]> {
  if (!hasExerciseFiles(files)) return [];
  const encoded_mi = localStorage.getItem("encoded_mi") || "";
  const resolved = await Promise.all(
    files.map(async (file) => {
      const kind = getFileKind(file);
      if (kind === "link") {
        return {
          Title: file.Title,
          Type: file.Type || "link",
          Content: {
            file_id: file.Content?.file_id,
            url: file.Content?.url,
          },
        } as FileData;
      }
      if ((kind === "video" || kind === "image") && file.Content?.file_id) {
        const res = await Application.showExerciseFile({
          file_id: file.Content.file_id,
          encoded_mi,
        });
        return {
          Title: res.data.file_name || file.Title,
          Type: res.data.file_type || file.Type,
          Content: {
            file_id: file.Content.file_id,
            url: res.data.base_64_data,
          },
        } as FileData;
      }
      return {
        Title: file.Title,
        Type: file.Type,
        Content: file.Content,
      } as FileData;
    })
  );
  return resolved.filter((file) => file.Content?.url || file.Content?.file_id);
}

function FilePreview({ file, previewKey }: { file: FileData; previewKey: string | number }) {
  const kind = getFileKind(file);
  return (
    <div
      key={previewKey}
      className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-800/50"
    >
      {file.Title && (
        <div className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
          {file.Title}
        </div>
      )}
      {kind === "video" ? (
        <video
          className="h-48 w-full rounded-md object-cover"
          controls
          preload="metadata"
        >
          <source src={file.Content.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : kind === "image" ? (
        <img
          src={file.Content.url}
          alt={file.Title || "Exercise image"}
          className="h-48 w-full rounded-md object-cover"
        />
      ) : (
        <div className="relative h-48 w-full overflow-hidden rounded-md">
          <iframe
            src={getYouTubeEmbedUrl(file.Content.url || "")}
            className="absolute inset-0 h-full w-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={file.Title || "Exercise video"}
          />
        </div>
      )}
    </div>
  );
}

interface ActivityMediaProps {
  files?: Exercise["Files"] | null;
}

export default function ActivityMedia({ files }: ActivityMediaProps) {
  const [resolved, setResolved] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const filesKey = (files ?? [])
    .map((file) => file.Content?.file_id || file.Content?.url || file.Title)
    .join("|");

  useEffect(() => {
    if (!hasExerciseFiles(files)) {
      setResolved([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    void resolveFiles(files)
      .then((next) => {
        if (!cancelled) setResolved(next);
      })
      .catch((err) => {
        console.error("Error loading activity files:", err);
        if (!cancelled) setResolved([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // filesKey is the stable identity for this file set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesKey]);

  if (!hasExerciseFiles(files) && !isLoading) return null;

  if (isLoading) {
    return <p className="text-xs text-gray-500">Loading files…</p>;
  }

  if (!resolved.length) return null;

  return (
    <div className="space-y-2">
      {resolved.map((file, fileIndex) => (
        <FilePreview
          key={file.Content.file_id || file.Content.url || fileIndex}
          file={file}
          previewKey={file.Content.file_id || fileIndex}
        />
      ))}
    </div>
  );
}
