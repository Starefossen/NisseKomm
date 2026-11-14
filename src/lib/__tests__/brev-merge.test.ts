/** @jest-environment node */
import { expect, test } from "@jest/globals";
import { createMemoryStore } from "../db";

test("to skjermer, samme dag, ulike forfattere: begge brevene overlever", async () => {
  const store = createMemoryStore();
  const K = "nissekomm-santa-letters";
  const gammelt = { day: 3, content: "gammelt brev uten navn" };
  await store.putState(K, [gammelt]);
  // Both screens start from [gammelt] and each add a letter on day 5.
  await store.putState(K, [
    gammelt,
    { day: 5, from: "Kristian", content: "a" },
  ]);
  const tv = await store.putState(K, [
    gammelt,
    { day: 5, from: "Håkon", content: "b" },
  ]);
  const alle = (await store.getState())[K];
  for (const v of [tv, alle])
    expect(v).toEqual(
      expect.arrayContaining([
        gammelt,
        { day: 5, from: "Kristian", content: "a" },
        { day: 5, from: "Håkon", content: "b" },
      ]),
    );
  // The same writer rewriting the same day replaces, not duplicates.
  await store.putState(K, [{ day: 5, from: "Håkon", content: "c" }]);
  expect((await store.getState())[K]).toHaveLength(3);
});
