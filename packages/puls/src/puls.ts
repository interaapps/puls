import {PulsHookedDOMAdapter} from "pulsjs-dom-adapter";
import {createTemplateFunction, ParserOutput, TemplateParser} from "pulsjs-template";
import {PulsAdapter} from "pulsjs-adapter";

export function createPuls<T>({
    // @ts-ignore
    adapter = PulsHookedDOMAdapter,
}: {
    adapter: null|(new (val: ParserOutput[]) => PulsAdapter<any>)
}) {
    if (!adapter) throw new Error('No adapter provided')

    const parser = createTemplateFunction(TemplateParser)

    return {

        html(parts: TemplateStringsArray, ...values: any) : T {
            return new adapter(parser(parts, ...values).parse()).render() as T
        }
    }
}