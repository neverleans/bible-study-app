import { api } from '$api/client';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  try {
    const book = await api.getBook(params.book);
    return { book };
  } catch (e) {
    throw error(404, `Livro "${params.book}" não encontrado`);
  }
};
