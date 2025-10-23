<script lang="ts">
    import { subscriptions } from './stores';
    import type { Subscription, ModalType } from './types';
    import SubscriptionCard from './components/SubscriptionCard.svelte';
    import Modal from './components/Modal.svelte';
    import PlusIcon from './components/icons/PlusIcon.svelte';
    import TrashIcon from './components/icons/TrashIcon.svelte';
    import ArrowsUpDownIcon from './components/icons/ArrowsUpDownIcon.svelte';

    let activeModal = $state<ModalType>(null);

    // Form state
    let name = $state('');
    let sessions = $state('');
    let duration = $state('');
    let startDate = $state(new Date().toISOString().split('T')[0]);
    let hasExpiry = $state(true);
    let customSessionDate = $state('');

    // Nav state
    let isNavOpen = $state(false);

    function handleAddSubscription() {
        if (!name || !sessions || !startDate) return;
        const sessionsCount = parseInt(sessions, 10);
        if (isNaN(sessionsCount) || sessionsCount <= 0) return;

        const startDateObj = new Date(startDate);
        let endDate: Date | null = null;
        let durationInDays: number | null = null;

        if(hasExpiry){
            const parsedDuration = parseInt(duration, 10);
            if(!isNaN(parsedDuration) && parsedDuration > 0) {
                durationInDays = parsedDuration;
                endDate = new Date(startDateObj);
                endDate.setDate(startDateObj.getDate() + durationInDays);
            }
        }

        const newSubscription: Subscription = {
            id: crypto.randomUUID(),
            name,
            sessionsLeft: sessionsCount,
            startDate: startDateObj.toISOString(),
            endDate: endDate ? endDate.toISOString() : null,
            history: [],
            lastRenewSessions: sessionsCount,
            lastRenewDuration: durationInDays,
        };
        $subscriptions = [...$subscriptions, newSubscription];
        closeModal();
    }

    function handleRenewSubscription() {
        if (activeModal?.type !== 'RENEW_SUBSCRIPTION' || !startDate) return;
        const sessionsToAdd = parseInt(sessions, 10);
        if (isNaN(sessionsToAdd) || sessionsToAdd <= 0) return;

        $subscriptions = $subscriptions.map(sub => {
            if (sub.id === activeModal.subscription.id) {
                const newSessionsLeft = sub.sessionsLeft + sessionsToAdd;

                let newEndDate: Date | null = sub.endDate ? new Date(sub.endDate) : null;
                let durationInDays: number | null = null;

                if (hasExpiry) {
                    const parsedDuration = parseInt(duration, 10);
                    if (!isNaN(parsedDuration) && parsedDuration > 0) {
                        durationInDays = parsedDuration;
                        const oldEndDate = sub.endDate ? new Date(sub.endDate) : null;
                        const baseDate = (oldEndDate && oldEndDate.getTime() > Date.now())
                            ? oldEndDate
                            : new Date(startDate);

                        newEndDate = new Date(baseDate);
                        newEndDate.setDate(baseDate.getDate() + durationInDays);
                    }
                } else {
                    newEndDate = null;
                }

                return {
                    ...sub,
                    sessionsLeft: newSessionsLeft,
                    endDate: newEndDate ? newEndDate.toISOString() : null,
                    lastRenewSessions: sessionsToAdd,
                    lastRenewDuration: durationInDays,
                };
            }
            return sub;
        });
        closeModal();
    }

    function addSession(id: string, sessionDate: string = new Date().toISOString()) {
        $subscriptions = $subscriptions.map(s => {
            if (s.id === id && s.sessionsLeft > 0) {
                return {
                    ...s,
                    sessionsLeft: s.sessionsLeft - 1,
                    history: [...s.history, sessionDate].sort((a,b) => new Date(b).getTime() - new Date(a).getTime())
                };
            }
            return s;
        });
    }

    function handleMarkSession(id: string) {
        const sub = $subscriptions.find(s => s.id === id);
        if (!sub) return;

        const todayStr = new Date().toISOString().split('T')[0];
        const hasSessionToday = sub.history.some(h => new Date(h).toISOString().split('T')[0] === todayStr);

        if (hasSessionToday) {
            openModal({ type: 'MARK_SESSION_CONFIRM', subscription: sub });
        } else {
            addSession(id);
        }
    }

    function handleConfirmMarkSession() {
        if (activeModal?.type !== 'MARK_SESSION_CONFIRM') return;
        addSession(activeModal.subscription.id);
        closeModal();
    }

    function handleMarkSessionWithDate() {
        if (activeModal?.type !== 'MARK_SESSION_CUSTOM' || !customSessionDate) return;
        const subId = activeModal.subscription.id;
        addSession(subId, new Date(customSessionDate).toISOString());
        closeModal();
    }

    function handleDeleteSubscription() {
        if (activeModal?.type !== 'DELETE_CONFIRM') return;
        $subscriptions = $subscriptions.filter(sub => sub.id !== activeModal.subscription.id);
        closeModal();
    }

    function handleDeleteHistoryEntry(subscriptionId: string, historyEntryDate: string) {
        $subscriptions = $subscriptions.map(sub => {
            if (sub.id === subscriptionId) {
                const newHistory = sub.history.filter(h => h !== historyEntryDate);
                return {
                    ...sub,
                    history: newHistory,
                    sessionsLeft: sub.sessionsLeft + 1
                };
            }
            return sub;
        });
    }

    function handleConfirmDeleteHistoryEntry() {
        if (activeModal?.type !== 'DELETE_HISTORY_CONFIRM') return;
        const { subscription, historyDate } = activeModal;
        handleDeleteHistoryEntry(subscription.id, historyDate);
        activeModal = { type: 'VIEW_HISTORY', subscription };
    }

    function openModal(modal: ModalType) {
        resetFormState();

        if (modal?.type === 'RENEW_SUBSCRIPTION') {
            const sub = modal.subscription;
            sessions = sub.lastRenewSessions?.toString() ?? '';

            if (sub.lastRenewDuration === null) {
                hasExpiry = false;
                duration = '';
            } else {
                hasExpiry = true;
                duration = sub.lastRenewDuration?.toString() ?? '';
            }
        } else if (modal?.type === 'MARK_SESSION_CUSTOM') {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            customSessionDate = now.toISOString().slice(0, 16);
        }

        activeModal = modal;
    }

    function closeModal() {
        activeModal = null;
        resetFormState();
    }

    function resetFormState() {
        name = '';
        sessions = '';
        duration = '';
        startDate = new Date().toISOString().split('T')[0];
        hasExpiry = true;
        customSessionDate = '';
    }

    let sortedSubscriptions = $derived(
        [...$subscriptions].sort((a, b) => {
            const aDate = a.endDate ? new Date(a.endDate) : new Date('9999-12-31');
            const bDate = b.endDate ? new Date(b.endDate) : new Date('9999-12-31');
            return aDate.getTime() - bDate.getTime();
        })
    );

    function scrollToSubscription(id: string) {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        isNavOpen = false;
    }

    function clickOutside(node: HTMLElement) {
        const handleClick = (event: MouseEvent) => {
            if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
                isNavOpen = false;
            }
        };
        document.addEventListener('click', handleClick, true);
        return {
            destroy() {
                document.removeEventListener('click', handleClick, true);
            }
        };
    }

    let modalTitle = $derived.by(() => {
        if (!activeModal) return '';
        const currentSubName = 'subscription' in activeModal ? activeModal.subscription.name : '';
        switch(activeModal.type) {
            case 'ADD_SUBSCRIPTION': return 'Новый абонемент';
            case 'RENEW_SUBSCRIPTION': return `Продлить: ${currentSubName}`;
            case 'VIEW_HISTORY': return `История: ${currentSubName}`;
            case 'DELETE_CONFIRM': return 'Подтверждение';
            case 'MARK_SESSION_CONFIRM': return 'Подтверждение';
            case 'MARK_SESSION_CUSTOM': return `Отметить занятие: ${currentSubName}`;
            case 'DELETE_HISTORY_CONFIRM': return 'Подтверждение удаления';
            default: return '';
        }
    });
