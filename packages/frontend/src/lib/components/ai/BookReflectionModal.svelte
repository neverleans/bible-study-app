<script lang="ts">
  import { api } from '$api/client';
  import type { Book, BookReflectionResult } from '$types';

  let {
    book,
    isOpen = false,
    onClose,
  }: {
    book: Book;
    isOpen: boolean;
    onClose: () => void;
  } = $props();

  let reflection = $state<BookReflectionResult | null>(null);
  let isLoading = $state(false);
  let statusText = $state<string>('');
  let isCached = $state<boolean>(false);
  let errorMessage = $state<string | null>(null);

  $effect(() => {
    if (isOpen && !reflection && !isLoading && !errorMessage) {
      loadReflection();
    }
  });

  async function loadReflection() {
    isLoading = true;
    errorMessage = null;
    statusText = 'Verificando reflexões existentes...';

    try {
      const response = await api.reflectBook(book.abbrev);

      if (response.status === 'completed' && response.data) {
        reflection = response.data;
        isCached = Boolean(response.cached);
        isLoading = false;
        return;
      }

      if (response.jobId) {
        statusText = 'Sintetizando temas panorâmicos e contexto histórico do livro...';
        const finalResponse = await api.pollAiJob<BookReflectionResult>(
          response.jobId,
          (status) => {
            if (status === 'waiting') {
              statusText = 'Aguardando processamento na fila...';
            } else if (status === 'active') {
              statusText = 'Gerando reflexão com inteligência artificial Gemini...';
            }
          },
        );

        if (finalResponse.status === 'completed' && finalResponse.data) {
          reflection = finalResponse.data;
          isCached = false;
        } else {
          errorMessage = finalResponse.error || 'Não foi possível concluir a reflexão.';
        }
      }
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Falha ao carregar reflexão do livro.';
    } finally {
      isLoading = false;
    }
  }

  function handleRetry() {
    reflection = null;
    loadReflection();
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    role="button"
    tabindex="0"
    class="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    aria-label="Fechar modal de reflexão"
  >
    <!-- Modal Window -->
    <div
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      class="max-w-3xl w-full rounded-2xl border shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
      style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text)"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div
        class="p-5 border-b flex items-center justify-between"
        style="background-color: var(--color-surface); border-color: var(--color-border)"
      >
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">✨</span>
          <div>
            <h2 class="font-extrabold text-lg sm:text-xl flex items-center gap-2" style="color: var(--color-text)">
              <span>Introdução & Reflexão — {book.name}</span>
              {#if isCached}
                <span class="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" title="Resposta recuperada do cache PostgreSQL">
                  ⚡ Em Cache
                </span>
              {:else if reflection}
                <span class="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  ✨ Gemini AI
                </span>
              {/if}
            </h2>
            <p class="text-xs" style="color: var(--color-muted)">
              Visão panorâmica, autor, propósito teológico e conexão com Cristo
            </p>
          </div>
        </div>
        <button
          onclick={onClose}
          class="p-2 rounded-xl border text-sm hover:opacity-80 transition-opacity cursor-pointer"
          style="border-color: var(--color-border); background-color: var(--color-bg)"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <!-- Body / Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        {#if isLoading}
          <!-- Loading state -->
          <div class="text-center py-16 space-y-4">
            <div class="animate-spin text-4xl inline-block">✨</div>
            <h3 class="text-base font-semibold" style="color: var(--color-text)">
              {statusText}
            </h3>
            <p class="text-xs max-w-sm mx-auto" style="color: var(--color-muted)">
              Consultando modelo de linguagem e consolidando estudo estruturado...
            </p>
          </div>
        {:else if errorMessage}
          <!-- Error state -->
          <div class="p-6 text-center space-y-4">
            <span class="text-4xl block">⚠️</span>
            <h3 class="text-base font-bold text-red-600">Erro na Reflexão</h3>
            <p class="text-sm max-w-md mx-auto" style="color: var(--color-muted)">{errorMessage}</p>
            <button
              onclick={handleRetry}
              class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        {:else if reflection}
          <!-- Reflection Content -->
          <!-- Central Theme Banner -->
          <div
            class="p-5 rounded-2xl border text-center space-y-1"
            style="background-color: var(--color-surface); border-color: var(--color-border)"
          >
            <span class="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Tema Central do Livro
            </span>
            <p class="text-lg font-serif font-bold italic" style="color: var(--color-text)">
              "{reflection.centralTheme}"
            </p>
          </div>

          <!-- Metadata Grid: Author, Date, Purpose -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              class="p-4 rounded-xl border space-y-1"
              style="background-color: var(--color-surface); border-color: var(--color-border)"
            >
              <span class="text-xs font-bold uppercase tracking-wider" style="color: var(--color-muted)">
                ✍️ Autoria & Época
              </span>
              <p class="text-sm font-semibold" style="color: var(--color-text)">
                {reflection.author}
              </p>
              <p class="text-xs leading-relaxed" style="color: var(--color-muted)">
                {reflection.dateAndContext}
              </p>
            </div>

            <div
              class="p-4 rounded-xl border space-y-1"
              style="background-color: var(--color-surface); border-color: var(--color-border)"
            >
              <span class="text-xs font-bold uppercase tracking-wider" style="color: var(--color-muted)">
                🎯 Propósito & Audiência
              </span>
              <p class="text-xs leading-relaxed pt-1" style="color: var(--color-text)">
                {reflection.purpose}
              </p>
            </div>
          </div>

          <!-- Outline of the Book -->
          {#if reflection.structureOutline && reflection.structureOutline.length > 0}
            <div class="space-y-2">
              <h4 class="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5" style="color: var(--color-muted)">
                <span>📑</span>
                <span>Esboço Geral do Livro</span>
              </h4>
              <div class="space-y-2">
                {#each reflection.structureOutline as section}
                  <div
                    class="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-2"
                    style="background-color: var(--color-surface); border-color: var(--color-border)"
                  >
                    <div>
                      <div class="font-bold text-sm" style="color: var(--color-text)">
                        {section.section}
                      </div>
                      <p class="text-xs mt-1 leading-relaxed" style="color: var(--color-muted)">
                        {section.summary}
                      </p>
                    </div>
                    <span
                      class="text-xs px-2.5 py-1 rounded-lg border font-mono font-medium whitespace-nowrap self-start"
                      style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-primary)"
                    >
                      {section.chapters}
                    </span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Key Verses -->
          {#if reflection.keyVerses && reflection.keyVerses.length > 0}
            <div class="space-y-2">
              <h4 class="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5" style="color: var(--color-muted)">
                <span>⭐</span>
                <span>Versículos-Chave</span>
              </h4>
              <div class="space-y-3">
                {#each reflection.keyVerses as kv}
                  <div
                    class="p-4 rounded-xl border space-y-1.5"
                    style="background-color: var(--color-surface); border-color: var(--color-border)"
                  >
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-sm" style="color: var(--color-primary)">
                        {kv.reference}
                      </span>
                    </div>
                    <p class="font-serif italic text-sm leading-relaxed" style="color: var(--color-text)">
                      "{kv.text}"
                    </p>
                    <p class="text-xs leading-relaxed" style="color: var(--color-muted)">
                      {kv.commentary}
                    </p>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Christological Significance -->
          {#if reflection.christologicalSignificance}
            <div class="space-y-2">
              <h4 class="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5" style="color: var(--color-muted)">
                <span>✝️</span>
                <span>Conexão Messiânica & Significado em Cristo</span>
              </h4>
              <div
                class="p-4 rounded-xl border text-sm leading-relaxed"
                style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
              >
                {reflection.christologicalSignificance}
              </div>
            </div>
          {/if}
        {/if}
      </div>

      <!-- Footer -->
      <div
        class="p-4 border-t flex items-center justify-between"
        style="background-color: var(--color-surface); border-color: var(--color-border)"
      >
        <span class="text-xs" style="color: var(--color-muted)">
          Reflexão consolidada via inteligência artificial
        </span>
        <button
          onclick={onClose}
          class="px-4 py-2 rounded-xl text-sm font-semibold border hover:opacity-80 cursor-pointer"
          style="border-color: var(--color-border)"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
{/if}
