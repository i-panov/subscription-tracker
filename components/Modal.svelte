<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import XMarkIcon from './icons/XMarkIcon.svelte';

    export let isOpen: boolean;
    export let title: string;

    let modalElement: HTMLDivElement;

    function close() {
        if (modalElement) {
            modalElement.dispatchEvent(new CustomEvent('close'));
        }
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
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
            class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity"
            on:click={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            bind:this={modalElement}
            tabindex="-1"
    >
        <div
                class="bg-card-bg rounded-2xl shadow-xl w-full max-w-md m-4 p-8 relative transform transition-all"
        >
            <div class="flex justify-between items-center mb-6">
                <h2 id="modal-title" class="text-2xl font-bold text-text-main">{title}</h2>
                <button
                        on:click={close}
                        class="text-text-secondary hover:text-text-main transition-colors"
                        aria-label="Close modal"
                >
                    <XMarkIcon />
                </button>
            </div>
            <div>
                <slot />
            </div>
        </div>
    </div>
{/if}
