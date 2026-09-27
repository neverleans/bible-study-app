<script lang="ts">
  let {
    bookAbbrev,
    chapterCount,
    currentChapter = null,
  }: {
    bookAbbrev: string;
    chapterCount: number;
    currentChapter?: number | null;
  } = $props();

  const chapters = $derived(Array.from({ length: chapterCount }, (_, i) => i + 1));
</script>

<div class="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
  {#each chapters as ch}
    <a
      href="/{bookAbbrev}/{ch}"
      class="flex items-center justify-center h-12 rounded-lg font-medium text-sm transition-all duration-150 border cursor-pointer hover:border-blue-500 hover:text-blue-500"
      class:active={currentChapter === ch}
      style={currentChapter === ch
        ? 'background-color: var(--color-primary); color: white; border-color: var(--color-primary);'
        : 'background-color: var(--color-surface); border-color: var(--color-border);'}
    >
      {ch}
    </a>
  {/each}
</div>
