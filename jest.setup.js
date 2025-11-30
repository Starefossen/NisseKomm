// Jest setup file
import "@testing-library/jest-dom";
import { webcrypto } from "crypto";
import http from "http";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables from .env.local
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const envFile = readFileSync(envPath, "utf8");
  envFile.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      process.env[key.trim()] = value;
    }
  });
} catch (error) {
  console.warn("Could not load .env.local:", error.message);
}

// Polyfill fetch for Jest environment
// Jest's jsdom doesn't include fetch, so we need to provide it
if (typeof global.fetch === "undefined") {
  // For integration tests that make real HTTP calls to Next.js API routes
  // We assume the dev server is running on localhost:3000
  global.fetch = (url, init = {}) => {
    const fullUrl = url.startsWith("http")
      ? url
      : `http://localhost:3000${url}`;
    const parsedUrl = new URL(fullUrl);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: init.method || "GET",
        headers: init.headers || {},
      };

      const req = http.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: new Map(Object.entries(res.headers)),
            json: () => Promise.resolve(JSON.parse(body)),
            text: () => Promise.resolve(body),
          });
        });
      });

      req.on("error", reject);

      if (init.body) {
        req.write(init.body);
      }
      req.end();
    });
  };
}

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock;

// Mock Web Crypto API for browser-like environment
if (typeof global.crypto === "undefined") {
  global.crypto = webcrypto;
}

// Mock window.crypto for browser compatibility
if (typeof window !== "undefined" && typeof window.crypto === "undefined") {
  Object.defineProperty(window, "crypto", {
    value: webcrypto,
    writable: true,
  });
}

// Reset localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
