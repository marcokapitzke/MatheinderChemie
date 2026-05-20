import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "Mathe_Website";
const inferredBase = repositoryName.endsWith(".github.io") ? "/" : `/${repositoryName}/`;

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? inferredBase,
  plugins: [react()],
  test: {
    globals: true,
    environment: "node"
  }
});
