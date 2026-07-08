import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { answerQuestion } from "@/lib/assistant";

export async function POST(req: NextRequest) {
  let message = "";
  try {
    const body = await req.json();
    message = String(body?.message ?? "");
  } catch {
    return NextResponse.json({ error: { code: "ASSISTANT.BAD_REQUEST", message: "Invalid JSON body." } }, { status: 400 });
  }
  const session = await getSession();
  const reply = await answerQuestion(message, session);
  return NextResponse.json(reply);
}
