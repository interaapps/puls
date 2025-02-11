import sass from 'sass'

const saved = new Map<number, string>()

function hash(str: string) {
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}

export function scss(strings: TemplateStringsArray, ...values: any[]) {
    let out = ''
    let i = 0
    for (const str of strings) {
        out += str
        if (values[i]) {
            out += values[i]
            i++
        }
    }

    const hashed = hash(out)
    if (!saved.has(hashed)) {
        saved.set(hashed, sass.compileString(out).css)
    }

    return saved.get(hashed)
}