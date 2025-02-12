import {
    ParserOutput,
    ParserTag,
    ParserText,
    TemplateParser,
    templateStringParse
} from "pulsjs-template";
import fs from "node:fs";

class RealValue {
    constructor(public value?: any) {
    }
}

function parseTemplateString(input: string) {
    let strings = [];
    let values = [];
    let buffer = "";
    let insideExpression = false;
    let insideString = false;
    let braceCount = 0;

    for (let i = 0; i < input.length; i++) {
        if (!insideExpression) {
            if (input[i] === "$" && input[i + 1] === "{") {
                strings.push(buffer);
                buffer = "";
                insideExpression = true;
                braceCount = 1;
                i++; // Skip "{"
            } else if (input[i] === "\\" && input[i + 1] === "$" && input[i + 2] === "{") {
                buffer += "${";
                i += 2;
            } else {
                buffer += input[i];
            }
        } else {
            if (input[i] === "\"" || input[i] === "'" || input[i] === "`") {
                insideString = !insideString;
            } else if (insideString) {
                buffer += input[i];
                continue;
            } else if (input[i] === "{") {
                braceCount++;
            } else if (input[i] === "}") {
                braceCount--;
                if (braceCount === 0) {
                    values.push(buffer); // If eval fails, keep it as string
                    buffer = "";
                    insideExpression = false;
                    continue;
                }
            }
            buffer += input[i];
        }
    }

    strings.push(buffer);

    return [strings, values.map(v => new RealValue(v))];
}

function resolve(value: any) {
    return value instanceof RealValue ? value.value : JSON.stringify(value)
}
function exportOutput(second: ParserOutput[]) {
    let out = '['
    for (const item of second) {
        if (item.type === 'text') {
            out += `{type: "text", value: ${resolve(item.value)}},`
        } else if (item.type === 'element') {
            out += '{type: "element", tag: ' + resolve(item.tag) + ', body: ' + exportOutput(item.body) + `, attributes: [${
                item.attributes
                    .map(([key, value]) => ([key, resolve(value)]))
                    .map(([key, value]) => `[${JSON.stringify(key)}, ${value}]`)
                    .join(', ')
            }]},`
        } else if (item.type === 'value') {
            out += '{type: "value", value: ' + item.value.value + '},'
        }
    }
    return out + ']';
}

export async function compile(r: string) {
    const templateParser = new TemplateParser();
    let scriptTag = '';
    let other = '';
    let extractedImports = '';
    let hasHtmlImport = false;

    const promises: Promise<void>[] = []

    templateParser.filterElements = (e: ParserTag) => {
        if (e.tag === 'script') {
            promises.push(new Promise<void>(async (res) => {
                const lang = e.attributes.find(([k]) => k === 'lang')?.[1]

                let scriptValue = (e.body[0] as ParserText).value
                if (lang === 'ts') {
                    const ts = await import('typescript')
                    const { outputText } = ts.transpileModule(scriptValue, {
                        compilerOptions: {
                            experimentalDecorators: true,
                            module: ts.ModuleKind.ESNext,
                            target: ts.ScriptTarget.ESNext,
                            moduleResolution: ts.ModuleResolutionKind.NodeJs,
                            esModuleInterop: true,
                        }
                    })
                    scriptValue = outputText;
                }
                scriptTag = scriptValue;

                const importRegex = /import\s+(((?:type\s+)?(?:\*\s+as\s+\w+|{[^}]+}|\w+)\s+from\s+['"][^'"]+['"](?:\s+with\s+{[^}]+})?\s*)|(['"][^'"]+['"]));?/g;
                const imports = scriptTag.match(importRegex) || [];

                hasHtmlImport = imports.some(i => /import\s+.*\bhtml\b.*from\s+['"]pulsInstance['"]/.test(i));

                extractedImports = imports.join('\n');
                scriptTag = scriptTag.replace(importRegex, '').trim();

                other = r.substring(0, e.from) + r.substring(e.to);
                res()
            }))
            return true;
        }
        return true;
    };

    templateStringParse(templateParser, [r] as any).parse();
    await Promise.all(promises)

    const [strings, values] = parseTemplateString(other)
    const second = templateStringParse(new TemplateParser(), strings as any, ...values).parse();

    return `${extractedImports}${hasHtmlImport ? '' : "\nimport { pulsInstance } from 'pulsjs';"}\n\nexport default ($props = {}) => {
    \n    ${scriptTag}\n    \n    return (new pulsInstance.adapter(${exportOutput(second)})).render();
}`;
}


export async function pulsPlugin() {
    return {
        name: 'vite-plugin-puls',
        transform: async (code: any, id: any) => {
            if (!id.endsWith('.puls')) return null;
            fs.writeFileSync('ex', code)

            return {
                code: await compile(code),
            }
        }
    }
}