</script>

<div class="min-h-screen">
    <header class="sticky top-0 z-30 bg-brand-bg/90 backdrop-blur-sm shadow-md">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-3xl font-bold">Мои Абонементы</h1>
            <div class="relative" use:clickOutside>
                {#if $subscriptions.length > 1}
                    <button
                            onclick={() => isNavOpen = !isNavOpen}
                            class="p-2 rounded-full hover:bg-white/10 transition-colors"
                            aria-label="Быстрая навигация"
                    >
                        <ArrowsUpDownIcon />
                    </button>
                {/if}
                {#if isNavOpen}
                    <div class="absolute top-full right-0 mt-2 w-64 bg-card-bg rounded-lg shadow-lg p-2 animate-fade-in-up">
                        <ul class="space-y-1">
                            {#each sortedSubscriptions as sub (sub.id)}
                                <li>
                                    <button
                                            onclick={() => scrollToSubscription(sub.id)}
                                            class="w-full text-left px-3 py-2 text-text-secondary hover:bg-primary/20 hover:text-text-main rounded-md transition-colors"
                                    >
                                        {sub.name}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>
        </div>
    </header>

    <main class="container mx-auto px-4 py-8">
        {#if $subscriptions.length === 0}
            <div class="text-center text-text-secondary mt-20">
                <h2 class="text-2xl mb-2">У вас пока нет абонементов</h2>
                <p>Нажмите "Добавить", чтобы начать отслеживать.</p>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each sortedSubscriptions as sub (sub.id)}
                    <SubscriptionCard
                            subscription={sub}
                            onmarkSession={handleMarkSession}
                            onmarkSessionWithDate={(s) => openModal({type: 'MARK_SESSION_CUSTOM', subscription: s})}
                            onrenew={(s) => openModal({type: 'RENEW_SUBSCRIPTION', subscription: s})}
                            onviewHistory={(s) => openModal({type: 'VIEW_HISTORY', subscription: s})}
                            ondelete={(s) => openModal({type: 'DELETE_CONFIRM', subscription: s})}
                    />
                {/each}
            </div>
        {/if}
    </main>

    <Modal isOpen={!!activeModal} onclose={closeModal} title={modalTitle}>
        {#if activeModal}
            {@const currentSub = 'subscription' in activeModal ? $subscriptions.find(s => s.id === activeModal.subscription.id) : undefined}

            {#if activeModal.type === 'ADD_SUBSCRIPTION' || activeModal.type === 'RENEW_SUBSCRIPTION'}
                {@const isRenew = activeModal.type === 'RENEW_SUBSCRIPTION'}
                <form onsubmit={(e) => { e.preventDefault(); isRenew ? handleRenewSubscription() : handleAddSubscription(); }}>
                    {#if !isRenew}
                        <div class="mb-4">
                            <label for="name" class="block text-sm font-medium text-text-secondary mb-1">Название абонемента</label>
                            <input type="text" id="name" bind:value={name} class="w-full bg-brand-bg border border-gray-600 rounded-lg p-2 text-text-main focus:ring-primary focus:border-primary" required />
                        </div>
                    {/if}
                    <div class="mb-4">
                        <label for="sessions" class="block text-sm font-medium text-text-secondary mb-1">Количество занятий</label>
                        <input type="number" id="sessions" bind:value={sessions} class="w-full bg-brand-bg border border-gray-600 rounded-lg p-2 text-text-main focus:ring-primary focus:border-primary" required min="1" />
                    </div>
                    <div class="mb-4">
                        <label for="startDate" class="block text-sm font-medium text-text-secondary mb-1">Дата старта</label>
                        <input type="date" id="startDate" bind:value={startDate} class="w-full bg-brand-bg border border-gray-600 rounded-lg p-2 text-text-main focus:ring-primary focus:border-primary" required />
                    </div>
                    <div class="mb-4">
                        <label class="flex items-center">
                            <input type="checkbox" bind:checked={hasExpiry} class="h-4 w-4 rounded border-gray-500 bg-brand-bg text-primary focus:ring-primary" />
                            <span class="ml-2 text-text-secondary">Есть срок действия</span>
                        </label>
                    </div>
                    {#if hasExpiry}
                        <div class="mb-6">
                            <label for="duration" class="block text-sm font-medium text-text-secondary mb-1">Срок действия (дней)</label>
                            <input type="number" id="duration" bind:value={duration} class="w-full bg-brand-bg border border-gray-600 rounded-lg p-2 text-text-main focus:ring-primary focus:border-primary" required min="1" />
                        </div>
                    {/if}
                    <button type="submit" class="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors hover:bg-primary-hover">{isRenew ? 'Продлить' : 'Добавить'}</button>
                </form>
            {:else if activeModal.type === 'VIEW_HISTORY' && currentSub}
                <div>
                    {#if currentSub.history.length > 0}
                        <ul class="space-y-2 max-h-80 overflow-y-auto">
                            {#each currentSub.history as date (date)}
                                <li class="flex justify-between items-center bg-brand-bg p-3 rounded-lg text-text-secondary">
                                    <span>
                                        {new Date(date).toLocaleString()}
                                    </span>
                                    <button
                                            onclick={() => openModal({ type: 'DELETE_HISTORY_CONFIRM', subscription: currentSub, historyDate: date })}
                                            class="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors"
                                            aria-label="Удалить запись"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {:else}
                        <p class="text-text-secondary text-center">История посещений пуста.</p>
                    {/if}
                </div>
            {:else if activeModal.type === 'DELETE_CONFIRM' && currentSub}
                <div>
                    <p class="text-text-secondary mb-6">Вы уверены, что хотите удалить абонемент "{currentSub.name}"?</p>
                    <div class="flex justify-end space-x-4">
                        <button onclick={closeModal} class="py-2 px-4 rounded-lg bg-gray-600/50 hover:bg-gray-600/80 transition-colors">Отмена</button>
                        <button onclick={handleDeleteSubscription} class="py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Удалить</button>
                    </div>
                </div>
            {:else if activeModal.type === 'MARK_SESSION_CONFIRM' && currentSub}
                <div>
                    <p class="text-text-secondary mb-6">Вы уже отмечали занятие сегодня. Вы уверены, что хотите добавить еще одно?</p>
                    <div class="flex justify-end space-x-4">
                        <button onclick={closeModal} class="py-2 px-4 rounded-lg bg-gray-600/50 hover:bg-gray-600/80 transition-colors">Отмена</button>
                        <button onclick={handleConfirmMarkSession} class="py-2 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors">Подтвердить</button>
                    </div>
                </div>
            {:else if activeModal.type === 'MARK_SESSION_CUSTOM'}
                <form onsubmit={(e) => { e.preventDefault(); handleMarkSessionWithDate(); }}>
                    <div class="mb-6">
                        <label for="sessionDate" class="block text-sm font-medium text-text-secondary mb-1">Дата и время занятия</label>
                        <input
                                type="datetime-local"
                                id="sessionDate"
                                bind:value={customSessionDate}
                                class="w-full bg-brand-bg border border-gray-600 rounded-lg p-2 text-text-main focus:ring-primary focus:border-primary"
                                required
                        />
                    </div>
                    <button type="submit" class="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors hover:bg-primary-hover">Подтвердить</button>
                </form>
            {:else if activeModal.type === 'DELETE_HISTORY_CONFIRM' && currentSub && 'historyDate' in activeModal}
                <div>
                    <p class="text-text-secondary mb-6">Вы уверены, что хотите удалить запись от {new Date(activeModal.historyDate).toLocaleString()}?</p>
                    <div class="flex justify-end space-x-4">
                        <button onclick={() => openModal({ type: 'VIEW_HISTORY', subscription: currentSub })} class="py-2 px-4 rounded-lg bg-gray-600/50 hover:bg-gray-600/80 transition-colors">Отмена</button>
                        <button onclick={handleConfirmDeleteHistoryEntry} class="py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Удалить</button>
                    </div>
                </div>
            {/if}
        {/if}
    </Modal>

    <button
            onclick={() => openModal({ type: 'ADD_SUBSCRIPTION' })}
            class="fixed z-40 bottom-8 right-8 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-hover"
            aria-label="Добавить абонемент"
    >
        <PlusIcon />
    </button>
</div>
