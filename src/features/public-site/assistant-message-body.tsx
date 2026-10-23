import { Fragment } from "react";
import { legalAssistantCopy } from "@/content/legal-assistant-copy";

const draftLabels = Object.values(legalAssistantCopy).map(copy => copy.draft as string);

// Deliberately limited presentation syntax. No HTML, links, images or executable markup.
function inline(text: string) {
  return text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g).map((part, index) =>
    part.startsWith("`") && part.endsWith("`") ? <code key={index}>{part.slice(1, -1)}</code>
      : part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong>
        : <Fragment key={index}>{part}</Fragment>);
}

export function assistantDisplayLines(body: string, draftLabel: string) {
  // Repair unmistakable escaped paragraph/list separators, not path fragments such as C:\notes.
  const normalized = body.split(/(```[\s\S]*?```|`[^`\n]+`)/g).map((part, index) => index % 2 ? part : part
    .replace(/\\r\\n/g, "\\n")
    .replace(/\\n(?=\\n|\s|[-*#] |\d+[.)] )/g, "\n")
    .replace(/\n\\n/g, "\n\n")).join("");
  let draftSeen = false;
  return normalized.replace(/\r\n?/g, "\n").split("\n").filter(line => {
    const plain = line.trim().replace(/^#{1,6}\s+/, "").replace(/^\*\*(.*?)\*\*$/, "$1");
    if (plain !== draftLabel && !draftLabels.includes(plain)) return true;
    if (draftSeen) return false;
    draftSeen = true;
    return true;
  });
}

export function AssistantMessageBody({ body, draftLabel }: { body: string; draftLabel: string }) {
  const lines = assistantDisplayLines(body, draftLabel);
  const hasDraftLabel = lines.some(line => draftLabels.includes(line.trim()) || line.trim() === draftLabel);
  const blocks = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (!line) continue;
    if (line.startsWith("```")) {
      const code = [];
      while (++index < lines.length && !lines[index].trim().startsWith("```")) code.push(lines[index]);
      blocks.push(<pre key={index} dir="auto"><code>{code.join("\n")}</code></pre>);
      continue;
    }
    const list = line.match(/^(?:([-*])|(\d+)[.)])\s+(.+)$/);
    if (list) {
      const ordered = !!list[2], items = [];
      let next = list;
      do {
        items.push(<li key={index} value={ordered ? Number(next[2]) : undefined}>{inline(next[3])}</li>);
        const candidate = lines[index + 1]?.trim().match(/^(?:([-*])|(\d+)[.)])\s+(.+)$/);
        if (!candidate || !!candidate[2] !== ordered) break;
        next = candidate;
        index++;
      } while (true);
      blocks.push(ordered ? <ol key={index} dir="auto">{items}</ol> : <ul key={index} dir="auto">{items}</ul>);
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+?)(?:\s+#+)?$/) ?? line.match(/^\*\*([^*]+)\*\*$/);
    const title = heading && hasDraftLabel ? heading[1].replace(/\s*\((?:preliminary|مسودة أولية)\)\s*$/i, "") : heading?.[1];
    blocks.push(heading ? <p key={index} className="consultation-response-heading" dir="auto"><strong>{inline(title!)}</strong></p>
      : <p key={index} dir="auto">{inline(line)}</p>);
  }
  return <div className="consultation-response">{blocks}</div>;
}
