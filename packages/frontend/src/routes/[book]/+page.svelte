<script lang="ts">
  import Breadcrumbs from '$components/bible/Breadcrumbs.svelte';
  import ChapterGrid from '$components/bible/ChapterGrid.svelte';
  import BookReflectionModal from '$components/ai/BookReflectionModal.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let showReflectionModal = $state(false);

  const testamentLabel = $derived(
    data.book.testament === 'OT' ? 'Antigo Testamento' : 'Novo Testamento',
  );
</script>

<svelte:head>
  <title>{data.book.name} — Capítulos e Leitura</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <Breadcrumbs
    items={[
      { label: 'Início', href: '/' },
      { label: testamentLabel, href: '/' },
      { label: data.book.name },
    ]}
  />

  <div
    class="p-6 rounded-2xl border"
    style="background-color: var(--color-surface); border-color: var(--color-border)"
  >
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-extrabold" style="color: var(--color-text)">
          {data.book.name}
        </h1>
        <span
          class="text-xs uppercase font-bold px-3 py-1 rounded-full"
          style="background-color: var(--color-primary); color: white;"
        >
          {data.book.abbrev}
        </span>
      </div>

      <button
        onclick={() => (showReflectionModal = true)}
        class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all hover:shadow hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400"
        style="background-color: var(--color-bg); border-color: var(--color-border)"
        title="Abrir introdução teológica e reflexão do livro com IA"
      >
        <span>✨</span>
        <span>Reflexão do Livro</span>
      </button>
    </div>

    <p class="text-sm" style="color: var(--color-muted)">
      {testamentLabel} · {data.book.chapterCount} {data.book.chapterCount === 1 ? 'capítulo' : 'capítulos'}
    </p>
  </div>

  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold">Capítulos</h2>
      <span class="text-xs" style="color: var(--color-muted)">Selecione um capítulo para iniciar a leitura</span>
    </div>
    <ChapterGrid bookAbbrev={data.book.abbrev} chapterCount={data.book.chapterCount} />
  </div>
</div>

<!-- Book Reflection Modal with Gemini and BullMQ -->
<BookReflectionModal
  book={data.book}
  isOpen={showReflectionModal}
  onClose={() => (showReflectionModal = false)}
/>
