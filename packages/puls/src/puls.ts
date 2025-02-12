import {PulsHookedDOMAdapter} from "pulsjs-dom-adapter";
import {createTemplateFunction, ParserOutput, TemplateParserBase, TemplateParser} from "pulsjs-template";
import {PulsAdapter} from "pulsjs-adapter";

export function createPuls<T>({
    // @ts-ignore
    adapter = PulsHookedDOMAdapter,
    templateParser = TemplateParser
}: {
    adapter?: null|(new (val: ParserOutput[]) => PulsAdapter<any>),
    templateParser?: new () => TemplateParserBase
}) {
    if (!adapter) throw new Error('No adapter provided')

    const parser = createTemplateFunction(TemplateParser)

    return {
        parser,
        templateParser,
        adapter,
        html(parts: TemplateStringsArray, ...values: any) : T {
            return new adapter(parser(parts, ...values).parse()).render() as T
        }
    }
}