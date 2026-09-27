<script lang="ts">
  import Breadcrumbs from '$components/bible/Breadcrumbs.svelte';
  import ChapterGrid from '$components/bible/ChapterGrid.svelte';
  import BookReflectionModal from '$components/ai/BookReflectionModal.svelte';
  import { api } from '$api/client';
  import type { PageData } from './$types';
  import type { StudyAid } from '$types';

  let { data }: { data: PageData } = $props();

  let showReflectionModal = $state(false);
  let bookStudyAids = $state<StudyAid[]>([]);
  let isLoadingAids = $state(false);

  const testamentLabel = $derived(
    data.book.testament === 'OT' ? 'Antigo Testamento' : 'Novo Testamento',
  );

  let contextAid = $derived(bookStudyAids.find((a) => a.type === 'context'));
  let keyVersesAids = $derived(bookStudyAids.filter((a) => a.type === 'key_verse'));

  $effect(() => {
    if (data.book?.abbrev) {
      loadBookStudyAids();
    }
  });

  async function loadBookStudyAids() {
    isLoadingAids = true;
    try {
      bookStudyAids = await api.getStudyAidsByBook(data.book.abbrev);
    } catch (err) {
      console.error('Falha ao carregar recursos do livro:', err);
    } finally {
      isLoadingAids = false;
    }
  }
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

  <!-- Book Header Banner -->
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

    <!-- Context & Curated Study Information -->
    {#if contextAid}
      <div class="mt-4 pt-4 border-t space-y-3" style="border-color: var(--color-border)">
        <p class="text-sm leading-relaxed" style="color: var(--color-text)">
          {contextAid.content}
        </p>

        <div class="flex flex-wrap items-center gap-4 text-xs" style="color: var(--color-muted)">
          {#if contextAid.metadata.author}
            <div class="flex items-center gap-1">
              <span>✍️</span>
              <span><strong>Autor:</strong> {contextAid.metadata.author}</span>
            </div>
          {/if}
          {#if contextAid.metadata.date}
            <div class="flex items-center gap-1">
              <span>📅</span>
              <span><strong>Datação:</strong> {contextAid.metadata.date}</span>
            </div>
          {/if}
          {#if contextAid.metadata.audience}
            <div class="flex items-center gap-1">
              <span>👥</span>
              <span><strong>Público:</strong> {contextAid.metadata.audience}</span>
            </div>
          {/if}
        </div>

        {#if Array.isArray(contextAid.metadata.keyThemes) && contextAid.metadata.keyThemes.length > 0}
          <div class="flex flex-wrap gap-1.5 pt-1">
            {#each contextAid.metadata.keyThemes as theme}
              <span
                class="px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-muted)"
              >
                🏷️ {theme}
              </span>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Key Verses Section (if available) -->
  {#if keyVersesAids.length > 0}
    <div
      class="p-5 rounded-2xl border space-y-3"
      style="background-color: var(--color-surface); border-color: var(--color-border)"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5" style="color: var(--color-muted)">
          <span>⭐</span>
          <span>Versículos-Chave de {data.book.name}</span>
        </h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#each keyVersesAids as kv}
          <div
            class="p-3.5 rounded-xl border space-y-1.5"
            style="background-color: var(--color-bg); border-color: var(--color-border)"
          >
            <div class="flex items-center justify-between">
              {#if kv.metadata.targetChapter || kv.metadata.chapterNumber}
                <a
                  href="/{data.book.abbrev}/{kv.metadata.targetChapter || kv.metadata.chapterNumber}{kv.metadata.verseNumber ? `#v${kv.metadata.verseNumber}` : ''}"
                  class="font-bold text-xs hover:underline flex items-center gap-1"
                  style="color: var(--color-primary)"
                >
                  <span>{kv.metadata.reference || `${data.book.name} ${kv.metadata.chapterNumber}:${kv.metadata.verseNumber}`}</span>
                  <span class="text-[10px]">↗</span>
                </a>
              {:else}
                <span class="font-bold text-xs" style="color: var(--color-primary)">
                  {kv.metadata.reference}
                </span>
              {/if}
            </div>
            <p class="font-serif italic text-xs leading-relaxed" style="color: var(--color-text)">
              "{kv.content}"
            </p>
            {#if kv.metadata.commentary}
              <p class="text-[11px] leading-relaxed" style="color: var(--color-muted)">
                {kv.metadata.commentary}
              </p>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Chapter Grid -->
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
