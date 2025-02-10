import {PulsDOMAdapter} from "../src/PulsDOMAdapter";
import {TemplateParser} from "pulsjs-template";

test('dom-adapter-test', () => {
    const d = new PulsDOMAdapter(TemplateParser.fromTemplate`test`.parse())

    const [el] = d.render()
    expect(el.textContent).toMatchSnapshot()
})

test('dom-adapter-full', () => {
    const d = new PulsDOMAdapter(TemplateParser.fromTemplate`
        <div>
            <h1>Hello, World!</h1>
            <p>${'test'}</p>
        </div>
    `.parse())

    const [div] = d.render()
    expect((div as HTMLElement).innerHTML).toMatchSnapshot()
})