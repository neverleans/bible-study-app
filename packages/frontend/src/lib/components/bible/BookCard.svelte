<script lang="ts">
  import type { Book } from '$types';

  let { book }: { book: Book } = $props();
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
</a>
