// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./components/**/*.{js,vue,ts}",
        "./layouts/**/*.vue",
        "./pages/**/*.vue",
        "./plugins/**/*.{js,ts}",
        "./app.vue",
        "./error.vue",
    ],
    theme: {
        extend: {
            colors: {
                'green-800': '#2D4B3F',
                'green-700': '#54625c',
                'beige-100': '#F5F5DC',
                'brown-800': '#6B4C3E',
            },
            fontFamily: {
                sans: ['"Poppins"', 'sans-serif'], // For general text
                serif: ['"EB Garamond"', 'serif'], // For headings
            },
        },
    },
    plugins: [],
}