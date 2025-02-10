export function css(strings: TemplateStringsArray, ...values: any[]) {
    let out = ''
    let i = 0
    for (const str of strings) {
        out += str
        if (values[i]) {
            out += values[i]
            i++
        }
    }
    return out
}