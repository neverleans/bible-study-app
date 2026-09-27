<script lang="ts">
  import { goto } from '$app/navigation';
  import Breadcrumbs from '$components/bible/Breadcrumbs.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let searchInput = $state('');
  let selectedTestament = $state('');
  let selectedBook = $state('');

  $effect(() => {
    searchInput = data.query || '';
    selectedTestament = data.testament || '';
    selectedBook = data.book || '';
  });

  function executeSearch(newPage = 1) {
    if (!searchInput.trim() || searchInput.trim().length < 2) return;

    const params = new URLSearchParams();
    params.set('q', searchInput.trim());
    if (newPage > 1) params.set('page', newPage.toString());
    if (selectedTestament) params.set('testament', selectedTestament);
    if (selectedBook) params.set('book', selectedBook);

    goto(`/search?${params.toString()}`);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      executeSearch(1);
    }
  }

  const filteredBookOptions = $derived(
    selectedTestament
      ? data.books.filter((b) => b.testament === selectedTestament)
      : data.books,
  );
</script>

<svelte:head>
  <title>Busca Bíblica {data.query ? `— "${data.query}"` : ''}</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <Breadcrumbs
    items={[
      { label: 'Início', href: '/' },
      { label: 'Busca na Bíblia' },
    ]}
  />

  <!-- Search Header -->
  <div
    class="p-6 sm:p-8 rounded-2xl border space-y-4"
    style="background-color: var(--color-surface); border-color: var(--color-border)"
  >
    <h1 class="text-2xl sm:text-3xl font-extrabold" style="color: var(--color-text)">
      Busca na Bíblia
    </h1>
    <p class="text-sm" style="color: var(--color-muted)">
      Pesquise palavras, frases ou expressões em todos os 66 livros e 31.000+ versículos.
    </p>

    <!-- Search Input & Button -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <input
          type="text"
          bind:value={searchInput}
          onkeydown={handleKeydown}
          placeholder="Ex: amor, princípio, fé, luz..."
          class="w-full pl-4 pr-10 py-3 rounded-xl border text-base outline-none transition-all focus:ring-2 focus:ring-blue-500"
          style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text)"
        />
        {#if searchInput}
          <button
            onclick={() => {
              searchInput = '';
              goto('/search');
            }}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        {/if}
      </div>

      <button
        onclick={() => executeSearch(1)}
        class="px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer shadow-sm"
        style="background-color: var(--color-primary);"
      >
        Buscar
      </button>
    </div>

    <!-- Filters Row -->
    <div class="flex flex-wrap items-center gap-4 pt-2 text-sm">
      <div class="flex items-center gap-2">
        <span style="color: var(--color-muted)">Testamento:</span>
        <select
          bind:value={selectedTestament}
          onchange={() => {
            selectedBook = '';
            if (searchInput.trim().length >= 2) executeSearch(1);
          }}
          class="px-3 py-1.5 rounded-lg border outline-none"
          style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text)"
        >
          <option value="">Todos</option>
          <option value="OT">Antigo Testamento</option>
          <option value="NT">Novo Testamento</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <span style="color: var(--color-muted)">Livro:</span>
        <select
          bind:value={selectedBook}
          onchange={() => {
            if (searchInput.trim().length >= 2) executeSearch(1);
          }}
          class="px-3 py-1.5 rounded-lg border outline-none"
          style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text)"
        >
          <option value="">Todos os Livros</option>
          {#each filteredBookOptions as b}
            <option value={b.abbrev}>{b.name}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Search Results -->
  {#if data.searchResult}
    <div class="space-y-4">
      <div class="flex items-center justify-between text-sm" style="color: var(--color-muted)">
        <span>
          Encontrados <strong>{data.searchResult.total}</strong> {data.searchResult.total === 1 ? 'versículo' : 'versículos'} para "{data.query}"
        </span>
        {#if data.searchResult.totalPages > 1}
          <span>
            Página {data.searchResult.page} de {data.searchResult.totalPages}
          </span>
        {/if}
      </div>

      {#if data.searchResult.results.length === 0}
        <div
          class="text-center py-12 rounded-2xl border"
          style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-muted)"
        >
          Nenhum versículo encontrado para o termo pesquisado com os filtros atuais.
        </div>
      {:else}
        <div class="space-y-3">
          {#each data.searchResult.results as item (item.verseId)}
            <a
              href="/{item.bookAbbrev}/{item.chapterNumber}"
              class="group block p-5 rounded-2xl border transition-all duration-150 hover:shadow-md hover:border-blue-500 cursor-pointer"
              style="background-color: var(--color-surface); border-color: var(--color-border)"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-bold text-base transition-colors group-hover:text-blue-500" style="color: var(--color-text)">
                  {item.bookName} {item.chapterNumber}:{item.verseNumber}
                </span>
                <span
                  class="text-xs uppercase font-medium px-2 py-0.5 rounded"
                  style="background-color: var(--color-border); color: var(--color-muted)"
                >
                  {item.testament === 'OT' ? 'AT' : 'NT'}
                </span>
              </div>
              <p class="font-serif text-base leading-relaxed" style="color: var(--color-text)">
                {@html item.highlight}
              </p>
            </a>
          {/each}
        </div>

        <!-- Pagination Controls -->
        {#if data.searchResult.totalPages > 1}
          <div class="flex items-center justify-center gap-3 pt-6 pb-12">
            <button
              disabled={data.searchResult.page <= 1}
              onclick={() => executeSearch(data.searchResult!.page - 1)}
              class="px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style="background-color: var(--color-surface); border-color: var(--color-border)"
            >
              ← Anterior
            </button>
            <span class="text-sm font-medium" style="color: var(--color-muted)">
              {data.searchResult.page} / {data.searchResult.totalPages}
            </span>
            <button
              disabled={data.searchResult.page >= data.searchResult.totalPages}
              onclick={() => executeSearch(data.searchResult!.page + 1)}
              class="px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style="background-color: var(--color-surface); border-color: var(--color-border)"
            >
              Próxima →
            </button>
          </div>
        {/if}
      {/if}
    </div>
  {:else if searchInput.trim().length > 0 && searchInput.trim().length < 2}
    <div
      class="text-center py-12 rounded-2xl border"
      style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-muted)"
    >
      Digite pelo menos 2 caracteres para realizar a busca.
    </div>
  {:else}
    <div
      class="text-center py-16 rounded-2xl border"
      style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-muted)"
    >
      <div class="text-4xl mb-3">🔍</div>
      <p class="text-base font-medium">Pronto para buscar na Bíblia</p>
      <p class="text-xs mt-1">Exemplos: "amor", "princípio", "justiça", "esperança"</p>
    </div>
  {/if}
</div>
