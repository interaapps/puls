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
    expect(div).toMatchSnapshot()
})
test('dom-adapter-attribute', () => {
    const d = new PulsDOMAdapter(html`
        <div>
            <h1 
                style=${{
                    color: '#FFF'
                }}
                class=${['text-2xl', 'font-bold']}
                id=${'test'}
                normal-value="hello world"
            >
                Hello, World
                !</h1>
            
        </div>
    `.parse())

    const [div] = d.render()
    expect(div).toMatchSnapshot()
})

test('dom-adapter-complex-html', () => {
    const d = new PulsDOMAdapter(html`
        <div>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
                         <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
                                     <meta http-equiv="X-UA-Compatible" content="ie=edge">
                         <title>Document</title>
            </head>
            <body>
              
            </body>
            </html>
        </div>
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})


test('dom-adapter-nested', () => {
    const d = new PulsDOMAdapter(html`
        <div>
            ${(new PulsDOMAdapter(html`
                <h1>Hello World!</h1>
            `.parse())).render()}
        </div>
    `.parse())

    const [div] = d.render()
    expect(div).toMatchSnapshot()
})

test('dom-adapter-function-components', () => {

    const TestComponent = (props: {name: string}) => new PulsDOMAdapter(html`
        <div>
            Name is <span id="name">${props.name}</span>
        </div>
    `.parse()).render()

    const d = new PulsDOMAdapter(html`
        <div>
            <${TestComponent} name="Jön" />
        </div>
    `.parse())

    const [div] = d.render()
    expect(div).toMatchSnapshot()
})

test('dom-adapter-event-handler', () => {
    let clicked = false;
    const d = new PulsDOMAdapter(html`
        <button @click=${() => clicked = true}>Click Me</button>
    `.parse())

    const [button] = d.render()
    button.dispatchEvent(new Event('click'))

    expect(clicked).toBe(true)
    expect(button).toMatchSnapshot()
})

test('dom-adapter-promise', async () => {
    const promiseValue = new Promise(resolve => setTimeout(() => resolve('Async Loaded!'), 100))
    const d = new PulsDOMAdapter(html`
        <div>
            <p>${promiseValue}</p>
        </div>
    `.parse())

    const [div] = d.render()
    expect(div).toMatchSnapshot()

    await promiseValue
    expect(div).toMatchSnapshot()
})
test('dom-adapter-promise-instant', async () => {
    const promiseValue = new Promise(resolve => setTimeout(() => resolve('Async Loaded!')))
    const d = new PulsDOMAdapter(html`
        <div>
            <p>${promiseValue}</p>
        </div>
    `.parse())

    const [div] = d.render()
    expect(div).toMatchSnapshot()

    await promiseValue
    expect(div).toMatchSnapshot()
})

test('dom-adapter-slots', () => {
    const TestComponent = (props: { $slot?: any }) => new PulsDOMAdapter(html`
        <div>
            <h2>Title</h2>
            ${props.$slot}
        </div>
    `.parse()).render()

    const d = new PulsDOMAdapter(html`
        <div>
            <${TestComponent}>
                <p>Inside the component</p>
            </${TestComponent}>
        </div>
    `.parse())

    const [div] = d.render()
    expect(div).toMatchSnapshot()
})
