import { mount } from 'svelte'; // Импортируем mount
import App from './App.svelte';

const app = mount(App, {
    target: document.getElementById('root')!,
});

export default app;
