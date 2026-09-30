import Application from "@/api/app";
import SimpleModeSelect from "@/components/chat/simple-mode-select";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Bot,
  CheckCheck,
  ExternalLink,
  Flag,
  Loader2,
  MoreVertical,
  RotateCcw,
  Send,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatViewport } from "@/hooks/use-keyboard-inset";
import { useChatMessagesQuery } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { openExternalUrl } from "@/lib/open-external-url";
import { sortMessagesChronologically, formatMessageClock } from "@/lib/chatMessageOrder";
import { subscribe, unsubscribe } from "@/lib/event";

type ChatMode = "coach" | "ai";
type ChatReference = { text: string; filename: string; url?: string };

const CLINIC_REF_NAMES = new Set([
  "your holistic plan",
  "your action plan",
  "your lab results",
  "your health data",
  "your clinic records",
  "clinic records",
]);

const PUBLISHED_REF_HOSTS = [
  "medlineplus.gov",
  "cdc.gov",
  "who.int",
  "heart.org",
  "dietaryguidelines.gov",
  "ods.od.nih.gov",
  "nimh.nih.gov",
];

function isOfficialReferenceUrl(url?: string): boolean {
  try {
    const parsed = new URL(String(url || "").trim());
    if (parsed.protocol !== "https:") return false;
    return PUBLISHED_REF_HOSTS.some(
      (host) =>
        parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

function allowedChatReferences(
  refs?: ChatReference[] | string | null
): ChatReference[] {
  if (typeof refs === "string") {
    try {
      refs = JSON.parse(refs);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(refs)) return [];
  return refs.filter((ref) => {
    const name = String(ref?.filename ?? "").trim().toLowerCase();
    const text = String(ref?.text ?? "").trim();
    if (!name || !text) return false;
    if (CLINIC_REF_NAMES.has(name)) return true;
    return isOfficialReferenceUrl(ref.url);
  });
}

interface Message {
  conversation_id: number;
  date: string;
  feedback?: string;
  images?: string[];
  message_text: string;
  replied_message_id?: string;
  reported: boolean;
  sender_iamge?: string;
  sender_id?: string;
  sender_name?: string;
  sender_type: "patient" | "coach" | "ai" | "user";
  time: string;
  timestamp?: number;
  message_id?: number; // Add unique message ID
  references?: ChatReference[];
  recipient?: boolean; // Indicates if message was sent/received
}

function messageDisplayKey(msg: Message): string {
  return `${msg.conversation_id}-${msg.sender_type}-${msg.date}-${msg.time}`;
}

interface Coach {
  id: string;
  name: string;
  specialization: string;
  avatar: string;
  rating: number;
  available: boolean;
  responseTime: string;
  experience: string;
}

const coaches: Coach[] = [
  {
    id: "1",
    name: "clinic",
    specialization: "Metabolic Health",
    avatar: "/avatars/sarah.jpg",
    rating: 4.9,
    available: true,
    responseTime: "~2 hours",
    experience: "8+ years",
  },
];

export default function ChatPage() {
  const [activeMode, setActiveMode] = useState<ChatMode>("coach");
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(coaches[0]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [displayedMessages, setDisplayedMessages] = useState<
    Record<string, string>
  >({});
  const [previousCount, setPreviousCount] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const { height: viewportHeight, keyboardOpen } = useChatViewport(rootRef);
  const [conversationId, setConversationId] = useState<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: chatData, isPending: chatPending } =
    useChatMessagesQuery(activeMode);
  const isInitialLoad = chatPending && chatData === undefined;
  const [isSending, setIsSending] = useState(false);
  const [messageReactions, setMessageReactions] = useState<
    Record<number, "liked" | "disliked" | null>
  >({});
  const [reportedMessages, setReportedMessages] = useState<Set<string>>(
    new Set()
  );
  // const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<number | null>(
    null
  );
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReferencesModal, setShowReferencesModal] = useState(false);
  const [selectedReferences, setSelectedReferences] = useState<ChatReference[]>(
    []
  );
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    });
  }, []);

  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages, displayedMessages]); //
  const formatText = (text: string, onDarkBubble = false) => {
    const linkClass = onDarkBubble
      ? "text-blue-100 underline break-all"
      : "text-blue-600 dark:text-blue-400 underline break-all";
    const boldedText = text.replace(/\*(.*?)\*/g, (_match, p1) => `<strong>${p1}</strong>`);

    const linkifiedText = boldedText.replace(
      /(https?:\/\/[^\s]+)/g,
      (url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${linkClass}">${url}</a>`
    );

    // متن رو به خطوط تقسیم می‌کنیم
    const lines = linkifiedText.split('\n');

    return lines.map((line, index) => (
      <span key={index}>
        <span dangerouslySetInnerHTML={{ __html: line }} />
        <br />
      </span>
    ));
  };  
  const applyChatPayload = (payload: { conversation_id: number; messages: any[] }) => {
    const nextMessages = sortMessagesChronologically(
      (payload.messages || []).map((msg: Message) => ({
        ...msg,
        references: allowedChatReferences(msg.references),
      })),
    );
    setMessages(nextMessages);
    setConversationId(payload.conversation_id);

    const feedbackState: Record<number, "liked" | "disliked" | null> = {};
    const reportedMessagesSet = new Set<string>();
    nextMessages.forEach((msg: Message) => {
      if (msg.feedback === "like") {
        feedbackState[msg.conversation_id] = "liked";
      } else if (msg.feedback === "disliked") {
        feedbackState[msg.conversation_id] = "disliked";
      }
      if (msg.reported) {
        reportedMessagesSet.add(`${msg.conversation_id}-${msg.date}-${msg.time}`);
      }
    });
    setMessageReactions(feedbackState);
    setReportedMessages(reportedMessagesSet);
  };

  useEffect(() => {
    if (!chatData) return;
    applyChatPayload(chatData);
  }, [chatData]);

  useEffect(() => {
    setDisplayedMessages({});
    setPreviousCount(0);
    lastMessageIdRef.current = null;
  }, [activeMode]);

  useEffect(() => {
    const openCoachChat = () => {
      setActiveMode("coach");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chatMessages("coach"),
      });
    };
    subscribe("openCoachChat", openCoachChat);
    return () => {
      unsubscribe("openCoachChat", openCoachChat);
    };
  }, [queryClient]);

  const patchChatMessages = (
    updater: (prev: { conversation_id: number; messages: any[] } | undefined) => {
      conversation_id: number;
      messages: any[];
    },
  ) => {
    queryClient.setQueryData(queryKeys.chatMessages(activeMode), updater);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const text = message;
    setIsSending(true);

    const optimisticMessage: Message = {
      conversation_id: 0,
      date: new Date().toISOString(),
      message_text: text,
      sender_type: "patient",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      timestamp: Date.now(),
      reported: false,
    };
    setMessage("");
    patchChatMessages((prev) => ({
      conversation_id: prev?.conversation_id ?? conversationId ?? 0,
      messages: [...(prev?.messages ?? []), optimisticMessage],
    }));
    Application.sendMessage({
      conversation_id:
        messages
          .filter(
            (msg) => msg.sender_type === "ai" || msg.sender_type === "coach"
          )
          .pop()?.conversation_id || 1,
      message_to: activeMode,
      text,
    })
      .then((res) => {
        if (res.data?.answer) {
          const reply: Message = {
            conversation_id: res.data.current_conversation_id,
            date: new Date().toISOString(),
            message_text: res.data.answer,
            sender_type: activeMode,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            timestamp: Date.now(),
            reported: false,
            references: allowedChatReferences(res.data.references),
          };
          patchChatMessages((prev) => ({
            conversation_id: res.data.current_conversation_id,
            messages: [...(prev?.messages ?? []), reply],
          }));
        }
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res.response.data.detail,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  const handleMessageReaction = (
    conversationId: number,
    reaction: "liked" | "disliked" | null
  ) => {
    setMessageReactions((prev) => ({
      ...prev,
      [conversationId]: prev[conversationId] === reaction ? null : reaction,
    }));

    // Show toast feedback
    if (reaction === "liked") {
      toast({
        title: "Thanks for the feedback!",
        description: "We're glad this response was helpful.",
      });
      Application.feeedBack("like", conversationId);
    } else if (reaction === "disliked") {
      toast({
        title: "Feedback received",
        description: "We'll work to improve our responses.",
      });
      Application.feeedBack("dislike", conversationId);
    }
  };

  const handleMessageMenu = (messageId: number) => {
    // This will be handled by the dropdown menu
  };

  const handleReportMessage = (messageId: number) => {
    setReportingMessageId(messageId);
    setShowReportModal(true);
  };
  const handleRegenerateMessage = async (messageId: number) => {
    const lastAIMessage = messages
      .filter((msg) => msg.sender_type === "ai")
      .pop();

    if (!lastAIMessage || lastAIMessage.conversation_id !== messageId) {
      toast({
        title: "Error",
        description: "Can only regenerate the last AI message.",
        variant: "destructive",
      });
      return;
    }

    const userMessages = messages.filter(
      (msg) =>
        msg.sender_type === "patient" &&
        messages.indexOf(msg) < messages.indexOf(lastAIMessage)
    );

    if (userMessages.length === 0) {
      toast({
        title: "Error",
        description: "Could not find the original user message.",
        variant: "destructive",
      });
      return;
    }
    let lastUsedId = 1;
    if (userMessages.length > 2) {
      lastUsedId = userMessages[userMessages.length - 2].conversation_id;
    }
    const userMessage = userMessages[userMessages.length - 1];

    setIsRegenerating(true);
    setIsSending(true);
    patchChatMessages((prev) => ({
      conversation_id: prev?.conversation_id ?? conversationId ?? 0,
      messages: (prev?.messages ?? []).filter(
        (msg: Message) =>
          !(msg.conversation_id === messageId && msg.sender_type === "ai"),
      ),
    }));

    try {
      const res = await Application.sendMessage({
        conversation_id: lastUsedId,
        message_to: activeMode,
        text: userMessage.message_text,
      });

      if (res.data?.answer) {
        const newMessage: Message = {
          conversation_id: res.data.current_conversation_id,
          date: new Date().toISOString(),
          message_text: res.data.answer,
          sender_type: activeMode,
          time: new Date().toLocaleTimeString(),
          reported: false,
          references: allowedChatReferences(res.data.references),
        };
        patchChatMessages((prev) => ({
          conversation_id: res.data.current_conversation_id,
          messages: [...(prev?.messages ?? []), newMessage],
        }));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to regenerate message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportReason("");
    setReportingMessageId(null);
  };

  const bookSession = () => {
    toast({
      title: "Session booking",
      description: "Redirecting to scheduling interface...",
    });
  };

  const handleShowReferences = (references: ChatReference[]) => {
    setSelectedReferences(allowedChatReferences(references));
    setShowReferencesModal(true);
  };

  const handleSubmitReport = () => {
    if (reportingMessageId) {
      // Find the specific message to create unique key
      const messageToReport = messages.find(
        (msg) => msg.conversation_id === reportingMessageId
      );
      if (messageToReport) {
        const messageKey = `${messageToReport.conversation_id}-${messageToReport.date}-${messageToReport.time}`;

        // Add message to reported messages set
        setReportedMessages((prev) => {
          const newSet = new Set(prev);
          newSet.add(messageKey);
          return newSet;
        });
      }

      // Show success toast
      toast({
        title: "Report submitted",
        description: "Thank you for your feedback. We'll review this message.",
      });
    }

    setShowReportModal(false);
    setReportReason("");
    setReportDetails("");
    setReportingMessageId(null);

    // Call API to report message
    if (reportingMessageId) {
      Application.reportMessage(
        reportingMessageId,
        reportReason,
        reportDetails
      );
    }
  };
  useEffect(() => {
    if (!messages.length) return;

    const lastMsg = messages[messages.length - 1];
    const isNewMessage = messages.length > previousCount;

    const lastDisplayKey = messageDisplayKey(lastMsg);

    if (
      lastMsg.sender_type === "ai" &&
      lastMessageIdRef.current === lastDisplayKey &&
      !isRegenerating
    ) {
      setDisplayedMessages((prev) => ({
        ...prev,
        [lastDisplayKey]: lastMsg.message_text,
      }));
      return;
    }

    if (previousCount === 0) {
      const initMessages: Record<string, string> = {};
      messages.forEach((msg) => {
        if (msg.sender_type === "ai" || msg.sender_type === "coach") {
          initMessages[messageDisplayKey(msg)] = msg.message_text;
        }
      });
      setDisplayedMessages(initMessages);
      setPreviousCount(messages.length);
      lastMessageIdRef.current = lastDisplayKey;
      return;
    }

    if (
      (isNewMessage && lastMsg.sender_type === "ai") ||
      (isRegenerating && lastMsg.sender_type === "ai")
    ) {
      let i = 0;
      const text = lastMsg.message_text;
      setDisplayedMessages((prev) => ({
        ...prev,
        [lastDisplayKey]: "",
      }));

      const interval = setInterval(() => {
        i++;
        setDisplayedMessages((prev) => ({
          ...prev,
          [lastDisplayKey]: text.slice(0, i),
        }));

        if (i >= text.length) {
          clearInterval(interval);
          setIsRegenerating(false);
        }
      }, 20);

      setPreviousCount(messages.length);
      lastMessageIdRef.current = lastDisplayKey;
    } else if (isNewMessage) {
      if (lastMsg.sender_type === "ai" || lastMsg.sender_type === "coach") {
        setDisplayedMessages((prev) => ({
          ...prev,
          [lastDisplayKey]: lastMsg.message_text,
        }));
      }
      setPreviousCount(messages.length);
      lastMessageIdRef.current = lastDisplayKey;
    }
  }, [messages, isRegenerating]);

  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages, displayedMessages]);
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (keyboardOpen) {
      document.body.setAttribute("data-chat-keyboard", "open");
      scrollToBottom("auto");
    } else {
      document.body.removeAttribute("data-chat-keyboard");
    }

    return () => {
      document.body.removeAttribute("data-chat-keyboard");
    };
  }, [keyboardOpen, scrollToBottom]);

  const handleInputFocus = () => {
    scrollToBottom("auto");
    setTimeout(() => scrollToBottom("smooth"), 300);
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [message]);

  const assistantIcon =
    activeMode === "coach" ? (
      <User className="h-3.5 w-3.5 text-white" />
    ) : (
      <Bot className="h-3.5 w-3.5 text-white" />
    );
  const assistantIconBg =
    activeMode === "coach"
      ? "bg-gradient-to-br from-emerald-500 to-teal-600"
      : "bg-gradient-to-br from-blue-500 to-indigo-600";

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#e8eef2] dark:bg-[#0b141a]"
      style={
        keyboardOpen && viewportHeight
          ? { height: `${viewportHeight}px` }
          : undefined
      }
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col md:max-w-2xl">
        <div className="shrink-0 border-b border-black/5 bg-white/95 px-2 pt-1 backdrop-blur-md dark:border-white/10 dark:bg-[#111b21] md:px-3">
          <SimpleModeSelect
            activeMode={activeMode}
            setActiveMode={setActiveMode}
          />
        </div>

        <div
          ref={messagesContainerRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-2 py-2 md:px-3"
          style={{ scrollbarWidth: "thin" }}
        >
          {isInitialLoad && (
            <div className="flex justify-center px-4 py-16">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}

          {messages.length === 0 && !isInitialLoad && !isSending && (
            <div className="flex flex-col items-center px-4 py-16 text-center">
              <span
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${assistantIconBg}`}
              >
                {assistantIcon}
              </span>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                {activeMode === "coach" ? "Health Coach" : "AI Copilot"}
              </p>
              <p className="mt-1 max-w-[16rem] text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                {activeMode === "coach"
                  ? "Send a message to your health coach."
                  : "Ask wellness questions about your own health data."}
              </p>
            </div>
          )}

          {messages.map((msg, msgIndex) => {
            const messageKey = `${msg.conversation_id}-${msg.date}-${msg.time}`;
            const isReported = reportedMessages.has(messageKey);
            const isPatient = msg.sender_type === "patient";
            const isAI = msg.sender_type === "ai";
            const displayKey = messageDisplayKey(msg);
            const aiBody =
              displayedMessages[displayKey] ?? msg.message_text ?? "";
            const lastAIMessage = messages
              .filter((m) => m.sender_type === "ai")
              .pop();
            const isLastAIMessage =
              lastAIMessage?.conversation_id === msg.conversation_id;
            const prev = msgIndex > 0 ? messages[msgIndex - 1] : null;
            const next =
              msgIndex < messages.length - 1 ? messages[msgIndex + 1] : null;
            const stacked = prev?.sender_type === msg.sender_type;
            const lastInStack = next?.sender_type !== msg.sender_type;

            return (
              <div
                key={`${messageKey}-${msgIndex}`}
                className={`flex items-end gap-1.5 ${
                  isPatient ? "justify-end" : "justify-start"
                } ${isReported ? "opacity-50" : ""} ${
                  stacked ? "mt-2" : "mt-3.5 first:mt-0"
                } ${msgIndex === messages.length - 1 ? "ui-bubble-in" : ""}`}
              >
                <div
                  className={`group min-w-0 ${
                    isPatient ? "max-w-[88%] sm:max-w-[75%]" : "max-w-[88%] sm:max-w-[78%]"
                  }`}
                >
                  <div
                    className={`px-2.5 pb-1.5 pt-1.5 shadow-sm ${
                      isPatient
                        ? `bg-[#d9fdd3] text-gray-900 dark:bg-[#005c4b] dark:text-gray-50 ${
                            lastInStack
                              ? "rounded-2xl rounded-br-sm"
                              : "rounded-2xl rounded-br-md"
                          }`
                        : `bg-white text-gray-900 dark:bg-[#1f2c33] dark:text-gray-100 ${
                            lastInStack
                              ? "rounded-2xl rounded-bl-sm"
                              : "rounded-2xl rounded-bl-md"
                          }`
                    }`}
                  >
                    <div className="text-[14.5px] leading-[1.45] break-words [overflow-wrap:anywhere]">
                      {isAI
                        ? formatText(aiBody)
                        : formatText(msg.message_text, false)}
                    </div>
                    <div className="mt-0.5 flex items-center justify-end gap-1">
                      <span
                        className={`select-none text-[10px] leading-none ${
                          isPatient
                            ? "text-gray-600/80 dark:text-white/55"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {formatMessageClock(msg)}
                      </span>
                      {isPatient && (
                        <CheckCheck
                          className={`h-3.5 w-3.5 ${
                            msg.recipient
                              ? "text-[#53bdeb]"
                              : "text-gray-500/70 dark:text-white/45"
                          }`}
                        />
                      )}
                      {isAI && isReported && (
                        <Flag className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>

                  {isAI && !isReported && (
                    <div className="mt-0.5 flex items-center gap-0.5 pl-0.5">
                      {allowedChatReferences(msg.references).length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-full p-0 text-gray-400 hover:bg-white/80 hover:text-blue-600 dark:hover:bg-white/10"
                          onClick={() =>
                            handleShowReferences(msg.references!)
                          }
                          title="View references"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 rounded-full p-0 ${
                          messageReactions[msg.conversation_id] === "liked"
                            ? "text-emerald-600"
                            : "text-gray-400 hover:text-emerald-600"
                        }`}
                        onClick={() =>
                          handleMessageReaction(msg.conversation_id, "liked")
                        }
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 rounded-full p-0 ${
                          messageReactions[msg.conversation_id] === "disliked"
                            ? "text-red-600"
                            : "text-gray-400 hover:text-red-600"
                        }`}
                        onClick={() =>
                          handleMessageReaction(
                            msg.conversation_id,
                            "disliked",
                          )
                        }
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 rounded-full p-0 text-gray-400 hover:bg-white/80 dark:hover:bg-white/10"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-44 rounded-xl"
                        >
                          {isLastAIMessage ? (
                            <DropdownMenuItem
                              onClick={() =>
                                handleRegenerateMessage(msg.conversation_id)
                              }
                              className="text-blue-600 dark:text-blue-400"
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Regenerate
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            onClick={() =>
                              handleReportMessage(msg.conversation_id)
                            }
                            className="text-red-600 dark:text-red-400"
                          >
                            <Flag className="mr-2 h-4 w-4" />
                            Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && messages.length > 0 && (
            <div className="flex items-end justify-start pt-1">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white px-3 py-2.5 shadow-sm dark:bg-[#1f2c33]">
                <span className="flex items-center gap-1">
                  <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-gray-400" />
                  <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-gray-400" />
                  <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-gray-400" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>

        <div
          className="z-20 w-full shrink-0 bg-[#f0f2f5] px-2 pt-1.5 dark:bg-[#1d2933] md:px-3"
          style={{
            paddingBottom: keyboardOpen
              ? "0.4rem"
              : "max(0.4rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex items-end gap-2">
            <div className="flex min-w-0 flex-1 items-end rounded-[22px] bg-white px-3.5 py-0.5 shadow-sm dark:bg-[#2a3942]">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message"
                rows={1}
                className="max-h-28 min-h-10 min-w-0 flex-1 resize-none border-0 bg-transparent px-0 py-2 text-[15px] shadow-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent dark:placeholder:text-gray-500"
                onFocus={handleInputFocus}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
            </div>
            <Button
              onMouseDown={(e) => e.preventDefault()}
              onClick={sendMessage}
              disabled={!message.trim() || isSending}
              size="icon"
              aria-label="Send message"
              className={`h-11 w-11 flex-shrink-0 rounded-full text-white shadow-sm disabled:opacity-40 ${
                activeMode === "coach"
                  ? "bg-[#00a884] hover:bg-[#008f72]"
                  : "bg-[#00a884] hover:bg-[#008f72]"
              }`}
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Report sheet */}
      <Sheet open={showReportModal} onOpenChange={setShowReportModal}>
        <SheetContent
          side="bottom"
          className="mx-auto flex w-full max-w-md flex-col gap-0 rounded-t-3xl border-x-0 border-t p-0 [&>button]:hidden"
        >
          <div className="flex justify-center pb-1 pt-3">
            <span className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>
          <SheetHeader className="space-y-0 px-5 pb-3 pt-1 text-left">
            <div className="flex items-center justify-between gap-3">
              <div>
                <SheetTitle className="text-base font-semibold">
                  Report response
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Help us improve AI answers
                </SheetDescription>
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          <div className="space-y-4 px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason
              </label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inaccurate">
                    Inaccurate or misleading
                  </SelectItem>
                  <SelectItem value="inappropriate">
                    Inappropriate content
                  </SelectItem>
                  <SelectItem value="irrelevant">
                    Irrelevant response
                  </SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Details (optional)
              </label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe the issue…"
                className="min-h-[80px] resize-none rounded-xl"
                rows={3}
              />
            </div>
            <Button
              onClick={handleSubmitReport}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white"
            >
              Submit report
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* References sheet */}
      <Sheet
        open={showReferencesModal}
        onOpenChange={setShowReferencesModal}
      >
        <SheetContent
          side="bottom"
          className="mx-auto flex max-h-[85dvh] w-full max-w-md flex-col gap-0 rounded-t-3xl border-x-0 border-t p-0 [&>button]:hidden"
        >
          <div className="flex justify-center pb-1 pt-3">
            <span className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>
          <SheetHeader className="flex-shrink-0 space-y-0 px-5 pb-3 pt-1 text-left">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <SheetTitle className="text-base font-semibold">
                    References
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Official public-health pages and your clinic records
                  </SheetDescription>
                </div>
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            {selectedReferences.map((reference, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200/60 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <p className="mb-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {reference.filename}
                </p>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {reference.text}
                </p>
                {isOfficialReferenceUrl(reference.url) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-8 rounded-lg px-2.5 text-xs"
                    onClick={() => void openExternalUrl(reference.url!)}
                  >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Open source
                  </Button>
                )}
              </div>
            ))}
            {selectedReferences.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">
                No references available
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
