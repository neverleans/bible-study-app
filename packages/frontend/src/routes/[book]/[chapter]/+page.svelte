<script lang="ts">
  import Breadcrumbs from '$components/bible/Breadcrumbs.svelte';
  import VerseList from '$components/bible/VerseList.svelte';
  import type { PageData } from './$types';
  import type { Verse } from '$types';

  let { data }: { data: PageData } = $props();

  let selectedVerse = $state<number | null>(null);

  function handleVerseClick(verse: Verse) {
    selectedVerse = selectedVerse === verse.number ? null : verse.number;
  }
</script>

<svelte:head>
  <title>{data.chapter.book.name} {data.chapter.number} — Leitura Bíblica</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
  <Breadcrumbs
    items={[
      { label: 'Início', href: '/' },
      { label: data.chapter.book.name, href: `/${data.chapter.book.abbrev}` },
      { label: `Capítulo ${data.chapter.number}` },
    ]}
  />

  <!-- Chapter Header & Navigation -->
  <div
    class="flex items-center justify-between p-4 sm:p-6 rounded-2xl border"
    style="background-color: var(--color-surface); border-color: var(--color-border)"
  >
    <div class="flex items-center gap-3">
      <h1 class="text-2xl sm:text-3xl font-extrabold" style="color: var(--color-text)">
        {data.chapter.book.name} {data.chapter.number}
      </h1>
      <span class="text-xs px-2.5 py-1 rounded-full font-medium" style="background-color: var(--color-border); color: var(--color-muted)">
        {data.chapter.verses.length} versículos
      </span>
    </div>

    <!-- Top Prev / Next Navigation -->
    <div class="flex items-center gap-2">
      {#if data.chapter.prevChapter}
        <a
          href="/{data.chapter.prevChapter.bookAbbrev}/{data.chapter.prevChapter.chapterNumber}"
          class="p-2 rounded-lg border transition-colors hover:border-blue-500 cursor-pointer"
          style="border-color: var(--color-border)"
          title="Capítulo anterior"
          aria-label="Capítulo anterior"
        >
          ←
        </a>
      {/if}
      <a
        href="/{data.chapter.book.abbrev}"
        class="text-xs px-3 py-2 rounded-lg border font-medium transition-colors hover:border-blue-500 cursor-pointer"
        style="border-color: var(--color-border); color: var(--color-muted)"
      >
        Todos Capítulos
      </a>
      {#if data.chapter.nextChapter}
        <a
          href="/{data.chapter.nextChapter.bookAbbrev}/{data.chapter.nextChapter.chapterNumber}"
          class="p-2 rounded-lg border transition-colors hover:border-blue-500 cursor-pointer"
          style="border-color: var(--color-border)"
          title="Próximo capítulo"
          aria-label="Próximo capítulo"
        >
          →
        </a>
      {/if}
    </div>
  </div>

  <!-- Verses Content -->
  <div
    class="p-6 sm:p-8 rounded-2xl border shadow-sm"
    style="background-color: var(--color-surface); border-color: var(--color-border)"
  >
    <VerseList
      verses={data.chapter.verses}
      {selectedVerse}
      onVerseClick={handleVerseClick}
    />
  </div>

  <!-- Bottom Navigation Buttons -->
  <div class="flex items-center justify-between pt-4 pb-8">
    {#if data.chapter.prevChapter}
      <a
        href="/{data.chapter.prevChapter.bookAbbrev}/{data.chapter.prevChapter.chapterNumber}"
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm transition-all hover:shadow hover:border-blue-500 cursor-pointer"
        style="background-color: var(--color-surface); border-color: var(--color-border)"
      >
        <span>←</span>
        <span>Capítulo Anterior</span>
      </a>
    {:else}
      <div></div>
    {/if}

    {#if data.chapter.nextChapter}
      <a
        href="/{data.chapter.nextChapter.bookAbbrev}/{data.chapter.nextChapter.chapterNumber}"
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm transition-all hover:shadow hover:border-blue-500 cursor-pointer"
        style="background-color: var(--color-surface); border-color: var(--color-border)"
      >
        <span>Próximo Capítulo</span>
        <span>→</span>
      </a>
    {/if}
  </div>
</div>
