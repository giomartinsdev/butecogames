import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { masterApi } from "@/api/master.js";
import type { MasterConversation, MasterMessage, MasterModelInfo } from "@butecogames/shared";

export function useMasterModels() {
    return useQuery<MasterModelInfo[]>({
        queryKey: ["master", "models"],
        queryFn: () => masterApi.getModels(),
    });
}

export function useMasterConversations() {
    return useQuery<MasterConversation[]>({
        queryKey: ["master", "conversations"],
        queryFn: () => masterApi.listConversations(),
    });
}

export function useMasterConversation(id?: string) {
    return useQuery<{ conversation: MasterConversation; messages: MasterMessage[] }>({
        queryKey: ["master", "conversation", id],
        queryFn: () => masterApi.getConversation(id!),
        enabled: !!id,
    });
}

export function useMasterChat() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: {
            conversationId: string | null;
            content: string;
            modelId: string;
        }) => masterApi.chat(payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["master", "conversations"] });
            if (data.conversation?._id) {
                queryClient.invalidateQueries({
                    queryKey: ["master", "conversation", data.conversation._id],
                });
            }
            // Also invalidate wallet to update balance in UI
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
        },
    });
}
