import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { fetchJson, parseUpstream, UpstreamError } from "./upstream";

const schema = z.object({ value: z.number() });

describe("fetchJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON and sends an identifying user agent", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(
      async () =>
        new Response(JSON.stringify({ value: 1 }), {
          headers: { "content-type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchJson("https://example.test/data", {
      provider: "test",
    });
    expect(result).toEqual({ value: 1 });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.headers).toMatchObject({
      Accept: "application/json",
      "User-Agent": expect.stringContaining("SaafHawa"),
    });
    expect(init?.cache).toBe("no-store");
  });

  it("wraps network failures in an UpstreamError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connection refused");
      }),
    );

    await expect(fetchJson("https://example.test", { provider: "test" })).rejects.toMatchObject(
      { name: "UpstreamError", provider: "test" },
    );
  });

  it("rejects non-2xx responses with the status attached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 503 })),
    );

    try {
      await fetchJson("https://example.test", { provider: "test" });
      throw new Error("expected fetchJson to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(UpstreamError);
      if (error instanceof UpstreamError) {
        expect(error.status).toBe(503);
      }
    }
  });

  it("rejects non-JSON content types", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("<html></html>", {
            headers: { "content-type": "text/html" },
          }),
      ),
    );

    await expect(
      fetchJson("https://example.test", { provider: "test" }),
    ).rejects.toThrow(/non-JSON/);
  });

  it("rejects malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("{oops", {
            headers: { "content-type": "application/json" },
          }),
      ),
    );

    await expect(
      fetchJson("https://example.test", { provider: "test" }),
    ).rejects.toThrow(/invalid JSON/);
  });
});

describe("parseUpstream", () => {
  it("returns validated data", () => {
    expect(parseUpstream(schema, { value: 2 }, "test")).toEqual({ value: 2 });
  });

  it("throws an UpstreamError on shape mismatches", () => {
    expect(() => parseUpstream(schema, { value: "two" }, "test")).toThrow(
      UpstreamError,
    );
  });
});
