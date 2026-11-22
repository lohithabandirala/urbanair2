import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELHI, TEST_PROFILE, makeSnapshot } from "@/test/fixtures";

vi.mock("@/services/air", () => ({ getAirQuality: vi.fn() }));
vi.mock("@/services/assistant", () => ({
  answerQuestion: vi.fn(),
  answerSources: vi.fn(),
}));
vi.mock("@/lib/rateLimit", () => ({ checkRateLimit: vi.fn() }));

import { checkRateLimit } from "@/lib/rateLimit";
import { getAirQuality } from "@/services/air";
import { answerQuestion, answerSources } from "@/services/assistant";
import { POST } from "./route";

const airMock = vi.mocked(getAirQuality);
const answerMock = vi.mocked(answerQuestion);
const sourcesMock = vi.mocked(answerSources);
const limitMock = vi.mocked(checkRateLimit);

const ANSWER = {
  answer: "Keep windows closed today.",
  provider: "grounded-fallback" as const,
  noticeKey: "assistant.offlineNotice",
  blocked: false,
  groundedOn: {
    city: "Delhi",
    aqi: 250,
    category: "poor" as const,
    dominantPollutant: "pm25" as const,
    observedAt: "2026-11-21T14:30",
    source: "Open-Meteo / CAMS model",
    freshness: "live",
  },
  sources: ["cpcbNaqi"],
};

const SOURCE = {
  id: "cpcbNaqi",
  publisher: "Central Pollution Control Board (India)",
  title: "National Air Quality Index",
  url: "https://cpcb.nic.in/national-air-quality-index/",
};

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/assistant", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function validBody() {
  return {
    question: "Should I open the windows?",
    language: "en",
    location: DELHI,
    profile: TEST_PROFILE,
  };
}

describe("POST /api/assistant", () => {
  beforeEach(() => {
    airMock.mockReset();
    answerMock.mockReset();
    sourcesMock.mockReset();
    limitMock.mockReset();
    airMock.mockResolvedValue(makeSnapshot({ aqi: 250, category: "poor" }));
    answerMock.mockResolvedValue(ANSWER);
    sourcesMock.mockReturnValue([SOURCE]);
    limitMock.mockReturnValue({
      allowed: true,
      remaining: 9,
      resetAt: Date.now() + 60_000,
      retryAfterSec: 60,
    });
  });

  it("re-fetches the reading server-side and returns the answer", async () => {
    const response = await POST(post(validBody()));

    expect(response.status).toBe(200);
    expect(airMock).toHaveBeenCalledWith(DELHI);
    expect(answerMock).toHaveBeenCalledWith({
      question: "Should I open the windows?",
      language: "en",
      location: DELHI,
      snapshot: makeSnapshot({ aqi: 250, category: "poor" }),
      profile: TEST_PROFILE,
    });
    expect(response.headers.get("x-assistant-provider")).toBe(
      "grounded-fallback",
    );
    expect(response.headers.get("x-ratelimit-remaining")).toBe("9");
    expect(response.headers.get("cache-control")).toBe("no-store");

    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { ...ANSWER, sources: [SOURCE] },
    });
  });

  it("defaults to the standard profile when none is supplied", async () => {
    const body = validBody();
    delete (body as { profile?: unknown }).profile;

    await POST(post(body));

    expect(answerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: {
          commuteMode: "car",
          cookingFuel: "lpg",
          vulnerableGroups: [],
          exercisesOutdoors: true,
        },
      }),
    );
  });

  it("rejects client-supplied readings instead of trusting them", async () => {
    const response = await POST(
      post({ ...validBody(), aqi: 5, snapshot: { aqi: 5 } }),
    );

    expect(response.status).toBe(400);
    expect(airMock).not.toHaveBeenCalled();
    const body = (await response.json()) as {
      error: { code: string; details: Array<{ path: string }> };
    };
    expect(body.error.code).toBe("invalid_input");
  });

  it("rejects an over-long question", async () => {
    const response = await POST(
      post({ ...validBody(), question: "a".repeat(501) }),
    );

    expect(response.status).toBe(400);
    expect(airMock).not.toHaveBeenCalled();
  });

  it("enforces the rate limit before fetching data", async () => {
    limitMock.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
      retryAfterSec: 30,
    });

    const response = await POST(post(validBody()));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(airMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and wrong content types", async () => {
    const malformed = await POST(post("{oops"));
    expect(malformed.status).toBe(400);

    const wrongType = await POST(
      new Request("http://localhost/api/assistant", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: JSON.stringify(validBody()),
      }),
    );
    expect(wrongType.status).toBe(415);
  });

  it("hides unexpected upstream errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    airMock.mockRejectedValue(new Error("api-key=super-secret"));

    const response = await POST(post(validBody()));

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).not.toContain("super-secret");
    log.mockRestore();
  });
});
