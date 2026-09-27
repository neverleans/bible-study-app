import { api } from '$api/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
  const q = url.searchParams.get('q') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const testament = url.searchParams.get('testament') as 'OT' | 'NT' | null;
  const book = url.searchParams.get('book') || null;

  try {
    const books = await api.getBooks();

    if (q.trim().length >= 2) {
      const searchResult = await api.search({
        q: q.trim(),
        page,
        testament: testament || undefined,
        book: book || undefined,
      });

      return {
        books,
        query: q,
        page,
        testament,
        book,
        searchResult,
      };
    }

    return {
      books,
      query: q,
      page,
      testament,
      book,
      searchResult: null,
    };
  } catch (e) {
    console.error('Search load failed:', e);
    return {
      books: [],
      query: q,
      page,
      testament,
      book,
      searchResult: null,
    };
  }
};
