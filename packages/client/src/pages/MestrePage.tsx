import { useState, useEffect } from "react";
import { MestreSidebar } from "@/components/mestre/MestreSidebar.js";
import { MestreChatArea } from "@/components/mestre/MestreChatArea.js";
import { useMestreConversation, useMestreChat, useMestreModels } from "@/hooks/useMestre.js";
import type { MestreModelInfo } from "@butecogames/shared";
import { toast } from "sonner";
import { Bot } from "lucide-react";

export function MestrePage() {
    const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
    const [selectedModel, setSelectedModel] = useState<MestreModelInfo | null>(null);

    const { data: models, isLoading: isLoadingModels } = useMestreModels();
    const { data: conversationData, isLoading: isLoadingConversation } =
        useMestreConversation(selectedConversationId);
    const chatMutation = useMestreChat();

    useEffect(() => {
        if (models && models.length > 0 && !selectedModel) {
            setSelectedModel(models[0]);
        }
    }, [models, selectedModel]);

    const handleSendMessage = async (content: string) => {
        if (!selectedModel) return;
        try {
            const result = await chatMutation.mutateAsync({
                conversationId: selectedConversationId || null,
                content,
                modelId: selectedModel.id,
            });

            if (!selectedConversationId) {
                setSelectedConversationId(result.conversation._id);
            }
        } catch (error: any) {
            const message = error.response?.data?.error || "Falha ao processar solicitação";
            toast.error(message);
        }
    };

    const messages = conversationData?.messages || [];

    if (isLoadingModels) {
        return (
            <div className="flex h-[calc(100vh-180px)] items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <Bot size={48} className="text-primary" />
                    <p className="text-muted-foreground font-medium">Acordando o Mestre...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-card-foreground">Mestre</h1>
                <p className="mt-1 text-sm text-muted-foreground italic">
                    "Pode perguntar, mas não espere que eu vá te dar a resposta em uma bandeja de prata."
                </p>
            </div>

            <div className="flex-1 flex overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                <MestreSidebar
                    selectedId={selectedConversationId}
                    onSelectConversation={setSelectedConversationId}
                    onNewChat={() => setSelectedConversationId(undefined)}
                    models={models || []}
                    selectedModelId={selectedModel?.id || ""}
                    onSelectModel={setSelectedModel}
                />
                <main className="flex-1 relative overflow-hidden">
                    {selectedModel && (
                        <MestreChatArea
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            isLoading={chatMutation.isPending || isLoadingConversation}
                            selectedModel={selectedModel}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
