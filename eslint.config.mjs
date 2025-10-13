import powerbiVisualsConfigs from "eslint-plugin-powerbi-visuals";

export default [
    powerbiVisualsConfigs.configs.recommended,
    {
        ignores: [
            "node_modules/**",
            "dist/**",
            ".vscode/**",
            ".tmp/**",
            "coverage/**",
            "test/**",
            "karma.conf.ts",
            "test.webpack.config.js",
            ".github/**",
        ],
    },
];