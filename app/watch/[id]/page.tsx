import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/simulation";
import { getConversationGate } from "@/lib/progression";
import { getDialogueById } from "@/lib/dialogues";
import { DialoguePlayer } from "./player";

export default async function WatchDialoguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  // Checked on the server as well as hidden in the index, since the id comes
  // off the URL and a locked scene must not be reachable by typing one.
  const gate = await getConversationGate(session.userId);
  if (!gate.unlocked) redirect("/watch");

  const { id } = await params;
  const dialogue = getDialogueById(id);
  if (!dialogue) notFound();

  return <DialoguePlayer dialogue={dialogue} />;
}
