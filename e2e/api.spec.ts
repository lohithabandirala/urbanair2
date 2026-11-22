import { expect, test } from "@playwright/test";

test.describe("API contract and security headers", () => {
  test("health probe exposes status and boolean provider flags only", async ({
    request,
  }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const body = (await response.json()) as {
      ok: boolean;
      data: {
        status: string;
        version: string;
        providers: Record<string, unknown>;
      };
    };

    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(body.data.version).toMatch(/^\d+\.\d+\.\d+$/);
    for (const value of Object.values(body.data.providers)) {
      expect(typeof value).toBe("boolean");
    }
  });

  test("rejects out-of-range coordinates before calling upstream", async ({
    request,
  }) => {
    const air = await request.get("/api/air?lat=999&lon=0");
    expect(air.status()).toBe(400);

    const weather = await request.get("/api/weather?lat=999&lon=0");
    expect(weather.status()).toBe(400);
  });

  test("rejects malformed geocode queries", async ({ request }) => {
    const missing = await request.get("/api/geocode");
    expect(missing.status()).toBe(400);

    const injected = await request.get(
      `/api/geocode?q=${encodeURIComponent("<script>alert(1)</script>")}`,
    );
    expect(injected.status()).toBe(400);

    const body = (await injected.json()) as {
      ok: boolean;
      error: { code: string };
    };
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("invalid_input");
  });

  test("rejects an invalid assistant payload without touching the model", async ({
    request,
  }) => {
    const response = await request.post("/api/assistant", {
      data: { question: "hi" },
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false });
  });

  test("serves a strict CSP and hardening headers on pages and APIs", async ({
    request,
  }) => {
    for (const path of ["/", "/api/health"]) {
      const response = await request.get(path);
      const headers = response.headers();

      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["referrer-policy"]).toBe(
        "strict-origin-when-cross-origin",
      );

      const csp = headers["content-security-policy"];
      expect(csp).toBeTruthy();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
    }
  });

  test("API responses are not cached by the browser", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.headers()["cache-control"]).toContain("no-store");
  });
});
