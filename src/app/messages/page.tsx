import { redirect } from "next/navigation";
import { markMessageReadAction } from "@/app/actions";
import { EmptyState, PageShell } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default async function MessagesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "MANAGER") redirect("/manager");

  const messages = store.listMessagesForUser(session.id);

  return (
    <PageShell
      title="Messages"
      subtitle="Buyer ↔ Seller contact threads. Opening an unread inbound message marks it as read."
    >
      {messages.length === 0 ? (
        <EmptyState title="No messages yet" body="Contact a buyer or seller from a profile or asset page." />
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const inbound = message.toUserId === session.id;
            return (
              <article key={message.id} className="surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{message.subject}</h3>
                      {inbound && !message.read ? <span className="badge badge-warn">Unread</span> : null}
                      <span className="badge">{inbound ? "Inbound" : "Sent"}</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {inbound ? "From" : "To"}{" "}
                      {inbound
                        ? `${message.fromUser.name} (${message.fromUser.role})`
                        : `${message.toUser.name} (${message.toUser.role})`}
                      {message.asset ? ` · re: ${message.asset.title}` : ""}
                    </p>
                  </div>
                  <div className="text-xs text-[var(--muted)]">{formatDate(message.createdAt)}</div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
                {inbound && !message.read ? (
                  <form
                    className="mt-4"
                    action={async () => {
                      "use server";
                      await markMessageReadAction(message.id);
                    }}
                  >
                    <button className="btn btn-ghost" type="submit">
                      Mark as read
                    </button>
                  </form>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
