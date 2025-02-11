import picocolors from "picocolors";
import prompts from "prompts"
import minimist from "minimist"
import * as path from "node:path";
import { fileURLToPath } from 'node:url'
import * as fs from "node:fs";

const {
    blue,
    blueBright,
    cyan,
    gray,
    green,
    greenBright,
    magenta,
    red,
    redBright,
    reset,
    yellow,
} = picocolors
const argv = minimist<{
    dev?: boolean
}>(process.argv.slice(2), {
    default: { help: false },
    alias: {
        dev: ['d'],
    },
    string: ['_'],
})

const cwd = process.cwd()
const targetDir = argv._[0]
const root = path.join(cwd, targetDir)


function copyDir(srcDir: string, destDir: string) {
    fs.mkdirSync(destDir, { recursive: true })
    for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.resolve(srcDir, file)
        const destFile = path.resolve(destDir, file)
        copy(srcFile, destFile)
    }
}
function copy(src: string, dest: string) {
    const stat = fs.statSync(src)
    if (stat.isDirectory()) {
        copyDir(src, dest)
    } else {
        fs.copyFileSync(src, dest)
    }
}

async function main() {
    const { language } = await prompts([
        {
            type: 'select',
            name: 'language',
            message: 'Pick Language',
            choices: [
                { title: 'Typescript', value: 'template-ts' },
                { title: 'Javascript', value: 'template-js' }
            ],
        }
    ])

    const templateDir = path.resolve(
        __dirname + (argv.dev ? '/packages/create-puls' : '/create-pulsjs'),
        '../..',
        language,
    )

    copy(templateDir, root)

    console.log(`
    Created project! 🎉
    
    ${green('$')} ${cyan('cd')} ${targetDir}
    ${green('$')} ${cyan('npm install')}
    ${green('$')} ${cyan('npm run dev')}
`)
}
main()