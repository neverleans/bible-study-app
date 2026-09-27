<script lang="ts">
  import type { StudyAid } from '$types';

  let {
    studyAids = [],
  }: {
    studyAids: StudyAid[];
  } = $props();

  let isCollapsed = $state(false);

  let summaries = $derived(studyAids.filter((a) => a.type === 'summary'));
  let keyVerses = $derived(studyAids.filter((a) => a.type === 'key_verse'));
  let crossRefs = $derived(studyAids.filter((a) => a.type === 'cross_ref'));
  let contextAids = $derived(studyAids.filter((a) => a.type === 'context'));

  let activeTab = $state<'summary' | 'key_verses' | 'cross_refs'>('summary');

  $effect(() => {
    if (summaries.length === 0 && keyVerses.length > 0) {
      activeTab = 'key_verses';
    } else if (summaries.length === 0 && crossRefs.length > 0) {
      activeTab = 'cross_refs';
    }
  });
</script>

{#if studyAids.length > 0}
  <section
    class="rounded-2xl border overflow-hidden transition-all shadow-xs"
    style="background-color: var(--color-surface); border-color: var(--color-border)"
    aria-label="Recursos de Estudo do Capítulo"
  >
    <!-- Header with Collapse Toggle -->
    <div
      class="px-5 py-3.5 border-b flex items-center justify-between cursor-pointer select-none"
      style="border-color: var(--color-border)"
      onclick={() => (isCollapsed = !isCollapsed)}
      onkeydown={(e) => e.key === 'Enter' && (isCollapsed = !isCollapsed)}
      role="button"
      tabindex="0"
    >
      <div class="flex items-center gap-2.5">
        <span class="text-base">📚</span>
        <h3 class="font-bold text-sm" style="color: var(--color-text)">
          Recursos de Estudo & Referências Cruzadas
        </h3>
        <span class="text-[11px] px-2 py-0.5 rounded-full font-medium" style="background-color: var(--color-border); color: var(--color-muted)">
          {studyAids.length} notas
        </span>
      </div>
      <button
        class="text-xs p-1 rounded-md hover:opacity-75 transition-opacity"
        style="color: var(--color-muted)"
        aria-label={isCollapsed ? 'Expandir recursos de estudo' : 'Recolher recursos de estudo'}
      >
        {isCollapsed ? '▼ Mostrar' : '▲ Ocultar'}
      </button>
    </div>

    <!-- Collapsible Body -->
    {#if !isCollapsed}
      <div class="p-5 space-y-4">
        <!-- Sub-tabs -->
        <div class="flex items-center gap-2 border-b pb-3" style="border-color: var(--color-border)">
          {#if summaries.length > 0}
            <button
              onclick={() => (activeTab = 'summary')}
              class="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors {activeTab === 'summary'
                ? 'bg-blue-600 text-white'
                : 'border hover:bg-black/5 dark:hover:bg-white/5'}"
              style={activeTab !== 'summary' ? 'border-color: var(--color-border); color: var(--color-text)' : ''}
            >
              📑 Resumo ({summaries.length})
            </button>
          {/if}

          {#if keyVerses.length > 0}
            <button
              onclick={() => (activeTab = 'key_verses')}
              class="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors {activeTab === 'key_verses'
                ? 'bg-blue-600 text-white'
                : 'border hover:bg-black/5 dark:hover:bg-white/5'}"
              style={activeTab !== 'key_verses' ? 'border-color: var(--color-border); color: var(--color-text)' : ''}
            >
              ⭐ Versículos-Chave ({keyVerses.length})
            </button>
          {/if}

          {#if crossRefs.length > 0}
            <button
              onclick={() => (activeTab = 'cross_refs')}
              class="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors {activeTab === 'cross_refs'
                ? 'bg-blue-600 text-white'
                : 'border hover:bg-black/5 dark:hover:bg-white/5'}"
              style={activeTab !== 'cross_refs' ? 'border-color: var(--color-border); color: var(--color-text)' : ''}
            >
              🔗 Referências Cruzadas ({crossRefs.length})
            </button>
          {/if}
        </div>

        <!-- Tab: Summaries -->
        {#if activeTab === 'summary'}
          <div class="space-y-3">
            {#each summaries as sum}
              <div class="space-y-1.5">
                {#if sum.metadata.title}
                  <h4 class="font-bold text-sm" style="color: var(--color-primary)">
                    {sum.metadata.title}
                  </h4>
                {/if}
                <p class="text-sm leading-relaxed" style="color: var(--color-text)">
                  {sum.content}
                </p>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Tab: Key Verses -->
        {#if activeTab === 'key_verses'}
          <div class="space-y-3">
            {#each keyVerses as kv}
              <div
                class="p-3.5 rounded-xl border space-y-1.5"
                style="background-color: var(--color-bg); border-color: var(--color-border)"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-xs" style="color: var(--color-primary)">
                    {kv.metadata.reference || `v. ${kv.metadata.verseNumber}`}
                  </span>
                </div>
                <p class="font-serif italic text-sm leading-relaxed" style="color: var(--color-text)">
                  "{kv.content}"
                </p>
                {#if kv.metadata.commentary}
                  <p class="text-xs pt-1 border-t leading-relaxed" style="border-color: var(--color-border); color: var(--color-muted)">
                    {kv.metadata.commentary}
                  </p>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

        <!-- Tab: Clickable Cross References -->
        {#if activeTab === 'cross_refs'}
          <div class="space-y-3">
            {#each crossRefs as cr}
              <div
                class="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style="background-color: var(--color-bg); border-color: var(--color-border)"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold px-2 py-0.5 rounded border" style="border-color: var(--color-border); color: var(--color-muted)">
                      {cr.metadata.sourceReference || 'Este capítulo'}
                    </span>
                    <span class="text-xs" style="color: var(--color-muted)">conecta com</span>
                    <span class="text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                      {cr.metadata.targetReference}
                    </span>
                  </div>
                  <p class="text-xs leading-relaxed" style="color: var(--color-text)">
                    {cr.content}
                  </p>
                </div>

                {#if cr.metadata.targetBookAbbrev && cr.metadata.targetChapter}
                  <a
                    href="/{cr.metadata.targetBookAbbrev}/{cr.metadata.targetChapter}{cr.metadata.targetVerse ? `#v${cr.metadata.targetVerse}` : ''}"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
                    style="border-color: var(--color-border)"
                    title="Navegar para {cr.metadata.targetReference}"
                  >
                    <span>Abrir {cr.metadata.targetReference}</span>
                    <span>↗</span>
                  </a>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </section>
{/if}
