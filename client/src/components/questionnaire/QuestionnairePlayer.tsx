/* eslint-disable @typescript-eslint/no-explicit-any */
import Application from "@/api/app";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  clampQuestionnaireStep,
  isQuestionVisible,
  resolveQuestionnaireState,
  sanitizeQuestionnaireRespond,
} from "@/lib/questionary/conditionalQuestions";
import { fillableQuestions } from "@/lib/questionary/fillableQuestions";
import { applicationData } from "@/lib/query/applicationQuery";
import { isColorDark } from "@/help";
import { AppContext } from "@/store/app";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Star, UploadCloud, X } from "lucide-react";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type MultiFileResponse = {
  frontal?: string;
  back?: string;
  side?: string;
};

type QuestionResponse = string | string[] | MultiFileResponse | null;

type SurveyQuestion = {
  id?: string;
  text?: string;
  question?: string;
  type?: string;
  options?: string[] | null;
  required?: boolean;
  response?: QuestionResponse;
  skip_validation?: boolean;
  hide?: boolean;
  conditions?: unknown[];
  order?: number;
  [key: string]: unknown;
};

type SurveyForm = {
  title?: string;
  description?: string;
  questions?: SurveyQuestion[];
  consent_text?: string;
  show_consent?: boolean;
  unique_id?: string;
};

const EMOJIS = [
  { name: "Angry", icon: "😠" },
  { name: "Sad", icon: "😢" },
  { name: "Neutral", icon: "😐" },
  { name: "Smile", icon: "😊" },
  { name: "Loved", icon: "😍" },
];

const SUPPORTED_TYPES = new Set([
  "text",
  "paragraph",
  "number",
  "multiple_choice",
  "checkbox",
  "yes_no",
  "yes/no",
  "scale",
  "star rating",
  "emojis",
  "file uploader",
]);

function questionType(question: SurveyQuestion) {
  return String(question.type || "").toLowerCase();
}

function questionText(question: SurveyQuestion) {
  return String(question.question || question.text || "Question");
}

function questionOptions(question: SurveyQuestion): string[] {
  if (!question.options) return [];
  if (Array.isArray(question.options)) return question.options.map((opt) => String(opt));
  return [];
}

