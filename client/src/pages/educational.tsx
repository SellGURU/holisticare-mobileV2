import Application from "@/api/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ExternalLink,
  FileText,
  Headphones,
  Search,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MarkdownBold } from "@/components/markdown-bold";
import { openExternalUrl } from "@/lib/open-external-url";
import {
  DEFAULT_EDUCATIONAL_CONTENT,
  normalizeEducationalItems,
  type EducationalItem,
} from "@/data/default-educational-content";

const CONTENT_ICONS = [Video, Headphones, BookOpen, FileText] as const;

const CONTENT_ICON_BG = [
  "bg-gradient-to-br from-red-500 to-pink-500",
  "bg-gradient-to-br from-purple-500 to-indigo-500",
  "bg-gradient-to-br from-blue-500 to-cyan-500",
  "bg-gradient-to-br from-emerald-500 to-teal-500",
] as const;

function getPreview(text: string, max = 100) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
}

export default function EducationalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentView, setCurrentView] = useState<"list" | "content">("list");
  const [selectedContent, setSelectedContent] =
    useState<EducationalItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [educationalContent, setEducationalContent] = useState<
    EducationalItem[]
  >(DEFAULT_EDUCATIONAL_CONTENT);

  const handleGetEducationalContent = () => {
    setIsLoading(true);
    Application.getEducationalContent()
      .then((res) => {
        const fromClinic = normalizeEducationalItems(res.data);
        setEducationalContent(
          fromClinic.length > 0 ? fromClinic : DEFAULT_EDUCATIONAL_CONTENT,
        );
      })
      .catch(() => {
        setEducationalContent(DEFAULT_EDUCATIONAL_CONTENT);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    handleGetEducationalContent();
  }, []);

  const filteredContent = useMemo(() => {
    if (!searchQuery) return educationalContent;
    const q = searchQuery.toLowerCase();
    return educationalContent.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
    );
  }, [searchQuery, educationalContent]);

  const startReading = (contentId: string) => {
    const content = educationalContent.find((c) => c.title === contentId);
    if (content) {
      setSelectedContent(content);
      setCurrentView("content");
    } else {
      toast({
        title: "Content coming soon",
        description: "This article is being prepared.",
      });
    }
  };

  const goBackToList = () => {
    setCurrentView("list");
    setSelectedContent(null);
  };

  const renderMarkdownLine = (line: string, index: number) => {
    if (line.startsWith("# ")) {
      return (
        <h1
          key={index}
          className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100"
        >
          {line.slice(2)}
        </h1>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h2
          key={index}
          className="mb-3 mt-6 text-lg font-semibold text-gray-800 dark:text-gray-200"
        >
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3
          key={index}
          className="mb-2 mt-4 text-base font-medium text-gray-700 dark:text-gray-300"
        >
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      return (
        <p
          key={index}
          className="mb-2 font-semibold text-gray-800 dark:text-gray-200"
        >
          {line.slice(2, -2)}
        </p>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li
          key={index}
          className="mb-1 ml-4 list-disc text-sm text-gray-600 dark:text-gray-400"
        >
          <MarkdownBold text={line.slice(2)} />
        </li>
      );
    }
    if (line.match(/^\d+\. /)) {
      return (
        <li
          key={index}
          className="mb-1 ml-4 list-decimal text-sm text-gray-600 dark:text-gray-400"
        >
          <MarkdownBold text={line.slice(line.indexOf(" ") + 1)} />
        </li>
      );
    }
    if (line.trim() === "") {
      return <div key={index} className="mb-3" />;
    }
    return (
      <p
        key={index}
        className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400"
      >
        <MarkdownBold text={line} />
      </p>
    );
  };

  const pageShell = "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 pb-8 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900/20";

  if (currentView === "content" && selectedContent) {
    return (
      <div className={pageShell}>
        <div className="sticky top-0 z-20 border-b border-gray-200/50 bg-white/90 backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-900/90">
          <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBackToList}
              aria-label="Back to library"
              className="h-10 w-10 flex-shrink-0 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                {selectedContent.title}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Educational article
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-md space-y-4 px-4 py-4">
          {selectedContent["reference link"] && (
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl text-sm font-medium"
              onClick={() =>
                void openExternalUrl(selectedContent["reference link"])
              }
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open source link
            </Button>
          )}

          <Card className="rounded-2xl border-0 bg-white/95 shadow-md dark:bg-gray-800/95">
            <CardContent className="p-5">
              {selectedContent.content ? (
                <div className="max-w-none">
                  {selectedContent.content
                    .split("\n")
                    .map((line, index) => renderMarkdownLine(line, index))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center">
                  <FileText className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Content coming soon
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This article is being prepared.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={pageShell}>
      <div className="mx-auto w-full max-w-md px-4 py-4">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
            <BookOpen className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Learn
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Health & wellness articles
            </p>
          </div>
        </div>

        {/* Summary */}
        {!isLoading && educationalContent.length > 0 && (
          <Card className="mb-4 rounded-2xl border-0 bg-white/80 shadow-md dark:bg-gray-800/80">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Library
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {educationalContent.length} article
                  {educationalContent.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-0 bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                Free to read
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="h-11 rounded-xl border-gray-200/80 bg-white/90 pl-10 pr-4 text-sm shadow-sm backdrop-blur-sm dark:border-gray-700/80 dark:bg-gray-800/90"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-white/60 dark:bg-gray-800/40"
              />
            ))}
          </div>
        ) : filteredContent.length > 0 ? (
          <div className="space-y-3">
            {filteredContent.map((content, index) => {
              const TypeIcon = CONTENT_ICONS[index % CONTENT_ICONS.length];
              const iconBg = CONTENT_ICON_BG[index % CONTENT_ICON_BG.length];
              const hasLink = Boolean(content["reference link"]);

              return (
                <Card
                  key={content.title}
                  className="cursor-pointer overflow-hidden rounded-2xl border-0 bg-white/90 shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.99] dark:bg-gray-800/90"
                  onClick={() => startReading(content.title)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${iconBg}`}
                      >
                        <TypeIcon className="h-5 w-5 text-white" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
                            {content.title}
                          </h3>
                          <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                          {getPreview(content.content)}
                        </p>
                        {hasLink && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-3 h-9 rounded-lg px-0 text-xs font-medium text-blue-600 hover:bg-transparent hover:text-blue-700 dark:text-blue-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              void openExternalUrl(content["reference link"]);
                            }}
                          >
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            Open link
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl bg-white/60 px-6 py-12 text-center dark:bg-gray-800/40">
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
              <BookOpen className="h-8 w-8 text-blue-500/70 dark:text-blue-400/70" />
            </span>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {searchQuery ? "No matching articles" : "No content yet"}
            </h3>
            <p className="mt-1 max-w-[16rem] text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? "Try a different search term."
                : "Educational articles will appear here when available."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
