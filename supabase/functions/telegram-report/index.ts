const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type TelegramReportBody = {
  step: number;
  title: string;
  fields?: Record<string, string>;
  image?: {
    fileName: string;
    dataUrl: string;
  };
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const validateBody = (body: unknown): TelegramReportBody | null => {
  if (!body || typeof body !== "object") return null;
  const candidate = body as Partial<TelegramReportBody>;
  if (typeof candidate.step !== "number" || candidate.step < 1 || candidate.step > 20) return null;
  if (typeof candidate.title !== "string" || candidate.title.trim().length < 2 || candidate.title.length > 120) return null;
  if (candidate.fields && (typeof candidate.fields !== "object" || Array.isArray(candidate.fields))) return null;
  if (candidate.image) {
    if (typeof candidate.image.fileName !== "string" || typeof candidate.image.dataUrl !== "string") return null;
    if (!candidate.image.dataUrl.startsWith("data:image/")) return null;
  }
  return candidate as TelegramReportBody;
};

const dataUrlToBlob = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i);
  if (!match) throw new Error("Unsupported image format");
  const [, mimeType, base64] = match;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chatId) {
    return jsonResponse({ error: "Telegram secrets are not configured" }, 500);
  }

  let body: TelegramReportBody | null = null;
  try {
    body = validateBody(await req.json());
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!body) {
    return jsonResponse({ error: "Invalid report payload" }, 400);
  }

  const fieldLines = Object.entries(body.fields ?? {})
    .filter(([, value]) => value && value.trim())
    .map(([key, value]) => `<b>${escapeHtml(key)}:</b> ${escapeHtml(value).slice(0, 900)}`);
  const text = [`<b>RetailEval Application Update</b>`, `<b>Step ${body.step}:</b> ${escapeHtml(body.title)}`, ...fieldLines].join("\n");

  const apiBase = `https://api.telegram.org/bot${token}`;
  const telegramResponse = body.image
    ? await (async () => {
        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("caption", text.slice(0, 1024));
        formData.append("parse_mode", "HTML");
        formData.append("photo", dataUrlToBlob(body.image!.dataUrl), body.image!.fileName);
        return fetch(`${apiBase}/sendPhoto`, { method: "POST", body: formData });
      })()
    : await fetch(`${apiBase}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      });

  const result = await telegramResponse.json();
  if (!telegramResponse.ok || !result.ok) {
    return jsonResponse({ error: "Telegram delivery failed" }, 502);
  }

  return jsonResponse({ ok: true });
});
