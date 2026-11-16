<script lang="ts">
  import type { Verse, HighlightColor } from '$types';
  import { HIGHLIGHT_META } from '$stores/study';

  let {
    verses,
    selectedVerse = null,
    notesCountByVerse = {},
    highlightsByVerse = {},
    onVerseClick,
  }: {
    verses: Verse[];
    selectedVerse?: number | null;
    notesCountByVerse?: Record<number, number>;
    highlightsByVerse?: Record<number, HighlightColor>;
    onVerseClick?: (verse: Verse) => void;
  } = $props();
</script>

<div class="space-y-2 leading-relaxed text-lg font-serif">
  {#each verses as verse}
    {@const noteCount = notesCountByVerse[verse.number] || 0}
    {@const isSelected = selectedVerse === verse.number}
    {@const color = highlightsByVerse[verse.number]}
    <div
      id="v{verse.number}"
      role="button"
      tabindex="0"
      onclick={() => onVerseClick?.(verse)}
      onkeydown={(e) => e.key === 'Enter' && onVerseClick?.(verse)}
      class="group flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer border {isSelected
        ? 'ring-2 ring-blue-500/50 border-blue-500/40'
        : color
          ? ''
          : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'} {color
        ? HIGHLIGHT_META[color].verse
        : isSelected
          ? 'bg-blue-50/50 dark:bg-blue-950/20'
          : ''}"
    >
      <div class="flex items-center gap-1.5 select-none pt-1">
        <span
          class="text-xs font-sans font-bold w-6 text-right transition-colors"
          style="color: var(--color-muted)"
        >
          {verse.number}
        </span>
        {#if color}
          <span
            class="w-2.5 h-2.5 rounded-full {HIGHLIGHT_META[color].swatch}"
            title="Destaque: {HIGHLIGHT_META[color].label}"
          ></span>
        {/if}
        {#if noteCount > 0}
          <span
            class="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-sans font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800"
            title="{noteCount} anotação(ões) neste versículo"
          >
            <span>📝</span>
            <span>{noteCount}</span>
          </span>
        {/if}
      </div>
      <p class="flex-1 font-serif text-[17px] leading-relaxed select-text">
        {verse.text}
      </p>
    </div>
  {/each}
</div>
