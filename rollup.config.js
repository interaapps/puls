import path from "path";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import fs from "fs";
import dts from "rollup-plugin-dts";
import { terser } from "rollup-plugin-terser"; // Optional for minification

const packagesDir = "packages"; // Adjust if your workspaces are elsewhere
const distDir = "dist";

// Get all workspaces with an index.ts entry
const workspaces = fs
    .readdirSync(packagesDir)
    .filter((pkg) => fs.existsSync(path.join(packagesDir, pkg, "index.ts")));

workspaces.forEach((pkg) => {
    const distPath = path.join(packagesDir, pkg, "dist");
    if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
        console.log(`🗑️  Deleted ${distPath}`);
    }
});

const configs = workspaces.map((pkg) => ([
    // Commonjs
    {
        input: path.join(packagesDir, pkg, "index.ts"),
        output: {
            dir: path.join(packagesDir, pkg, distDir),
            format: "cjs",
            sourcemap: true,
            preserveModules: true,
            preserveModulesRoot: path.join(packagesDir, pkg), // ✅ Fixes imports
            entryFileNames: "[name].js", // ✅ Ensures the output files have `.mjs`
        },
        plugins: [resolve({
            extensions: [".ts", ".tsx", ".js", ".json"],
        }),
            commonjs({ transformMixedEsModules: true }),
            typescript({
                compilerOptions: {
                    module: "ESNext",
                    moduleResolution: "node",
                    declaration: false, // Set true if you want .d.ts
                    esModuleInterop: false,
                    importHelpers: false,
                },
            }),
        ],
        external: (id) => !id.startsWith(".") && !id.startsWith('packages') && !path.isAbsolute(id), // Exclude external dependencies
    },

    // Browser export
    {
        input: path.join(packagesDir, pkg, "index.ts"),
        output: {
            file: path.join(packagesDir, pkg, distDir, "index.global.js"),
            format: "iife",
            name: pkg.replaceAll('-', ''),
            sourcemap: true,
            globals: {
                // Explicitly define global dependencies if necessary
            },
        },
        plugins: [
            resolve({ browser: true, preferBuiltins: false }), // Ensure all dependencies are bundled
            commonjs({ requireReturnsDefault: "auto" }), // Convert CJS to ESM properly
            typescript({
                compilerOptions: {
                    module: "ESNext",
                    moduleResolution: "node",
                    esModuleInterop: true, // Ensures compatibility with CJS modules
                    importHelpers: false, // Prevents tslib from being imported
                    noEmitHelpers: true, // Avoids extra helper imports
                },
            }),
            terser(), // Minifies the output
        ],
        external: [], // 🚀 Ensures all dependencies are bundled inside
    },

    // ESM Output
    {
        input: path.join(packagesDir, pkg, "index.ts"),
        output: {
            dir: path.join(packagesDir, pkg, distDir),
            format: "es", // Ensure ESM format (import/export)
            sourcemap: true,
            preserveModules: true,
            preserveModulesRoot: path.join(packagesDir, pkg), // ✅ Fixes imports
            entryFileNames: "[name].mjs", // ✅ Ensures the output files have `.mjs`
        },
        plugins: [
            resolve({ extensions: [".ts", ".tsx", ".mjs", ".js", ".json"] }),
            typescript({
                compilerOptions: {
                    module: "ESNext", // Ensure ES module output
                    moduleResolution: "node",
                    declaration: false, // Set to true if you want .d.ts files
                    esModuleInterop: false, // Avoids unnecessary __importDefault wrappers
                    importHelpers: false, // Avoids tslib imports
                },
            }),
        ],
        external: (id) => !id.startsWith(".") && !path.isAbsolute(id), // Keep external dependencies as ESM
    },
    {
        input: path.join(packagesDir, pkg, "index.ts"),
        output: {
            file: path.join(packagesDir, pkg, distDir, "index.d.ts"),
            format: "es"
        },
        plugins: [dts()],
        external: (id) => !id.startsWith(".") && !id.startsWith('packages') && !path.isAbsolute(id), // Exclude external dependencies
    },
    {
        input: path.join(packagesDir, pkg, "index.ts"),
        output: {
            file: path.join(packagesDir, pkg, distDir, "index.d.mts"),
            format: "es"
        },
        plugins: [dts()],
        external: (id) => !id.startsWith(".") && !id.startsWith('packages') && !path.isAbsolute(id), // Exclude external dependencies
    }
]));

export default configs.flat();
