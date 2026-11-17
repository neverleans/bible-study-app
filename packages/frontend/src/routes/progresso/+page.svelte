<script lang="ts">
  import Breadcrumbs from '$components/bible/Breadcrumbs.svelte';
  import { isAuthenticated, isAuthLoading } from '$stores/auth';
  import { loadAllProgress } from '$stores/study';
  import { overviewOf } from '$lib/study/overview';
  import { PALETTES } from '$lib/art/bookArt';
  import type { PageData } from './$types';
  import type { ReadingProgressItem } from '$types';

  let { data }: { data: PageData } = $props();

  let progress = $state<ReadingProgressItem[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  let overview = $derived(overviewOf(progress, data.books));

  async function load(authenticated: boolean) {
    isLoading = true;
    error = null;
    try {
      progress = await loadAllProgress(authenticated);
    } catch {
      error = 'Não foi possível carregar seu progresso. Tente novamente.';
    } finally {
      isLoading = false;
    }
  }

  // Wait for the session check so signed-in users do not briefly see guest progress.
  $effect(() => {
    if (!$isAuthLoading) load($isAuthenticated);
  });

  const pct = (read: number, total: number) => (total === 0 ? 0 : Math.round((read / total) * 100));
</script>

<svelte:head>
  <title>Progresso — Estudo Bíblico</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Progresso' }]} />

  <h1 class="text-2xl font-extrabold">📈 Seu progresso</h1>

  {#if error}
    <p class="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
    <button type="button" onclick={() => load($isAuthenticated)} class="px-4 py-2 rounded-xl border text-sm cursor-pointer" style="border-color: var(--color-border)">
      Tentar de novo
    </button>
  {:else if isLoading}
    <p class="text-sm" style="color: var(--color-muted)">Carregando…</p>
  {:else if data.books.length === 0}
    <p class="text-sm" style="color: var(--color-muted)">Não foi possível carregar os livros.</p>
  {:else}
    <section class="p-6 rounded-2xl border space-y-3" style="background-color: var(--color-surface); border-color: var(--color-border)">
      <p class="text-4xl font-extrabold">{overview.percent}%</p>
      <div class="h-3 rounded-full overflow-hidden" style="background-color: var(--color-border)" role="progressbar" aria-valuenow={overview.percent} aria-valuemin="0" aria-valuemax="100" aria-label="Bíblia lida">
        <div class="h-full bg-blue-600" style="width: {overview.percent}%"></div>
      </div>
      <p class="text-sm" style="color: var(--color-muted)">
        {overview.chaptersRead} de {overview.chapterCount} capítulos · {overview.booksCompleted} de {overview.bookCount} livros concluídos
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--color-muted)">Por gênero</h2>
      {#each overview.byGenre as g}
        <div class="p-4 rounded-xl border space-y-2" style="background-color: var(--color-surface); border-color: var(--color-border)">
          <div class="flex items-baseline justify-between gap-2">
            <p class="font-semibold">{g.label}</p>
            <p class="text-xs" style="color: var(--color-muted)">
              {g.chaptersRead}/{g.chapterCount} capítulos · {g.booksCompleted}/{g.bookCount} livros
            </p>
          </div>
          <div class="h-2 rounded-full overflow-hidden" style="background-color: var(--color-border)">
            <div class="h-full" style="width: {pct(g.chaptersRead, g.chapterCount)}%; background-color: {PALETTES[g.genre].to}"></div>
          </div>
        </div>
      {/each}
    </section>
  {/if}
</div>
