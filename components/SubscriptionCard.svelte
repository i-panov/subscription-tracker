<script lang="ts">
    import type { Subscription } from '../types';
    import CalendarIcon from './icons/CalendarIcon.svelte';
    import HistoryIcon from './icons/HistoryIcon.svelte';
    import TrashIcon from './icons/TrashIcon.svelte';
    import CheckIcon from './icons/CheckIcon.svelte';
    import FireIcon from './icons/FireIcon.svelte';
    import CalendarPlusIcon from './icons/CalendarPlusIcon.svelte';

    export let subscription: Subscription;

    // Ссылка на корневой DOM-элемент карточки для отправки событий
    let cardElement: HTMLDivElement;

    let daysRemaining: number | null = null;
    $: {
        if (!subscription.endDate) {
            daysRemaining = null;
        } else {
            const end = new Date(subscription.endDate);
            const now = new Date();
            const diffTime = end.getTime() - now.getTime();
            if (diffTime < 0) {
                daysRemaining = -1; // Expired
            } else {
                daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }
    }

    $: hasExpired = daysRemaining !== null && daysRemaining < 0;
    $: isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0;
    $: isOutOfSessions = subscription.sessionsLeft === 0;

    $: cardBorderColor = hasExpired
        ? 'border-red-500/50'
        : isExpiringSoon
            ? 'border-amber-500/50'
            : 'border-transparent';

    $: dateDisplay = subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'Бессрочный';

</script>

<div
        id={subscription.id}
        class={`bg-card-bg rounded-2xl shadow-lg p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1 border ${cardBorderColor}`}
        bind:this={cardElement}
>
    <div>
        <h3 class="text-2xl font-bold text-text-main mb-2">{subscription.name}</h3>
        <div class="flex items-center text-text-secondary mb-4">
            <CalendarIcon className="mr-2" />
            <span>{hasExpired ? 'Абонемент истек' : `Действителен до: ${dateDisplay}`}</span>
        </div>

        {#if isExpiringSoon && !hasExpired}
            <div class="flex items-center text-amber-400 text-sm mb-4 p-2 bg-amber-500/10 rounded-lg">
                <FireIcon className="mr-2"/>
                <span>Срок действия скоро истекает!</span>
            </div>
        {/if}

        <div class="text-center my-6">
            <p class="text-text-secondary text-lg">Осталось занятий</p>
            <p class={`text-6xl font-bold ${subscription.sessionsLeft > 0 ? 'text-primary' : 'text-red-500'}`}>{subscription.sessionsLeft}</p>
        </div>
    </div>

    <div class="flex flex-col space-y-3">
        <div class="flex space-x-2">
            <button
                    on:click={() => cardElement.dispatchEvent(new CustomEvent('markSession', { detail: subscription.id }))}
                    disabled={isOutOfSessions || hasExpired}
                    class="flex-grow flex items-center justify-center bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors hover:bg-primary-hover disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                <CheckIcon className="mr-2" />
                Отметить занятие
            </button>
            <button
                    on:click={() => cardElement.dispatchEvent(new CustomEvent('markSessionWithDate', { detail: subscription }))}
                    disabled={isOutOfSessions || hasExpired}
                    class="flex-shrink-0 bg-primary/80 text-white p-3 rounded-lg transition-colors hover:bg-primary-hover disabled:bg-gray-500 disabled:cursor-not-allowed"
                    aria-label="Отметить занятие с выбором даты"
            >
                <CalendarPlusIcon />
            </button>
        </div>
        <button
                on:click={() => cardElement.dispatchEvent(new CustomEvent('renew', { detail: subscription }))}
                class="w-full bg-secondary text-white font-bold py-3 px-4 rounded-lg transition-colors hover:bg-secondary-hover"
        >
            Продлить
        </button>
        <div class="flex space-x-2 pt-2">
            <button
                    on:click={() => cardElement.dispatchEvent(new CustomEvent('viewHistory', { detail: subscription }))}
                    class="flex-grow flex items-center justify-center bg-gray-600/30 text-text-secondary font-semibold py-2 px-4 rounded-lg transition-colors hover:bg-gray-600/50"
            >
                <HistoryIcon className="mr-2" />
                История
            </button>
            <button
                    on:click={() => cardElement.dispatchEvent(new CustomEvent('delete', { detail: subscription }))}
                    class="flex-shrink-0 p-3 bg-red-500/20 text-red-400 rounded-lg transition-colors hover:bg-red-500/40 hover:text-red-300"
                    aria-label="Удалить абонемент"
            >
                <TrashIcon />
            </button>
        </div>
    </div>
</div>
