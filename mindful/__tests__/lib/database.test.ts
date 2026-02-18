import { describe, it, expect } from 'vitest';
import { itemToDb, dbToItem, type DbItem } from '../../lib/database';
import type { Item, QuestionAnswer } from '../../types/item';

// ─── Helpers ────────────────────────────────────────────

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    name: 'Test Item',
    imageUrl: 'https://example.com/img.png',
    constraintType: 'time',
    consumptionScore: 5,
    addedDate: '2025-01-15',
    waitUntilDate: '2025-02-15',
    questionnaire: [
      { id: 'importance', question: 'How important?', answer: '4' },
      { id: 'urgency', question: 'How urgent?', answer: '2' },
    ],
    ...overrides,
  };
}

function makeDbItem(overrides: Partial<DbItem> = {}): DbItem {
  return {
    id: 'item-1',
    user_id: 'user-1',
    name: 'Test Item',
    image_url: 'https://example.com/img.png',
    constraint_type: 'time',
    consumption_score: 5,
    added_date: '2025-01-15',
    wait_until_date: '2025-02-15',
    questionnaire_why: '',
    questionnaire_alternatives: '',
    questionnaire_impact: '',
    questionnaire_urgency: '',
    ...overrides,
  };
}

// ─── itemToDb ───────────────────────────────────────────

describe('itemToDb', () => {
  it('maps app item fields to database fields', () => {
    const item = makeItem();
    const result = itemToDb(item, 'user-42');

    expect(result.id).toBe('item-1');
    expect(result.user_id).toBe('user-42');
    expect(result.name).toBe('Test Item');
    expect(result.image_url).toBe('https://example.com/img.png');
    expect(result.constraint_type).toBe('time');
    expect(result.consumption_score).toBe(5);
    expect(result.added_date).toBe('2025-01-15');
    expect(result.wait_until_date).toBe('2025-02-15');
  });

  it('serializes questionnaire as JSON in questionnaire_why', () => {
    const questionnaire: QuestionAnswer[] = [
      { id: 'a', question: 'Q1?', answer: '3' },
      { id: 'b', question: 'Q2?', answer: '5' },
    ];
    const item = makeItem({ questionnaire });
    const result = itemToDb(item, 'user-1');

    const parsed = JSON.parse(result.questionnaire_why);
    expect(parsed).toEqual(questionnaire);
  });

  it('sets other questionnaire fields to empty strings', () => {
    const result = itemToDb(makeItem(), 'user-1');

    expect(result.questionnaire_alternatives).toBe('');
    expect(result.questionnaire_impact).toBe('');
    expect(result.questionnaire_urgency).toBe('');
  });

  it('maps goals-based items correctly', () => {
    const item = makeItem({
      constraintType: 'goals',
      difficulty: 'hard',
      waitUntilDate: undefined,
    });
    const result = itemToDb(item, 'user-1');

    expect(result.constraint_type).toBe('goals');
    expect(result.difficulty).toBe('hard');
    expect(result.wait_until_date).toBeUndefined();
  });
});

// ─── dbToItem ───────────────────────────────────────────

describe('dbToItem', () => {
  it('parses new JSON format from questionnaire_why', () => {
    const questionnaire: QuestionAnswer[] = [
      { id: 'importance', question: 'How important?', answer: '4' },
      { id: 'urgency', question: 'How urgent?', answer: '2' },
    ];
    const dbItem = makeDbItem({
      questionnaire_why: JSON.stringify(questionnaire),
    });

    const result = dbToItem(dbItem);

    expect(result.questionnaire).toEqual(questionnaire);
  });

  it('falls back to old format when questionnaire_why is plain text', () => {
    const dbItem = makeDbItem({
      questionnaire_why: 'I really want this',
      questionnaire_alternatives: 'None',
      questionnaire_impact: 'Big impact',
      questionnaire_urgency: 'Very urgent',
    });

    const result = dbToItem(dbItem);

    expect(result.questionnaire).toHaveLength(4);
    expect(result.questionnaire[0]).toEqual({
      id: 'why',
      question: 'Why do you want this item?',
      answer: 'I really want this',
    });
    expect(result.questionnaire[1]).toEqual({
      id: 'alternatives',
      question: 'What alternatives have you considered?',
      answer: 'None',
    });
    expect(result.questionnaire[2]).toEqual({
      id: 'impact',
      question: 'What impact will this have?',
      answer: 'Big impact',
    });
    expect(result.questionnaire[3]).toEqual({
      id: 'urgency',
      question: 'How urgent is this purchase?',
      answer: 'Very urgent',
    });
  });

  it('falls back to old format when questionnaire_why is non-array JSON', () => {
    const dbItem = makeDbItem({
      questionnaire_why: JSON.stringify({ not: 'an array' }),
      questionnaire_alternatives: 'alt',
      questionnaire_impact: 'impact',
      questionnaire_urgency: 'urgency',
    });

    const result = dbToItem(dbItem);

    expect(result.questionnaire).toHaveLength(4);
    expect(result.questionnaire[0].id).toBe('why');
    // The answer in old format uses the raw questionnaire_why value
    expect(result.questionnaire[0].answer).toBe(JSON.stringify({ not: 'an array' }));
  });

  it('maps basic fields correctly', () => {
    const dbItem = makeDbItem({
      id: 'abc',
      name: 'My Item',
      image_url: 'https://example.com/img.png',
      constraint_type: 'goals',
      consumption_score: 8,
      added_date: '2025-06-01',
      difficulty: 'hard',
    });

    const result = dbToItem(dbItem);

    expect(result.id).toBe('abc');
    expect(result.name).toBe('My Item');
    expect(result.imageUrl).toBe('https://example.com/img.png');
    expect(result.constraintType).toBe('goals');
    expect(result.consumptionScore).toBe(8);
    expect(result.addedDate).toBe('2025-06-01');
    expect(result.difficulty).toBe('hard');
  });

  it('handles empty questionnaire_why with empty other fields', () => {
    const dbItem = makeDbItem({
      questionnaire_why: '',
      questionnaire_alternatives: '',
      questionnaire_impact: '',
      questionnaire_urgency: '',
    });

    const result = dbToItem(dbItem);

    // Empty string is not valid JSON, so falls back to old format
    expect(result.questionnaire).toHaveLength(4);
    expect(result.questionnaire[0].answer).toBe('');
  });

  it('preserves waitUntilDate for time-based items', () => {
    const dbItem = makeDbItem({
      constraint_type: 'time',
      wait_until_date: '2025-03-15',
    });

    const result = dbToItem(dbItem);
    expect(result.waitUntilDate).toBe('2025-03-15');
  });
});
