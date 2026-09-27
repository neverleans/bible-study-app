<script lang="ts">
  import { api } from '$api/client';
  import type { Book, ChapterAnalysisResult } from '$types';

  let {
    book,
    chapterNumber,
    isOpen = false,
    onClose,
  }: {
    book: Book;
    chapterNumber: number;
    isOpen: boolean;
    onClose: () => void;
  } = $props();

  let analysis = $state<ChapterAnalysisResult | null>(null);
  let isLoading = $state(false);
  let statusText = $state<string>('');
  let isCached = $state<boolean>(false);
  let errorMessage = $state<string | null>(null);

  $effect(() => {
    if (isOpen && !analysis && !isLoading && !errorMessage) {
      loadAnalysis();
    }
  });

  async function loadAnalysis() {
    isLoading = true;
    errorMessage = null;
    statusText = 'Verificando análises existentes...';

    try {
      const response = await api.analyzeChapter(book.abbrev, chapterNumber);

      if (response.status === 'completed' && response.data) {
        analysis = response.data;
        isCached = Boolean(response.cached);
        isLoading = false;
        return;
      }

      if (response.jobId) {
        statusText = 'Analisando capítulo no contexto histórico e teológico...';
        const finalResponse = await api.pollAiJob<ChapterAnalysisResult>(
          response.jobId,
          (status) => {
            if (status === 'waiting') {
              statusText = 'Na fila de processamento da IA...';
            } else if (status === 'active') {
              statusText = 'Executando exegese e estruturação com Gemini...';
            }
          },
        );

        if (finalResponse.status === 'completed' && finalResponse.data) {
          analysis = finalResponse.data;
          isCached = false;
        } else {
          errorMessage = finalResponse.error || 'Não foi possível concluir a análise.';
        }
      }
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Falha ao analisar o capítulo.';
    } finally {
      isLoading = false;
    }
  }

  function handleRetry() {
    analysis = null;
    loadAnalysis();
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
    aria-label="Fechar modal de análise"
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
              <span>Análise Teológica — {book.name} {chapterNumber}</span>
              {#if isCached}
                <span class="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" title="Resposta recuperada do cache PostgreSQL">
                  ⚡ Em Cache
                </span>
              {:else if analysis}
                <span class="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  ✨ Gemini AI
                </span>
              {/if}
            </h2>
            <p class="text-xs" style="color: var(--color-muted)">
              Exegese, contexto histórico, temas centrais e aplicações práticas
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
              Processando via BullMQ e gerando análise com inteligência artificial...
            </p>
          </div>
        {:else if errorMessage}
          <!-- Error state -->
          <div class="p-6 text-center space-y-4">
            <span class="text-4xl block">⚠️</span>
            <h3 class="text-base font-bold text-red-600">Erro na Análise</h3>
            <p class="text-sm max-w-md mx-auto" style="color: var(--color-muted)">{errorMessage}</p>
            <button
              onclick={handleRetry}
              class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        {:else if analysis}
          <!-- Analysis Content -->
          <!-- Title Banner -->
          <div
            class="p-4 rounded-xl border text-center font-serif text-lg sm:text-xl font-bold italic"
            style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-primary)"
          >
            "{analysis.title}"
          </div>

          <!-- Key Themes Chips -->
          {#if analysis.keyThemes && analysis.keyThemes.length > 0}
            <div class="space-y-2">
              <span class="text-xs font-bold uppercase tracking-wider block" style="color: var(--color-muted)">
                Temas Principais
              </span>
              <div class="flex flex-wrap gap-2">
                {#each analysis.keyThemes as theme}
                  <span
                    class="px-3 py-1 rounded-full text-xs font-medium border"
                    style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
                  >
                    🏷️ {theme}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Theological Summary -->
          <div class="space-y-2">
            <h4 class="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5" style="color: var(--color-muted)">
              <span>📖</span>
              <span>Resumo do Capítulo</span>
            </h4>
            <div
              class="p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-line"
              style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
            >
              {analysis.summary}
            </div>
          </div>

          <!-- Historical & Cultural Context -->
          <div class="space-y-2">
            <h4 class="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5" style="color: var(--color-muted)">
              <span>🏛️</span>
              <span>Contexto Histórico & Cultural</span>
            </h4>
            <div
              class="p-4 rounded-xl border text-sm leading-relaxed"
              style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
            >
              {analysis.historicalContext}
            </div>
          </div>

          <!-- Literary Structure -->
          {#if analysis.literaryStructure && analysis.literaryStructure.length > 0}
            <div class="space-y-2">
              <h4 class="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5" style="color: var(--color-muted)">
                <span>📑</span>
                <span>Estrutura Literária (Perícopes)</span>
              </h4>
              <div class="space-y-2.5">
                {#each analysis.literaryStructure as item}
                  <div
                    class="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-2"
                    style="background-color: var(--color-surface); border-color: var(--color-border)"
                  >
                    <div>
                      <div class="font-bold text-sm" style="color: var(--color-text)">
                        {item.section}
                      </div>
                      <p class="text-xs mt-1 leading-relaxed" style="color: var(--color-muted)">
                        {item.description}
                      </p>
                    </div>
                    <span
                      class="text-xs px-2.5 py-1 rounded-lg border font-mono font-medium whitespace-nowrap self-start"
                      style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-primary)"
                    >
                      vv. {item.verses}
                    </span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Practical Applications -->
          {#if analysis.practicalApplication && analysis.practicalApplication.length > 0}
            <div class="space-y-2">
              <h4 class="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5" style="color: var(--color-muted)">
                <span>🌱</span>
                <span>Aplicações Práticas para a Vida Cristã</span>
              </h4>
              <div class="grid grid-cols-1 gap-2.5">
                {#each analysis.practicalApplication as appItem}
                  <div
                    class="p-3.5 rounded-xl border flex items-start gap-2.5"
                    style="background-color: var(--color-surface); border-color: var(--color-border)"
                  >
                    <span class="text-blue-500 font-bold">•</span>
                    <p class="text-sm leading-relaxed" style="color: var(--color-text)">
                      {appItem}
                    </p>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Theological Insights -->
          {#if analysis.theologicalInsights}
            <div class="space-y-2">
              <h4 class="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5" style="color: var(--color-muted)">
                <span>✝️</span>
                <span>Conexão Teológica e Redentora</span>
              </h4>
              <div
                class="p-4 rounded-xl border text-sm leading-relaxed"
                style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
              >
                {analysis.theologicalInsights}
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
          Desenvolvido com Google Gemini e fila distribuída BullMQ
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
