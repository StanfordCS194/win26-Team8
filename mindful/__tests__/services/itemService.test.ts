import { describe, it, expect } from 'vitest';
import { dbItemToItem, itemToDbItem, createReflectionEntries } from '../../services/itemService';
import type { DbItem, ItemReflection } from '../../lib/supabase';
import type { QuestionAnswer } from '../../types/item';

// ─── Helpers ────────────────────────────────────────────

function makeDbItem(overrides: Partial<DbItem> = {}): DbItem {
  return {
    id: 'item-1',
    user_id: 'user-1',
    name: 'Test Item',
    url: null,
    image_url: 'https://example.com/image.png',
    cost: null,
    created_at: '2025-01-15T12:00:00Z',
    ...overrides,
  };
}

function makeReflection(overrides: Partial<ItemReflection> = {}): ItemReflection {
  return {
    id: 'ref-1',
    item_id: 'item-1',
    question: 'importance',
    response: 4,
    created_at: '2025-01-15T12:00:00Z',
    ...overrides,
  };
}

// ─── dbItemToItem ───────────────────────────────────────

describe('dbItemToItem', () => {
  it('transforms reflections into questionnaire array', () => {
    const reflections = [
      makeReflection({ question: 'importance', response: 4 }),
      makeReflection({ id: 'ref-2', question: 'urgency', response: 2 }),
    ];
    const result = dbItemToItem(makeDbItem(), reflections);

    expect(result.questionnaire).toHaveLength(2);
    expect(result.questionnaire[0]).toEqual({
      id: 'importance',
      question: 'importance',
      answer: '4',
    });
    expect(result.questionnaire[1]).toEqual({
      id: 'urgency',
      question: 'urgency',
      answer: '2',
    });
  });

  it('provides default questions when reflections are empty', () => {
    const result = dbItemToItem(makeDbItem(), []);

    expect(result.questionnaire).toHaveLength(4);
    expect(result.questionnaire[0].id).toBe('why');
    expect(result.questionnaire[1].id).toBe('alternatives');
    expect(result.questionnaire[2].id).toBe('impact');
    expect(result.questionnaire[3].id).toBe('urgency');
    // All answers should be empty
    result.questionnaire.forEach((q) => {
      expect(q.answer).toBe('');
    });
  });

  // ── constraintType derivation ──

  it('sets constraintType to "time" when cost is null', () => {
    const result = dbItemToItem(makeDbItem({ cost: null }), []);
    expect(result.constraintType).toBe('time');
  });

  it('sets constraintType to "time" when cost is 0', () => {
    const result = dbItemToItem(makeDbItem({ cost: 0 }), []);
    expect(result.constraintType).toBe('time');
  });

  it('sets constraintType to "goals" when cost > 0', () => {
    const result = dbItemToItem(makeDbItem({ cost: 50 }), []);
    expect(result.constraintType).toBe('goals');
  });

  // ── consumptionScore calculation ──

  it('calculates consumptionScore from cost (cost / 10, clamped 1-10)', () => {
    expect(dbItemToItem(makeDbItem({ cost: 5 }), []).consumptionScore).toBe(1);
    expect(dbItemToItem(makeDbItem({ cost: 10 }), []).consumptionScore).toBe(1);
    expect(dbItemToItem(makeDbItem({ cost: 15 }), []).consumptionScore).toBe(2);
    expect(dbItemToItem(makeDbItem({ cost: 50 }), []).consumptionScore).toBe(5);
    expect(dbItemToItem(makeDbItem({ cost: 100 }), []).consumptionScore).toBe(10);
  });

  it('clamps consumptionScore to max 10', () => {
    expect(dbItemToItem(makeDbItem({ cost: 999 }), []).consumptionScore).toBe(10);
  });

  it('defaults consumptionScore to 5 when cost is null', () => {
    expect(dbItemToItem(makeDbItem({ cost: null }), []).consumptionScore).toBe(5);
  });

  // ── time-based fields ──

  it('calculates waitUntilDate for time-based items', () => {
    const result = dbItemToItem(makeDbItem({ cost: null, created_at: '2025-01-01T00:00:00Z' }), []);
    // consumptionScore defaults to 5, days = 5 * 7 = 35
    const expected = new Date('2025-01-01');
    expected.setDate(expected.getDate() + 35);
    expect(result.waitUntilDate).toBe(expected.toISOString().split('T')[0]);
  });

  it('does not set difficulty for time-based items', () => {
    const result = dbItemToItem(makeDbItem({ cost: null }), []);
    expect(result.difficulty).toBeUndefined();
  });

  // ── goals-based fields ──

  it('sets difficulty "easy" for score <= 3', () => {
    expect(dbItemToItem(makeDbItem({ cost: 10 }), []).difficulty).toBe('easy'); // score 1
    expect(dbItemToItem(makeDbItem({ cost: 30 }), []).difficulty).toBe('easy'); // score 3
  });

  it('sets difficulty "medium" for score 4-7', () => {
    expect(dbItemToItem(makeDbItem({ cost: 40 }), []).difficulty).toBe('medium'); // score 4
    expect(dbItemToItem(makeDbItem({ cost: 70 }), []).difficulty).toBe('medium'); // score 7
  });

  it('sets difficulty "hard" for score > 7', () => {
    expect(dbItemToItem(makeDbItem({ cost: 80 }), []).difficulty).toBe('hard'); // score 8
    expect(dbItemToItem(makeDbItem({ cost: 100 }), []).difficulty).toBe('hard'); // score 10
  });

  it('does not set waitUntilDate for goals-based items', () => {
    const result = dbItemToItem(makeDbItem({ cost: 50 }), []);
    expect(result.waitUntilDate).toBeUndefined();
  });

  // ── image fallback ──

  it('uses image_url when available', () => {
    const result = dbItemToItem(makeDbItem({ image_url: 'https://custom.com/img.png' }), []);
    expect(result.imageUrl).toBe('https://custom.com/img.png');
  });

  it('falls back to url when image_url is null', () => {
    const result = dbItemToItem(makeDbItem({ image_url: null, url: 'https://fallback.com/page' }), []);
    expect(result.imageUrl).toBe('https://fallback.com/page');
  });

  it('falls back to placeholder when both image_url and url are null', () => {
    const result = dbItemToItem(makeDbItem({ image_url: null, url: null }), []);
    expect(result.imageUrl).toContain('unsplash.com');
  });

  // ── basic field mapping ──

  it('maps id, name, and addedDate correctly', () => {
    const dbItem = makeDbItem({ id: 'abc', name: 'My Item', created_at: '2025-06-01T00:00:00Z' });
    const result = dbItemToItem(dbItem, []);
    expect(result.id).toBe('abc');
    expect(result.name).toBe('My Item');
    expect(result.addedDate).toBe('2025-06-01T00:00:00Z');
  });
});

