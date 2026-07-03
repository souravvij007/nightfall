import { test } from "node:test";
import assert from "node:assert/strict";
import {
  thresholdForLevel,
  levelForPoints,
  rankForLevel,
  unlockedFeatures,
  hasFeature,
  progressForPoints,
} from "./levels";

test("thresholds match the documented curve", () => {
  assert.equal(thresholdForLevel(1), 0);
  assert.equal(thresholdForLevel(2), 100);
  assert.equal(thresholdForLevel(3), 300);
  assert.equal(thresholdForLevel(5), 1000);
  assert.equal(thresholdForLevel(10), 4500);
  assert.equal(thresholdForLevel(20), 19000);
});

test("levelForPoints is the inverse of thresholdForLevel", () => {
  assert.equal(levelForPoints(0), 1);
  assert.equal(levelForPoints(99), 1);
  assert.equal(levelForPoints(100), 2); // exactly on the boundary
  assert.equal(levelForPoints(299), 2);
  assert.equal(levelForPoints(300), 3);
  assert.equal(levelForPoints(999), 4);
  assert.equal(levelForPoints(1000), 5);
  assert.equal(levelForPoints(18999), 19);
  assert.equal(levelForPoints(19000), 20);
});

test("levelForPoints round-trips every modeled threshold", () => {
  for (let l = 1; l <= 60; l++) {
    const t = thresholdForLevel(l);
    assert.equal(levelForPoints(t), l, `at level ${l}`);
    assert.equal(levelForPoints(t - 1), l - 1 || 1, `just below level ${l}`);
  }
});

test("negative or garbage points clamp to level 1", () => {
  assert.equal(levelForPoints(-500), 1);
});

test("rank bands", () => {
  assert.equal(rankForLevel(1), "BRONZE");
  assert.equal(rankForLevel(4), "BRONZE");
  assert.equal(rankForLevel(5), "SILVER");
  assert.equal(rankForLevel(10), "GOLD");
  assert.equal(rankForLevel(20), "PLATINUM");
  assert.equal(rankForLevel(50), "DIAMOND");
});

test("feature unlocks gate on level", () => {
  assert.deepEqual(unlockedFeatures(1), []);
  assert.deepEqual(unlockedFeatures(5), ["HOST_AV_ROOM"]);
  assert.deepEqual(unlockedFeatures(10), ["HOST_AV_ROOM", "HOST_MEETUP"]);
  assert.deepEqual(unlockedFeatures(20), ["HOST_AV_ROOM", "HOST_MEETUP", "HOST_TRIP"]);

  assert.equal(hasFeature(4, "HOST_AV_ROOM"), false);
  assert.equal(hasFeature(5, "HOST_AV_ROOM"), true);
  assert.equal(hasFeature(19, "HOST_TRIP"), false);
  assert.equal(hasFeature(20, "HOST_TRIP"), true);
});

test("progress is coherent within a level", () => {
  const p = progressForPoints(200); // level 2 spans [100, 300)
  assert.equal(p.level, 2);
  assert.equal(p.rank, "BRONZE");
  assert.equal(p.pointsIntoLevel, 100);
  assert.equal(p.pointsForLevel, 200);
  assert.equal(p.pointsToNextLevel, 100);
  assert.equal(p.progress, 0.5);
});
