<script lang="ts">
  import { HIGHLIGHT_META, HIGHLIGHT_COLORS } from '$stores/study';
  import type { Highlight, HighlightColor } from '$types';

  let {
    selectedVerse,
    selectedHighlight,
    reviewMessage,
    studyError,
    onHighlight,
    onReview,
  }: {
    selectedVerse: number | null;
    selectedHighlight: Highlight | null | undefined;
    reviewMessage: string | null;
    studyError: string | null;
    onHighlight: (color: HighlightColor) => void;
    onReview: () => void;
  } = $props();
</script>

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
        onclick={() => onHighlight(color)}
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
      <button type="button" onclick={onReview}
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
