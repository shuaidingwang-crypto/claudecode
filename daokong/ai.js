// AI helpers for auto-tagging and picking a jar's highlight.
// Order of preference: the claude.ai artifact runtime (when the page is hosted there),
// then the user's own Anthropic API key (kept only in this browser), else null so callers fall back to keywords.

const KEY_STORE = "daokong-api-key";
const MODEL = "claude-opus-5-5";

export function getApiKey() {
  try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; }
}
export function setApiKey(key) {
  try { key ? localStorage.setItem(KEY_STORE, key) : localStorage.removeItem(KEY_STORE); } catch { /* storage blocked */ }
  client = null;
}

let samplerP = null;
function artifactSampler() {
  if (!samplerP) {
    samplerP = window.claude && window.claude.use
      ? window.claude.use("sample").catch(() => null)
      : Promise.resolve(null);
  }
  return samplerP;
}

let client = null;
async function sdkClient() {
  const key = getApiKey();
  if (!key) return null;
  if (!client) {
    const { default: Anthropic } = await import("./vendor/anthropic-sdk.mjs");
    // The key never leaves this device except to api.anthropic.com; this is a single-user app.
    client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 1 });
  }
  return client;
}

/** True when some AI route exists (artifact runtime or an API key). */
export async function aiAvailable() {
  return !!(await artifactSampler()) || !!getApiKey();
}

/**
 * Ask for a JSON answer matching `schema`. Resolves to the parsed object,
 * or null when no AI route is available or the model declined.
 * effort: "low" for quick classification, "medium" for judgement calls.
 */
export async function askJSON(prompt, schema, effort = "low") {
  const sample = await artifactSampler();
  if (sample) return sample.json(prompt, { modelTier: effort === "low" ? "quick" : "default" });

  const c = await sdkClient();
  if (!c) return null;
  const res = await c.beta.messages.create({
    model: MODEL,
    max_tokens: 4096,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort, format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") return null;
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return JSON.parse(text);
}

/** One small call to check that the saved key works. Resolves to "ok" or an error message for the user. */
export async function testKey() {
  const c = await sdkClient();
  if (!c) return "还没有填 API key。";
  try {
    const r = await askJSON(
      "回 JSON：{\"ok\": true}",
      { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false },
      "low"
    );
    return r && r.ok ? "ok" : "连上了，但回答不对，自动分类可能不稳定。";
  } catch (e) {
    const status = e && e.status;
    if (status === 401) return "key 不对，请检查后重新粘贴。";
    if (status === 429) return "请求太频繁或额度用完了，稍后再试。";
    if (status) return "连接失败（" + status + "）。";
    return "连不上 Anthropic，检查一下网络。";
  }
}
