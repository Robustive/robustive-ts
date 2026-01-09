import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "Robustive",
            fileName: (format) => `robustive-express.${format}.js`
        },
    }
});
//# sourceMappingURL=vite.config.js.map