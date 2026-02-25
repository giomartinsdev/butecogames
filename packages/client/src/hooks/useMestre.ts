import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mestreApi } from "@/api/mestre.js";
import type { MestreConversation, MestreMessage, MestreModelInfo } from "@butecogames/shared";

export function useMestreModels() {
    return useQuery<MestreModelInfo[]>({
        queryKey: ["mestre", "models"],
        queryFn: () => mestreApi.getModels(),
    });
}

export function useMestreConversations() {
    return useQuery<MestreConversation[]>({
        queryKey: ["mestre", "conversations"],
        queryFn: () => mestreApi.listConversations(),
    });
}

export function useMestreConversation(id?: string) {
    return useQuery<{ conversation: MestreConversation; messages: MestreMessage[] }>({
        queryKey: ["mestre", "conversation", id],
        queryFn: () => mestreApi.getConversation(id!),
        enabled: !!id,
    });
}

export function useMestreChat() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: {
            conversationId: string | null;
            content: string;
            modelId: string;
        }) => mestreApi.chat(payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["mestre", "conversations"] });
            if (data.conversation?._id) {
                queryClient.invalidateQueries({
                    queryKey: ["mestre", "conversation", data.conversation._id],
                });
            }
            // Also invalidate wallet to update balance in UI
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
        },
    });
}
