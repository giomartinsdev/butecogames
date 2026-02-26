import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Bot, Brain } from "lucide-react";
import { motion } from "framer-motion";
import type { MasterMessage, MasterModelInfo } from "@butecogames/shared";
import { cn } from "@/lib/utils.js";
import { MasterMessageItem } from "./MasterMessageItem.js";

interface Props {
    messages: MasterMessage[];
    onSendMessage: (content: string) => void;
    isLoading: boolean;
    selectedModel: MasterModelInfo;
}

export function MasterChatArea({ messages, onSendMessage, isLoading, selectedModel }: Props) {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const groupedMessages = useMemo(() => {
        const groups: Record<string, MasterMessage[]> = {};

        [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .forEach(msg => {
                const dateKey = new Date(msg.createdAt).toDateString();
                if (!groups[dateKey]) groups[dateKey] = [];
                groups[dateKey].push(msg);
            });

        return Object.entries(groups).map(([date, msgs]) => ({ date, messages: msgs }));
    }, [messages]);

    const formatHeaderDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (dateString === today) return "Hoje";
        if (dateString === yesterday) return "Ontem";

        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input.trim());
        setInput("");
    };

    return (
        <div className="flex h-full flex-col bg-background/50">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-border bg-card/30 px-6 py-3 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-foreground">O Mestre</h2>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-tighter">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            Pronto para reclamar
                        </div>
                    </div>
                </div>
                <div className="hidden items-center gap-4 sm:flex">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">Modelo Ativo</span>
                        <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                            <Brain size={12} />
                            {selectedModel.name}
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar space-y-8">
                {messages.length === 0 && !isLoading ? (
                    <EmptyState />
                ) : (
                    groupedMessages.map((group) => (
                        <div key={group.date} className="space-y-8">
                            <DateSeparator label={formatHeaderDate(group.date)} />
                            {group.messages.map((msg) => (
                                <MasterMessageItem key={msg._id || msg.createdAt} message={msg} />
                            ))}
                        </div>
                    ))
                )}

                {isLoading && <LoadingMessage modelType={selectedModel.type} />}
            </div>

            {/* Input */}
            <div className="border-t border-border bg-card/30 p-4 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="mx-auto flex max-w-4xl gap-2 relative">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={selectedModel.type === "IMAGE" ? "Descreva a imagem..." : "Pergunte ao Mestre..."}
                        className="flex-1 rounded-2xl border border-border bg-background px-4 py-4 pr-14 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                        <Send size={18} />
                    </button>
                </form>
                <p className="mt-2 text-center text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                    Pressione Enter para enviar • O Mestre cobra caro
                </p>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center">
                <Bot size={32} />
            </div>
            <div className="space-y-1">
                <h3 className="font-bold">Nenhuma mensagem ainda</h3>
                <p className="text-sm max-w-xs">Não fique aí parado, o Mestre não tem o dia todo. Pergunte logo algo útil.</p>
            </div>
        </div>
    );
}

function DateSeparator({ label }: { label: string }) {
    return (
        <div className="flex items-center justify-center">
            <div className="h-px flex-1 bg-border/50" />
            <span className="mx-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded-md">
                {label}
            </span>
            <div className="h-px flex-1 bg-border/50" />
        </div>
    );
}

function LoadingMessage({ modelType }: { modelType: string }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full gap-4 max-w-4xl mx-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot size={16} />
            </div>
            <div className="flex flex-col gap-2 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center h-5">
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                    <span className="text-xs text-muted-foreground ml-2 font-medium">
                        {modelType === 'IMAGE' ? 'Mestre está pintando...' : 'Mestre está pensando...'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}


