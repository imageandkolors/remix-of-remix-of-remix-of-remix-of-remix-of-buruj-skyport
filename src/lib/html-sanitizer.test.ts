import assert from "node:assert/strict";
import test from "node:test";
import { cleanHtml } from "./html-sanitizer";

test("removes scripts and event-handler attributes", () => {
  const html = cleanHtml(
    "<p>Safe</p><script>alert(1)</script><img src=x onerror=alert(1)><svg onload=alert(2)></svg>",
  );
  assert.match(html, /<p>Safe<\/p>/);
  assert.doesNotMatch(html, /<script|onerror|onload|<svg/i);
});

test("removes unsafe URL schemes while preserving safe links", () => {
  const html = cleanHtml(
    '<a href="javascript:alert(1)">unsafe</a><a href="https://example.com" target="_blank">safe</a>',
  );
  assert.doesNotMatch(html, /javascript:/i);
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test("retains approved article markup and trusted video embeds", () => {
  const html = cleanHtml(
    '<h2>Story</h2><iframe src="https://www.youtube-nocookie.com/embed/abc" title="Clip"></iframe>',
  );
  assert.match(html, /<h2>Story<\/h2>/);
  assert.match(html, /youtube-nocookie\.com\/embed\/abc/);
});

test("drops untrusted iframe hosts", () => {
  const html = cleanHtml('<iframe src="https://attacker.example/payload"></iframe>');
  assert.doesNotMatch(html, /src=|attacker\.example/i);
});
