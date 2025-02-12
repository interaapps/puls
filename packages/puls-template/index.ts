import {TemplateParser} from "./src/TemplateParser";
import {TemplateParserBase} from "./src/TemplateParserBase";
export { TemplateParser } from './src/TemplateParser';
export { TemplateParserBase } from './src/TemplateParserBase';
export * from './src/parser-types';

export function templateStringParse(parser: TemplateParserBase, parts: TemplateStringsArray, ...values: any) {
    let valuesIndex = 0
    for (const part of parts) {
        for (const item of part.split('')) {
            parser.elements.push({
                type: 'char',
                value: item
            })
        }
        if (valuesIndex < values.length) {
            parser.elements.push({
                type: 'value',
                value: values[valuesIndex]
            })
            valuesIndex++
        }
    }
    return parser
}

export function createTemplateFunction(parserClass: new () => TemplateParserBase = TemplateParser) {
    return (parts: TemplateStringsArray, ...values: any) => {
        const parser = new parserClass()

        let valuesIndex = 0
        for (const part of parts) {
            for (const item of part.split('')) {
                parser.elements.push({
                    type: 'char',
                    value: item
                })
            }
            if (valuesIndex < values.length) {
                parser.elements.push({
                    type: 'value',
                    value: values[valuesIndex]
                })
                valuesIndex++
            }
        }
        return parser
    }
}