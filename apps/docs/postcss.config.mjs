/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind v4 ships as a dedicated PostCSS plugin; it includes its
    // own vendor-prefixing (via Lightning CSS), so autoprefixer is gone.
    "@tailwindcss/postcss": {},
  },
};

export default config;
