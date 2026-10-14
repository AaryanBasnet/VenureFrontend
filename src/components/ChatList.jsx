import { useMemo, useState } from "react";
import { MessageCircle, Search } from "lucide-react";

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("") || "V";

const timeLabel = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const minutes = Math.floor((Date.now() - date) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// Conversation list. Shared by the customer and owner chat pages.
export default function ChatList({ chats = [], activeChat, onSelect, currentUserId }) {
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      chats.map((chat) => ({
        chat,
        name: chat.participants.filter((p) => p._id !== currentUserId).map((p) => p.name || "Guest").join(", ") || "Conversation",
      })),
    [chats, currentUserId]
  );
  const shown = rows.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));

  if (rows.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-gold-100 text-gold-800">
          <MessageCircle aria-hidden="true" className="size-6" strokeWidth={1.5} />
        </span>
        <h3 className="mt-4 font-display text-h5 font-normal text-ink">No conversations yet</h3>
        <p className="mt-1 font-body text-small text-taupe">Message a venue from its page and the conversation will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-line p-4">
        <label htmlFor="chat-search" className="sr-only">Search conversations</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-taupe-light" />
          <input
            id="chat-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-full border border-border bg-paper-white py-2.5 pl-10 pr-4 font-body text-small text-charcoal placeholder:text-taupe-light focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
          />
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {shown.length === 0 && <li className="p-6 text-center font-body text-small text-taupe">No conversation matches that name.</li>}
        {shown.map(({ chat, name }) => {
          const active = activeChat?._id === chat._id;
          const unread = chat.unreadCount || 0;
          return (
            <li key={chat._id}>
              <button
                type="button"
                onClick={() => onSelect(chat)}
                aria-current={active ? "true" : undefined}
                className={`flex w-full items-center gap-3 border-b border-line border-l-4 px-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
                  active ? "border-l-gold bg-sand" : "border-l-transparent hover:bg-cream"
                }`}
              >
                <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-full font-display text-h5 ${active ? "bg-ink text-gold-50" : "bg-gold-100 text-gold-800"}`}>
                  {initials(name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-body text-body font-medium text-ink">{name}</span>
                    {(chat.lastMessage?.timestamp || chat.updatedAt) && <span className="shrink-0 font-body text-caption text-taupe">{timeLabel(chat.lastMessage?.timestamp || chat.updatedAt)}</span>}
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate font-body text-small text-taupe">{chat.lastMessage?.text || "Open conversation"}</span>
                    {unread > 0 && (
                      <span className="shrink-0 rounded-full bg-gold-800 px-2 py-0.5 font-body text-caption text-white">
                        <span className="sr-only">{unread} unread, </span>
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
