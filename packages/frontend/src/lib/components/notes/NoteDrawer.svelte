<script lang="ts">
  import { api } from '$api/client';
  import type { Verse, Note, Book } from '$types';

  let {
    book,
    chapterNumber,
    verse,
    notes = [],
    isOpen = false,
    onClose,
    onNoteSaved,
    onNoteDeleted,
  }: {
    book: Book;
    chapterNumber: number;
    verse: Verse | null;
    notes: Note[];
    isOpen: boolean;
    onClose: () => void;
    onNoteSaved: (note: Note) => void;
    onNoteDeleted: (noteId: string) => void;
  } = $props();

  let newNoteContent = $state('');
  let isSaving = $state(false);
  let editingNoteId = $state<string | null>(null);
  let editContent = $state('');
  let errorMessage = $state<string | null>(null);

  async function handleCreateNote() {
    if (!verse || !newNoteContent.trim() || isSaving) return;

    isSaving = true;
    errorMessage = null;
    try {
      const created = await api.createNote({
        bookAbbrev: book.abbrev,
        chapterNumber,
        verseNumber: verse.number,
        content: newNoteContent.trim(),
      });
      newNoteContent = '';
      onNoteSaved(created);
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Falha ao salvar nota';
    } finally {
      isSaving = false;
    }
  }

  function startEdit(note: Note) {
    editingNoteId = note.id;
    editContent = note.content;
  }

  function cancelEdit() {
    editingNoteId = null;
    editContent = '';
  }

  async function handleUpdateNote(noteId: string) {
    if (!editContent.trim() || isSaving) return;

    isSaving = true;
    errorMessage = null;
    try {
      const updated = await api.updateNote(noteId, {
        content: editContent.trim(),
      });
      editingNoteId = null;
      editContent = '';
      onNoteSaved(updated);
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Falha ao atualizar nota';
    } finally {
      isSaving = false;
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;

    isSaving = true;
    errorMessage = null;
    try {
      await api.deleteNote(noteId);
      onNoteDeleted(noteId);
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Falha ao excluir nota';
    } finally {
      isSaving = false;
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
</script>

{#if isOpen && verse}
  <!-- Backdrop -->
  <div
    role="button"
    tabindex="0"
    class="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    aria-label="Fechar painel de notas"
  ></div>

  <!-- Slide-over Drawer -->
  <aside
    class="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 shadow-2xl flex flex-col border-l transition-transform duration-300"
    style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text)"
    aria-labelledby="note-drawer-title"
  >
    <!-- Header -->
    <div
      class="p-5 border-b flex items-center justify-between"
      style="border-color: var(--color-border); background-color: var(--color-surface)"
    >
      <div>
        <h2 id="note-drawer-title" class="font-bold text-lg" style="color: var(--color-text)">
          {book.name} {chapterNumber}:{verse.number}
        </h2>
        <span class="text-xs" style="color: var(--color-muted)">
          Anotações pessoais de estudo (protegidas por RLS)
        </span>
      </div>
      <button
        onclick={onClose}
        class="p-1.5 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer text-sm"
        style="border-color: var(--color-border); background-color: var(--color-bg)"
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>

    <!-- Verse Quote -->
    <div class="p-4 border-b text-sm italic font-serif leading-relaxed" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-muted)">
      "{verse.text}"
    </div>

    <!-- Error alert -->
    {#if errorMessage}
      <div class="m-4 p-3 rounded-lg text-sm bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
        {errorMessage}
      </div>
    {/if}

    <!-- Notes List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      {#if notes.length === 0}
        <div class="text-center py-8" style="color: var(--color-muted)">
          <span class="text-3xl block mb-2">📝</span>
          <p class="text-sm font-medium">Nenhuma anotação neste versículo ainda.</p>
          <p class="text-xs mt-1">Escreva sua reflexão ou estudo abaixo.</p>
        </div>
      {:else}
        {#each notes as note (note.id)}
          <div
            class="p-4 rounded-xl border relative space-y-2 group transition-shadow hover:shadow-sm"
            style="background-color: var(--color-surface); border-color: var(--color-border)"
          >
            {#if editingNoteId === note.id}
              <!-- Edit mode -->
              <textarea
                bind:value={editContent}
                rows="3"
                class="w-full p-2.5 rounded-lg border text-sm focus:outline-none focus:border-blue-500"
                style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text)"
              ></textarea>
              <div class="flex items-center justify-end gap-2">
                <button
                  onclick={cancelEdit}
                  disabled={isSaving}
                  class="px-3 py-1 text-xs rounded-lg border cursor-pointer hover:opacity-80"
                  style="border-color: var(--color-border)"
                >
                  Cancelar
                </button>
                <button
                  onclick={() => handleUpdateNote(note.id)}
                  disabled={isSaving || !editContent.trim()}
                  class="px-3 py-1 text-xs rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            {:else}
              <!-- View mode -->
              <p class="text-sm whitespace-pre-wrap leading-relaxed" style="color: var(--color-text)">
                {note.content}
              </p>
              <div class="flex items-center justify-between text-xs pt-1 border-t" style="border-color: var(--color-border); color: var(--color-muted)">
                <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                <div class="flex items-center gap-2">
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
      {/if}
    </div>

    <!-- Create Note Form -->
    <div
      class="p-4 border-t space-y-3"
      style="border-color: var(--color-border); background-color: var(--color-surface)"
    >
      <label for="new-note-input" class="text-xs font-semibold uppercase tracking-wider block" style="color: var(--color-muted)">
        Nova Anotação
      </label>
      <textarea
        id="new-note-input"
        bind:value={newNoteContent}
        placeholder="Escreva seus pensamentos, cruzamentos de referências, significado em hebraico/grego..."
        rows="3"
        class="w-full p-3 rounded-xl border text-sm resize-none focus:outline-none focus:border-blue-500"
        style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text)"
      ></textarea>
      <div class="flex justify-end">
        <button
          onclick={handleCreateNote}
          disabled={isSaving || !newNoteContent.trim()}
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <span>✏️</span>
          <span>{isSaving ? 'Salvando...' : 'Adicionar Anotação'}</span>
        </button>
      </div>
    </div>
  </aside>
{/if}
