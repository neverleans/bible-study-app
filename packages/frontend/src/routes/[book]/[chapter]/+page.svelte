<script lang="ts">
  import Breadcrumbs from '$components/bible/Breadcrumbs.svelte';
  import VerseList from '$components/bible/VerseList.svelte';
  import NoteDrawer from '$components/notes/NoteDrawer.svelte';
  import { api } from '$api/client';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { Verse, Note } from '$types';

  let { data }: { data: PageData } = $props();

  let selectedVerse = $state<number | null>(null);
  let isDrawerOpen = $state(false);
  let chapterNotes = $state<Note[]>([]);
  let isLoadingNotes = $state(false);

  // Derived map of note counts per verse
  let notesCountByVerse = $derived(
    chapterNotes.reduce<Record<number, number>>((acc, note) => {
      acc[note.verseNumber] = (acc[note.verseNumber] || 0) + 1;
      return acc;
    }, {})
  );

  let activeVerse = $derived(
    selectedVerse !== null
      ? data.chapter.verses.find((v) => v.number === selectedVerse) || null
      : null
  );

  let activeVerseNotes = $derived(
    selectedVerse !== null
      ? chapterNotes.filter((n) => n.verseNumber === selectedVerse)
      : []
  );

  async function loadChapterNotes() {
    isLoadingNotes = true;
    try {
      chapterNotes = await api.getNotes({
        book: data.chapter.book.abbrev,
        chapter: data.chapter.number,
      });
    } catch (err) {
      console.error('Falha ao carregar notas:', err);
    } finally {
      isLoadingNotes = false;
    }
  }

  $effect(() => {
    if (data.chapter?.book?.abbrev && data.chapter?.number) {
      selectedVerse = null;
      isDrawerOpen = false;
      loadChapterNotes();
    }
  });

  onMount(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const match = window.location.hash.match(/^#v(\d+)$/);
      if (match) {
        const vNum = parseInt(match[1], 10);
        selectedVerse = vNum;
        isDrawerOpen = true;
        setTimeout(() => {
          const el = document.getElementById(`v${vNum}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }
  });

  function handleVerseClick(verse: Verse) {
    if (selectedVerse === verse.number && isDrawerOpen) {
      isDrawerOpen = false;
    } else {
      selectedVerse = verse.number;
      isDrawerOpen = true;
    }
  }

  function handleCloseDrawer() {
    isDrawerOpen = false;
  }

  function handleNoteSaved(savedNote: Note) {
    const existingIndex = chapterNotes.findIndex((n) => n.id === savedNote.id);
    if (existingIndex >= 0) {
      chapterNotes[existingIndex] = savedNote;
    } else {
      chapterNotes = [...chapterNotes, savedNote];
    }
  }

  function handleNoteDeleted(noteId: string) {
    chapterNotes = chapterNotes.filter((n) => n.id !== noteId);
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
      {#if chapterNotes.length > 0}
        <span class="text-xs px-2.5 py-1 rounded-full font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800">
          📝 {chapterNotes.length} {chapterNotes.length === 1 ? 'nota' : 'notas'}
        </span>
      {/if}
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

  <!-- Instruction banner for notes -->
  <div class="px-4 py-2 rounded-xl text-xs flex items-center justify-between border" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-muted)">
    <div class="flex items-center gap-2">
      <span>💡</span>
      <span>Dica: Clique em qualquer versículo para abrir suas anotações pessoais de estudo.</span>
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
      {notesCountByVerse}
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

<!-- Slide-over Note Drawer -->
<NoteDrawer
  book={data.chapter.book}
  chapterNumber={data.chapter.number}
  verse={activeVerse}
  notes={activeVerseNotes}
  isOpen={isDrawerOpen}
  onClose={handleCloseDrawer}
  onNoteSaved={handleNoteSaved}
  onNoteDeleted={handleNoteDeleted}
/>
