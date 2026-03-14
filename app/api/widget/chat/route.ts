import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { detectState, trackKeywords } from "@/lib/helpers";
import { US_STATES } from "@/lib/constants";
import { chatCompletion } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { widget_key, message } = body;

    if (!widget_key || !message) {
      return NextResponse.json({ detail: "widget_key and message required" }, { status: 400 });
    }

    const { data: wk } = await supabase
      .from("widget_keys")
      .select("id, user_id, revoked")
      .eq("widget_key", widget_key);

    if (!wk?.length || wk[0].revoked) {
      return NextResponse.json({ detail: "Invalid or revoked widget key" }, { status: 403 });
    }

    trackKeywords(message).catch(() => {});
    const state = detectState(message);

    const contextParts: string[] = [];
    if (state) {
      const { data: laws } = await supabase.from("state_laws").select("title, content").eq("state", state).order("id");
      if (laws?.length) {
        contextParts.push(`=== STATE LAWS FOR ${US_STATES[state] || state} ===`);
        for (const law of laws) contextParts.push(`--- ${law.title} ---\n${law.content}`);
      }
    } else {
      const { data: nw } = await supabase.from("state_laws").select("title, content").eq("state", "NW").order("id");
      if (nw?.length) {
        contextParts.push("=== NATIONWIDE / GENERAL LAWS ===");
        for (const law of nw) contextParts.push(`--- ${law.title} ---\n${law.content}`);
      }
    }

    let systemPrompt = "You are AskAServer.AI, an AI assistant specialized in service of process law. You are NOT a lawyer and cannot provide legal advice.";
    if (contextParts.length) {
      systemPrompt += "\n\nREFERENCE DATA:\n" + contextParts.join("\n\n");
    }

    let aiResponse = "I'm sorry, I couldn't generate a response. Please try again.";
    try {
      aiResponse = await chatCompletion({ system: systemPrompt, messages: [{ role: "user", content: message }], maxTokens: 2000 });
    } catch (err) {
      console.error("Widget chat AI error:", err);
    }

    try {
      await supabase.from("activity_log").insert({
        user_email: `widget:${widget_key}`,
        question: message,
        state_detected: state,
        event_type: "widget_chat",
      });
    } catch { /* non-critical */ }

    return NextResponse.json({ response: aiResponse, state_detected: state });
  } catch {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
