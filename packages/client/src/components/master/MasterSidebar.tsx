import { useState, useMemo } from "react";
import { Plus, History, ChevronRight } from "lucide-react";
import { useMasterConversations } from "@/hooks/useMaster.js";
import type { MasterConversation, MasterModelInfo } from "@butecogames/shared";
import { cn } from "@/lib/utils.js";
import { MasterModelSelector } from "./MasterModelSelector.js";

interface Props {
    selectedId?: string;
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    models: MasterModelInfo[];
    selectedModelId: string;
    onSelectModel: (model: MasterModelInfo) => void;
}

interface GroupedConversations {
    label: string;
    items: MasterConversation[];
}

export function MasterSidebar({
    selectedId,
    onSelectConversation,
    onNewChat,
    models,
    selectedModelId,
    onSelectModel,
}: Props) {
    const { data: conversations, isLoading } = useMasterConversations();
    const [showAll, setShowAll] = useState(false);

    const groupedConversations = useMemo<GroupedConversations[]>(() => {
        if (!conversations) return [];

        let displayConvs = showAll ? conversations : conversations.slice(0, 5);

        // Ensure selected conversation is always visible
        if (!showAll && selectedId && !displayConvs.some(c => c._id === selectedId)) {
            const selectedConv = conversations.find(c => c._id === selectedId);
            if (selectedConv) displayConvs = [...displayConvs, selectedConv];
        }

        const groups: Record<string, MasterConversation[]> = {
            "Hoje": [],
            "Ontem": [],
            "Últimos 7 dias": [],
            "Últimos 30 dias": [],
            "Anteriores": []
        };

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        displayConvs.forEach(conv => {
            const date = new Date(conv.lastMessageAt || conv.createdAt);
            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) groups["Hoje"].push(conv);
            else if (diffDays === 1) groups["Ontem"].push(conv);
            else if (diffDays <= 7) groups["Últimos 7 dias"].push(conv);
            else if (diffDays <= 30) groups["Últimos 30 dias"].push(conv);
            else groups["Anteriores"].push(conv);
        });

        return Object.entries(groups)
            .filter(([_, items]) => items.length > 0)
            .map(([label, items]) => ({ label, items }));
    }, [conversations, showAll, selectedId]);

    return (
        <div className="flex h-full w-80 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
            <div className="p-4">
                <button
                    onClick={onNewChat}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                >
                    <Plus size={18} className="transition-transform group-hover:rotate-90" />
                    Nova Conversa
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                <div className="mb-4">
                    <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                        <History size={14} />
                        Histórico
                    </h4>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {groupedConversations.length > 0 ? (
                                <>
                                    {groupedConversations.map((group: GroupedConversations) => (
                                        <div key={group.label} className="space-y-1">
                                            <h5 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                                {group.label}
                                            </h5>
                                            {group.items.map((conv: MasterConversation) => (
                                                <button
                                                    key={conv._id}
                                                    onClick={() => onSelectConversation(conv._id)}
                                                    className={cn(
                                                        "group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                                                        selectedId === conv._id
                                                            ? "bg-muted font-medium text-foreground"
                                                            : "text-muted-foreground/80"
                                                    )}
                                                >
                                                    <span className="truncate flex-1">{conv.title}</span>
                                                    <ChevronRight
                                                        size={14}
                                                        className={cn(
                                                            "opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100",
                                                            selectedId === conv._id && "opacity-100"
                                                        )}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    ))}

                                    {(conversations?.length || 0) > 5 && (
                                        <button
                                            onClick={() => setShowAll(!showAll)}
                                            className="w-full text-center py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                        >
                                            {showAll ? "Ver menos" : "Ver todas"}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                                    Nenhuma conversa encontrada.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-border pt-6 pb-4">
                    <MasterModelSelector
                        models={models}
                        selectedModelId={selectedModelId}
                        onSelect={onSelectModel}
                    />
                </div>
            </div>
        </div>
    );
}
