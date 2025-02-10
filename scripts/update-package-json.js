import fs from "fs";
import path from "path";

const packagesDir = "packages";

const workspaces = fs.readdirSync(packagesDir).filter((pkg) =>
    fs.existsSync(path.join(packagesDir, pkg, "index.ts"))
);

const mainPackageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));

workspaces.forEach((pkg) => {
    const pkgJsonPath = path.join(packagesDir, pkg, "package.json");

    if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
        pkgJson.main = 'dist/index.js';
        pkgJson.module = 'dist/index.mjs';
        pkgJson.version = mainPackageJson.version;
        pkgJson.exports = {
            ".": {
                "import": {
                    "types": "./dist/index.d.mts",
                    "node": "./dist/index.mjs",
                    "default": "./dist/index.mjs"
                },
                "require": {
                    "types": "./dist/index.d.ts",
                    "node": "./dist/index.js",
                    "default": "./dist/index.js"
                },
                "default": "index.ts"
            }
        };

        pkgJson.unpkg = 'dist/index.browser.js'
        pkgJson.jsdelivr = 'dist/index.browser.js'

        pkgJson.author = "Julian Gojani"
        pkgJson.license = "MIT"
        pkgJson.repository = {
            "type": "git",
            "url": "git+https://github.com/interaapps/puls.git"
        };
        pkgJson.files = [
            "dist/",
            "package.json"
        ]
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");
        console.log(`✅ Updated ${pkgJsonPath}`);
    }
});

console.log("🚀 All package.json files updated!");