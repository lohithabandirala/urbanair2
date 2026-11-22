import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_VERSION } from "@/lib/config";
import { GET } from "./route";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports provider booleans without exposing secrets", async () => {
    vi.stubEnv("CPCB_API_KEY", "cpcb-secret");
    vi.stubEnv("WAQI_TOKEN", "waqi-secret");
    vi.stubEnv("OPENWEATHER_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "gemini-secret");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const body = (await response.json()) as {
      ok: boolean;
      data: {
        status: string;
        version: string;
        providers: Record<string, boolean>;
      };
    };

    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(body.data.version).toBe(APP_VERSION);
    expect(body.data.providers).toEqual({
      cpcb: true,
      waqi: true,
      openWeather: false,
      gemini: true,
    });

    const text = JSON.stringify(body);
    expect(text).not.toContain("cpcb-secret");
    expect(text).not.toContain("waqi-secret");
    expect(text).not.toContain("gemini-secret");
  });
});
