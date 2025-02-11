import {PulsHookedDOMAdapter} from "../index";
import {createTemplateFunction} from "pulsjs-template";
import {state} from "pulsjs-state";

const html = createTemplateFunction()
test('dom-control-hook-flow-if-true expects shown', () => {
    const v = state(false)
    const d = new PulsHookedDOMAdapter(html`
        <div>
            <div :if=${v}>
                Hello World
            </div>
        </div>
    `.parse())

    const [el] = d.render()
    v.value = true

    expect(el).toMatchSnapshot()
})
test('dom-control-hook-flow-if-false expects hidden', () => {
    const v = state(true)
    const d = new PulsHookedDOMAdapter(html`
        <div>
            <div :if=${v}>
                Hello World
            </div>
        </div>
    `.parse())

    const [el] = d.render()
    v.value = false

    expect(el).toMatchSnapshot()
})
test('dom-control-hook-flow-if-false-stay expects hidden', () => {
    const v = state(false)
    const d = new PulsHookedDOMAdapter(html`
        <div>
            <div :if=${v}>
                Hello World
            </div>
        </div>
    `.parse())

    const [el] = d.render()
    v.value = false

    expect(el).toMatchSnapshot()
})
test('dom-control-hook-flow-if-false-stay initial hidden', () => {
    const v = state(false)
    const d = new PulsHookedDOMAdapter(html`
        <div>
            <div :if=${v}>
                Hello World
            </div>
        </div>
    `.parse())
    const [el] = d.render()
    expect(el).toMatchSnapshot()
})

test('dom-control-hook-flow-else-if-true expects 1', () => {
    const v = state(true)
    const d = new PulsHookedDOMAdapter(html`
        <div>
            <div :if=${v}>
                Hello World 0
            </div>
            <div :else>
                Hello World 1
            </div>
        </div>
    `.parse())

    const [el] = d.render()
    v.value = false

    expect(el).toMatchSnapshot()
})


test('dom-control-hook-flow-else-if-true expects 0', () => {
    const v = state(true)
    const d = new PulsHookedDOMAdapter(html`
        <div>
            <div :if=${v}>
                Hello World 0
            </div>
            <div :else>
                Hello World 1
            </div>
        </div>
    `.parse())

    const [el] = d.render()
    v.value = true

    expect(el).toMatchSnapshot()
})



test('dom-control-flow-if-true-inline-computed expects shown', () => {
    const v = state('a')
    const d = new PulsHookedDOMAdapter(html`
        <div>
            <div :if=${() => v.value === 'a'}>
                Hello World
            </div>
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})
test('dom-control-flow-if-fals-inline-computed expects hidden', () => {
    const v = state('a')
    const d = new PulsHookedDOMAdapter(html`
        <div>
            <div :if=${() => v.value !== 'a'}>
                Hello World
            </div>
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})