import { useQuery } from "@tanstack/react-query";
import Application from "@/api/app";
import { queryKeys } from "@/lib/query/keys";
import { sortMessagesChronologically } from "@/lib/chatMessageOrder";

export type ChatMode = "ai" | "coach";

export type ChatMessagesData = {
  conversation_id: number;
  messages: any[];
};

export function useChatMessagesQuery(mode: ChatMode) {
  return useQuery({
    queryKey: queryKeys.chatMessages(mode),
    queryFn: async (): Promise<ChatMessagesData> => {
      const response = await Application.getMessagesId({ message_from: mode });
      return {
        conversation_id: response.data?.conversation_id ?? 1,
        messages: sortMessagesChronologically(response.data?.messages ?? []),
      };
    },
    refetchInterval: mode === "coach" ? 15_000 : false,
    staleTime: mode === "coach" ? 10_000 : 5 * 60_000,
  });
}
