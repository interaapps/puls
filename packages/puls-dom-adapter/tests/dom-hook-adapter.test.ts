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

    expect(div).toMatchSnapshot()
})

test('dom-hook-adapter-complex-html', () => {
    const d = new PulsHookedDOMAdapter(html`
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
    `.parse())

    const [el] = d.render()
    expect(el).toMatchSnapshot()
})
