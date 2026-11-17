<script lang="ts">
  import { api } from '$api/client';
  import type { ChapterQuizStatus, QuizAttemptResult } from '$types';

  let { book, chapter }: { book: string; chapter: number } = $props();

  const POLL_MS = 2000;
  const MAX_POLLS = 45;

  let quiz = $state<ChapterQuizStatus | null>(null);
  let answers = $state<(number | null)[]>([]);
  let result = $state<QuizAttemptResult | null>(null);
  let isBusy = $state(false);
  let error = $state<string | null>(null);
  let pollToken = 0;

  let questions = $derived(quiz?.questions ?? []);
  let allAnswered = $derived(questions.length > 0 && answers.every((a) => a !== null));

  function apply(status: ChapterQuizStatus) {
    quiz = status;
    if (status.status === 'ready') {
      answers = (status.questions ?? []).map(() => null);
      result = null;
    }
  }

  async function poll(token: number) {
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      if (token !== pollToken) return; // chapter changed or component reset
      try {
        const status = await api.getChapterQuiz(book, chapter);
        if (token !== pollToken) return;
        if (status.status !== 'generating') return apply(status);
      } catch {
        // transient network error: keep polling
      }
    }
    if (token === pollToken) {
      quiz = { status: 'failed', error: 'A geração demorou demais. Tente novamente.' };
    }
  }

  async function load() {
    const token = ++pollToken;
    quiz = null;
    result = null;
    error = null;
    try {
      const status = await api.getChapterQuiz(book, chapter);
      if (token !== pollToken) return;
      apply(status);
      if (status.status === 'generating') poll(token);
    } catch {
      if (token === pollToken) error = 'Não foi possível carregar o quiz.';
    }
  }

  async function generate() {
    const token = ++pollToken;
    isBusy = true;
    error = null;
    try {
      const status = await api.generateChapterQuiz(book, chapter);
      apply(status);
      if (status.status === 'generating') poll(token);
    } catch {
      error = 'Não foi possível pedir o quiz. Tente novamente.';
    } finally {
      isBusy = false;
    }
  }

  async function submit() {
    if (!quiz?.quizId || !allAnswered) return;
    isBusy = true;
    error = null;
    try {
      result = await api.submitQuizAttempt(quiz.quizId, answers as number[]);
    } catch {
      error = 'Não foi possível corrigir o quiz. Tente novamente.';
    } finally {
      isBusy = false;
    }
  }

  function retry() {
    answers = questions.map(() => null);
    result = null;
  }

  $effect(() => {
    book;
    chapter;
    load();
    return () => {
      pollToken++; // stop polling when leaving the chapter
    };
  });
</script>

<section
  class="p-5 rounded-2xl border space-y-4"
  style="background-color: var(--color-surface); border-color: var(--color-border)"
  aria-labelledby="quiz-title"
>
  <div class="flex items-center justify-between gap-3">
    <h2 id="quiz-title" class="font-bold">🧠 Teste o que você leu</h2>
    {#if result}
      <span class="text-sm font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200">
        {result.score}/{result.total}
      </span>
    {/if}
  </div>

  {#if error}
    <p class="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
  {/if}

  {#if quiz === null && !error}
    <p class="text-sm" style="color: var(--color-muted)">Carregando…</p>
  {:else if quiz?.status === 'none'}
    <p class="text-sm" style="color: var(--color-muted)">
      Perguntas geradas por IA a partir do texto deste capítulo. Responder de memória fixa melhor do que reler.
    </p>
    <button type="button" onclick={generate} disabled={isBusy}
      class="px-4 py-2 rounded-xl border text-sm font-medium cursor-pointer hover:border-blue-500 disabled:opacity-50"
      style="border-color: var(--color-border)">
      ✨ Gerar quiz com IA
    </button>
  {:else if quiz?.status === 'generating'}
    <p class="text-sm" style="color: var(--color-muted)" aria-live="polite">⏳ A IA está preparando as perguntas…</p>
  {:else if quiz?.status === 'failed'}
    <p class="text-sm text-red-600 dark:text-red-400" role="alert">
      Não foi possível gerar o quiz: {quiz.error}
    </p>
    <button type="button" onclick={generate} disabled={isBusy}
      class="px-4 py-2 rounded-xl border text-sm font-medium cursor-pointer hover:border-blue-500 disabled:opacity-50"
      style="border-color: var(--color-border)">
      Tentar de novo
    </button>
  {:else if quiz?.status === 'ready'}
    <ol class="space-y-5">
      {#each questions as q, qi}
        {@const r = result?.results[qi]}
        <li>
          <fieldset class="space-y-2" disabled={result !== null}>
            <legend class="font-medium text-sm mb-1">{qi + 1}. {q.question}</legend>
            {#each q.options as option, oi}
              <label
                class="flex items-start gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer {r && oi === r.correctIndex
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : r && oi === r.chosenIndex
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                    : ''}"
                style={r && (oi === r.correctIndex || oi === r.chosenIndex) ? '' : 'border-color: var(--color-border)'}
              >
                <input type="radio" name="q{qi}" value={oi} checked={answers[qi] === oi}
                  onchange={() => (answers[qi] = oi)} class="mt-1" />
                <span>{option}</span>
              </label>
            {/each}
          </fieldset>
          {#if r}
            <p class="mt-2 text-xs" style="color: var(--color-muted)">
              {r.correct ? '✓ Correto.' : '✗ Resposta certa marcada em verde.'}
              {r.explanation} <span class="whitespace-nowrap">(v. {r.verse})</span>
            </p>
          {/if}
        </li>
      {/each}
    </ol>

    {#if result}
      <button type="button" onclick={retry}
        class="px-4 py-2 rounded-xl border text-sm font-medium cursor-pointer hover:border-blue-500"
        style="border-color: var(--color-border)">
        Tentar de novo
      </button>
    {:else}
      <button type="button" onclick={submit} disabled={!allAnswered || isBusy}
        class="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        Corrigir
      </button>
    {/if}
    <p class="text-[11px]" style="color: var(--color-muted)">
      Quiz gerado por IA a partir do texto do capítulo; confira no texto se algo parecer errado.
    </p>
  {/if}
</section>
