import assert from "node:assert/strict";
import test from "node:test";
import { isSafeNotificationPath, isTrustedPushEndpoint } from "./push-endpoint";

test("accepts standard HTTPS browser push service endpoints", () => {
  assert.equal(isTrustedPushEndpoint("https://fcm.googleapis.com/fcm/send/opaque-token"), true);
  assert.equal(
    isTrustedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/opaque-token"),
    true,
  );
  assert.equal(isTrustedPushEndpoint("https://web.push.apple.com/opaque-token"), true);
});

test("rejects untrusted, plaintext, credentialed, or nonstandard push endpoints", () => {
  assert.equal(isTrustedPushEndpoint("http://fcm.googleapis.com/fcm/send/token"), false);
  assert.equal(isTrustedPushEndpoint("https://127.0.0.1/internal"), false);
  assert.equal(isTrustedPushEndpoint("https://attacker.example/push"), false);
  assert.equal(isTrustedPushEndpoint("https://user:pass@fcm.googleapis.com/push"), false);
  assert.equal(isTrustedPushEndpoint("https://fcm.googleapis.com:8443/push"), false);
});

test("accepts only same-origin notification paths", () => {
  assert.equal(isSafeNotificationPath("/news/latest"), true);
  assert.equal(isSafeNotificationPath("/dashboard?tab=applications"), true);
  assert.equal(isSafeNotificationPath("//attacker.example/phish"), false);
  assert.equal(isSafeNotificationPath("///attacker.example/phish"), false);
  assert.equal(isSafeNotificationPath("/\\\\attacker.example"), false);
  assert.equal(isSafeNotificationPath("https://attacker.example"), false);
});
