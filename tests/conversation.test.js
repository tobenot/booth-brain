import test from "node:test";
import assert from "node:assert/strict";
import { interpret } from "../docs/conversation.js";
for (const [source, visitorLanguage, expected] of [
  ["zh", "ja", "ja"],
  ["yue", "en", "en"],
  ["fr", "en", "zh"],
  [undefined, null, null],
])
  test(`route ${source} with ${visitorLanguage}`, async () => {
    const events = [];
    await interpret({
      message: { content: "utterance", annotations: [{ language: source }] },
      visitorLanguage,
      showOriginal: () => events.push("original"),
      explain: () => {
        events.push("card");
        return new Promise(() => {});
      },
      translate: async (text, target) => {
        events.push(target);
        return text;
      },
      showTranslation: () => events.push("shown"),
    });
    assert.deepEqual(
      events,
      expected ? ["original", "card", expected, "shown"] : ["original", "card"],
    );
  });
