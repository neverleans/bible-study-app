<script lang="ts">
  import type { Book } from '$types';

  let { book, readCount = 0 }: { book: Book; readCount?: number } = $props();
  let pct = $derived(book.chapterCount > 0 ? Math.min(100, Math.round((readCount / book.chapterCount) * 100)) : 0);
</script>

<a
  href="/{book.abbrev}"
  class="group block p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer"
  style="background-color: var(--color-surface); border-color: var(--color-border)"
>
  <div class="flex items-center justify-between mb-2">
    <span
      class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
      style="background-color: var(--color-border); color: var(--color-muted)"
    >
      {book.abbrev}
    </span>
    <span class="text-xs" style="color: var(--color-muted)">
      {book.chapterCount} {book.chapterCount === 1 ? 'capítulo' : 'capítulos'}
    </span>
  </div>
  <h3 class="font-semibold text-lg transition-colors group-hover:text-blue-500">
    {book.name}
  </h3>
  {#if readCount > 0}
    <div class="mt-2" title="{readCount} de {book.chapterCount} capítulos lidos">
      <div class="h-1.5 rounded-full overflow-hidden" style="background-color: var(--color-border)" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct} aria-label="Progresso de leitura de {book.name}">
        <div class="h-full rounded-full {pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}" style="width: {pct}%"></div>
      </div>
      <span class="text-[11px]" style="color: var(--color-muted)">{pct >= 100 ? '✓ Concluído' : `${readCount}/${book.chapterCount}`}</span>
    </div>
  {/if}
</a>
