import { describe, expect, test } from "bun:test";
import { buildClipboardHtml } from "./clipboard";

describe("Teams-compatible clipboard HTML", () => {
  test("preserves multiple lines and blank paragraphs", () => {
    const html = buildClipboardHtml("SOT: 12345\n\nREALIZADO POR: Lee Mauricio");
    expect(html).toContain("Segoe UI");
    expect(html).toContain("SOT: 12345");
    expect(html).toContain("REALIZADO POR: Lee Mauricio");
    expect(html).toContain('<p style="margin:0;min-height:1em;white-space:pre-wrap;">&nbsp;</p>');
    expect(html).toContain("<!--StartFragment-->");
  });

  test("escapes user-provided text so copying cannot inject HTML", () => {
    const html = buildClipboardHtml('Cliente: <script>alert("x")</script> & contacto');
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp; contacto");
    expect(html).not.toContain("<script>");
  });

  test("normalizes Windows and Unix newlines to the same HTML", () => {
    expect(buildClipboardHtml("A\r\nB")).toBe(buildClipboardHtml("A\nB"));
  });
});
