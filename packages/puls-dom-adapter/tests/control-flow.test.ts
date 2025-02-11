import {PulsDOMAdapter} from "../index";
import {createTemplateFunction} from "pulsjs-template";

const html = createTemplateFunction()
test('dom-control-flow-if-true', () => {
    const d = new PulsDOMAdapter(html`
        <div :if=${true}>
            Hello World
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})
test('dom-control-flow-if-false expects none', () => {
    const d = new PulsDOMAdapter(html`
        <div :if=${false}>
            Hello World
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})
test('dom-control-flow-if-else-1 expects 0', () => {
    const d = new PulsDOMAdapter(html`
        <div>
            <div :if=${true}>
                Hello World
            </div>
            <div :else>
                Hello World 2
            </div>
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})
test('dom-control-flow-if-else-2 expects 2', () => {
    const d = new PulsDOMAdapter(html`
        <div>
            <div :if=${false}>
                Hello World
            </div>
            <div :else>
                Hello World 2
            </div>
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})
test('dom-control-flow-if-else-if-1 expects 0', () => {
    const d = new PulsDOMAdapter(html`
        <div>
            <div :if=${true}>
                Hello World
            </div>
            <div :else-if=${false}>
                Hello World 2
            </div>
            <div :else>
                Hello World 3
            </div>
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})
test('dom-control-flow-if-else-if-2 expects 0', () => {
    const d = new PulsDOMAdapter(html`
        <div>
            <div :if=${true}>
                Hello World
            </div>
            <div :else-if=${true}>
                Hello World 2
            </div>
            <div :else>
                Hello World 3
            </div>
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})
test('dom-control-flow-if-else-if-3 expects 2', () => {
    const d = new PulsDOMAdapter(html`
        <div>
        <div :if=${false}>
            Hello World
        </div>
        <div :else-if=${true}>
            Hello World 2
        </div>
        <div :else>
            Hello World 3
        </div>
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})
test('dom-control-flow-if-else-if-4 expects 3', () => {
    const d = new PulsDOMAdapter(html`
        <div>
        <div :if=${false}>
            Hello World
        </div>
        <div :else-if=${false}>
            Hello World 2
        </div>
        <div :else>
            Hello World 3
        </div>
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})
test('dom-control-flow-if-else-if-5 expects 2', () => {
    const d = new PulsDOMAdapter(html`
        <div>
        <div :if=${false}>
            Hello World
        </div>
        <div :else-if=${true}>
            Hello World 2
        </div>
        <div :else-if=${true}>
            Hello World 3
        </div>
        <div :else>
            Hello World 4
        </div>
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})

test('dom-control-flow-if-else-if-6 expects 3', () => {
    const d = new PulsDOMAdapter(html`
        <div>
        <div :if=${false}>
            Hello World
        </div>
        <div :else-if=${false}>
            Hello World 2
        </div>
        <div :else-if=${true}>
            Hello World 3
        </div>
        <div :else>
            Hello World 4
        </div>
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})
