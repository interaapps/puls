import path from "path";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import fs from "fs";
import dts from "rollup-plugin-dts";
import { terser } from "rollup-plugin-terser"; // Optional for minification

const packagesDir = "packages"; // Adjust if your workspaces are elsewhere
const distDir = "dist";


const workspaces = fs
    .readdirSync(packagesDir)
    .filter((pkg) => fs.existsSync(path.join(packagesDir, pkg, "index.ts")));

const packageJsons = workspaces.reduce((acc, pkg) => {
    const packageJsonPath = path.join(packagesDir, pkg, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    acc[pkg] = packageJson;
    return acc;
}, {});

// Build a dependency graph based on package.json dependencies
function buildDependencyGraph() {
    const graph = {};

    // Create a graph where each package points to its dependencies
    for (const pkg of workspaces) {
        graph[pkg] = Object.keys(packageJsons[pkg].dependencies || {});
    }

    return graph;
}

// Topological sort (using Kahn's algorithm) to determine the correct build order
function topologicalSort(graph) {
    const sorted = [];
    const visited = new Set();
    const tempMark = new Set();

    function visit(pkg) {
        if (tempMark.has(pkg)) {
            throw new Error(`Circular dependency detected: ${pkg}`);
        }
        if (!visited.has(pkg)) {
            tempMark.add(pkg);
            for (const dep of graph[pkg] || []) {
                visit(dep);
            }
            tempMark.delete(pkg);
            visited.add(pkg);
            sorted.push(pkg);
        }
    }

    for (const pkg of workspaces) {
        visit(pkg);
    }

    return sorted.reverse(); // Reverse to get the correct order
}

const dependencyGraph = buildDependencyGraph();
const sortedWorkspaces = topologicalSort(dependencyGraph).filter((pkg) => workspaces.includes(pkg));

console.log(sortedWorkspaces)

const configs = [
    ...sortedWorkspaces.map((pkg) => ([
        {
            input: path.join(packagesDir, pkg, "index.ts"),
            output: {
                file: path.join(packagesDir, pkg, distDir, "index.d.ts"),
                format: "es"
            },
            plugins: [dts()]
        },
        {
            input: path.join(packagesDir, pkg, "index.ts"),
            output: {
                file: path.join(packagesDir, pkg, distDir, "index.d.mts"),
                format: "es"
            },
            plugins: [dts()]
        }
    ])),

    ...sortedWorkspaces.map((pkg) => ([
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
        external: (id) => !id.startsWith(".") && !path.isAbsolute(id), // Exclude external dependencies
    },
    {
        input: path.join(packagesDir, pkg, "index.ts"),
        output: {
            file: path.join(packagesDir, pkg, distDir, "index.d.mts"),
            format: "es"
        },
        plugins: [dts()],
        external: (id) => !id.startsWith(".") && !path.isAbsolute(id), // Exclude external dependencies
    },
])),

    ...sortedWorkspaces.map((pkg) => ([

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
    ]))
];

export default configs.flat();
