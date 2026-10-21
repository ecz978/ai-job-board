import type { NextConfig } from "next";

// App dinamica: ogni pagina legge la sessione Google, quindi non serve il prerendering.
const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
