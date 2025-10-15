/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Diz ao Tailwind para procurar classes em todos estes ficheiros
  ],
  theme: {
    extend: {
      // Aqui podemos adicionar cores, fontes e animações personalizadas no futuro
      colors: {
        'primary': '#1890ff',
        'secondary': '#f0f2f5',
      },
    },
  },
  plugins: [],
}