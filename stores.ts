import { writable } from 'svelte/store';
import type { Subscription } from './types';

// Function to generate initial data for debugging
const getInitialSubscriptions = (): Subscription[] => {
  const initialNames = ['Бокс', 'Плавание', 'Вокал', 'Гитара', 'Ударные'];
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 30); // 1 month duration

  return initialNames.map(name => ({
    id: crypto.randomUUID(),
    name,
    sessionsLeft: 12,
    startDate: today.toISOString(),
    endDate: endDate.toISOString(),
    history: [],
    lastRenewSessions: 12,
    lastRenewDuration: 30,
  }));
};


const key = 'subscriptions';
const storedValue = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
const initialValue = storedValue ? JSON.parse(storedValue) : getInitialSubscriptions();

export const subscriptions = writable<Subscription[]>(initialValue);

subscriptions.subscribe(value => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
});