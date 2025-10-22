export async function api<T = any>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const res = await fetch(base + path, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
