<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import XMarkIcon from './icons/XMarkIcon.svelte';

    type Props = {
        isOpen: boolean;
        title: string;
        onclose?: () => void;
        children?: import('svelte').Snippet;
    };

    let { isOpen, title, onclose, children }: Props = $props();

    function close() {
        onclose?.();
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            close();
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            close();
        }
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });
</script>

{#if isOpen}
    <div
            class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity"
            onclick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabindex="-1"
    >
        <div class="bg-card-bg rounded-2xl shadow-xl w-full max-w-md m-4 p-8 relative transform transition-all">
            <div class="flex justify-between items-center mb-6">
                <h2 id="modal-title" class="text-2xl font-bold text-text-main">{title}</h2>
                <button
                        onclick={close}
                        class="text-text-secondary hover:text-text-main transition-colors"
                        aria-label="Close modal"
                >
                    <XMarkIcon />
                </button>
            </div>
            <div>
                {@render children?.()}
            </div>
        </div>
    </div>
{/if}
