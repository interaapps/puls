import fs from "fs";
import path from "path";

const packagesDir = "packages";

const workspaces = fs.readdirSync(packagesDir).filter((pkg) =>
    fs.existsSync(path.join(packagesDir, pkg, "index.ts"))
);

const mainPackageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));

const testingLocally = process.argv.includes('localtesting')

if (testingLocally) console.warn("🚨 Testing locally, not updating package.json files");

workspaces.forEach((pkg) => {
    const pkgJsonPath = path.join(packagesDir, pkg, "package.json");

    if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));

        if (testingLocally) {
            pkgJson.main = 'index.ts';
            pkgJson.module = undefined
            pkgJson.exports = undefined;
            pkgJson.files = ["index.ts", "package.json"]
        } else {
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

            pkgJson.unpkg = 'dist/index.global.js'
            pkgJson.jsdelivr = 'dist/index.global.js'

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
        }
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");
        console.log(`✅ Updated ${pkgJsonPath}`);
    }
});
if (testingLocally) console.warn("🚨 Testing locally, not updating package.json files");
console.log("🚀 All package.json files updated!");