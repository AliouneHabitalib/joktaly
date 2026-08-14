import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { MessagesSquare, X } from "lucide-react";
import { askAssistant } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import logoAsset from "@/assets/tera-devis-logo.png.asset.json";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Quels sont vos tarifs ?",
  "Comment créer un devis ?",
  "Puis-je payer avec Wave ?",
];

const WELCOME =
  "Bonjour 👋 Je suis Tera, l'assistant TERA-DEVIS. Posez-moi votre question sur les devis, les factures ou les tarifs.";

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const ask = useServerFn(askAssistant);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await ask({ data: { messages: next.slice(-12) } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Désolé, une erreur est survenue. Réessayez ou écrivez-nous à contact@tera-devis.com.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-x-3 bottom-3 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-5 sm:h-[540px] sm:w-[380px]">
          <div className="flex items-center justify-between gap-3 bg-secondary px-4 py-3 text-secondary-foreground">
            <div className="flex items-center gap-2.5">
              <img src={logoAsset.url} alt="" className="h-8 w-8 rounded-lg bg-card/10 object-contain p-1" />
              <div className="leading-tight">
                <p className="text-sm font-semibold">Assistant Tera</p>
                <p className="flex items-center gap-1.5 text-xs opacity-80">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> En ligne · réponse immédiate
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer le chat"
              className="rounded-full p-1.5 transition-colors hover:bg-card/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Conversation className="flex-1">
            <ConversationContent className="gap-4 p-4">
              <Message from="assistant">
                <MessageContent>
                  <MessageResponse>{WELCOME}</MessageResponse>
                </MessageContent>
              </Message>
              {messages.map((m, i) => (
                <Message key={i} from={m.role}>
                  <MessageContent>
                    <MessageResponse>{m.content}</MessageResponse>
                  </MessageContent>
                </Message>
              ))}
              {loading && (
                <Message from="assistant">
                  <MessageContent>
                    <Shimmer>Tera réfléchit…</Shimmer>
                  </MessageContent>
                </Message>
              )}
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t p-3">
            <PromptInput
              onSubmit={(message, event) => {
                event.preventDefault();
                const text = message.text ?? "";
                void send(text);
                (event.currentTarget as HTMLFormElement).reset();
              }}
            >
              <PromptInputTextarea placeholder="Écrivez votre question…" />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit status={loading ? "submitted" : undefined} disabled={loading} />
              </PromptInputFooter>
            </PromptInput>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Assistant IA ·{" "}
              <Link to="/register" search={{ plan: undefined, cycle: undefined }} className="underline">
                créer un compte gratuit
              </Link>
            </p>
          </div>
        </div>
      )}

      <Button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer l'assistant en ligne" : "Ouvrir l'assistant en ligne"}
        className="fixed bottom-5 right-5 z-40 h-auto gap-2 rounded-full px-4 py-3 shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessagesSquare className="h-5 w-5" />}
        <span className="hidden sm:inline">{open ? "Fermer" : "Assistant en ligne"}</span>
      </Button>
    </>
  );
}
