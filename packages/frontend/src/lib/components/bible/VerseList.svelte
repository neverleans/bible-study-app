<script lang="ts">
  import type { Verse } from '$types';

  let {
    verses,
    selectedVerse = null,
    onVerseClick,
  }: {
    verses: Verse[];
    selectedVerse?: number | null;
    onVerseClick?: (verse: Verse) => void;
  } = $props();
</script>

<div class="space-y-3 leading-relaxed text-lg font-serif">
  {#each verses as verse}
    <div
      role="button"
      tabindex="0"
      onclick={() => onVerseClick?.(verse)}
      onkeydown={(e) => e.key === 'Enter' && onVerseClick?.(verse)}
      class="group flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
      class:selected={selectedVerse === verse.number}
      style={selectedVerse === verse.number ? 'background-color: var(--color-surface);' : ''}
    >
      <span
        class="text-xs font-sans font-bold select-none pt-1 w-6 text-right transition-colors"
        style="color: var(--color-muted)"
      >
        {verse.number}
      </span>
      <p class="flex-1">
        {verse.text}
      </p>
    </div>
  {/each}
</div>
