import {css} from "../index";

test('test-correct-css', () => {
    expect(css`* {value: #000}`).toBe('* {value: #000}')
})

test('test-correct-css-intpl', () => {
    expect(css`* {value: ${'#000'}}`).toBe('* {value: #000}')
})