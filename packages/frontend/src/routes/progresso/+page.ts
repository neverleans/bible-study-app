import { api } from '$api/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  try {
    return { books: await api.getBooks() };
  } catch (e) {
    console.error('Failed to load books:', e);
    return { books: [] };
  }
};
