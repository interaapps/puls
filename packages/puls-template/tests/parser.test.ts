import TemplateParser from "../src/TemplateParser";

test('parser-text', () => {
    expect((TemplateParser.fromTemplate`Hello`).parse()).toMatchSnapshot()
})

test('parser-h1-element', () => {
    expect(TemplateParser.fromTemplate`<h1>Hello World!</h1>`.parse()).toMatchSnapshot()
})

test('parser-attributes', () => {
    expect(TemplateParser.fromTemplate`<h1 id="title" class="Hello World">Hello World!</h1>`.parse()).toMatchSnapshot()
})

test('parser-full-html', () => {
    expect(TemplateParser.fromTemplate`
        <!doctype html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
                     <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
                                 <meta http-equiv="X-UA-Compatible" content="ie=edge">
                     <title>Document</title>
        </head>
        <body>
          <h1>Hello World!</h1>
        </body>
    </html>`.parse()).toMatchSnapshot()
})

test('parser-interpolation-attributes', () => {
    const a = () => alert('test')
    expect(TemplateParser.fromTemplate`
        <div id=${'hello-world'}>I'm a div</div>
    `.parse()).toMatchSnapshot()
})

test('parser-function-attributes', () => {
    const a = () => alert('test')
    expect(TemplateParser.fromTemplate`
        <button @click=${a}>Click me</button>
    `.parse()).toMatchSnapshot()
})