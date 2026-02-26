import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, Download } from "lucide-react";
import type { MasterMessage } from "@butecogames/shared";
import { cn } from "@/lib/utils.js";

interface Props {
    message: MasterMessage;
    isLast?: boolean;
}

export function MasterMessageItem({ message }: Props) {
    const isUser = message.role === "USER";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "flex w-full gap-4 max-w-4xl mx-auto",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            <div
                className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm border",
                    isUser
                        ? "bg-muted border-border"
                        : "bg-primary border-primary/20 text-primary-foreground"
                )}
            >
                {isUser ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div
                className={cn(
                    "flex flex-col gap-2 max-w-[85%]",
                    isUser ? "items-end" : "items-start"
                )}
            >
                <div
                    className={cn(
                        "rounded-2xl px-4 py-3 shadow-sm",
                        isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border text-card-foreground"
                    )}
                >
                    {message.type === "IMAGE" && message.imageUrl ? (
                        <div className="space-y-3 group">
                            <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted w-[300px] sm:w-[400px]">
                                <img
                                    src={message.imageUrl}
                                    alt="Gerada pelo Mestre"
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={message.imageUrl}
                                        download={`mestre-ia-${new Date().getTime()}.jpg`}
                                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors flex items-center gap-2 px-4"
                                        title="Baixar imagem"
                                    >
                                        <Download size={20} />
                                        <span className="text-xs font-bold uppercase">Download</span>
                                    </a>
                                </div>
                            </div>
                            <p className="text-sm italic opacity-80">{message.content}</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                    {message.role === "ASSISTANT" ? (
                        <>Mestre ({message.aiModel?.split('/').pop()})</>
                    ) : "Você"} • {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {message.cost} coins
                </span>
            </div>
        </motion.div>
    );
}
