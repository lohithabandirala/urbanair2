import { describe, expect, it, vi } from "vitest";
import { HttpError } from "./errors";
import {
  getClientIp,
  handleRouteError,
  jsonError,
  jsonOk,
  queryObject,
  readJsonBody,
} from "./http";

describe("jsonOk", () => {
  it("wraps data in a success envelope with safe headers", async () => {
    const response = jsonOk({ aqi: 42 }, { cacheControl: "public, s-maxage=60" });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cache-control")).toBe("public, s-maxage=60");
    await expect(response.json()).resolves.toEqual({ ok: true, data: { aqi: 42 } });
  });
});

describe("jsonError", () => {
  it("wraps errors in a failure envelope and never caches them", async () => {
    const response = jsonError(400, "bad", "Bad request", [{ path: "city" }]);
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: { code: "bad", message: "Bad request", details: [{ path: "city" }] },
    });
  });
});

describe("handleRouteError", () => {
  it("passes typed HTTP errors through with a retry header for 429", async () => {
    const response = handleRouteError(
      new HttpError(429, "rate_limited", "Slow down", undefined),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "rate_limited", message: "Slow down" },
    });
  });

  it("hides unexpected error details from clients", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = handleRouteError(new Error("database password leaked"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.message).toBe("Something went wrong.");
    expect(JSON.stringify(body)).not.toContain("password");
    expect(error).toHaveBeenCalled();
  });
});

describe("readJsonBody", () => {
  function request(body: string, headers: Record<string, string>) {
    return new Request("http://localhost/api/test", {
      method: "POST",
      headers,
      body,
    });
  }

  it("parses a JSON body with optional media-type parameters", async () => {
    const body = await readJsonBody(
      request('{"hello":"world"}', {
        "content-type": "application/json; charset=utf-8",
      }),
    );
    expect(body).toEqual({ hello: "world" });
  });

  it("rejects non-JSON and lookalike content types", async () => {
    for (const contentType of [
      "text/plain",
      "text/application/json",
      "application/jsonp",
    ]) {
      await expect(
        readJsonBody(request("hello", { "content-type": contentType })),
      ).rejects.toMatchObject({ status: 415 });
    }
  });

  it("rejects bodies that declare an excessive length", async () => {
    await expect(
      readJsonBody(
        request("{}", {
          "content-type": "application/json",
          "content-length": "999999",
        }),
      ),
    ).rejects.toMatchObject({ status: 413 });
  });

  it("rejects empty and malformed JSON", async () => {
    await expect(
      readJsonBody(request("   ", { "content-type": "application/json" })),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      readJsonBody(request("{oops", { "content-type": "application/json" })),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("getClientIp", () => {
  it("uses the first forwarded address", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(getClientIp(request)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip and then unknown", () => {
    expect(
      getClientIp(
        new Request("http://localhost", {
          headers: { "x-real-ip": "198.51.100.7" },
        }),
      ),
    ).toBe("198.51.100.7");

    expect(getClientIp(new Request("http://localhost"))).toBe("unknown");
  });
});

describe("queryObject", () => {
  it("collects non-empty query parameters", () => {
    expect(queryObject("http://localhost/api?city=Delhi&empty=&lat=28.6")).toEqual({
      city: "Delhi",
      lat: "28.6",
    });
  });
});
