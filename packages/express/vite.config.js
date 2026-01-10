import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "RobustiveExpress",
            formats: ["es", "umd"],
            fileName: (format) => `robustive-express.${format}.js`
        },
        rollupOptions: {
            treeshake: false, // prevent losing side effects (prototype extension)
            external: ["robustive-ts", "express"],
            output: {
                globals: {
                    "robustive-ts": "Robustive",
                    express: "express",
                },
            },
        },
    }
});
//# sourceMappingURL=vite.config.js.map