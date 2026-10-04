export async function streamAi(
  body: unknown,
  onText: (full: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    let msg = `AI request failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {}
    if (res.status === 402) msg = "AI credits are used up. Add credits to continue.";
    if (res.status === 429) msg = "Too many AI requests — try again in a moment.";
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += dec.decode(value, { stream: true });
    onText(full);
  }
  if (!full.trim()) throw new Error("AI returned no answer. Try again later.");
  return full;
}
