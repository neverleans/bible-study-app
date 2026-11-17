<script lang="ts">
  import { api } from '$api/client';
  import type { Reflection } from '$types';

  let { book, chapter }: { book: string; chapter: number } = $props();

  const MIN_CHARS = 40;
  const MAX_CHARS = 2000;
  const POLL_MS = 2000;
  const MAX_POLLS = 45;

  let text = $state('');
  let items = $state<Reflection[]>([]);
  let isBusy = $state(false);
  let error = $state<string | null>(null);
  let token = 0;

  let length = $derived(text.trim().length);
  let canSubmit = $derived(length >= MIN_CHARS && length <= MAX_CHARS && !isBusy);

  function upsert(r: Reflection) {
    items = [r, ...items.filter((i) => i.id !== r.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async function pollUntilDone(id: string, myToken: number) {
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      if (myToken !== token) return; // chapter changed
      try {
        const r = await api.getReflection(id);
        if (myToken !== token) return;
        upsert(r);
        if (r.feedbackStatus !== 'pending') return;
      } catch {
        // transient error: keep polling
      }
    }
  }

  async function load() {
    const myToken = ++token;
    items = [];
    text = '';
    error = null;
    try {
      const list = await api.listReflections(book, chapter);
      if (myToken !== token) return;
      items = list;
      for (const r of list) if (r.feedbackStatus === 'pending') pollUntilDone(r.id, myToken);
    } catch {
      if (myToken === token) error = 'Não foi possível carregar suas explicações.';
    }
  }

  async function submit() {
    if (!canSubmit) return;
    isBusy = true;
    error = null;
    const myToken = token;
    try {
      const created = await api.createReflection(book, chapter, text.trim());
      upsert(created);
      text = '';
      if (created.feedbackStatus === 'pending') pollUntilDone(created.id, myToken);
    } catch {
      error = 'Não foi possível salvar sua explicação. Seu texto continua na caixa; tente de novo.';
    } finally {
      isBusy = false;
    }
  }

  $effect(() => {
    book;
    chapter;
    load();
    return () => {
      token++;
    };
  });
</script>

<section
  class="p-5 rounded-2xl border space-y-4"
  style="background-color: var(--color-surface); border-color: var(--color-border)"
  aria-labelledby="reflection-title"
>
  <div>
    <h2 id="reflection-title" class="font-bold">✍️ Explique com suas palavras</h2>
    <p class="text-sm mt-1" style="color: var(--color-muted)">
      Sem olhar o texto, escreva o que você entendeu deste capítulo. Explicar fixa mais do que reler;
      depois a IA compara com o texto e mostra o que faltou.
    </p>
  </div>

  <div class="space-y-2">
    <label for="reflection-text" class="sr-only">Sua explicação do capítulo</label>
    <textarea
      id="reflection-text"
      bind:value={text}
      rows="5"
      maxlength={MAX_CHARS}
      placeholder="Neste capítulo, eu entendi que…"
      class="w-full p-3 rounded-xl border text-sm bg-transparent"
      style="border-color: var(--color-border)"
    ></textarea>
    <div class="flex items-center justify-between gap-3">
      <span class="text-xs" style="color: {length > 0 && length < MIN_CHARS ? 'inherit' : 'var(--color-muted)'}">
        {length}/{MAX_CHARS}{length > 0 && length < MIN_CHARS ? ` — escreva pelo menos ${MIN_CHARS} caracteres` : ''}
      </span>
      <button type="button" onclick={submit} disabled={!canSubmit}
        class="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        {isBusy ? 'Enviando…' : 'Enviar e receber feedback'}
      </button>
    </div>
    {#if error}
      <p class="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
    {/if}
  </div>

  {#if items.length > 0}
    <ul class="space-y-4">
      {#each items as r (r.id)}
        <li class="rounded-xl border p-4 space-y-3" style="border-color: var(--color-border)">
          <p class="text-sm whitespace-pre-line font-serif">{r.content}</p>
          <p class="text-[11px]" style="color: var(--color-muted)">{new Date(r.createdAt).toLocaleString('pt-BR')}</p>

          {#if r.feedbackStatus === 'pending'}
            <p class="text-sm" style="color: var(--color-muted)" aria-live="polite">⏳ A IA está comparando com o texto…</p>
          {:else if r.feedbackStatus === 'failed'}
            <p class="text-sm text-red-600 dark:text-red-400" role="alert">
              Sua explicação foi salva, mas não foi possível gerar o feedback: {r.feedbackError}
            </p>
          {:else if r.feedback}
            <div class="space-y-2 text-sm">
              {#if r.feedback.coveredPoints.length > 0}
                <div>
                  <p class="font-semibold text-emerald-700 dark:text-emerald-300">✓ Você captou</p>
                  <ul class="list-disc pl-5">{#each r.feedback.coveredPoints as p}<li>{p}</li>{/each}</ul>
                </div>
              {/if}
              {#if r.feedback.missingPoints.length > 0}
                <div>
                  <p class="font-semibold text-amber-700 dark:text-amber-300">+ Faltou mencionar</p>
                  <ul class="list-disc pl-5">{#each r.feedback.missingPoints as p}<li>{p}</li>{/each}</ul>
                </div>
              {/if}
              {#if r.feedback.misunderstandings.length > 0}
                <div>
                  <p class="font-semibold text-rose-700 dark:text-rose-300">⚠ Vale rever no texto</p>
                  <ul class="list-disc pl-5">
                    {#each r.feedback.misunderstandings as m}
                      <li>“{m.claim}” — {m.correction} <a class="underline whitespace-nowrap" href="#v{m.verse}">(v. {m.verse})</a></li>
                    {/each}
                  </ul>
                </div>
              {/if}
              <p style="color: var(--color-muted)">{r.feedback.encouragement}</p>
              <p class="text-[11px]" style="color: var(--color-muted)">
                Feedback gerado por IA a partir do texto do capítulo; confira no texto se algo parecer errado.
              </p>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>
