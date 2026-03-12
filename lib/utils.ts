export function esc(s: string | null | undefined): string {
  if (!s) return "";
  const d = document.createElement("span");
  d.textContent = s;
  return d.innerHTML;
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  try {
    return new Date(d + "Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function mdToHtml(t: string): string {
  let h = t
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h3>$1</h3>")
    .replace(/^[•\-*] (.*$)/gm, "<li>$1</li>")
    .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );
  h = h.replace(/((?:<li>.*?<\/li>\n?)+)/g, "<ul>$1</ul>");
  return h
    .split("\n\n")
    .map((b) => {
      b = b.trim();
      if (!b) return "";
      if (b.startsWith("<h3>") || b.startsWith("<ul>")) return b;
      return `<p>${b.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
