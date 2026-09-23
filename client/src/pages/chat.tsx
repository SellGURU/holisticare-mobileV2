import Application from "@/api/app";
import SimpleModeSelect from "@/components/chat/simple-mode-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Check,
  ExternalLink,
  Flag,
  Loader2,
  MessageCircle,
  MoreVertical,
  RotateCcw,
  Send,
  Shield,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatViewport } from "@/hooks/use-keyboard-inset";
import { openExternalUrl } from "@/lib/open-external-url";

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
  message_id?: number; // Add unique message ID
  references?: ChatReference[];
  recipient?: boolean; // Indicates if message was sent/received
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
    Record<number, string>
  >({});
  const [previousCount, setPreviousCount] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const { height: viewportHeight, keyboardOpen } = useChatViewport(rootRef);
  const [conversationId, setConversationId] = useState<number>(0);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
  const formatText = (text: string) => {
    // ابتدا بولدها رو جایگزین می‌کنیم
    const boldedText = text.replace(/\*(.*?)\*/g, (_match, p1) => `<strong>${p1}</strong>`);

    // سپس لینک‌ها رو جایگزین می‌کنیم
    const linkifiedText = boldedText.replace(
      /(https?:\/\/[^\s]+)/g,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-green-400 underline">${url}</a>`
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
  const handleGetMessagesId = async () => {
    Application.getMessagesId({ message_from: activeMode })
      .then((res) => {
        setMessages(
          (res.data.messages || []).map((msg: Message) => ({
            ...msg,
            references: allowedChatReferences(msg.references),
          }))
        );
        setConversationId(res.data.conversation_id);

        // Initialize displayedMessages for all AI messages
        const initDisplayedMessages: Record<number, string> = {};
        res.data.messages.forEach((msg: Message) => {
          if (msg.sender_type === "ai" || msg.sender_type === "coach") {
            initDisplayedMessages[msg.conversation_id] = msg.message_text;
          }
        });
        setDisplayedMessages(initDisplayedMessages);

        // Update previousCount to match loaded messages
        if (res.data.messages.length > 0) {
          setPreviousCount(res.data.messages.length);
          const lastMsg = res.data.messages[res.data.messages.length - 1];
          lastMessageIdRef.current = lastMsg.conversation_id;
        }

        // Sync feedback state with server data
        const feedbackState: Record<number, "liked" | "disliked" | null> = {};
        const reportedMessagesSet = new Set<string>();

        res.data.messages.forEach((msg: Message) => {
          if (msg.feedback === "like") {
            feedbackState[msg.conversation_id] = "liked";
          } else if (msg.feedback === "disliked") {
            feedbackState[msg.conversation_id] = "disliked";
          }

          // Add reported messages from server using unique key
          if (msg.reported) {
            const messageKey = `${msg.conversation_id}-${msg.date}-${msg.time}`;
            reportedMessagesSet.add(messageKey);
          }
        });

        setMessageReactions(feedbackState);
        setReportedMessages(reportedMessagesSet);
      })
      .catch((res) => {
        if (res.response.data.detail) {
          toast({
            title: "Error",
            description: res.response.data.detail,
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  useEffect(() => {
    setMessages([]);
    setConversationId(0);
    setDisplayedMessages({});
    setPreviousCount(0);
    lastMessageIdRef.current = null;
    setIsLoading(true);
    handleGetMessagesId();
  }, [activeMode]);

  useEffect(() => {
    if (activeMode == "coach") {
      const interval = setInterval(() => {
        handleGetMessagesId();
      }, 15000); // 15 seconds
      return () => clearInterval(interval);
    }

    // Cleanup interval on component unmount or when activeMode changes
  }, [activeMode]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const text = message;
    setIsLoading(true);

    const newMessage: Message = {
      conversation_id: 0,
      date: new Date().toISOString(),
      message_text: text,
      sender_type: "patient",
      time: new Date().toLocaleTimeString(),
      reported: false,
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
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
          const newMessage: Message = {
            conversation_id: res.data.current_conversation_id,
            date: new Date().toISOString(),
            message_text: res.data.answer,
            sender_type: activeMode,
            time: new Date().toLocaleTimeString(),
            reported: false,
            references: allowedChatReferences(res.data.references),
          };
          setMessages((prev) => [...prev, newMessage]);
          // scrollToBottom()
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
        setIsLoading(false);
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

    setMessages((prev) =>
      prev.filter(
        (msg) =>
          !(msg.conversation_id === messageId && msg.sender_type === "ai")
      )
    );

    setIsLoading(true);

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
        setMessages((prev) => [...prev, newMessage]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to regenerate message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

    if (
      lastMsg.sender_type === "ai" &&
      lastMessageIdRef.current === lastMsg.conversation_id &&
      !isRegenerating
    ) {
      setDisplayedMessages((prev) => ({
        ...prev,
        [lastMsg.conversation_id]: lastMsg.message_text,
      }));
      return;
    }

    if (previousCount === 0) {
      const initMessages: Record<number, string> = {};
      messages.forEach((msg) => {
        initMessages[msg.conversation_id] = msg.message_text;
      });
      setDisplayedMessages(initMessages);
      setPreviousCount(messages.length);
      lastMessageIdRef.current = lastMsg.conversation_id;
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
        [lastMsg.conversation_id]: "",
      }));

      const interval = setInterval(() => {
        i++;
        setDisplayedMessages((prev) => ({
          ...prev,
          [lastMsg.conversation_id]: text.slice(0, i),
        }));

        if (i >= text.length) {
          clearInterval(interval);
          setIsRegenerating(false);
        }
      }, 20);

      setPreviousCount(messages.length);
      lastMessageIdRef.current = lastMsg.conversation_id;
    } else if (isNewMessage) {
      setDisplayedMessages((prev) => ({
        ...prev,
        [lastMsg.conversation_id]: lastMsg.message_text,
      }));
      setPreviousCount(messages.length);
      lastMessageIdRef.current = lastMsg.conversation_id;
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

  return (
    <div
      ref={rootRef}
      className="flex flex-col h-full min-h-0 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900/20 relative"
      style={
        keyboardOpen && viewportHeight
          ? { height: `${viewportHeight}px` }
          : undefined
      }
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col px-3 py-2">
        {/* Header */}
        <div className="mb-2 flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
            <MessageCircle className="h-4 w-4 text-white" />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Chat
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeMode === "coach"
                ? "Message your coach"
                : "Not a diagnosis or definitive treatment"}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <SimpleModeSelect
            activeMode={activeMode}
            setActiveMode={setActiveMode}
          />
        </div>

        <div className="mb-2 flex shrink-0 items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-950/70">
          <Shield className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-100">
            Not a diagnosis or definitive treatment. Check with your doctor
            before making medical decisions.
          </p>
        </div>

        {/* Messages */}
        <Card className="min-h-0 flex-1 !border-none !bg-transparent !shadow-none">
          <CardContent className="flex h-full min-h-0 flex-col p-0">
            <div
              ref={messagesContainerRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-2"
              style={{ scrollbarWidth: "thin" }}
            >
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center px-4 py-16 text-center">
                  <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                    <MessageCircle className="h-8 w-8 text-blue-500/70 dark:text-blue-400/70" />
                  </span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Start a conversation
                  </p>
                  <p className="mt-1 max-w-[14rem] text-xs text-gray-500 dark:text-gray-400">
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

                return (
                  <div
                    key={`${messageKey}-${msgIndex}`}
                    className={`flex items-end gap-1.5 ${
                      isPatient ? "justify-end" : "justify-start"
                    } ${isReported ? "opacity-50" : ""}`}
                  >
                    {activeMode === "coach" &&
                      isPatient &&
                      msg.recipient && (
                        <Check className="order-1 mb-2 h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                      )}

                    <div
                      className={`max-w-[85%] group ${
                        isPatient ? "order-2" : "order-1"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 shadow-sm ${
                          isPatient
                            ? "rounded-br-md bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                            : activeMode === "coach"
                              ? "rounded-bl-md border border-emerald-200/50 bg-white dark:border-emerald-800/30 dark:bg-gray-800"
                              : "rounded-bl-md border border-blue-200/50 bg-white dark:border-blue-800/30 dark:bg-gray-800"
                        }`}
                      >
                        <div
                          className={`text-sm leading-relaxed break-words ${
                            isPatient
                              ? "text-white"
                              : "text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {isAI
                            ? displayedMessages[msg.conversation_id] || ""
                            : formatText(msg.message_text)}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p
                            className={`text-[10px] ${
                              isPatient
                                ? "text-blue-100"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {msg.time}
                          </p>

                          {isAI && !isReported && (
                            <div className="flex items-center gap-0.5">
                              {allowedChatReferences(msg.references).length >
                                0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 rounded-lg p-0 text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
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
                                className={`h-8 w-8 rounded-lg p-0 ${
                                  messageReactions[msg.conversation_id] ===
                                  "liked"
                                    ? "text-emerald-600"
                                    : "text-gray-400 hover:text-emerald-600"
                                }`}
                                onClick={() =>
                                  handleMessageReaction(
                                    msg.conversation_id,
                                    "liked"
                                  )
                                }
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 rounded-lg p-0 ${
                                  messageReactions[msg.conversation_id] ===
                                  "disliked"
                                    ? "text-red-600"
                                    : "text-gray-400 hover:text-red-600"
                                }`}
                                onClick={() =>
                                  handleMessageReaction(
                                    msg.conversation_id,
                                    "disliked"
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
                                    className="h-8 w-8 rounded-lg p-0 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-44 rounded-xl"
                                >
                                  {(() => {
                                    const lastAIMessage = messages
                                      .filter((m) => m.sender_type === "ai")
                                      .pop();
                                    const isLastAIMessage =
                                      lastAIMessage?.conversation_id ===
                                      msg.conversation_id;

                                    return isLastAIMessage ? (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleRegenerateMessage(
                                            msg.conversation_id
                                          )
                                        }
                                        className="text-blue-600 dark:text-blue-400"
                                      >
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Regenerate
                                      </DropdownMenuItem>
                                    ) : null;
                                  })()}
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

                          {isAI && isReported && (
                            <span className="flex items-center gap-1 text-[10px] text-red-500">
                              <Flag className="h-3 w-3" />
                              Reported
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && messages.length > 0 && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-gray-200/50 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Thinking…
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-1" />
            </div>
          </CardContent>
        </Card>

        {/* Input */}
        <div
          className="z-20 w-full shrink-0 border-t border-gray-200/60 bg-white/95 pt-2 backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-900/95"
          style={{
            paddingBottom: keyboardOpen
              ? "0.5rem"
              : "max(0.5rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                activeMode === "coach"
                  ? "Message your coach…"
                  : "Ask a wellness question…"
              }
              rows={1}
              className="min-h-[44px] max-h-28 flex-1 resize-none rounded-xl border-gray-200/80 bg-gray-50/80 px-3.5 py-3 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500/30 dark:border-gray-600/80 dark:bg-gray-800/80"
              onFocus={handleInputFocus}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onMouseDown={(e) => e.preventDefault()}
              onClick={sendMessage}
              disabled={!message.trim()}
              size="icon"
              className={`h-11 w-11 flex-shrink-0 rounded-xl shadow-sm transition-all ${
                activeMode === "coach"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              } text-white disabled:opacity-40`}
            >
              <Send className="h-4 w-4" />
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
