<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$api/client';
  import type { ReviewCard, ReviewGrade } from '$types';

  let cards = $state<ReviewCard[]>([]);
  let totalDue = $state(0);
  let index = $state(0);
  let revealed = $state(false);
  let reviewed = $state(0);
  let isLoading = $state(true);
  let isBusy = $state(false);
  let error = $state<string | null>(null);

  let current = $derived(cards[index] ?? null);
  let isDone = $derived(!isLoading && !error && current === null);

  const GRADES: { grade: ReviewGrade; label: string; hint: string; style: string }[] = [
    { grade: 'again', label: 'Errei', hint: 'volta amanhã', style: 'border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30' },
    { grade: 'good', label: 'Acertei', hint: 'intervalo cresce', style: 'border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' },
    { grade: 'easy', label: 'Fácil', hint: 'cresce mais', style: 'border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30' },
  ];

  async function load() {
    isLoading = true;
    error = null;
    try {
      const result = await api.getDueCards(20);
      cards = result.cards;
      totalDue = result.totalDue;
      index = 0;
      revealed = false;
    } catch {
      error = 'Não foi possível carregar os cartões. Tente novamente.';
    } finally {
      isLoading = false;
    }
  }

  async function grade(g: ReviewGrade) {
    if (!current || isBusy) return;
    isBusy = true;
    error = null;
    try {
      await api.gradeReviewCard(current.id, g);
      reviewed += 1;
      window.dispatchEvent(new CustomEvent('review-changed'));
      index += 1;
      revealed = false;
    } catch {
      error = 'Não foi possível salvar sua resposta. Tente novamente.';
    } finally {
      isBusy = false;
    }
  }

  onMount(load);
</script>

<svelte:head>
  <title>Revisão — Estudo Bíblico</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-extrabold">🧠 Revisão espaçada</h1>
    {#if !isLoading && totalDue > 0}
      <span class="text-xs px-2.5 py-1 rounded-full font-medium" style="background-color: var(--color-border); color: var(--color-muted)">
        {Math.min(index + 1, cards.length)} de {cards.length}{totalDue > cards.length ? ` (+${totalDue - cards.length})` : ''}
      </span>
    {/if}
  </div>

  {#if error}
    <p class="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
    {#if cards.length === 0}
      <button type="button" onclick={load} class="px-4 py-2 rounded-xl border text-sm cursor-pointer" style="border-color: var(--color-border)">
        Tentar de novo
      </button>
    {/if}
  {/if}

  {#if isLoading}
    <p class="text-sm" style="color: var(--color-muted)">Carregando…</p>
  {:else if isDone}
    <div class="p-6 rounded-2xl border text-center space-y-2" style="background-color: var(--color-surface); border-color: var(--color-border)">
      <p class="text-lg font-semibold">{reviewed > 0 ? `✓ Revisão concluída (${reviewed})` : 'Nada para revisar agora'}</p>
      <p class="text-sm" style="color: var(--color-muted)">
        Os cartões voltam no dia certo. Erros no quiz de um capítulo e versículos marcados com
        “Revisar depois” entram aqui automaticamente.
      </p>
    </div>
  {:else if current}
    <article class="p-6 rounded-2xl border space-y-4" style="background-color: var(--color-surface); border-color: var(--color-border)">
      <p class="text-xs" style="color: var(--color-muted)">
        {current.kind === 'verse' ? 'Versículo' : 'Pergunta do quiz'} ·
        <a class="underline" href="/{current.bookAbbrev}/{current.chapterNumber}{current.verseNumber ? `#v${current.verseNumber}` : ''}">
          {current.bookName} {current.chapterNumber}{current.verseNumber ? `:${current.verseNumber}` : ''}
        </a>
      </p>
      <p class="text-lg font-serif">{current.prompt}</p>

      {#if !revealed}
        <button type="button" onclick={() => (revealed = true)}
          class="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium cursor-pointer">
          Mostrar resposta
        </button>
        <p class="text-xs" style="color: var(--color-muted)">Tente lembrar antes de ver. É o esforço de lembrar que fixa.</p>
      {:else}
        <p class="p-4 rounded-xl border font-serif" style="border-color: var(--color-border)" aria-live="polite">{current.answer}</p>
        <div class="grid grid-cols-3 gap-2">
          {#each GRADES as g}
            <button type="button" onclick={() => grade(g.grade)} disabled={isBusy}
              class="px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer disabled:opacity-50 {g.style}">
              <span class="block">{g.label}</span>
              <span class="block text-[11px] font-normal" style="color: var(--color-muted)">{g.hint}</span>
            </button>
          {/each}
        </div>
      {/if}
    </article>
  {/if}
</div>
