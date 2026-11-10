import { describe, it, expect } from "@jest/globals";
import { PLAYLIST } from "../NisseMusikk";
import { MEDIA_MANIFEST, mediaUrl, type MediaManifestEntry } from "@/lib/media";

describe("NisseMusikk playlist", () => {
  it("derives all 12 playable tracks from MEDIA_MANIFEST", () => {
    expect(PLAYLIST).toHaveLength(12);

    const manifestTracks = MEDIA_MANIFEST.filter(
      (entry): entry is MediaManifestEntry & { title: string } =>
        typeof entry !== "string" &&
        entry.path.startsWith("music/") &&
        Boolean(entry.title),
    );

    expect(PLAYLIST.length).toBe(manifestTracks.length);

    PLAYLIST.forEach((track, i) => {
      const manifest = manifestTracks[i];
      expect(track.id).toBe(i + 1);
      expect(track.title).toBe(manifest.title);
      expect(track.subtitle).toBe(manifest.subtitle);
      expect(track.src).toBe(mediaUrl(manifest.path));
      expect(track.defaultDuration).toBe(manifest.defaultDuration);
    });
  });

  it("koder filnavnet nøyaktig én gang (encodeURI på toppen ga 404)", () => {
    for (const track of PLAYLIST) {
      expect(track.src).not.toMatch(/%25/);
      expect(decodeURIComponent(track.src)).not.toMatch(/%/);
    }
  });
});
