import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  define: {
    __WEB__: true,
    __UNI_PLATFORM__: JSON.stringify("h5"),
  },
});