function brandTint(hex: string, alphaHex = "1A") {
  const raw = (hex || "#10b981").trim();
  if (!raw.startsWith("#")) return raw;
  if (raw.length === 4) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}${alphaHex}`;
  }
  if (raw.length === 7) return `${raw}${alphaHex}`;
  return raw;
}

function alreadyAnswered(error: unknown) {
  const detail = (error as any)?.response?.data?.detail || (error as any)?.message || "";
  return typeof detail === "string" && detail.toLowerCase().includes("already answered");
}

function errorMessage(error: unknown, fallback: string) {
  const detail = (error as any)?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function defaultResponse(question: SurveyQuestion): QuestionResponse {
  const type = questionType(question);
  if (question.response !== undefined && question.response !== null) {
    return question.response;
  }
  if (type === "checkbox") return [];
  if (type === "file uploader") return {};
  if (type === "star rating") return "0";
  if (type === "emojis") return EMOJIS[2].name;
  if (type === "scale") {
    const options = questionOptions(question);
    const min = Number.parseInt(options[0] || "1", 10);
    const max = Number.parseInt(options[1] || "10", 10);
    return String(Math.floor((min + max) / 2));
  }
  return "";
}

function isEmptyResponse(type: string, value: QuestionResponse) {
  if (value === undefined || value === null) return true;
  if (type === "checkbox") return !Array.isArray(value) || value.length === 0;
  if (type === "file uploader") {
    const files = (value || {}) as MultiFileResponse;
    return !files.frontal && !files.back && !files.side;
  }
  if (type === "star rating") return !value || value === "0";
  if (typeof value === "string") return value.trim() === "";
  return false;
}

type QuestionnairePlayerProps = {
  uniqueId: string;
  formUniqueId?: string;
  title?: string;
  mode?: "questionnaire" | "checkin";
  onClose: () => void;
  onSubmitted: () => void;
  onSaved?: () => void;
};

function coerceQuestionList(value: unknown): SurveyQuestion[] {
  if (Array.isArray(value)) return value as SurveyQuestion[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function QuestionnairePlayer({
  uniqueId,
  formUniqueId = "",
  title,
  mode = "questionnaire",
  onClose,
  onSubmitted,
  onSaved,
}: QuestionnairePlayerProps) {
  const { brandInfo } = useContext(AppContext);
  const primary = brandInfo?.primary_color || "#10b981";
  const secondary = brandInfo?.secondary_color || primary;
  const onPrimary = isColorDark(primary || "#000000") ? "#ffffff" : "#111827";
  const tint = brandTint(primary);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<SurveyForm | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [responses, setResponses] = useState<Record<number, QuestionResponse>>({});
  const [step, setStep] = useState(0);
  const [slideDir, setSlideDir] = useState<"next" | "back">("next");
  const [complete, setComplete] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const autosaveTimer = useRef<number | null>(null);

  const showConsent = Boolean(form?.show_consent && form?.consent_text);

  const resolvedQuestions = useMemo(
    () => resolveQuestionnaireState(questions, responses),
    [questions, responses],
  );

  const visibleQuestions = useMemo(
    () => resolvedQuestions.filter(isQuestionVisible),
    [resolvedQuestions],
  );

  const visibleIndex = showConsent ? step - 1 : step;
  const currentQuestion = visibleIndex >= 0 ? visibleQuestions[visibleIndex] : null;
  const currentOriginalIndex = currentQuestion
    ? resolvedQuestions.findIndex((question) => question === currentQuestion)
    : -1;
  const totalVisible = visibleQuestions.length;
  const progress =
    complete || totalVisible === 0
      ? 100
      : Math.round(((Math.max(visibleIndex, 0) + (currentQuestion ? 0 : totalVisible)) / totalVisible) * 100);

  const buildRespond = useCallback(() => {
    return sanitizeQuestionnaireRespond(resolvedQuestions, responses);
  }, [resolvedQuestions, responses]);

  const persistAutosave = useCallback(() => {
    if (mode === "checkin" || !formUniqueId) return;
    void Application.autosaveQuestionnaire({
      unique_id: uniqueId,
      f_unique_id: formUniqueId,
      respond: buildRespond(),
    }).catch(() => {});
  }, [buildRespond, formUniqueId, mode, uniqueId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const request =
      mode === "checkin"
        ? Application.showCheckin({ unique_id: uniqueId })
        : Application.showQuestionnaire({
            unique_id: uniqueId,
            f_unique_id: formUniqueId,
          });
    applicationData<SurveyForm>(request)
      .then((payload) => {
        if (cancelled) return;
        if (!payload) {
          setLoadError("Could not load this form. Please try again or contact your clinic.");
          setLoading(false);
          return;
        }
        const nextQuestions = fillableQuestions(coerceQuestionList(payload.questions));
        const initial: Record<number, QuestionResponse> = {};
        nextQuestions.forEach((question, index) => {
          initial[index] = defaultResponse(question);
        });
        setForm(payload);
        setQuestions(nextQuestions);
        setResponses(initial);
        setStep(payload?.show_consent && payload?.consent_text ? 0 : 0);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        if (alreadyAnswered(error)) {
          setComplete(true);
          setLoadError(null);
        } else {
          setLoadError(errorMessage(error, "Could not load this questionnaire."));
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formUniqueId, mode, uniqueId]);

  useEffect(() => {
    const nextStep = clampQuestionnaireStep({
      step,
      totalVisible,
      showConsent,
    });
    if (nextStep !== step) setStep(nextStep);
  }, [showConsent, step, totalVisible]);

  useEffect(() => {
    if (mode === "checkin" || loading || complete || questions.length === 0) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(persistAutosave, 800);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [complete, loading, persistAutosave, questions.length, responses]);

  const updateResponse = (value: QuestionResponse) => {
    if (currentOriginalIndex < 0) return;
    setResponses((prev) => ({ ...prev, [currentOriginalIndex]: value }));
    setValidationError(null);
  };

  const validateCurrent = () => {
    if (!currentQuestion || currentOriginalIndex < 0) return true;
    if (!currentQuestion.required) return true;
    const type = questionType(currentQuestion);
    if (!SUPPORTED_TYPES.has(type)) return true;
    if (isEmptyResponse(type, responses[currentOriginalIndex])) {
      setValidationError("This question requires an answer");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (showConsent && step === 0) {
      if (!consentAccepted) {
        setValidationError("Please confirm the consent statement to continue.");
        return;
      }
      setValidationError(null);
      setSlideDir("next");
      setStep(1);
      return;
    }
    if (!validateCurrent()) return;
    if (visibleIndex >= totalVisible - 1) {
      await handleSubmit();
      return;
    }
    setSlideDir("next");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setValidationError(null);
    if (step <= 0) {
      onClose();
      return;
    }
    setSlideDir("back");
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setValidationError(null);
    try {
      if (mode === "checkin") {
        await Application.saveCheckin({
          unique_id: uniqueId,
          respond: buildRespond(),
        });
      } else {
        await Application.saveQuestionnaire({
          unique_id: uniqueId,
          f_unique_id: formUniqueId,
          respond: buildRespond(),
        });
      }
      setComplete(true);
      onSaved?.();
    } catch (error) {
      if (alreadyAnswered(error)) {
        setComplete(true);
        onSaved?.();
      } else {
        setValidationError(errorMessage(error, "Could not submit this questionnaire."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const type = questionType(question);
    const value = currentOriginalIndex >= 0 ? responses[currentOriginalIndex] : "";
    const options = questionOptions(question);

    if (!SUPPORTED_TYPES.has(type)) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Question type "{question.type}" is not supported in this preview.
        </div>
      );
    }

    if (type === "paragraph") {
      return (
        <Textarea
          value={String(value || "")}
          onChange={(event) => updateResponse(event.target.value)}
          placeholder="Type your answer here..."
          className="min-h-[140px] text-base transition-shadow duration-200"
        />
      );
    }

    if (type === "text") {
      return (
        <Input
          value={String(value || "")}
          onChange={(event) => updateResponse(event.target.value)}
          placeholder="Type your answer here..."
          className="h-12 text-base transition-shadow duration-200"
        />
      );
    }

    if (type === "number") {
      return (
        <Input
          type="number"
          value={String(value || "")}
          onChange={(event) => updateResponse(event.target.value)}
          placeholder="Type your answer here..."
          className="h-12 text-base transition-shadow duration-200"
        />
      );
    }

    if (type === "multiple_choice") {
      return (
        <RadioGroup
          value={String(value || "")}
          onValueChange={(next) => updateResponse(next)}
          className="space-y-2"
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateResponse(option)}
              className={`q-choice flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${
                String(value) === option
                  ? ""
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              }`}
              style={
                String(value) === option
                  ? { borderColor: primary, background: tint }
                  : undefined
              }
            >
              <RadioGroupItem
                value={option}
                className="pointer-events-none"
                style={{ borderColor: primary, color: primary }}
              />
              <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {option}
              </Label>
            </button>
          ))}
        </RadioGroup>
      );
    }

    if (type === "checkbox") {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {options.map((option) => {
            const checked = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  updateResponse(
                    checked
                      ? selected.filter((item) => item !== option)
                      : [...selected, option],
                  )
                }
                className={`q-choice flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left ${
                  checked ? "" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                }`}
                style={checked ? { borderColor: primary, background: tint } : undefined}
              >
                <Checkbox
                  checked={checked}
                  className="mt-0.5 pointer-events-none"
                  style={{ borderColor: primary, color: primary }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    if (type === "yes_no" || type === "yes/no") {
      return (
        <div className="grid grid-cols-2 gap-3">
          {["Yes", "No"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateResponse(option)}
              className={`q-choice rounded-xl px-4 py-3 text-base font-semibold ${
                value === option
                  ? ""
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
              }`}
              style={
                value === option
                  ? option === "Yes"
                    ? { background: primary, color: onPrimary }
                    : { background: secondary, color: isColorDark(secondary || "#000000") ? "#ffffff" : "#111827" }
                  : undefined
              }
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    if (type === "scale") {
      const min = Number.parseInt(options[0] || "1", 10);
      const max = Number.parseInt(options[1] || "10", 10);
      const current = Number.parseInt(String(value || Math.floor((min + max) / 2)), 10);
      return (
        <div
          className="space-y-6 px-1 [&_.bg-primary]:bg-[var(--q-brand)] [&_.border-primary]:border-[var(--q-brand)]"
          style={{ ["--q-brand" as string]: primary }}
        >
          <Slider
            value={[current]}
            min={min}
            max={max}
            step={1}
            onValueChange={(next) => updateResponse(String(next[0]))}
          />
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Low ({min})</span>
            <span className="text-xl font-bold transition-transform duration-200" style={{ color: primary }}>
              {current}
            </span>
            <span>High ({max})</span>
          </div>
        </div>
      );
    }

    if (type === "star rating") {
      const max = options.length || 5;
      const current = Number.parseInt(String(value || "0"), 10);
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            {Array.from({ length: max }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => updateResponse(String(index + 1))}
                className={`q-choice ${index < current ? "[scale:1.12]" : "text-gray-300"}`}
                style={index < current ? { color: primary } : undefined}
              >
                <Star className="h-8 w-8 fill-current" />
              </button>
            ))}
          </div>
          {current > 0 && (
            <p className="text-sm" style={{ color: primary }}>
              You selected: {current} star{current === 1 ? "" : "s"}
            </p>
          )}
        </div>
      );
    }

    if (type === "emojis") {
      return (
        <div className="flex justify-center gap-3">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji.name}
              type="button"
              onClick={() => updateResponse(emoji.name)}
              className={`q-choice flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
                value === emoji.name ? "[scale:1.12]" : "bg-gray-100 dark:bg-gray-800"
              }`}
              style={
                value === emoji.name
                  ? { background: tint, boxShadow: `0 0 0 2px ${primary}` }
                  : undefined
              }
              aria-label={emoji.name}
            >
              {emoji.icon}
            </button>
          ))}
        </div>
      );
    }

    if (type === "file uploader") {
      const files = ((value || {}) as MultiFileResponse) || {};
      return (
        <div className="space-y-3">
          <label
            className="q-choice flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center"
            style={{ borderColor: primary, background: tint }}
          >
            <UploadCloud className="mb-2 h-6 w-6" style={{ color: primary }} />
            <span className="text-sm font-medium" style={{ color: primary }}>
              {files.frontal ? "Replace photo" : "Upload a photo"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  updateResponse({
                    ...files,
                    frontal: String(reader.result || ""),
                  });
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {files.frontal && (
            <img
              src={files.frontal}
              alt="Uploaded"
              className="mx-auto h-32 w-32 rounded-xl object-cover"
            />
          )}
        </div>
      );
    }

    return null;
  };

  const heading = form?.title || title || "Questionnaire";
  const columnClass = "mx-auto w-full max-w-[32rem]";
  const brandButtonStyle = { background: primary, color: onPrimary };

  return (
    <div
      className="q-player-overlay fixed inset-0 z-[9999] flex h-dvh w-full flex-col overflow-hidden bg-white dark:bg-neutral-900"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-44"
        style={{
          background: `linear-gradient(180deg, ${brandTint(primary, "24")} 0%, transparent 100%)`,
        }}
      />
      <div className="relative flex h-11 w-full shrink-0 items-center border-b border-gray-200 px-4 dark:border-gray-800 md:border-transparent">
        <div className={`${columnClass} flex items-center gap-2 pr-10`}>
          {brandInfo?.logo ? (
            <img
              src={brandInfo.logo}
              alt=""
              className="h-6 w-6 shrink-0 rounded object-contain"
            />
          ) : null}
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {heading}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={complete ? onSubmitted : onClose}
          className="q-press absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 md:right-5"
          aria-label="Close questionnaire"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className={`${columnClass} h-1 shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800 md:rounded-full`}>
        <div
          className="q-progress-fill h-full"
          style={{
            width: `${complete ? 100 : showConsent && step === 0 ? 4 : progress}%`,
            background: primary,
          }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 md:px-6 md:py-8">
        <div className={`${columnClass} md:rounded-2xl md:border md:border-gray-200 md:bg-white md:p-6 md:shadow-sm dark:md:border-gray-800 dark:md:bg-neutral-900`}>
          {loading && (
            <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: primary }} />
              <p className="text-sm">Loading questionnaire…</p>
            </div>
          )}

          {!loading && loadError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
              {loadError}
            </div>
          )}

          {!loading && !loadError && complete && (
            <div className="q-thanks flex min-h-[16rem] flex-col items-center justify-center px-2 text-center">
              <span
                className="q-thanks-icon mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: tint }}
              >
                <CheckCircle2 className="h-7 w-7" style={{ color: primary }} />
              </span>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Thank you
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Your answers were submitted. You can return to the app now.
              </p>
            </div>
          )}

          {!loading && !loadError && !complete && showConsent && step === 0 && (
            <div key="consent" className="q-step-next space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Before you start
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {form?.consent_text}
              </p>
              <label className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-gray-800/60">
                <Checkbox
                  checked={consentAccepted}
                  onCheckedChange={(checked) => {
                    setConsentAccepted(checked === true);
                    setValidationError(null);
                  }}
                  className="mt-0.5"
                  style={{ borderColor: primary, color: primary }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  I have read and accept this statement.
                </span>
              </label>
            </div>
          )}

          {!loading && !loadError && !complete && currentQuestion && (
            <div
              key={`q-${step}-${visibleIndex}`}
              className={`${slideDir === "back" ? "q-step-back" : "q-step-next"} space-y-4`}
            >
              <p
                className="text-[11px] font-medium uppercase tracking-wide"
                style={{ color: primary }}
              >
                Question {visibleIndex + 1} of {totalVisible}
              </p>
              <h2 className="text-base font-semibold leading-snug text-gray-900 dark:text-gray-100">
                {questionText(currentQuestion)}
              </h2>
              {renderQuestion(currentQuestion)}
            </div>
          )}

          {validationError && (
            <div className="q-step-next mt-4 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>
      </div>

      {!loading && !loadError && (
        <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-neutral-900 md:border-transparent md:bg-transparent md:px-6 md:dark:bg-transparent">
          <div className={columnClass}>
            {complete ? (
              <Button
                className="q-press h-11 w-full rounded-xl"
                style={brandButtonStyle}
                onClick={onSubmitted}
              >
                Return to app
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="q-press h-11 flex-1 rounded-xl"
                  style={{ borderColor: primary, color: primary }}
                  onClick={handleBack}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="q-press h-11 flex-1 rounded-xl group"
                  style={brandButtonStyle}
                  onClick={() => void handleNext()}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : visibleIndex >= totalVisible - 1 && !(showConsent && step === 0) ? (
                    "Submit"
                  ) : (
                    <>
                      Next
                      <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
