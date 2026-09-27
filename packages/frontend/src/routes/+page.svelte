<script lang="ts">
  import BookCard from '$components/bible/BookCard.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let search = $state('');
  let activeTab = $state<'ALL' | 'OT' | 'NT'>('ALL');

  const filteredBooks = $derived(
    data.books.filter((book) => {
      const matchesSearch =
        book.name.toLowerCase().includes(search.toLowerCase()) ||
        book.abbrev.toLowerCase().includes(search.toLowerCase());
      const matchesTab =
        activeTab === 'ALL' ||
        (activeTab === 'OT' && book.testament === 'OT') ||
        (activeTab === 'NT' && book.testament === 'NT');
      return matchesSearch && matchesTab;
    }),
  );
</script>

<svelte:head>
  <title>Estudo Bíblico — Livros e Leitura</title>
</svelte:head>

<div class="space-y-8">
  <div class="text-center py-6">
    <h1 class="text-4xl font-extrabold tracking-tight mb-3" style="color: var(--color-primary)">
      Estudo Bíblico
    </h1>
    <p class="text-lg" style="color: var(--color-muted)">
      Selecione um livro para começar a leitura e reflexão
    </p>
  </div>

  <!-- Filter & Search Controls -->
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
    <!-- Tabs -->
    <div
      class="flex p-1 rounded-xl border text-sm font-medium"
      style="background-color: var(--color-surface); border-color: var(--color-border)"
    >
      <button
        onclick={() => (activeTab = 'ALL')}
        class="px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
        style={activeTab === 'ALL' ? 'background-color: var(--color-primary); color: white;' : 'color: var(--color-muted);'}
      >
        Todos (66)
      </button>
      <button
        onclick={() => (activeTab = 'OT')}
        class="px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
        style={activeTab === 'OT' ? 'background-color: var(--color-primary); color: white;' : 'color: var(--color-muted);'}
      >
        Antigo Testamento (39)
      </button>
      <button
        onclick={() => (activeTab = 'NT')}
        class="px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
        style={activeTab === 'NT' ? 'background-color: var(--color-primary); color: white;' : 'color: var(--color-muted);'}
      >
        Novo Testamento (27)
      </button>
    </div>

    <!-- Quick Search -->
    <div class="w-full sm:w-72">
      <input
        type="text"
        bind:value={search}
        placeholder="Buscar livro por nome..."
        class="w-full px-4 py-2 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-blue-500"
        style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
      />
    </div>
  </div>

  <!-- Books Grid -->
  {#if filteredBooks.length === 0}
    <div class="text-center py-16" style="color: var(--color-muted)">
      Nenhum livro encontrado com o termo "{search}".
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {#each filteredBooks as book (book.id)}
        <BookCard {book} />
      {/each}
    </div>
  {/if}
</div>
