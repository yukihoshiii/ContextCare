// Remove only a complete JSON code fence. Never repair values or extract JSON
// from surrounding prose/markup: source quotes must survive byte-for-byte.
export function parseBriefJSON(answer: string): unknown {
  const text = answer.trim();
  const fenced = text.match(/^```(?:json)?[ \t]*(?:\r?\n)?([\s\S]*?)(?:\r?\n)?```$/i);
  return JSON.parse(fenced ? fenced[1].trim() : text);
}
