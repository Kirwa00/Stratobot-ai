import { test } from "node:test";
import assert from "node:assert/strict";
import { youtubeId } from "../video-strategy";

test("YouTube links in every common shape give the video id", () => {
  const id = "ORr7eERahvc";
  for (const link of [
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=31s`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=abc`,
    `youtu.be/${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `https://www.youtube.com/live/${id}`,
    id,
  ]) {
    assert.equal(youtubeId(link), id, link);
  }
});

test("other links and text are refused", () => {
  for (const s of ["", "hello", "https://vimeo.com/123", "https://www.youtube.com/@channel", "https://evil.com/watch?v=ORr7eERahvc"]) {
    assert.equal(youtubeId(s), null, s);
  }
});
