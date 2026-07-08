import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Message = {
  role?: string;
  text?: string;
};

type AgentContext = {
  currentDirectory?: string;
  lastCommand?: string;
  lastOutput?: string;
  selectedItem?: string;
  retryCount?: number;
};

function getApiKey(settings: Record<string, unknown>) {
  const direct =
    typeof settings.apiKey === "string" ? settings.apiKey.trim() : "";

  if (direct) return direct;

  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ""
  );
}

async function generateGemini(
  draft: string,
  messages: Message[],
  settings: Record<string, unknown>,
  capabilities: Record<string, unknown>,
  context: AgentContext
) {
  const apiKey = getApiKey(settings);

  if (!apiKey) {
    throw new Error("Gemini API key not found.");
  }

  const model =
    typeof settings.model === "string" && settings.model.trim()
      ? settings.model.trim()
      : "gemini-2.5-flash";

  const history = messages
    .slice(-20)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text ?? "" }],
    }))
    .filter((m) => m.parts[0].text.trim().length > 0);

  const enabledCapabilities = Object.entries(capabilities)
    .filter(([, v]) => Boolean(v))
    .map(([k]) => k);

  const systemInstruction = `
You are Zenvora AI, an autonomous Windows execution agent.

MISSION:
Convert natural language requests into executable Windows terminal commands.

SESSION MEMORY:

Current directory:
${context.currentDirectory || "unknown"}

Last command:
${context.lastCommand || "none"}

Selected item:
${context.selectedItem || "none"}

Last terminal output:
${context.lastOutput || "none"}

RULES:

1. Maintain session memory.
2. Remember the current working directory.
3. Remember the previously selected file/folder.
4. Remember previous command output.
5. When the user says:
   - open it
   - clone it
   - fetch it
   - transfer it
   - check it
   - run it
   - delete it
   - move it

The word "it" refers to:
- selectedItem
- currentDirectory
- previous command result

FAILURE RECOVERY:

If previous output contains:
- "not found"
- "access denied"
- "cannot find"
- "error"
- "failed"

If the user says:
- open it
- open this
- clone it
- fetch it
- transfer it
- check it
- retry
- continue

You MUST use previous conversation context and generate the appropriate shell command.
Never answer with explanations when a shell command can be generated.
Always prefer executable commands.

Then automatically generate a corrected command.

EXECUTION FORMAT:

Always return ONLY one executable block:

\`\`\`execute
command_here
\`\`\`

Examples:

\`\`\`execute
systeminfo
\`\`\`

\`\`\`execute
ipconfig /all
\`\`\`

\`\`\`execute
cd /d "%USERPROFILE%\\Desktop" && dir
\`\`\`

Do NOT explain.
Do NOT write markdown outside execute blocks.
Do NOT write conversational text.

Enabled capabilities:
${enabledCapabilities.join(", ") || "default"}
`.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemInstruction }],
          },
          ...history,
          {
            role: "user",
            parts: [
              {
                text: `User request:\n${draft}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: Number(settings.maxTokens ?? 2048),
          topP: 0.9,
          topK: 40,
        },
      }),
    }
  );

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(raw);
  }

  let data: any;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON returned from Gemini.");
  }

  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text ?? "")
      .join("") || ""
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const draft =
      typeof body.draft === "string"
        ? body.draft
        : "";

    const messages: Message[] =
      Array.isArray(body.messages)
        ? body.messages
        : [];

    const settings =
      typeof body.settings === "object" && body.settings
        ? body.settings
        : {};

    const capabilities =
      typeof body.capabilities === "object" && body.capabilities
        ? body.capabilities
        : {};

    const context: AgentContext =
      typeof body.context === "object" && body.context
        ? body.context
        : {};

    const text = await generateGemini(
      draft,
      messages,
      settings,
      capabilities,
      context
    );

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const words = text.match(/\S+\s*/g) || [];
        let index = 0;

        function send() {
          if (index >= words.length) {
            controller.close();
            return;
          }

          controller.enqueue(
            encoder.encode(words[index])
          );

          index++;
          setTimeout(send, 15);
        }

        send();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Generation failed",
      },
      {
        status: 500,
      }
    );
  }
}