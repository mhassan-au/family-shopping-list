import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedUpApiUrl } from "../lib/securityPolicy";

test("UP pagination accepts only the official HTTPS API", () => {
  assert.equal(
    isAllowedUpApiUrl("https://api.up.com.au/api/v1/transactions?page%5Bafter%5D=abc"),
    true,
  );
});

test("UP pagination rejects lookalike hosts and insecure URLs", () => {
  assert.equal(isAllowedUpApiUrl("https://api.up.com.au.evil.example/api/v1/transactions"), false);
  assert.equal(isAllowedUpApiUrl("http://api.up.com.au/api/v1/transactions"), false);
  assert.equal(isAllowedUpApiUrl("https://api.up.com.au@evil.example/api/v1/transactions"), false);
});

test("UP pagination rejects credentials and unrelated paths", () => {
  assert.equal(isAllowedUpApiUrl("https://user:pass@api.up.com.au/api/v1/transactions"), false);
  assert.equal(isAllowedUpApiUrl("https://api.up.com.au/not-the-api"), false);
  assert.equal(isAllowedUpApiUrl("not a URL"), false);
});
