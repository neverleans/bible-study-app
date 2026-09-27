<script lang="ts">
  import { api } from '$api/client';
  import { onMount } from 'svelte';
  import { currentUserId, setUserId } from '$stores/user';
  import type { Note, Book } from '$types';

  let notes = $state<Note[]>([]);
  let books = $state<Book[]>([]);
  let isLoading = $state(true);
  let errorMessage = $state<string | null>(null);

  // Filters
  let selectedBook = $state<string>('all');
  let searchQuery = $state('');

  // Editing state
  let editingNoteId = $state<string | null>(null);
  let editContent = $state('');
  let isSaving = $state(false);

  // User Switcher (demonstrating RLS isolation)
  let showUserModal = $state(false);
  let customUserId = $state('');

  onMount(async () => {
    customUserId = $currentUserId;
    await loadData();
  });

  async function loadData() {
    isLoading = true;
    errorMessage = null;
    try {
      const [fetchedNotes, fetchedBooks] = await Promise.all([
        api.getNotes(),
        api.getBooks(),
      ]);
      notes = fetchedNotes;
      books = fetchedBooks;
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Falha ao carregar anotações';
    } finally {
      isLoading = false;
    }
  }

  // Filtered notes
  let filteredNotes = $derived(
    notes.filter((note) => {
      const matchesBook = selectedBook === 'all' || note.bookAbbrev.toLowerCase() === selectedBook.toLowerCase();
      const matchesQuery = !searchQuery.trim() ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.bookName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesBook && matchesQuery;
    })
  );

  function startEdit(note: Note) {
    editingNoteId = note.id;
    editContent = note.content;
  }

  function cancelEdit() {
    editingNoteId = null;
    editContent = '';
  }

  async function handleSaveEdit(noteId: string) {
    if (!editContent.trim() || isSaving) return;
    isSaving = true;
    try {
      const updated = await api.updateNote(noteId, { content: editContent.trim() });
      const index = notes.findIndex((n) => n.id === noteId);
      if (index >= 0) {
        notes[index] = updated;
      }
      editingNoteId = null;
      editContent = '';
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar nota');
    } finally {
      isSaving = false;
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Deseja realmente excluir esta anotação?')) return;
    try {
      await api.deleteNote(noteId);
      notes = notes.filter((n) => n.id !== noteId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir nota');
    }
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  function applyUserChange(userIdToApply: string) {
    if (!userIdToApply.trim()) return;
    setUserId(userIdToApply.trim());
    showUserModal = false;
    loadData();
  }
</script>

<svelte:head>
  <title>Minhas Anotações de Estudo — Estudo Bíblico</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b" style="border-color: var(--color-border)">
    <div>
      <h1 class="text-3xl font-extrabold flex items-center gap-3" style="color: var(--color-text)">
        <span>📝</span>
        <span>Minhas Anotações</span>
      </h1>
      <p class="text-sm mt-1" style="color: var(--color-muted)">
        Anotações e reflexões pessoais protegidas por Row-Level Security (RLS) no PostgreSQL.
      </p>
    </div>

    <!-- Active User & RLS Badge -->
    <div class="flex items-center gap-2">
      <div
        class="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs"
        style="background-color: var(--color-surface); border-color: var(--color-border)"
      >
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
        <span style="color: var(--color-muted)">Usuário:</span>
        <span class="font-mono font-medium max-w-[120px] truncate" title={$currentUserId}>
          {$currentUserId}
        </span>
        <button
          onclick={() => (showUserModal = true)}
          class="text-xs px-2 py-0.5 rounded border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
          style="border-color: var(--color-border); color: var(--color-primary)"
        >
          Trocar
        </button>
      </div>
    </div>
  </div>

  <!-- Search & Filter Controls -->
  <div
    class="p-4 rounded-2xl border flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
    style="background-color: var(--color-surface); border-color: var(--color-border)"
  >
    <div class="flex-1 relative">
      <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm select-none" style="color: var(--color-muted)">🔍</span>
      <input
        type="search"
        bind:value={searchQuery}
        placeholder="Filtrar por palavras na anotação ou livro..."
        class="w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:border-blue-500"
        style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text)"
      />
    </div>

    <div class="flex items-center gap-2">
      <label for="book-filter" class="text-xs font-medium whitespace-nowrap" style="color: var(--color-muted)">
        Livro:
      </label>
      <select
        id="book-filter"
        bind:value={selectedBook}
        class="py-2 px-3 rounded-xl border text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
        style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text)"
      >
        <option value="all">Todos os Livros ({notes.length})</option>
        {#each books as b}
          {@const count = notes.filter((n) => n.bookAbbrev.toLowerCase() === b.abbrev.toLowerCase()).length}
          {#if count > 0}
            <option value={b.abbrev}>
              {b.name} ({count})
            </option>
          {/if}
        {/each}
      </select>
    </div>
  </div>

  <!-- Error display -->
  {#if errorMessage}
    <div class="p-4 rounded-xl text-sm bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
      {errorMessage}
    </div>
  {/if}

  <!-- Loading state -->
  {#if isLoading}
    <div class="text-center py-16" style="color: var(--color-muted)">
      <div class="animate-spin text-3xl inline-block mb-3">⏳</div>
      <p class="text-sm">Carregando suas anotações...</p>
    </div>
  {:else if filteredNotes.length === 0}
    <!-- Empty state -->
    <div
      class="text-center py-16 px-6 rounded-2xl border"
      style="background-color: var(--color-surface); border-color: var(--color-border)"
    >
      <span class="text-5xl block mb-4">📖</span>
      {#if notes.length === 0}
        <h2 class="text-lg font-bold mb-1" style="color: var(--color-text)">Você ainda não tem anotações</h2>
        <p class="text-sm max-w-md mx-auto mb-6" style="color: var(--color-muted)">
          Abra qualquer capítulo da Bíblia, selecione um versículo e comece a registrar seus estudos e reflexões.
        </p>
        <a
          href="/"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <span>Ir para a Bíblia</span>
          <span>→</span>
        </a>
      {:else}
        <h2 class="text-lg font-bold mb-1" style="color: var(--color-text)">Nenhuma anotação encontrada com este filtro</h2>
        <p class="text-sm max-w-md mx-auto mb-4" style="color: var(--color-muted)">
          Tente remover o filtro de livro ou alterar o termo de busca.
        </p>
        <button
          onclick={() => { selectedBook = 'all'; searchQuery = ''; }}
          class="px-4 py-2 rounded-xl text-sm font-medium border hover:opacity-80 cursor-pointer"
          style="border-color: var(--color-border); color: var(--color-primary)"
        >
          Limpar Filtros
        </button>
      {/if}
    </div>
  {:else}
    <!-- Notes Grid / List -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each filteredNotes as note (note.id)}
        <div
          class="p-5 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-md"
          style="background-color: var(--color-surface); border-color: var(--color-border)"
        >
          <div>
            <!-- Note Header: Reference & Link -->
            <div class="flex items-center justify-between pb-3 mb-3 border-b" style="border-color: var(--color-border)">
              <a
                href="/{note.bookAbbrev}/{note.chapterNumber}#v{note.verseNumber}"
                class="font-bold text-base hover:underline flex items-center gap-1.5 group"
                style="color: var(--color-primary)"
              >
                <span>{note.bookName} {note.chapterNumber}:{note.verseNumber}</span>
                <span class="text-xs transition-transform group-hover:translate-x-0.5">↗</span>
              </a>
              <span class="text-xs" style="color: var(--color-muted)">
                {formatDate(note.updatedAt || note.createdAt)}
              </span>
            </div>

            <!-- Note Content -->
            {#if editingNoteId === note.id}
              <textarea
                bind:value={editContent}
                rows="4"
                class="w-full p-3 rounded-xl border text-sm resize-none focus:outline-none focus:border-blue-500 mb-3"
                style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text)"
              ></textarea>
              <div class="flex items-center justify-end gap-2 mb-2">
                <button
                  onclick={cancelEdit}
                  disabled={isSaving}
                  class="px-3 py-1.5 text-xs rounded-lg border hover:opacity-80 cursor-pointer"
                  style="border-color: var(--color-border)"
                >
                  Cancelar
                </button>
                <button
                  onclick={() => handleSaveEdit(note.id)}
                  disabled={isSaving || !editContent.trim()}
                  class="px-3 py-1.5 text-xs rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alteração'}
                </button>
              </div>
            {:else}
              <p class="text-sm whitespace-pre-wrap leading-relaxed pb-3" style="color: var(--color-text)">
                {note.content}
              </p>
            {/if}
          </div>

          <!-- Note Actions Footer -->
          {#if editingNoteId !== note.id}
            <div class="flex items-center justify-between pt-3 border-t text-xs" style="border-color: var(--color-border); color: var(--color-muted)">
              <a
                href="/{note.bookAbbrev}/{note.chapterNumber}#v{note.verseNumber}"
                class="hover:underline"
                style="color: var(--color-primary)"
              >
                Ver no contexto do capítulo →
              </a>
              <div class="flex items-center gap-3">
                <button
                  onclick={() => startEdit(note)}
                  class="hover:underline cursor-pointer"
                  style="color: var(--color-primary)"
                >
                  Editar
                </button>
                <span>•</span>
                <button
                  onclick={() => handleDeleteNote(note.id)}
                  class="hover:underline cursor-pointer text-red-500 hover:text-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Switch User Modal (To demo RLS Tenant Isolation) -->
{#if showUserModal}
  <div
    role="button"
    tabindex="0"
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
    onclick={() => (showUserModal = false)}
    onkeydown={(e) => e.key === 'Escape' && (showUserModal = false)}
  >
    <div
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      class="max-w-md w-full p-6 rounded-2xl border shadow-xl space-y-4"
      style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text)"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-lg">Trocar Identificador de Usuário (RLS)</h3>
        <button
          onclick={() => (showUserModal = false)}
          class="p-1 rounded-lg border text-xs cursor-pointer hover:opacity-80"
          style="border-color: var(--color-border)"
        >
          ✕
        </button>
      </div>

      <p class="text-xs leading-relaxed" style="color: var(--color-muted)">
        O backend utiliza <strong>PostgreSQL Row-Level Security</strong> via <code>app.current_user_id</code>. Ao trocar seu ID aqui, o banco de dados filtrará as notas para exibir apenas as pertencentes à nova identidade.
      </p>

      <div class="space-y-2">
        <label for="custom-user-input" class="text-xs font-semibold block" style="color: var(--color-text)">
          ID do Usuário:
        </label>
        <input
          id="custom-user-input"
          type="text"
          bind:value={customUserId}
          class="w-full px-3 py-2 rounded-xl border text-sm font-mono focus:outline-none focus:border-blue-500"
          style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
        />
      </div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <button
          onclick={() => applyUserChange('user-teste-1')}
          class="px-3 py-1.5 text-xs rounded-lg border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
          style="border-color: var(--color-border)"
        >
          Usuário 1
        </button>
        <button
          onclick={() => applyUserChange('user-teste-2')}
          class="px-3 py-1.5 text-xs rounded-lg border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
          style="border-color: var(--color-border)"
        >
          Usuário 2
        </button>
        <button
          onclick={() => applyUserChange(customUserId)}
          class="px-4 py-1.5 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
{/if}
