<script lang="ts">
  import { onMount } from 'svelte';
  import {
    PLAN_LENGTHS,
    chaptersForDay,
    expectedByDay,
    flattenChapters,
    planDay,
    type StoredPlan,
  } from '$lib/study/plan';
  import type { BookRef, ReadItem } from '$lib/study/continue';

  let { books, progress }: { books: BookRef[]; progress: ReadItem[] } = $props();

  // The plan is a per-device preference, so it lives in localStorage (guests and accounts alike).
  const KEY = 'reading-plan';

  let plan = $state<StoredPlan | null>(null);
  let chosenDays = $state<number>(365);
  let today = $state(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD in the local time zone

  onMount(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredPlan;
        if (Number.isInteger(parsed.days) && parsed.days > 0 && typeof parsed.startedAt === 'string') plan = parsed;
      }
    } catch {
      // Unreadable storage: the plan simply starts empty.
    }
  });

  function save(next: StoredPlan | null) {
    plan = next;
    try {
      if (next) localStorage.setItem(KEY, JSON.stringify(next));
      else localStorage.removeItem(KEY);
    } catch {
      // Private mode: the plan works for this visit only.
    }
  }

  let chapters = $derived(flattenChapters(books));
  let day = $derived(plan ? planDay(plan.startedAt, today) : 0);
  let todays = $derived(plan ? chaptersForDay(chapters, plan.days, day) : []);
  let readKeys = $derived(new Set(progress.map((p) => `${p.bookAbbrev.toLowerCase()}:${p.chapterNumber}`)));
  let readNow = $derived(chapters.filter((c) => readKeys.has(`${c.bookAbbrev.toLowerCase()}:${c.chapterNumber}`)).length);
  let expected = $derived(plan ? expectedByDay(chapters.length, plan.days, day) : 0);
  let finished = $derived(plan !== null && day > plan.days);
  let delta = $derived(readNow - expected);
</script>

<section class="p-5 rounded-2xl border space-y-3" style="background-color: var(--color-surface); border-color: var(--color-border)">
  <h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--color-muted)">Plano de leitura</h2>

  {#if !plan}
    <p class="text-sm" style="color: var(--color-muted)">
      Leia a Bíblia inteira em ordem, com a mesma quantidade de capítulos por dia.
    </p>
    <div class="flex flex-wrap items-center gap-2">
      <label class="text-sm" for="plan-days">Em</label>
      <select id="plan-days" bind:value={chosenDays} class="px-3 py-1.5 rounded-lg border text-sm" style="background-color: var(--color-surface); border-color: var(--color-border)">
        {#each PLAN_LENGTHS as d}
          <option value={d}>{d} dias</option>
        {/each}
      </select>
      <button type="button" onclick={() => save({ days: chosenDays, startedAt: today })}
        class="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium cursor-pointer">
        Começar hoje
      </button>
    </div>
  {:else if finished}
    <p class="text-sm">O plano de {plan.days} dias terminou. Você leu {readNow} de {chapters.length} capítulos.</p>
    <button type="button" onclick={() => save(null)} class="px-3 py-1.5 rounded-lg border text-sm cursor-pointer" style="border-color: var(--color-border)">
      Novo plano
    </button>
  {:else if day < 1}
    <p class="text-sm" style="color: var(--color-muted)">A data de início do plano está no futuro.</p>
    <button type="button" onclick={() => save(null)} class="px-3 py-1.5 rounded-lg border text-sm cursor-pointer" style="border-color: var(--color-border)">
      Refazer plano
    </button>
  {:else}
    <p class="text-sm">
      Dia <strong>{day}</strong> de {plan.days} ·
      {#if delta >= 0}
        <span class="text-emerald-700 dark:text-emerald-300">{delta === 0 ? 'em dia' : `${delta} capítulo(s) à frente`}</span>
      {:else}
        <span class="text-amber-700 dark:text-amber-300">{-delta} capítulo(s) para recuperar</span>
      {/if}
    </p>
    <div>
      <p class="text-xs mb-1.5" style="color: var(--color-muted)">Leitura de hoje</p>
      <ul class="flex flex-wrap gap-2">
        {#each todays as c}
          {@const isRead = readKeys.has(`${c.bookAbbrev.toLowerCase()}:${c.chapterNumber}`)}
          <li>
            <a href="/{c.bookAbbrev}/{c.chapterNumber}"
              class="inline-block px-2.5 py-1 rounded-lg border text-sm hover:border-blue-500 {isRead ? 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-400' : ''}"
              style={isRead ? '' : 'border-color: var(--color-border)'}>
              {isRead ? '✓ ' : ''}{c.bookName} {c.chapterNumber}
            </a>
          </li>
        {/each}
      </ul>
    </div>
    <button type="button" onclick={() => save(null)} class="text-xs underline cursor-pointer" style="color: var(--color-muted)">
      Parar plano
    </button>
  {/if}
</section>
