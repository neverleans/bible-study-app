<script lang="ts">
  import type { ChapterNavigation } from '$types';

  let { prev, next }: { prev?: ChapterNavigation | null; next?: ChapterNavigation | null } = $props();
</script>

<!-- Bottom Navigation Buttons -->
<div class="flex items-center justify-between pt-4 pb-8">
  {#if prev}
    <a
      href="/{prev.bookAbbrev}/{prev.chapterNumber}"
      class="flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm transition-all hover:shadow hover:border-blue-500 cursor-pointer"
      style="background-color: var(--color-surface); border-color: var(--color-border)"
    >
      <span>←</span>
      <span>Capítulo Anterior</span>
    </a>
  {:else}
    <div></div>
  {/if}

  {#if next}
    <a
      href="/{next.bookAbbrev}/{next.chapterNumber}"
      class="flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm transition-all hover:shadow hover:border-blue-500 cursor-pointer"
      style="background-color: var(--color-surface); border-color: var(--color-border)"
    >
      <span>Próximo Capítulo</span>
      <span>→</span>
    </a>
  {/if}
</div>
