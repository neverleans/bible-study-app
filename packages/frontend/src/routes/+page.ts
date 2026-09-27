import { api } from '$api/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  // Use custom fetch or API client
  try {
    const books = await api.getBooks();
    return {
      books,
      otBooks: books.filter((b) => b.testament === 'OT'),
      ntBooks: books.filter((b) => b.testament === 'NT'),
    };
  } catch (e) {
    console.error('Failed to load books:', e);
    return {
      books: [],
      otBooks: [],
      ntBooks: [],
    };
  }
};
