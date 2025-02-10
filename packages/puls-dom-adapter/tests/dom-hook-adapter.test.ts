import {TemplateParser} from "pulsjs-template";
import {PulsHookedDOMAdapter} from "../src/PulsHookedDOMAdapter";
import {state} from "pulsjs-state";

test('dom-hook-adapter-test', () => {
    const d = new PulsHookedDOMAdapter(TemplateParser.fromTemplate`test`.parse())

    const [el] = d.render()
    expect(el.textContent).toMatchSnapshot()
})

test('dom-hook-adapter-full', () => {
    const name = state('test')

    const d = new PulsHookedDOMAdapter(TemplateParser.fromTemplate`
        <div>
            <h1>Hello, World!</h1>
            <p>${name}</p>
        </div>
    `.parse())
    
    const [div] = d.render()

    name.value = 'John'

    expect((div as HTMLElement).innerHTML).toMatchSnapshot()
})