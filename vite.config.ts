import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => {
  return {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      tanstackStart({
        server: { entry: "server" },
      }),
      command === "build" ? nitro() : null,
      react(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  };
});
