import {ParserElement, ParserOutput} from "./parser-types";

export abstract class TemplateParserBase {
    index = 0
    elements: ParserElement[] = []

    isWhiteSpace(c: any) {
        if (c === undefined) return false
        if (typeof c !== 'string') return false
        return c === '\n' || c === ' ' || c === '\t' || c === '\v' || c === '\f'
    }

    get(index = this.index) {
        return this.elements[index]
    }

    next(i = 1) {
        this.index += i
    }


    readUntil(callable: (opt: {type: 'value' | 'char', value: any}) => any) {
        let out = []
        let currentStr = ''
        while (this.hasNext()) {
            const { type, value } = this.get()

            if (callable({ type, value })) {
                if (currentStr !== '')
                    out.push({type: 'text', value: currentStr})
                break
            }

            if (type === 'char') {
                currentStr += value
            } else {
                if (currentStr !== '') {
                    out.push({type: 'text', value: currentStr})
                    currentStr = ''
                }
                out.push({ type, value })
            }

            this.next()
        }
        return out
    }


    skipEmpty() {
        while (this.hasNext() && (this.isWhiteSpace(this.get().value))) {
            this.next()
        }
    }

    nextIs(string: string, startInd = 0) {
        const split = string.split('')

        for (let indStr in split) {
            const ind = parseInt(indStr)

            const current = this.get(this.index + ind + startInd)

            if (current === undefined) return false
            const {type, value} = current

            if (value !== split[ind])
                return false
        }

        return true
    }

    hasNext() {
        return this.elements.length > this.index
    }

    abstract readContent(): ParserOutput[]

    parse(): ParserOutput[] {
        const contents = this.readContent()
        this.index = 0
        return contents
    }

}