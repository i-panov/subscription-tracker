export interface Subscription {
  id: string;
  name: string;
  sessionsLeft: number;
  startDate: string; // ISO String
  endDate: string | null; // ISO String or null
  history: string[]; // Array of ISO date strings for attended sessions
  lastRenewSessions: number;
  lastRenewDuration: number | null; // Duration in days
}

export type ModalType = 
  | { type: 'ADD_SUBSCRIPTION' }
  | { type: 'RENEW_SUBSCRIPTION', subscription: Subscription }
  | { type: 'VIEW_HISTORY', subscription: Subscription }
  | { type: 'DELETE_CONFIRM', subscription: Subscription }
  | { type: 'MARK_SESSION_CUSTOM', subscription: Subscription }
  | { type: 'MARK_SESSION_CONFIRM', subscription: Subscription }
  | { type: 'DELETE_HISTORY_CONFIRM', subscription: Subscription, historyDate: string }
  | null;