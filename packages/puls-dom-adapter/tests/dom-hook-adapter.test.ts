import {createTemplateFunction} from "pulsjs-template";
import {PulsHookedDOMAdapter} from "../index";
import {state} from "pulsjs-state";

const html = createTemplateFunction()
test('dom-hook-adapter-test', () => {
    const d = new PulsHookedDOMAdapter(html`test`.parse())

    const [el] = d.render()
    expect(el.textContent).toMatchSnapshot()
})

test('dom-hook-adapter-full', () => {
    const name = state('test')

    const d = new PulsHookedDOMAdapter(html`
        <div>
            <h1>Hello, World!</h1>
            <p>${name}</p>
        </div>
    `.parse())
    
    const [div] = d.render()

    name.value = 'John'

    expect((div as HTMLElement).innerHTML).toMatchSnapshot()
})