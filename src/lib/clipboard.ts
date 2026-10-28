/**
 * Clipboard formats compatible with browsers, Teams and rich-text editors.
 * No data leaves the browser: it is written only to the local clipboard.
 */
export function buildClipboardHtml(value: string): string {
  const normalized = value.replace(/\r\n?/g, "\n");
  const escape = (line: string) => line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // Individual paragraphs maintain blank lines and work in rich editors.
  const paragraphs = normalized.split("\n")
    .map(line => `<p style="margin:0;min-height:1em;white-space:pre-wrap;">${escape(line) || "&nbsp;"}</p>`)
    .join("");

  return `<html><body><!--StartFragment--><div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#242424;">${paragraphs}</div><!--EndFragment--></body></html>`;
}

/**
 * Fallback for environments without the async multi-format Clipboard API.
 * Browser-native copy of an editable selection typically exposes both
 * CF_UNICODETEXT and HTML Format to Windows desktop applications.
 */
function copyUsingSelection(plain: string, html: string): boolean {
  if (typeof document === "undefined" || !document.body || !document.execCommand) return false;

  const editor = document.createElement("div");
  editor.contentEditable = "true";
  editor.setAttribute("aria-hidden", "true");
  editor.style.cssText = "position:fixed;top:0;left:-10000px;width:1px;height:1px;overflow:hidden;";
  editor.innerHTML = html;

  const previousActive = document.activeElement;
  const originalSelection = window.getSelection();
  const selectedRanges: Range[] = [];
  if (originalSelection) {
    for (let i = 0; i < originalSelection.rangeCount; i++) {
      selectedRanges.push(originalSelection.getRangeAt(i).cloneRange());
    }
  }

  const handler = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;
    event.clipboardData.setData("text/plain", plain);
    event.clipboardData.setData("text/html", html);
    event.preventDefault();
  };

  document.body.appendChild(editor);
  editor.addEventListener("copy", handler);
  try {
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    editor.removeEventListener("copy", handler);
    editor.remove();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    for (const range of selectedRanges) selection?.addRange(range);
    if (previousActive instanceof HTMLElement) previousActive.focus({ preventScroll: true });
  }
}

/**
 * Prefer native rich clipboard data so web editors / Windows applications can
 * choose text/html or text/plain. This does not reproduce Teams-only private
 * clipboard formats, which cannot be supplied by a normal web application.
 */
export async function copyRichText(value: string): Promise<void> {
  const plain = value.replace(/\r\n?/g, "\r\n");
  const html = buildClipboardHtml(value);

  if (typeof navigator !== "undefined" && navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      const item = new ClipboardItem({
        "text/plain": new Blob([plain], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      });
      await navigator.clipboard.write([item]);
      return;
    } catch {
      // Restricted clipboard permissions or unsupported rich formats.
    }
  }

  // Some older Chromium / corporate browser policies allow a user-gesture
  // selection copy even when the modern multi-format clipboard is blocked.
  if (copyUsingSelection(plain, html)) return;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(plain);
    return;
  }

  throw new Error("No clipboard method is available.");
}
