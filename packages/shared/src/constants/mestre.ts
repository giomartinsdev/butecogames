import type { MestreModelInfo } from "../types/mestre.js";

export const MESTRE_MODELS: MestreModelInfo[] = [
    // Text Models
    {
        id: "meta/llama-3.3-70b-instruct",
        name: "Llama 3.3 70B",
        provider: "Meta",
        type: "TEXT",
        cost: 250,
        tags: ["POWERFUL", "PREMIUM"],
    },
    {
        id: "meta/llama-3.1-8b-instruct",
        name: "Llama 3.1 8B",
        provider: "Meta",
        type: "TEXT",
        cost: 125,
        tags: ["BASIC"],
    },
    {
        id: "minimaxai/minimax-m2.1",
        name: "MiniMax M2.1",
        provider: "MiniMax",
        type: "TEXT",
        cost: 150,
        tags: ["SMART"],
    },
    {
        id: "z-ai/glm5",
        name: "GLM-5",
        provider: "Zhipu",
        type: "TEXT",
        cost: 400,
        tags: ["FLAGSHIP"],
    },
    {
        id: "moonshotai/kimi-k2.5",
        name: "Kimi k2.5",
        provider: "Moonshot",
        type: "TEXT",
        cost: 200,
        tags: ["SMART", "ADVANCED"],
    },
    {
        id: "deepseek-ai/deepseek-v3.2",
        name: "DeepSeek V3",
        provider: "DeepSeek",
        type: "TEXT",
        cost: 180,
        tags: ["POWERFUL", "MOE"],
    },
    {
        id: "nvidia/nvidia-nemotron-nano-9b-v2",
        name: "Nemotron Nano 9B",
        provider: "NVIDIA",
        type: "TEXT",
        cost: 100,
        tags: ["FAST", "LITE"],
    },
    // Image Models
    {
        id: "black-forest-labs/flux-1-schnell",
        name: "Flux.1 Schnell",
        provider: "Black Forest",
        type: "IMAGE",
        cost: 500,
        tags: ["MASTERPIECE"],
    },
    {
        id: "stabilityai/stable-diffusion-3-medium",
        name: "SD 3 Medium",
        provider: "Stability AI",
        type: "IMAGE",
        cost: 350,
        tags: ["ART"],
    },
];

export const MESTRE_SYSTEM_PROMPT =
    "Você é o 'Mestre', um velho mentor experiente, ranzinza e direto. Você não tem paciência para questões óbvias, mas ajuda quem demonstra esforço. Suas respostas devem ser úteis, porém carregadas de um tom grosseiro de 'amigo velho que te dá um tapa na cabeça para você acordar'. Use expressões brasileiras de mentor ranzinza mas nao seja muito ofensivo.";
