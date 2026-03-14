import { NextRequest } from "next/server";
import { requireUser, requireVerified, checkRateLimit, recordRateLimit, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";
import { detectState, trackKeywords } from "@/lib/helpers";
import { US_STATES } from "@/lib/constants";
import { chatCompletionStream } from "@/lib/llm";

const SYSTEM_PROMPT_BASE =
  "You are AskAServer.AI, an AI assistant specialized in service of process law. " +
  "You help process servers, attorneys, and legal professionals understand state-specific " +
  "rules for serving legal documents. Always be helpful, accurate, and cite specific laws when possible. " +
  "If you don't have specific information about a state's laws in your context, say so and recommend " +
  "consulting the relevant state statutes directly. You are NOT a lawyer and cannot provide legal advice — " +
  "only informational guidance based on the state law data provided.";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await requireVerified(user);

    if (!["admin", "owner"].includes(user.role)) {
      await checkRateLimit(user.id);
    }

    const body = await request.json();
    const message = body.message || "";
    const chatSessionId = body.chat_session_id || null;

    if (!message || message.length > 4000) {
      return new Response(JSON.stringify({ detail: "Message required (max 4000 chars)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const uid = user.id;
    let sessionId: string;

    if (chatSessionId) {
      const { data: sess } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("id", chatSessionId)
        .eq("user_id", uid);

      if (sess?.length) {
        sessionId = sess[0].id;
      } else {
        const { data: newSess } = await supabase
          .from("chat_sessions")
          .insert({ user_id: uid, title: message.slice(0, 50) })
          .select("id");
        sessionId = newSess![0].id;
      }
    } else {
      const { data: newSess } = await supabase
        .from("chat_sessions")
        .insert({ user_id: uid, title: message.slice(0, 50) })
        .select("id");
      sessionId = newSess![0].id;
    }

    await supabase.from("messages").insert({
      chat_session_id: sessionId,
      role: "user",
      content: message,
    });

    trackKeywords(message).catch(() => {});

    const state = detectState(message);

    try {
      await supabase.from("activity_log").insert({
        user_email: user.email || "",
        question: message,
        state_detected: state,
        event_type: "question",
      });
    } catch { /* non-critical */ }

    const contextParts: string[] = [];

    if (state) {
      const { data: laws } = await supabase
        .from("state_laws")
        .select("title, content")
        .eq("state", state)
        .order("id");
      if (laws?.length) {
        contextParts.push(`=== STATE LAWS FOR ${US_STATES[state] || state} ===`);
        for (const law of laws) {
          contextParts.push(`--- ${law.title} ---\n${law.content}`);
        }
      }
    } else {
      const { data: nwLaws } = await supabase
        .from("state_laws")
        .select("title, content")
        .eq("state", "NW")
        .order("id");
      if (nwLaws?.length) {
        contextParts.push("=== NATIONWIDE / GENERAL LAWS ===");
        for (const law of nwLaws) {
          contextParts.push(`--- ${law.title} ---\n${law.content}`);
        }
      }
    }

    try {
      const { data: blogPosts } = await supabase
        .from("blog_posts")
        .select("title, body")
        .eq("status", "published")
        .eq("train_ai", true)
        .order("score", { ascending: false })
        .limit(10);

      const qLower = message.toLowerCase();
      const words = new Set(qLower.split(/\s+/).filter((w: string) => w.length > 3));
      const matched: typeof blogPosts = [];
      for (const bp of blogPosts || []) {
        const tl = (bp.title || "").toLowerCase();
        const bl = (bp.body || "").toLowerCase();
        for (const w of words) {
          if (tl.includes(w) || bl.includes(w)) {
            matched.push(bp);
            break;
          }
        }
        if (matched.length >= 3) break;
      }

      if (matched.length) {
        contextParts.push("=== RELATED BLOG CONTENT (supplemental) ===");
        for (const bp of matched) {
          contextParts.push(`--- ${bp.title} ---\n${(bp.body || "").slice(0, 500)}`);
        }
      }
    } catch { /* non-critical */ }

    const { data: historyData } = await supabase
      .from("messages")
      .select("role, content")
      .eq("chat_session_id", sessionId)
      .order("id");

    let systemPrompt = SYSTEM_PROMPT_BASE;
    if (contextParts.length) {
      systemPrompt += "\n\nREFERENCE DATA (use this to answer questions):\n" + contextParts.join("\n\n");
    }

    const llmMessages = (historyData || []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    let directoryResults: Record<string, string>[] = [];
    if (state) {
      try {
        const { data: notes } = await supabase
          .from("company_notes")
          .select("company_name, website_url, notes, logo_url")
          .eq("state", state)
          .order("id");
        directoryResults = (notes || []).map((n) => ({
          company_name: n.company_name || "",
          website_url: n.website_url || "",
          notes: n.notes || "",
          logo_url: n.logo_url || "",
        }));
      } catch { /* non-critical */ }
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        send("meta", {
          chat_session_id: sessionId,
          directory_results: directoryResults,
          featured_companies: [],
          state_detected: state,
        });

        let fullResponse = "";

        try {
          const tokenStream = chatCompletionStream({
            system: systemPrompt,
            messages: llmMessages,
            maxTokens: 2000,
          });

          for await (const token of tokenStream) {
            fullResponse += token;
            send("token", { text: token });
          }
        } catch (err) {
          console.error("AI chat stream error:", err);
          if (!fullResponse) {
            fullResponse = "I'm sorry, I couldn't generate a response. Please try again.";
            send("token", { text: fullResponse });
          }
        }

        send("done", {});

        await supabase.from("messages").insert({
          chat_session_id: sessionId,
          role: "assistant",
          content: fullResponse,
        });

        try {
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("chat_session_id", sessionId);
          if ((count || 0) <= 2) {
            await supabase
              .from("chat_sessions")
              .update({ title: message.slice(0, 50) })
              .eq("id", sessionId);
          }
        } catch { /* non-critical */ }

        if (!["admin", "owner"].includes(user.role)) {
          recordRateLimit(uid).catch(() => {});
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
