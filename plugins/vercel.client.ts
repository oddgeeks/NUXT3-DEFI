import { inject } from '@vercel/analytics';

export default defineNuxtPlugin(() => {
    !process.dev && inject();
})