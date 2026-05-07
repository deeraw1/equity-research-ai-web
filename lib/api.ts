export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://deeraw-equity-research-ai-api.hf.space";

export async function api<T>(path: string, body?: unknown, method: "GET" | "POST" = "POST"): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
