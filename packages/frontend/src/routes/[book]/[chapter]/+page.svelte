<script lang="ts">
  import Breadcrumbs from '$components/bible/Breadcrumbs.svelte';
  import VerseList from '$components/bible/VerseList.svelte';
  import NoteDrawer from '$components/notes/NoteDrawer.svelte';
  import ChapterAnalysisModal from '$components/ai/ChapterAnalysisModal.svelte';
  import StudyAidsPanel from '$components/bible/StudyAidsPanel.svelte';
  import OriginalWordsPanel from '$components/bible/OriginalWordsPanel.svelte';
  import QuizPanel from '$components/study/QuizPanel.svelte';
  import { api } from '$api/client';
  import { onMount } from 'svelte';
  import { getGuestNotes, isAuthenticated } from '$stores/auth';
  import {
    HIGHLIGHT_META,
    HIGHLIGHT_COLORS,
    loadHighlights,
    setHighlight,
    removeHighlight,
    loadReadChapters,
    setChapterRead,
  } from '$stores/study';
  import type { PageData } from './$types';
  import type { Verse, Note, StudyAid, Highlight, HighlightColor, ChapterOriginal } from '$types';

  let { data }: { data: PageData } = $props();

  let chapterHighlights = $state<Highlight[]>([]);
  let chapterOriginal = $state<ChapterOriginal | null>(null);
  let isRead = $state(false);
  let studyError = $state<string | null>(null);

  let highlightsByVerse = $derived(
    chapterHighlights.reduce<Record<number, HighlightColor>>((acc, h) => {
      acc[h.verseNumber] = h.color;
      return acc;
    }, {})
  );

  async function loadStudyState() {
    const book = data.chapter.book.abbrev;
    const chapter = data.chapter.number;
    const [highlights, read] = await Promise.all([
      loadHighlights(book, chapter, $isAuthenticated),
      loadReadChapters(book, $isAuthenticated),
    ]);
    // Ignore stale responses if the user navigated meanwhile
    if (book === data.chapter.book.abbrev && chapter === data.chapter.number) {
      chapterHighlights = highlights;
      isRead = read.includes(chapter);
    }
  }

  async function loadOriginal() {
    const book = data.chapter.book.abbrev;
    const chapter = data.chapter.number;
    chapterOriginal = null;
    try {
      const result = await api.getChapterOriginal(book, chapter);
      if (book === data.chapter.book.abbrev && chapter === data.chapter.number) {
        chapterOriginal = result;
      }
    } catch (err) {
      console.warn('Palavras originais indisponíveis:', err);
    }
  }

  async function handleHighlight(color: HighlightColor) {
    if (selectedVerse === null) return;
    studyError = null;
    try {
      if (selectedHighlight && selectedHighlight.color === color) {
        await removeHighlight(selectedHighlight, $isAuthenticated);
        chapterHighlights = chapterHighlights.filter((h) => h.id !== selectedHighlight!.id);
        return;
      }
      const saved = await setHighlight(
        {
          bookAbbrev: data.chapter.book.abbrev,
          chapterNumber: data.chapter.number,
          verseNumber: selectedVerse,
          color,
        },
        $isAuthenticated,
      );
      chapterHighlights = [
        ...chapterHighlights.filter((h) => h.verseNumber !== saved.verseNumber),
        saved,
      ];
    } catch (err) {
      console.error('Falha ao salvar destaque:', err);
      studyError = 'Não foi possível salvar o destaque. Tente novamente.';
    }
  }

  let reviewMessage = $state<string | null>(null);

  async function addToReview() {
    if (selectedVerse === null) return;
    studyError = null;
    reviewMessage = null;
    try {
      await api.addVerseToReview(data.chapter.book.abbrev, data.chapter.number, selectedVerse);
      reviewMessage = `Versículo ${selectedVerse} adicionado à revisão.`;
      window.dispatchEvent(new CustomEvent('review-changed'));
    } catch (err) {
      console.error('Falha ao adicionar à revisão:', err);
      studyError = 'Não foi possível adicionar à revisão. Tente novamente.';
    }
  }

  async function toggleRead() {
    studyError = null;
    const next = !isRead;
    try {
      await setChapterRead(data.chapter.book.abbrev, data.chapter.number, next, $isAuthenticated);
      isRead = next;
    } catch (err) {
      console.error('Falha ao atualizar progresso:', err);
      studyError = 'Não foi possível atualizar o progresso. Tente novamente.';
    }
  }

  let selectedVerse = $state<number | null>(null);
  let isDrawerOpen = $state(false);
  let showAiModal = $state(false);
  let chapterNotes = $state<Note[]>([]);
  let chapterStudyAids = $state<StudyAid[]>([]);
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

  let selectedHighlight = $derived(
    selectedVerse !== null
      ? chapterHighlights.find((h) => h.verseNumber === selectedVerse) || null
      : null
  );

  async function loadChapterNotes() {
    isLoadingNotes = true;
    try {
      const guestNotes = getGuestNotes({
        book: data.chapter.book.abbrev,
        chapter: data.chapter.number,
      });

      let serverNotes: Note[] = [];
      if ($isAuthenticated) {
        try {
          serverNotes = await api.getNotes({
            book: data.chapter.book.abbrev,
            chapter: data.chapter.number,
          });
        } catch (e) {
          console.warn('Falha ao carregar notas da nuvem:', e);
        }
      }

      // Merge avoiding duplicate ids
      const noteMap = new Map<string, Note>();
      for (const n of guestNotes) noteMap.set(n.id, n);
      for (const n of serverNotes) noteMap.set(n.id, n);
      chapterNotes = Array.from(noteMap.values());
    } catch (err) {
      console.error('Falha ao carregar notas:', err);
    } finally {
      isLoadingNotes = false;
    }
  }

  async function loadChapterStudyAids() {
    try {
      chapterStudyAids = await api.getStudyAidsByChapter(
        data.chapter.book.abbrev,
        data.chapter.number,
      );
    } catch (err) {
      console.error('Falha ao carregar recursos de estudo:', err);
    }
  }

  $effect(() => {
    if (data.chapter?.book?.abbrev && data.chapter?.number) {
      const _auth = $isAuthenticated;
      selectedVerse = null;
      isDrawerOpen = false;
      loadChapterNotes();
      loadChapterStudyAids();
      loadStudyState();
      loadOriginal();
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
      <button
        onclick={() => (showAiModal = true)}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
        style="background-color: var(--color-surface); border-color: var(--color-border)"
        title="Ver Análise Exegética e Teológica do Capítulo com IA"
      >
        <span>✨</span>
        <span>Análise IA</span>
      </button>
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

  <!-- Observe: semantic highlights for the selected verse -->
  <div
    class="px-4 py-3 rounded-xl border space-y-2"
    style="background-color: var(--color-surface); border-color: var(--color-border)"
  >
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-semibold" style="color: var(--color-muted)">
        🔍 Observar{selectedVerse !== null ? ` — versículo ${selectedVerse}` : ''}:
      </span>
      {#each HIGHLIGHT_COLORS as color}
        {@const meta = HIGHLIGHT_META[color]}
        <button
          type="button"
          onclick={() => handleHighlight(color)}
          disabled={selectedVerse === null}
          aria-pressed={selectedHighlight?.color === color}
          title="{meta.label} — {meta.hint}"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed {selectedHighlight?.color === color
            ? 'ring-2 ring-blue-500/60'
            : ''}"
          style="border-color: var(--color-border)"
        >
          <span class="w-3 h-3 rounded-full {meta.swatch}"></span>
          {meta.label}
        </button>
      {/each}
    </div>
    {#if selectedVerse === null}
      <p class="text-xs" style="color: var(--color-muted)">
        Selecione um versículo e escolha o que você observou nele. Clique de novo na mesma cor para remover.
      </p>
    {:else}
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" onclick={addToReview}
          class="px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer hover:border-blue-500"
          style="border-color: var(--color-border)"
          title="Cria um cartão de revisão espaçada com este versículo">
          🧠 Revisar depois
        </button>
        {#if reviewMessage}
          <span class="text-xs text-emerald-700 dark:text-emerald-300" aria-live="polite">{reviewMessage}</span>
        {/if}
      </div>
    {/if}
    {#if studyError}
      <p class="text-xs text-red-600 dark:text-red-400" role="alert">{studyError}</p>
    {/if}
  </div>

  <!-- Interpret: original-language words of the selected verse -->
  <OriginalWordsPanel original={chapterOriginal} verseNumber={selectedVerse} />

  <!-- Curated Study Aids (Summaries, Key Verses, Cross-References) -->
  {#if chapterStudyAids.length > 0}
    <StudyAidsPanel studyAids={chapterStudyAids} />
  {/if}

  <!-- Verses Content -->
  <div
    class="p-6 sm:p-8 rounded-2xl border shadow-sm"
    style="background-color: var(--color-surface); border-color: var(--color-border)"
  >
    <VerseList
      verses={data.chapter.verses}
      {selectedVerse}
      {notesCountByVerse}
      {highlightsByVerse}
      onVerseClick={handleVerseClick}
    />
  </div>

  <!-- Retrieval practice: AI-generated quiz graded on the server -->
  <QuizPanel book={data.chapter.book.abbrev} chapter={data.chapter.number} />

  <!-- Reading progress -->
  <div class="flex justify-center">
    <button
      type="button"
      onclick={toggleRead}
      aria-pressed={isRead}
      class="px-5 py-2.5 rounded-xl border font-medium text-sm transition-all cursor-pointer {isRead
        ? 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-400 text-emerald-800 dark:text-emerald-200'
        : 'hover:border-emerald-500'}"
      style={isRead ? '' : 'background-color: var(--color-surface); border-color: var(--color-border)'}
    >
      {isRead ? '✓ Capítulo lido (clique para desmarcar)' : 'Marcar capítulo como lido'}
    </button>
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

<!-- Chapter AI Analysis Modal -->
<ChapterAnalysisModal
  book={data.chapter.book}
  chapterNumber={data.chapter.number}
  isOpen={showAiModal}
  onClose={() => (showAiModal = false)}
/>

