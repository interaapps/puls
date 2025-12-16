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

    const parser = createTemplateFunction(TemplateParser)

    const ret = {
        parser,
        templateParser,
        adapter,
        html(parts: TemplateStringsArray, ...values: any) : T {
            if (!ret.adapter) throw new Error('No adapter provided');
            return new ret.adapter(parser(parts, ...values).parse()).render() as T
        }
    }

    return ret
}