// ─── itemToDbItem ───────────────────────────────────────

describe('itemToDbItem', () => {
  const baseItem = {
    name: 'New Item',
    imageUrl: 'https://example.com/img.png',
    constraintType: 'time' as const,
    consumptionScore: 7,
    waitUntilDate: '2025-03-01',
    questionnaire: [] as QuestionAnswer[],
  };

  it('maps app fields to DB fields', () => {
    const result = itemToDbItem(baseItem, 'user-42');
    expect(result.user_id).toBe('user-42');
    expect(result.name).toBe('New Item');
    expect(result.image_url).toBe('https://example.com/img.png');
    expect(result.url).toBeNull();
  });

  it('converts consumptionScore to cost (*10)', () => {
    const result = itemToDbItem(baseItem, 'user-1');
    expect(result.cost).toBe(70); // 7 * 10
  });

  it('converts score 1 to cost 10', () => {
    const result = itemToDbItem({ ...baseItem, consumptionScore: 1 }, 'user-1');
    expect(result.cost).toBe(10);
  });
});

// ─── createReflectionEntries ────────────────────────────

describe('createReflectionEntries', () => {
  it('maps questionnaire to reflection entries', () => {
    const questionnaire: QuestionAnswer[] = [
      { id: 'importance', question: 'How important?', answer: '4' },
      { id: 'urgency', question: 'How urgent?', answer: '2' },
    ];
    const result = createReflectionEntries('item-99', questionnaire);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ item_id: 'item-99', question: 'importance', response: 4 });
    expect(result[1]).toEqual({ item_id: 'item-99', question: 'urgency', response: 2 });
  });

  it('defaults non-numeric answers to 3', () => {
    const questionnaire: QuestionAnswer[] = [
      { id: 'why', question: 'Why?', answer: 'because I want it' },
    ];
    const result = createReflectionEntries('item-1', questionnaire);
    expect(result[0].response).toBe(3);
  });

  it('handles empty string answers as 3', () => {
    const questionnaire: QuestionAnswer[] = [
      { id: 'q1', question: 'Q?', answer: '' },
    ];
    const result = createReflectionEntries('item-1', questionnaire);
    expect(result[0].response).toBe(3);
  });

  it('returns empty array for empty questionnaire', () => {
    const result = createReflectionEntries('item-1', []);
    expect(result).toEqual([]);
  });
});
