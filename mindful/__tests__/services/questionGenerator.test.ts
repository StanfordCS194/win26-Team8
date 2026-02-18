import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateQuestions, DEFAULT_QUESTIONS } from '../../services/questionGenerator';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('generateQuestions', () => {
  it('returns DEFAULT_QUESTIONS when API key is not set', async () => {
    // Ensure no API key is present
    vi.stubEnv('EXPO_PUBLIC_ANTHROPIC_API_KEY', '');

    const result = await generateQuestions('AirPods');

    expect(result).toEqual(DEFAULT_QUESTIONS);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns DEFAULT_QUESTIONS when API key is placeholder', async () => {
    vi.stubEnv('EXPO_PUBLIC_ANTHROPIC_API_KEY', 'your_api_key_here');

    const result = await generateQuestions('AirPods');

    expect(result).toEqual(DEFAULT_QUESTIONS);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns parsed questions on successful API response', async () => {
    vi.stubEnv('EXPO_PUBLIC_ANTHROPIC_API_KEY', 'sk-ant-test-key-12345');

    const mockQuestions = [
      { id: 'importance', question: 'How important are AirPods?', placeholder: 'Not/Very' },
      { id: 'urgency', question: 'How urgent are AirPods?', placeholder: 'Not/Very' },
      { id: 'alternatives', question: 'How about other headphones?', placeholder: 'Not/Very' },
      { id: 'impact', question: 'How much will AirPods improve things?', placeholder: 'Not/Very' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: JSON.stringify(mockQuestions) }],
      }),
    });

    const result = await generateQuestions('AirPods');

    expect(result).toEqual(mockQuestions);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('falls back to DEFAULT_QUESTIONS on API error status', async () => {
    vi.stubEnv('EXPO_PUBLIC_ANTHROPIC_API_KEY', 'sk-ant-test-key-12345');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const result = await generateQuestions('AirPods');
    expect(result).toEqual(DEFAULT_QUESTIONS);
  });

  it('falls back to DEFAULT_QUESTIONS when response has no content', async () => {
    vi.stubEnv('EXPO_PUBLIC_ANTHROPIC_API_KEY', 'sk-ant-test-key-12345');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [] }),
    });

    const result = await generateQuestions('AirPods');
    expect(result).toEqual(DEFAULT_QUESTIONS);
  });

  it('falls back to DEFAULT_QUESTIONS when JSON cannot be parsed from response', async () => {
    vi.stubEnv('EXPO_PUBLIC_ANTHROPIC_API_KEY', 'sk-ant-test-key-12345');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: 'Here are some great questions for you!' }],
      }),
    });

    const result = await generateQuestions('AirPods');
    expect(result).toEqual(DEFAULT_QUESTIONS);
  });

  it('falls back to DEFAULT_QUESTIONS when response has wrong number of questions', async () => {
    vi.stubEnv('EXPO_PUBLIC_ANTHROPIC_API_KEY', 'sk-ant-test-key-12345');

    const twoQuestions = [
      { id: 'a', question: 'Q1?', placeholder: 'P1' },
      { id: 'b', question: 'Q2?', placeholder: 'P2' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: JSON.stringify(twoQuestions) }],
      }),
    });

    const result = await generateQuestions('AirPods');
    expect(result).toEqual(DEFAULT_QUESTIONS);
  });

  it('falls back to DEFAULT_QUESTIONS when questions have invalid structure', async () => {
    vi.stubEnv('EXPO_PUBLIC_ANTHROPIC_API_KEY', 'sk-ant-test-key-12345');

    const badQuestions = [
      { id: 'a', question: 'Q1?' }, // missing placeholder
      { id: 'b', question: 'Q2?', placeholder: 'P2' },
      { id: 'c', question: 'Q3?', placeholder: 'P3' },
      { id: 'd', question: 'Q4?', placeholder: 'P4' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: JSON.stringify(badQuestions) }],
      }),
    });

    const result = await generateQuestions('AirPods');
    expect(result).toEqual(DEFAULT_QUESTIONS);
  });

  it('falls back to DEFAULT_QUESTIONS on network error', async () => {
    vi.stubEnv('EXPO_PUBLIC_ANTHROPIC_API_KEY', 'sk-ant-test-key-12345');

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await generateQuestions('AirPods');
    expect(result).toEqual(DEFAULT_QUESTIONS);
  });

  it('extracts JSON array even with surrounding text', async () => {
    vi.stubEnv('EXPO_PUBLIC_ANTHROPIC_API_KEY', 'sk-ant-test-key-12345');

    const mockQuestions = [
      { id: 'a', question: 'Q1?', placeholder: 'P1' },
      { id: 'b', question: 'Q2?', placeholder: 'P2' },
      { id: 'c', question: 'Q3?', placeholder: 'P3' },
      { id: 'd', question: 'Q4?', placeholder: 'P4' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: `Here are the questions:\n${JSON.stringify(mockQuestions)}\nHope that helps!` }],
      }),
    });

    const result = await generateQuestions('Test Product');
    expect(result).toEqual(mockQuestions);
  });
});
