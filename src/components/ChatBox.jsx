import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Clock, Loader2, Send, MessageCircle } from "lucide-react";

const timeOf = (t) => (t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
const senderId = (msg) => (typeof msg.sender === "object" ? msg.sender?._id : msg.sender);
const senderName = (msg) => (typeof msg.sender === "object" ? msg.sender?.name : null) || "Guest";
const initials = (name) => name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "V";

function Ticks({ status }) {
  const label = { sent: "Sent", delivered: "Delivered", read: "Read" }[status] ?? "Sending";
  const Icon = status === "sent" ? Check : status === "delivered" || status === "read" ? CheckCheck : Clock;
  return (
    <span title={label}>
      <Icon aria-hidden="true" className={`size-3 ${status === "read" ? "text-gold" : "text-gold-200/70"}`} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

// Message thread and composer. Shared by the customer and owner chat pages.
export default function ChatBox({ messages = [], onSend, currentUserId, isTyping = false, loading = false, error = false, onRetry }) {
  const [text, setText] = useState("");
  const logRef = useRef(null);
  const areaRef = useRef(null);

  useEffect(() => {
    // Scroll only the message list, never the whole page.
    const log = logRef.current;
    if (!log) return;
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    log.scrollTo({ top: log.scrollHeight, behavior: calm ? "auto" : "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const send = () => {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  };

  return (
    <div className="flex h-full flex-col bg-cream">
      <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6" role="log" aria-live="polite" aria-label="Messages">
        {loading && messages.length === 0 ? (
          <div role="status" className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Loader2 aria-hidden="true" className="size-6 animate-spin text-gold-800" />
            <p className="font-body text-small text-taupe">Loading messages</p>
          </div>
        ) : error && messages.length === 0 ? (
          <div role="alert" className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-display text-h5 font-normal text-ink">We could not load this conversation</p>
            <p className="mt-1 font-body text-small text-taupe">Please check your connection and try again.</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex min-h-11 items-center rounded-full border border-gold-800 bg-gold-800 px-6 font-body text-button uppercase text-white transition-colors hover:border-gold hover:bg-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Try again
              </button>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-gold-100 text-gold-800">
              <MessageCircle aria-hidden="true" className="size-6" strokeWidth={1.5} />
            </span>
            <p className="mt-4 font-display text-h5 font-normal text-ink">Start the conversation</p>
            <p className="mt-1 max-w-xs font-body text-small text-taupe">Send a message to say hello. Replies appear here as they arrive.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const mine = senderId(msg) === currentUserId;
            const first = i === 0 || (senderId(messages[i - 1]) === currentUserId) !== mine;
            const name = mine ? "You" : senderName(msg);
            return (
              <div key={msg._id ?? i} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <span
                  aria-hidden="true"
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full font-body text-caption ${first ? (mine ? "bg-ink text-gold-50" : "bg-gold-100 text-gold-800") : "invisible"}`}
                >
                  {initials(name)}
                </span>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 sm:max-w-md ${mine ? "rounded-br-md bg-ink text-gold-50" : "rounded-bl-md border border-line bg-white text-ink"}`}>
                  {!mine && first && <p className="mb-0.5 font-body text-caption font-medium text-gold-800">{name}</p>}
                  <p className="whitespace-pre-wrap break-words font-body text-small">{msg.text}</p>
                  <p className={`mt-1 flex items-center justify-end gap-1.5 font-body text-caption ${mine ? "text-gold-200/80" : "text-taupe"}`}>
                    {timeOf(msg.timestamp)}
                    {mine && <Ticks status={msg.status} />}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <p className="flex items-center gap-2 font-body text-caption text-taupe" role="status">
            <span aria-hidden="true" className="flex gap-1">
              {[0, 1, 2].map((d) => (
                <span key={d} className="size-1.5 animate-bounce rounded-full bg-gold" style={{ animationDelay: `${d * 0.12}s` }} />
              ))}
            </span>
            Typing
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-3 border-t border-line bg-white p-3 sm:p-4"
      >
        <label htmlFor="chat-message" className="sr-only">Type your message</label>
        <textarea
          id="chat-message"
          ref={areaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type your message"
          className="max-h-32 min-h-11 w-full resize-none rounded-card-md border border-border-strong bg-paper-white px-4 py-3 font-body text-small text-charcoal placeholder:text-taupe focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Send message"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-gold-50 transition-colors hover:bg-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-taupe"
        >
          <Send aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </button>
      </form>
    </div>
  );
}
