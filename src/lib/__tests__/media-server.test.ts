/** @jest-environment node */
import { afterEach, expect, test } from "@jest/globals";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  mediaStatus,
  resolveMedia,
  serveMedia,
  tooLarge,
  uploadMedia,
} from "../media-server";
import { MEDIA_MANIFEST, mediaUrl } from "../media";

const dir = mkdtempSync(path.join(tmpdir(), "media-"));
mkdirSync(path.join(dir, "video/julius"), { recursive: true });
writeFileSync(path.join(dir, "video/julius/dag-01.mp4"), "0123456789");

afterEach(() => {
  delete process.env.NISSEKOMM_MODE;
});

test("rejects path traversal", async () => {
  expect(resolveMedia(["..", "etc", "passwd.mp4"], dir)).toBeNull();
  expect(resolveMedia(["video", "..", "..", "x.mp4"], dir)).toBeNull();
  expect(resolveMedia(["/etc/x.mp4"], dir)).toBeNull();
  expect((await serveMedia(["..", "x.mp4"], null, dir)).status).toBe(400);
});

test("Range returns 206 with the requested bytes", async () => {
  const res = await serveMedia(
    ["video", "julius", "dag-01.mp4"],
    "bytes=2-4",
    dir,
  );
  expect(res.status).toBe(206);
  expect(res.headers.get("content-range")).toBe("bytes 2-4/10");
  expect(res.headers.get("content-type")).toBe("video/mp4");
  expect(await res.text()).toBe("234");
});

test("manifest lists missing files", async () => {
  const status = await mediaStatus(dir);
  expect(status).toHaveLength(MEDIA_MANIFEST.length);
  expect(status.find((s) => s.path === "video/julius/dag-01.mp4")?.size).toBe(
    10,
  );
  expect(
    status.find((s) => s.path === "video/julius/dag-02.mp4")?.size,
  ).toBeNull();
});

test("upload is rejected in public mode", async () => {
  process.env.NISSEKOMM_MODE = "public";
  const res = await uploadMedia(
    ["video", "julius", "dag-02.mp4"],
    "video/mp4",
    new ArrayBuffer(4),
    dir,
  );
  expect(res.status).toBe(404);
});

test("lan upload writes manifest files only, with the right type", async () => {
  process.env.NISSEKOMM_MODE = "lan";
  const p = ["video", "julius", "dag-02.mp4"];
  expect(
    (await uploadMedia(p, "image/png", new ArrayBuffer(4), dir)).status,
  ).toBe(415);
  expect(
    (
      await uploadMedia(
        ["video", "evil.mp4"],
        "video/mp4",
        new ArrayBuffer(4),
        dir,
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await uploadMedia(
        p,
        "video/mp4",
        new TextEncoder().encode("abcd").buffer,
        dir,
      )
    ).status,
  ).toBe(201);
  expect(readFileSync(path.join(dir, "video/julius/dag-02.mp4"), "utf8")).toBe(
    "abcd",
  );
});

test("mediaUrl encodes each segment", () => {
  expect(mediaUrl("feed/snøfall-storm.png")).toBe(
    "/media/feed/sn%C3%B8fall-storm.png",
  );
});

test("symlink out of MEDIA_DIR is not served", async () => {
  const outside = mkdtempSync(path.join(tmpdir(), "outside-"));
  writeFileSync(path.join(outside, "secret.mp4"), "secret");
  symlinkSync(
    path.join(outside, "secret.mp4"),
    path.join(dir, "video/julius/dag-23.mp4"),
  );
  const res = await serveMedia(["video", "julius", "dag-23.mp4"], null, dir);
  expect(res.status).toBe(404);
});

test("suffix range and unsatisfiable range", async () => {
  const p = ["video", "julius", "dag-01.mp4"];
  const suffix = await serveMedia(p, "bytes=-3", dir);
  expect(suffix.status).toBe(206);
  expect(await suffix.text()).toBe("789");
  const bad = await serveMedia(p, "bytes=10-", dir);
  expect(bad.status).toBe(416);
  expect(bad.headers.get("content-range")).toBe("bytes */10");
});

test("ETag revalidates and changes when the file is swapped", async () => {
  const p = ["video", "julius", "dag-01.mp4"];
  const file = path.join(dir, "video/julius/dag-01.mp4");
  const first = await serveMedia(p, null, dir);
  const etag = first.headers.get("etag");
  expect(first.headers.get("cache-control")).toBe("no-cache");
  expect((await serveMedia(p, null, dir, etag)).status).toBe(304);
  writeFileSync(file, "abcdefghijk");
  const swapped = await serveMedia(p, null, dir, etag);
  expect(swapped.status).toBe(200);
  expect(swapped.headers.get("etag")).not.toBe(etag);
  writeFileSync(file, "0123456789");
});

test("declared oversize upload is refused before reading", () => {
  expect(tooLarge(String(51 * 1024 * 1024))).toBe(true);
  expect(tooLarge("1000")).toBe(false);
  expect(tooLarge(null)).toBe(false);
});
