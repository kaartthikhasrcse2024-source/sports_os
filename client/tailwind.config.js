/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dark: {
                    900: '#111111',
                    800: '#1f1f1f',
                    700: '#2d2d2d',
                },
                primary: {
                    500: '#c5a059',
                    400: '#d7b875',
                }
            }
        },
    },
    plugins: [],
}
