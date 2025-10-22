import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        svelte(),
        VitePWA({
            // registerType: 'autoUpdate' говорит плагину автоматически обновлять
            // сервис-воркер, когда появляются новые версии приложения.
            registerType: 'autoUpdate',

            // workbox отвечает за генерацию сервис-воркера.
            // globPatterns указывает, какие файлы из папки сборки нужно кешировать.
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}']
            },

            // manifest - это конфигурация файла manifest.webmanifest
            manifest: {
                name: 'Трекер Абонементов',
                short_name: 'Абонементы',
                description: 'Простое приложение для отслеживания ваших абонементов.',
                // Цвет темы, который будет использоваться в UI браузера на мобильных
                theme_color: '#6366f1',
                // Цвет фона для сплэш-скрина при запуске
                background_color: '#1a1a1a',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: 'icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'icons/icon-maskable-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable' // "Маскируемая" иконка лучше адаптируется под разные формы иконок в Android
                    }
                ]
            }
        })
    ],
    server: {
        port: 3000,
        host: '0.0.0.0',
    },
});
