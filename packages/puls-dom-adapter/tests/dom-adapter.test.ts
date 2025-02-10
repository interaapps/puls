import {PulsDOMAdapter} from "../index";
import {createTemplateFunction} from "pulsjs-template";

const html = createTemplateFunction()
test('dom-adapter-test', () => {
    const d = new PulsDOMAdapter(html`test`.parse())

    const [el] = d.render()
    expect(el.textContent).toMatchSnapshot()
})

test('dom-adapter-full', () => {
    const d = new PulsDOMAdapter(html`
        <div>
            <h1>Hello, World!</h1>
            <p>${'test'}</p>
        </div>
    `.parse())

    const [div] = d.render()
    expect((div as HTMLElement).innerHTML).toMatchSnapshot()
})