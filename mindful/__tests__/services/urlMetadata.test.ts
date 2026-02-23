import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUrlMetadata } from '../../services/urlMetadata';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('fetchUrlMetadata', () => {
  it('returns title and image on successful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          title: 'Cool Product',
          image: { url: 'https://example.com/img.png' },
        },
      }),
    });

    const result = await fetchUrlMetadata('https://example.com/product');

    expect(result).toEqual({
      title: 'Cool Product',
      image: 'https://example.com/img.png',
    });
  });

  it('returns null image when no image in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          title: 'No Image Product',
        },
      }),
    });

    const result = await fetchUrlMetadata('https://example.com/product');

    expect(result).toEqual({
      title: 'No Image Product',
      image: null,
    });
  });

  it('returns null title when no title in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          image: { url: 'https://example.com/img.png' },
        },
      }),
    });

    const result = await fetchUrlMetadata('https://example.com/product');

    expect(result).toEqual({
      title: null,
      image: 'https://example.com/img.png',
    });
  });

  it('returns nulls on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await fetchUrlMetadata('https://example.com/product');

    expect(result).toEqual({ title: null, image: null });
  });

  it('returns nulls when API returns non-success status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'fail',
        data: {},
      }),
    });

    const result = await fetchUrlMetadata('https://example.com/product');

    expect(result).toEqual({ title: null, image: null });
  });

  it('returns nulls on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchUrlMetadata('https://example.com/product');

    expect(result).toEqual({ title: null, image: null });
  });

  it('returns nulls on abort/timeout', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await fetchUrlMetadata('https://example.com/product');

    expect(result).toEqual({ title: null, image: null });
  });

  it('encodes URL parameter correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        data: { title: 'Test' },
      }),
    });

    await fetchUrlMetadata('https://example.com/product?id=123&foo=bar');

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('api.microlink.io');
    expect(calledUrl).toContain(encodeURIComponent('https://example.com/product?id=123&foo=bar'));
  });
});
