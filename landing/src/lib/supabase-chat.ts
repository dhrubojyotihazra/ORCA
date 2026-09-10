import { supabase } from "./supabase";
import { ChatMessage, ChatSession } from "./chat-store";

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Load all user conversations and their messages from Supabase
 */
export async function loadUserConversations(userId: string): Promise<ChatSession[]> {
  if (!userId || userId === "anonymous") return [];

  try {
    const { data: convs, error } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at, messages(id, role, content, metadata, created_at)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("Error loading conversations from Supabase:", error.message);
      return [];
    }

    if (!convs || !Array.isArray(convs)) return [];

    return convs.map((c: any) => {
      const messagesRaw = Array.isArray(c.messages) ? c.messages : [];
      const messages: ChatMessage[] = messagesRaw
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((m: any) => ({
          id: m.id || generateUUID(),
          role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
          content: m.content || "",
          timestamp: new Date(m.created_at || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          modelUsed: m.metadata?.modelUsed || "ORCA Multi-Agent",
          agentTrace: m.metadata?.agentTrace,
          artifact: m.metadata?.artifact,
        }));

      return {
        id: c.id,
        title: c.title || "Marine Advisory Session",
        createdAt: new Date(c.created_at || Date.now()).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
        model: "ORCA Multi-Agent (LangGraph)",
        statusDotColor: "bg-teal-400",
        messages,
      };
    });
  } catch (err) {
    console.error("Failed to load user conversations from Supabase:", err);
    return [];
  }
}

/**
 * Persist conversation metadata into Supabase
 */
export async function saveConversationToSupabase(
  userId: string,
  conversationId: string,
  title: string
): Promise<boolean> {
  if (!userId || userId === "anonymous" || conversationId === "orca-walkthrough-tutorial") {
    return false;
  }

  try {
    const now = new Date().toISOString();
    const { error } = await supabase.from("conversations").upsert({
      id: conversationId,
      user_id: userId,
      title: title.slice(0, 80),
      updated_at: now,
    });

    if (error) {
      console.warn("Error saving conversation to Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase conversation upsert failed:", err);
    return false;
  }
}

/**
 * Persist a message into Supabase
 */
export async function saveMessageToSupabase(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  if (!conversationId || conversationId === "orca-walkthrough-tutorial") {
    return false;
  }

  try {
    const payload: Record<string, any> = {
      conversation_id: conversationId,
      role,
      content,
      metadata: metadata || {},
    };

    const { error } = await supabase.from("messages").insert(payload);
    if (error) {
      console.warn("Error saving message to Supabase:", error.message);
      return false;
    }

    // Touch conversation updated_at
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return true;
  } catch (err) {
    console.error("Supabase message insert failed:", err);
    return false;
  }
}

/**
 * Delete a conversation and its cascaded messages from Supabase
 */
export async function deleteConversationFromSupabase(conversationId: string): Promise<boolean> {
  if (!conversationId || conversationId === "orca-walkthrough-tutorial") {
    return false;
  }

  try {
    const { error } = await supabase.from("conversations").delete().eq("id", conversationId);
    if (error) {
      console.warn("Error deleting conversation from Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase conversation delete failed:", err);
    return false;
  }
}
