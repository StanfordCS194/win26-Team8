import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Item, QuestionAnswer } from '../../types/item';

// vi.mock is hoisted — use vi.hoisted to create mocks accessible inside factory
const { mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn();
  return { mockFrom };
});

vi.mock('../../env', () => ({
  supabase: { from: mockFrom },
}));

// Import after mocking
import { fetchItems, saveItem, deleteItem, testConnection, type DbItem } from '../../lib/database';

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

function makeDbRow(overrides: Partial<DbItem> = {}): DbItem {
  return {
    id: 'item-1',
    user_id: 'user-1',
    name: 'Test Item',
    image_url: 'https://example.com/img.png',
    category: null,
    constraint_type: 'time',
    consumption_score: 5,
    wait_until_date: '2025-02-15',
    difficulty: null,
    questionnaire: [
      { id: 'importance', question: 'How important?', answer: '4' },
      { id: 'urgency', question: 'How urgent?', answer: '2' },
    ],
    added_date: '2025-01-15',
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    ...overrides,
  };
}

// ─── Helper to build fluent supabase chain mock ─────────

function mockChain(result: { data?: any; error?: any; count?: number }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'delete', 'eq', 'order', 'single'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // The final await resolves to the result
  chain.then = (resolve: any) => resolve(result);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── fetchItems ─────────────────────────────────────────

describe('fetchItems', () => {
  it('returns items converted from database rows', async () => {
    const rows = [makeDbRow({ id: 'a', name: 'Item A' }), makeDbRow({ id: 'b', name: 'Item B' })];
    const chain = mockChain({ data: rows, error: null });
    mockFrom.mockReturnValue(chain);

    const { items, error } = await fetchItems('user-1');

    expect(mockFrom).toHaveBeenCalledWith('items');
    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(error).toBeNull();
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('a');
    expect(items[0].name).toBe('Item A');
    expect(items[1].id).toBe('b');
  });

  it('maps snake_case DB fields to camelCase app fields', async () => {
    const row = makeDbRow({
      id: 'x',
      image_url: 'https://img.test/photo.jpg',
      constraint_type: 'goals',
      consumption_score: 8,
      added_date: '2025-06-01',
      wait_until_date: '2025-07-01',
      difficulty: 'hard',
      category: 'Electronics',
    });
    const chain = mockChain({ data: [row], error: null });
    mockFrom.mockReturnValue(chain);

    const { items } = await fetchItems('user-1');

    expect(items[0].imageUrl).toBe('https://img.test/photo.jpg');
    expect(items[0].constraintType).toBe('goals');
    expect(items[0].consumptionScore).toBe(8);
    expect(items[0].addedDate).toBe('2025-06-01');
    expect(items[0].waitUntilDate).toBe('2025-07-01');
    expect(items[0].difficulty).toBe('hard');
  });

  it('returns empty array and error when supabase returns an error', async () => {
    const chain = mockChain({ data: null, error: { message: 'db error' } });
    mockFrom.mockReturnValue(chain);

    const { items, error } = await fetchItems('user-1');

    expect(items).toEqual([]);
    expect(error).toBeTruthy();
  });

  it('returns empty array when data is null', async () => {
    const chain = mockChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { items, error } = await fetchItems('user-1');

    expect(items).toEqual([]);
    expect(error).toBeNull();
  });

  it('converts questionnaire JSONB field correctly', async () => {
    const questionnaire: QuestionAnswer[] = [
      { id: 'q1', question: 'Why?', answer: 'because' },
    ];
    const row = makeDbRow({ questionnaire });
    const chain = mockChain({ data: [row], error: null });
    mockFrom.mockReturnValue(chain);

    const { items } = await fetchItems('user-1');

    expect(items[0].questionnaire).toEqual(questionnaire);
  });

  it('handles null optional fields gracefully', async () => {
    const row = makeDbRow({
      image_url: null,
      category: null,
      wait_until_date: null,
      difficulty: null,
    });
    const chain = mockChain({ data: [row], error: null });
    mockFrom.mockReturnValue(chain);

    const { items } = await fetchItems('user-1');

    expect(items[0].imageUrl).toBeFalsy();
    expect(items[0].category).toBeFalsy();
    expect(items[0].waitUntilDate).toBeFalsy();
    expect(items[0].difficulty).toBeFalsy();
  });
});

// ─── saveItem ───────────────────────────────────────────

describe('saveItem', () => {
  // We need to mock global fetch for the network ping test in saveItem
  const mockFetchGlobal = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchGlobal);
    // Default: network ping succeeds
    mockFetchGlobal.mockResolvedValue({ status: 200 });
  });

  it('validates that name, user_id, and constraint_type are required', async () => {
    const item = makeItem({ name: '' });

    const { success, error } = await saveItem(item, 'user-1');

    expect(success).toBe(false);
    expect(error).toBeTruthy();
  });

  it('validates that questionnaire is non-empty', async () => {
    const item = makeItem({ questionnaire: [] });

    const { success, error } = await saveItem(item, 'user-1');

    expect(success).toBe(false);
    expect(error).toBeTruthy();
  });

  it('validates consumption score is between 1 and 10', async () => {
    const item = makeItem({ consumptionScore: 0 });
    const { success } = await saveItem(item, 'user-1');
    expect(success).toBe(false);

    const item2 = makeItem({ consumptionScore: 11 });
    const { success: success2 } = await saveItem(item2, 'user-1');
    expect(success2).toBe(false);
  });

  it('returns success when insert succeeds', async () => {
    const chain = mockChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const { success, error } = await saveItem(makeItem(), 'user-1');

    expect(success).toBe(true);
    expect(error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('items');
  });

  it('returns failure when insert returns an error', async () => {
    const chain = mockChain({ error: { message: 'insert failed' } });
    mockFrom.mockReturnValue(chain);

    const { success, error } = await saveItem(makeItem(), 'user-1');

    expect(success).toBe(false);
    expect(error).toBeTruthy();
  });

  it('returns failure when network is unreachable', async () => {
    mockFetchGlobal.mockRejectedValueOnce(new Error('Network error'));

    const { success, error } = await saveItem(makeItem(), 'user-1');

    expect(success).toBe(false);
    expect(error).toBeTruthy();
  });
});

// ─── deleteItem ─────────────────────────────────────────

describe('deleteItem', () => {
  it('calls delete with correct item id and user id', async () => {
    const chain = mockChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const { success, error } = await deleteItem('item-99', 'user-1');

    expect(mockFrom).toHaveBeenCalledWith('items');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'item-99');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(success).toBe(true);
    expect(error).toBeNull();
  });

  it('returns failure when delete errors', async () => {
    const chain = mockChain({ error: { message: 'delete failed' } });
    mockFrom.mockReturnValue(chain);

    const { success, error } = await deleteItem('item-99', 'user-1');

    expect(success).toBe(false);
    expect(error).toBeTruthy();
  });
});

// ─── testConnection ─────────────────────────────────────

describe('testConnection', () => {
  const mockFetchGlobal = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchGlobal);
  });

  it('returns success when supabase responds', async () => {
    mockFetchGlobal.mockResolvedValue({ status: 200 });
    const chain = mockChain({ error: null, count: 3 });
    mockFrom.mockReturnValue(chain);

    const { success, error } = await testConnection();

    expect(success).toBe(true);
    expect(error).toBeNull();
  });

  it('returns failure when network fetch fails', async () => {
    mockFetchGlobal.mockRejectedValueOnce(new Error('Network error'));

    const { success, error } = await testConnection();

    expect(success).toBe(false);
    expect(error).toBeTruthy();
  });
});
