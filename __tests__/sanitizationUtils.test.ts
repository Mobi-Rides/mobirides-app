import {
  removeEventHandlers,
  removeJavascriptUris,
  removeScriptTags,
  sanitizeBasic,
  sanitizeDescription,
  sanitizeEmail,
  sanitizeHtml,
  sanitizeName,
  sanitizePhone,
  sanitizedDescription,
  sanitizedName,
  sanitizedString,
  stripHtmlTags,
} from "@/utils/sanitization";

describe("sanitization utilities", () => {
  it("removes unsafe HTML, script-like tags, event handlers, and risky URI schemes", () => {
    const unsafe = '<script>alert(1)</script><p onclick="run()">Hello</p><a href="javascript:bad()">link</a><img src="data:text/plain,hi">';

    expect(stripHtmlTags(unsafe)).not.toContain("<p");
    expect(removeScriptTags(unsafe)).not.toMatch(/<script/i);
    expect(removeEventHandlers(unsafe)).not.toMatch(/onclick\s*=/i);
    expect(removeJavascriptUris(unsafe)).toContain("#removed:");

    const sanitized = sanitizeHtml(unsafe);
    expect(sanitized).not.toMatch(/<[^>]+>/);
    expect(sanitized).not.toMatch(/onclick\s*=/i);
    expect(sanitized).not.toMatch(/javascript\s*:/i);
    expect(sanitized).not.toMatch(/data\s*:/i);
  });

  it("normalizes basic user input fields", () => {
    expect(sanitizeBasic(" \u0000hello\u0007 ")).toBe("hello");
    expect(sanitizeName("  Alice\u200B <b>Smith</b> ")).toBe("Alice Smith");
    expect(sanitizeDescription(" <p>Clean text</p> ")).toBe("Clean text");
    expect(sanitizeEmail(" USER@Example.COM ")).toBe("user@example.com");
    expect(sanitizePhone("+267 71 234 567 ext 99")).toBe("2677123456799");
  });

  it("applies zod transforms for sanitized schemas", () => {
    expect(sanitizedString().parse("<b>value</b>")).toBe("value");
    expect(sanitizedName().parse("  <span>Jane Doe</span> ")).toBe("Jane Doe");
    expect(sanitizedDescription().parse("<p>Allowed description</p>")).toBe("Allowed description");
  });
});
