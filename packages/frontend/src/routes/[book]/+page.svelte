<script lang="ts">
  import Breadcrumbs from '$components/bible/Breadcrumbs.svelte';
  import ChapterGrid from '$components/bible/ChapterGrid.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const testamentLabel = $derived(
    data.book.testament === 'OT' ? 'Antigo Testamento' : 'Novo Testamento',
  );
</script>

<svelte:head>
  <title>{data.book.name} — Capítulos e Leitura</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <Breadcrumbs
    items={[
      { label: 'Início', href: '/' },
      { label: testamentLabel, href: '/' },
      { label: data.book.name },
    ]}
  />

  <div
    class="p-6 rounded-2xl border"
    style="background-color: var(--color-surface); border-color: var(--color-border)"
  >
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-3xl font-extrabold" style="color: var(--color-text)">
        {data.book.name}
      </h1>
      <span
        class="text-xs uppercase font-bold px-3 py-1 rounded-full"
        style="background-color: var(--color-primary); color: white;"
      >
        {data.book.abbrev}
      </span>
    </div>
    <p class="text-sm" style="color: var(--color-muted)">
      {testamentLabel} · {data.book.chapterCount} {data.book.chapterCount === 1 ? 'capítulo' : 'capítulos'}
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-bold">Capítulos</h2>
    <ChapterGrid bookAbbrev={data.book.abbrev} chapterCount={data.book.chapterCount} />
  </div>
</div>
