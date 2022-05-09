"use strict";
const path = require("path");
const { defineConfig } = require("vite");
module.exports = defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            name: "Robustive",
            fileName: (format) => `robustive.${format}.js`
        },
    }
});
//# sourceMappingURL=vite.config.js.map