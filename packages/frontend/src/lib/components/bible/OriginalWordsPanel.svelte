<script lang="ts">
  import { api } from '$api/client';
  import type { ChapterOriginal, OriginalWord, LexiconEntry } from '$types';

  let {
    original,
    verseNumber,
  }: {
    original: ChapterOriginal | null;
    verseNumber: number | null;
  } = $props();

  let selectedWord = $state<OriginalWord | null>(null);
  let entry = $state<LexiconEntry | null>(null);
  let isLoading = $state(false);
  let lookupError = $state<string | null>(null);

  let words = $derived(
    original && verseNumber !== null
      ? (original.verses.find((v) => v.verseNumber === verseNumber)?.words ?? [])
      : []
  );
  let isHebrew = $derived(original?.lang === 'heb');

  // Clear the open entry when the verse changes
  $effect(() => {
    verseNumber;
    selectedWord = null;
    entry = null;
    lookupError = null;
  });

  async function selectWord(word: OriginalWord) {
    selectedWord = word;
    entry = null;
    lookupError = null;
    if (!word.strong) return;
    isLoading = true;
    try {
      const result = await api.getLexiconEntry(word.strong);
      if (selectedWord === word) entry = result;
    } catch {
      if (selectedWord === word) lookupError = 'Verbete não encontrado no léxico.';
    } finally {
      isLoading = false;
    }
  }
</script>

{#if original?.available}
  <details
    class="rounded-xl border"
    style="background-color: var(--color-surface); border-color: var(--color-border)"
  >
    <summary class="px-4 py-3 text-xs font-semibold cursor-pointer select-none" style="color: var(--color-muted)">
      📜 Palavras originais ({isHebrew ? 'hebraico' : 'grego'})
      {verseNumber !== null ? `— versículo ${verseNumber}` : ''}
    </summary>

    <div class="px-4 pb-4 space-y-3">
      {#if verseNumber === null}
        <p class="text-xs" style="color: var(--color-muted)">
          Selecione um versículo para ver as palavras no original.
        </p>
      {:else if words.length === 0}
        <p class="text-xs" style="color: var(--color-muted)">Sem dados originais para este versículo.</p>
      {:else}
        <div class="flex flex-wrap gap-2 {isHebrew ? 'flex-row-reverse' : ''}" dir={isHebrew ? 'rtl' : 'ltr'}>
          {#each words as word (word.position)}
            <button
              type="button"
              onclick={() => selectWord(word)}
              aria-pressed={selectedWord === word}
              class="flex flex-col items-center px-2.5 py-1.5 rounded-lg border text-center cursor-pointer transition-colors hover:border-blue-500 {selectedWord === word
                ? 'ring-2 ring-blue-500/60'
                : ''}"
              style="border-color: var(--color-border)"
              dir="ltr"
            >
              <span class="text-xl leading-tight" lang={isHebrew ? 'he' : 'el'} dir={isHebrew ? 'rtl' : 'ltr'}>{word.surface}</span>
              {#if word.transliteration}
                <span class="text-[11px] italic" style="color: var(--color-muted)">{word.transliteration}</span>
              {/if}
              {#if word.gloss}
                <span class="text-[11px]">{word.gloss}</span>
              {/if}
            </button>
          {/each}
        </div>

        {#if selectedWord}
          <div
            class="rounded-lg border p-3 text-sm space-y-1.5"
            style="border-color: var(--color-border)"
            aria-live="polite"
          >
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span class="text-lg" lang={isHebrew ? 'he' : 'el'}>{selectedWord.lemma ?? selectedWord.surface}</span>
              {#if selectedWord.strong}
                <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200">
                  {selectedWord.strong}
                </span>
              {/if}
              {#if selectedWord.morph}
                <span class="text-xs font-mono" style="color: var(--color-muted)" title="Morfologia">
                  {selectedWord.morph}
                </span>
              {/if}
            </div>
            {#if isLoading}
              <p class="text-xs" style="color: var(--color-muted)">Carregando verbete…</p>
            {:else if lookupError}
              <p class="text-xs" style="color: var(--color-muted)">{lookupError}</p>
            {:else if entry}
              {#if entry.gloss}<p class="font-medium">{entry.gloss}</p>{/if}
              {#if entry.meaning}
                <p class="text-xs whitespace-pre-line max-h-40 overflow-y-auto" style="color: var(--color-muted)">
                  {entry.meaning}
                </p>
              {/if}
            {/if}
          </div>
        {/if}
      {/if}

      <p class="text-[11px]" style="color: var(--color-muted)">
        Dados: <a class="underline" href="https://github.com/STEPBible/STEPBible-Data" target="_blank" rel="noopener noreferrer">STEPBible</a>
        / Tyndale House Cambridge, CC BY 4.0. Glosas e verbetes em inglês.
      </p>
    </div>
  </details>
{/if}
