import { api } from '$api/client';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const chapterNumber = parseInt(params.chapter, 10);
  if (isNaN(chapterNumber) || chapterNumber < 1) {
    throw error(400, 'Número de capítulo inválido');
  }

  try {
    const chapterData = await api.getChapter(params.book, chapterNumber);
    return { chapter: chapterData };
  } catch (e) {
    throw error(404, `Capítulo ${params.chapter} do livro "${params.book}" não encontrado`);
  }
};
