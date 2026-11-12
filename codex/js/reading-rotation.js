import { avoidedGroupIds, createRng, isActiveGroup } from "./quick-form.js";

const REQUIRED = new Map([
  ["5/1/0", 10], ["6/4/1", 1],
  ["7/2/1", 1], ["7/3/1", 1], ["7/4/1", 1], ["7/5/3", 1]
]);
const DOUBLE = "7/5/2";
const MAX_DRAWS = 300;
const specs = new Map([
  ["5/1/0", 30], ["6/4/1", 4],
  ["7/2/1", 4], ["7/3/1", 3], ["7/4/1", 3], [DOUBLE, 2], ["7/5/3", 3]
]);

export const isReadingFullForm = (id) => /^read-full-[123]$/.test(String(id));
const docCount = (group) => group.passage?.docs.length ?? 0;
const shape = (group) => `${group.part}/${group.questions.length}/${docCount(group)}`;
const hasInsertion = (group) => group.questions.filter((question) => question.questionType === "sentence-insertion").length === 1;

export function originalReadingGroups(bank, formId) {
  const set = bank.meta.sets.find((item) => item.id === formId);
  const ids = new Set(set?.groupIds);
  return bank.groups.filter((group) => ids.has(group.id)).sort((a, b) => a.part - b.part);
}

export function readingRotationPools(bank) {
  const reserved = new Set(bank.meta.sets.filter((set) => isReadingFullForm(set.id)).flatMap((set) => set.groupIds));
  const pools = new Map([...specs.keys()].map((key) => [key, []]));
  for (const group of bank.groups) {
    if (group.section !== "reading" || reserved.has(group.id) || !isActiveGroup(group)) continue;
    if (group.part === 6 && !hasInsertion(group)) continue;
    pools.get(shape(group))?.push(group);
  }
  return pools;
}

function sample(groups, count, random) {
  const candidates = [...groups];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, count);
}

function selectReplacements(pool, count, avoid, random) {
  const fresh = pool.filter((group) => !avoid.has(group.id));
  if (fresh.length >= count) return sample(fresh, count, random);
  return [...fresh, ...sample(pool.filter((group) => avoid.has(group.id)), count - fresh.length, random)];
}

function validMock(groups) {
  const sizes = new Map();
  const ids = new Set();
  const positions = [0, 0, 0, 0];
  for (const group of groups) {
    const key = shape(group);
    if (ids.has(group.id) || group.section !== "reading" || !specs.has(key) || (group.part === 6 && !hasInsertion(group))) return false;
    ids.add(group.id);
    sizes.set(key, (sizes.get(key) ?? 0) + 1);
    if (group.part === 7) {
      for (const question of group.questions) {
        if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) return false;
        positions[question.answer]++;
      }
    }
  }
  return [...specs].every(([key, count]) => sizes.get(key) === count)
    && positions.every((count) => count / 54 >= 0.18 && count / 54 <= 0.32);
}

export function assembleReadingRotation(bank, formId, seed, recent = []) {
  const original = originalReadingGroups(bank, formId);
  const fallback = { groupIds: original.map((group) => group.id), changedQuestions: 0, fallback: true };
  const pools = readingRotationPools(bank);
  if (!validMock(original) || [...REQUIRED].some(([key, count]) => pools.get(key).length < count)) return fallback;
  const random = createRng(seed);
  const recentlyUsed = avoidedGroupIds(recent);
  const unrestricted = new Set();
  for (let attempt = 0; attempt < MAX_DRAWS; attempt++) {
    // If the recent-group preference prevents a valid answer distribution, widen the pool.
    const avoid = attempt < MAX_DRAWS / 2 ? recentlyUsed : unrestricted;
    const rules = [...REQUIRED];
    if (pools.get(DOUBLE).some((group) => !avoid.has(group.id)) && random() < 0.5) rules.push([DOUBLE, 1]);
    const removed = new Set();
    const added = [];
    for (const [key, count] of rules) {
      for (const group of sample(original.filter((group) => shape(group) === key), count, random)) removed.add(group.id);
      added.push(...selectReplacements(pools.get(key), count, avoid, random));
    }
    const groups = [...original.filter((group) => !removed.has(group.id)), ...added];
    if (!validMock(groups)) continue;
    groups.sort((a, b) => a.part - b.part || docCount(a) - docCount(b) || a.questions.length - b.questions.length);
    return { groupIds: groups.map((group) => group.id), changedQuestions: added.reduce((sum, group) => sum + group.questions.length, 0), fallback: false };
  }
  return fallback;
}
