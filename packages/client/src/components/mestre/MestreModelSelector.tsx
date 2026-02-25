import { useState, useMemo } from "react";
import type { MestreModelInfo } from "@butecogames/shared";
import { MessageSquare, Image as ImageIcon, ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils.js";

interface Props {
    models: MestreModelInfo[];
    selectedModelId: string;
    onSelect: (model: MestreModelInfo) => void;
}

export function MestreModelSelector({ models, selectedModelId, onSelect }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

    const getProvider = (model: MestreModelInfo) => model?.provider || "NVIDIA NIM";

    const groupedModels = useMemo(() => {
        const groups: Record<string, Record<string, MestreModelInfo[]>> = {};

        models.forEach(model => {
            const provider = getProvider(model);
            const type = model.type === "TEXT" ? "Texto" : "Imagem";

            if (!groups[provider]) groups[provider] = {};
            if (!groups[provider][type]) groups[provider][type] = [];

            groups[provider][type].push(model);
        });

        return groups;
    }, [models]);

    return (
        <div className="relative space-y-2">
            <h4 className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Modelo do Mestre
            </h4>

            {/* Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between rounded-xl p-3 text-left transition-all border border-border shadow-sm",
                    isOpen ? "bg-muted/50 border-primary/30 ring-1 ring-primary/20" : "bg-card hover:bg-muted/30"
                )}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        selectedModel?.type === 'IMAGE' ? "bg-blue-500/20 text-blue-400" : "bg-primary/20 text-primary"
                    )}>
                        {selectedModel?.type === 'IMAGE' ? <ImageIcon size={18} /> : <MessageSquare size={18} />}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-foreground truncate max-w-[140px]">
                            {selectedModel?.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase">
                            {getProvider(selectedModel)} • {selectedModel?.cost} coins
                        </div>
                    </div>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="mt-2 space-y-4 rounded-xl border border-border bg-card/80 p-2 shadow-xl backdrop-blur-md max-h-[400px] overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
                    {Object.entries(groupedModels).map(([provider, types]) => (
                        <div key={provider} className="space-y-3">
                            <ProviderHeader label={provider} />

                            {Object.entries(types).map(([type, items]) => (
                                <div key={type} className="space-y-1 pl-1">
                                    <div className="px-2 mb-1 text-[9px] font-bold text-muted-foreground/60 uppercase">
                                        {type}
                                    </div>
                                    <div className="grid gap-1">
                                        {items.map((model) => (
                                            <ModelItem
                                                key={model.id}
                                                model={model}
                                                isSelected={selectedModelId === model.id}
                                                onClick={() => {
                                                    onSelect(model);
                                                    setIsOpen(false);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ProviderHeader({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 px-2 py-1">
            <div className="h-4 w-1 rounded-full bg-primary" />
            <span className="text-[11px] font-black text-foreground uppercase tracking-tight">{label}</span>
            <div className="h-px flex-1 bg-border/50" />
        </div>
    );
}

function ModelItem({ model, isSelected, onClick }: { model: MestreModelInfo; isSelected: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-all hover:bg-primary/5",
                isSelected ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
        >
            <div className="flex flex-col">
                <span className="text-xs font-semibold">{model.name}</span>
                <div className="flex gap-1 mt-0.5">
                    {model.tags?.map((tag: string) => (
                        <span key={tag} className="text-[8px] px-1 rounded bg-muted font-bold text-muted-foreground uppercase">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-yellow-500 whitespace-nowrap">
                    {model.cost} <span className="text-[8px] opacity-70">coins</span>
                </span>
                {isSelected && <Check size={12} />}
            </div>
        </button>
    );
}

