<script lang="ts">
  import Breadcrumbs from '$components/bible/Breadcrumbs.svelte';
  import { api } from '$api/client';
  import { isAuthenticated, isAuthLoading } from '$stores/auth';
  import { loadReadChapters, countBookHighlights } from '$stores/study';
  import { buildBookCardSvg, CARD_WIDTH, CARD_HEIGHT } from '$lib/art/bookArt';
  import type { PageData } from './$types';
  import type { BookStats } from '$types';

  let { data }: { data: PageData } = $props();

  let stats = $state<BookStats | null>(null);
  let chaptersRead = $state(0);
  let highlightCount = $state(0);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let exportError = $state<string | null>(null);

  let svg = $derived(
    stats
      ? buildBookCardSvg({
          order: data.book.order,
          name: data.book.name,
          chaptersRead,
          chapterCount: data.book.chapterCount,
          quizAveragePercent: stats.quizBestByChapter.length > 0 ? stats.quizAveragePercent : null,
          reflectionCount: stats.reflectionCount,
          highlightCount,
        })
      : ''
  );
  let completed = $derived(chaptersRead >= data.book.chapterCount && data.book.chapterCount > 0);

  async function load(authenticated: boolean) {
    isLoading = true;
    error = null;
    try {
      const [s, read, hl] = await Promise.all([
        api.getBookStats(data.book.abbrev),
        loadReadChapters(data.book.abbrev, authenticated),
        countBookHighlights(data.book.abbrev, authenticated),
      ]);
      stats = s;
      chaptersRead = new Set(read).size;
      highlightCount = hl;
    } catch {
      error = 'Não foi possível carregar os dados do cartão. Tente novamente.';
    } finally {
      isLoading = false;
    }
  }

  // Wait for the session check so signed-in users do not briefly see guest data.
  $effect(() => {
    if (!$isAuthLoading) load($isAuthenticated);
  });

  async function downloadPng() {
    exportError = null;
    try {
      const scale = 2;
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Falha ao desenhar o cartão'));
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = CARD_WIDTH * scale;
      canvas.height = CARD_HEIGHT * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas indisponível');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
      if (!blob) throw new Error('Falha ao gerar o PNG');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cartao-${data.book.abbrev}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch (e) {
      console.error(e);
      exportError = 'Não foi possível gerar o PNG. Tente novamente.';
    }
  }
</script>

<svelte:head>
  <title>Cartão — {data.book.name} — Estudo Bíblico</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <Breadcrumbs
    items={[
      { label: 'Início', href: '/' },
      { label: data.book.name, href: `/${data.book.abbrev}` },
      { label: 'Cartão do livro' },
    ]}
  />

  <div>
    <h1 class="text-2xl font-extrabold">🎴 Cartão de {data.book.name}</h1>
    <p class="text-sm mt-1" style="color: var(--color-muted)">
      {completed
        ? 'Você leu todos os capítulos. Este é o resumo do seu estudo.'
        : `Faltam ${Math.max(data.book.chapterCount - chaptersRead, 0)} capítulo(s) para concluir o livro. O cartão se atualiza conforme você estuda.`}
    </p>
  </div>

  {#if error}
    <p class="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
    <button type="button" onclick={() => load($isAuthenticated)} class="px-4 py-2 rounded-xl border text-sm cursor-pointer" style="border-color: var(--color-border)">
      Tentar de novo
    </button>
  {:else if isLoading || !stats}
    <p class="text-sm" style="color: var(--color-muted)">Carregando…</p>
  {:else}
    <div class="mx-auto max-w-sm rounded-[28px] shadow-lg overflow-hidden [&>svg]:w-full [&>svg]:h-auto">
      {@html svg}
    </div>

    <div class="flex flex-wrap items-center justify-center gap-3">
      <button type="button" onclick={downloadPng}
        class="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium cursor-pointer">
        ⬇️ Baixar PNG
      </button>
      <a href="/{data.book.abbrev}" class="px-4 py-2 rounded-xl border text-sm font-medium" style="border-color: var(--color-border)">
        Voltar ao livro
      </a>
    </div>
    {#if exportError}
      <p class="text-sm text-center text-red-600 dark:text-red-400" role="alert">{exportError}</p>
    {/if}
  {/if}
</div>
