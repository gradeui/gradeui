/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind v4 as a PostCSS plugin (same pipeline as apps/docs).
    "@tailwindcss/postcss": {},
  },
};

export default config;
