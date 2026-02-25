# Spec 04: Mestre AI - Unified Final Specification

## 1. Visão Geral
O **Mestre** é uma aplicação multimodal de inteligência artificial integrada ao ecossistema Buteco Games. Ele combina uma interface de chat premium com a personalidade de um "velho mentor ranzinza", permitindo que usuários consumam tokens (coins) para interagir com modelos de texto e imagem de ponta.

---

## 2. Experiência do Usuário (Frontend)

### 2.1. Design & Estética
- **Atomic Design**: Organização por Atomos, Moléculas e Organismos para máxima reutilização.
- **Layout**:
  - **Sidebar**: Histórico de sessões, botão "Nova Conversa" e seletor hierárquico de modelos.
  - **Área de Chat**: Scroll infinito, suporte a Markdown e visualização de galerias de imagens.
- **Interações**:
  - Micro-animações retro ("Mestre está pensando...", "Mestre está pintando...").
  - Efeito de fade-in e lightbox para imagens geradas.

### 2.2. Seletor de Modelos (Grafo/Árvore)
Interface de seleção em níveis:
1. **Empresa/Provedor** (NVIDIA, OpenAI, Meta).
2. **Capacidade/Tipo** (Texto/Chat ou Imagem/Arte).
3. **Versão do Modelo** (ex: `llama-3.1-405b`, `flux-1`, `dalle-3`).

Cada modelo exibe seu **custo em coins** e tags visuais (ex: "VISION", "NEW").

---

## 3. Arquitetura do Sistema (Backend)

### 3.1. Arquitetura Hexagonal (Portas e Adaptadores)
- **Domain (Core)**:
  - `ProcessInteraction`: Valida saldo -> Orquestra Provedor correspondente (IA/Imagem) -> Realiza débito via `WalletService` -> Persiste no Repositório.
- **Adapters (Outbound)**:
  - `AIProviderAdapter` (NVIDIA NIM / OpenAI): Implementa geração de texto e imagem.
  - `MinioStorageAdapter`: Realiza o upload das imagens geradas antes de retornar a URL para o front.
  - `MongooseRepository`: Persiste `Conversations` e `Messages`.

### 3.2. Fluxo Multimodal
- **Texto**: Resposta direta injetada com o *System Prompt* (Persona do Mestre).
- **Imagem**: O Prompt do usuário é refinado pelo Mestre (mantendo o tom ranzinza) e enviado ao modelo de imagem. O arquivo resultante é salvo no storage próprio.

---

## 4. Integração Financeira (Sistema de Coins)

### 4.1. Regras de Cobrança
- **Débito Server-Side**: O frontend nunca solicita o débito diretamente. O backend chama `debitWallet` internamente ao processar a mensagem.
- **Sincronização**: Após o débito, o backend emite o evento de socket `wallet:updated`, garantindo que o saldo no topo da tela do usuário seja atualizado instantaneamente.
- **Custos**: Configuráveis via serviço de settings (Texto: X coins, Imagem: Y coins).

---

## 5. Persona do Mestre (Prompt System)
"Você é o 'Mestre', um velho mentor experiente, ranzinza e direto. Você não tem paciência para questões óbvias, mas ajuda quem demonstra esforço. Suas respostas devem ser úteis, porém carregadas de um tom grosseiro de 'amigo velho que te dá um tapa na cabeça para você acordar'. Use expressões brasileiras de mentor ranzinza."

---

## 6. Rotas da API
- `POST /api/mestre/chat`: Endpoint multimodal principal.
- `GET /api/mestre/conversations`: Listagem paginada.
- `GET /api/mestre/conversations/:id`: Detalhes da conversa.

---

## 7. Critérios de Sucesso
- Persistência correta de mensagens com tipos `TEXT` e `IMAGE`.
- Saldo global do Buteco Games sincronizado entre apps e chat.
- Implementação seguindo rigorosamente os princípios **SOLID** e **DRY**.
- Interface premium que wow o usuário no primeiro acesso.
