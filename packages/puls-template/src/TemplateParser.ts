import {ParserAttribute, ParserOutput, ParserTag} from "./parser-types";
import {TemplateParserBase} from "./TemplateParserBase";

export class TemplateParser extends TemplateParserBase {
    autoCloseTags = ['hr', 'br', 'input', 'img', 'meta', 'link', 'wbr', 'source', 'keygen', 'spacer', 'isindex', 'track', 'param', 'embed', 'base', 'area', 'col', '!doctype']

    readTag(): ParserTag|null {
        let tag: ParserTag = { type: 'element', tag: '', attributes: [], body: [], from: this.index, to: 0 }
        let opened = false
        let tagNameOpened = true
        let closingTag = false
        let i = 0
        while (this.hasNext()) {
            const index = i++

            const {type, value} = this.get()

            if (!opened) {
                if (tagNameOpened) {
                    if (this.isWhiteSpace(value)) {
                        tag.attributes = this.readAttributes()

                        if (this.get().value === '>') {
                            tagNameOpened = false
                            continue
                        }

                        if (this.nextIs('/>')) {
                            this.next(2)
                            break
                        }
                    } else if (value === '>') {
                        tagNameOpened = false
                        continue
                    } else if (type === 'value') {
                        tag.tag = value
                    } else if (value !== '<') {
                        tag.tag += value
                    }
                }


                if (value === '>') {
                    if (typeof tag.tag === 'string' && this.autoCloseTags.includes(tag.tag.toLowerCase())) {
                        this.next()
                        break
                    }
                    opened = true
                }
            } else if (closingTag) {
                break
            } else {
                tag.body = this.readContent(['script', 'style'].includes(tag.tag as string), tag)
                closingTag = true
                this.next()
                break
            }

            this.next()
        }

        tag.to = this.index

        if (this.filterElements && !this.filterElements(tag)) {
            return null
        }

        return tag
    }

    isClosingTag(tag: ParserTag, ind = -1) {
        const index = this.index - ind
        const next = `</`

        // TODO: Check why -1 is needed
        if (this.nextIs(next, ind)) {
            let isEnding = false
            const afterClosingSlash = this.get(index + 2)

            if (afterClosingSlash.type === 'value') {
                if (afterClosingSlash.value === tag.tag) {
                    isEnding = true
                    tag.attributes.push(['slot', tag.body])
                    this.next()
                }
            } else {
                if (typeof tag.tag === 'string' && !this.nextIs(tag.tag)) {
                    isEnding = true
                    this.next(tag.tag.length)
                }
            }

            if (isEnding) {
                this.next(next.length - 1)
                this.skipEmpty()
                // Skipping >
                this.next()
            }

            return isEnding
        }
        return false
    }

    readAttributes(): ParserAttribute[] {
        const attributes: ParserAttribute[] = []
        let inAttribute = false

        while (this.hasNext()) {
            this.skipEmpty()
            const {type, value} = this.get()

            if (value === '>' || value === '/') {
                break;
            } else {
                const {name, value: attrValue} = this.readAttribute()
                attributes.push([name, attrValue])

                if (this.get().value === '>' || (this.get().value === '/' && this.get(this.index + 1)?.value === '>')) {
                    break;
                }
            }

            this.next()
        }
        return attributes
    }

    readAttribute(): {name: string, value: any, isLast: boolean, from: number, to: number} {
        const out = {name: '', value: true, isLast: false, from: this.index, to: 0}

        let hasReadName = false
        let hasReadEquals = false
        let foundValue = false

        while (this.hasNext()) {
            this.skipEmpty()
            const {type, value} = this.get()

            if (value === '>')
                break

            if (!hasReadName) {
                let doBreak = false

                if (type === 'value') {
                    out.name = value
                    hasReadName = true
                    continue
                }

                let [{value: name}] = this.readUntil(({type, value}) => {
                    if (value === '>') {
                        doBreak = true
                        out.isLast = true
                        return true
                    }
                    if (value === '=' || this.isWhiteSpace(value)) {
                        if (value === '=') {
                            return true
                        }

                        let i = this.index
                        while (this.get(i) && this.isWhiteSpace(this.get(i).value)) {
                            i++
                        }
                        if (this.get(i).value !== '=') {
                            doBreak = true
                            return true
                        }
                    }
                })

                if (name === '>') break

                if (!out.name)
                    out.name = name.trim()
                if (doBreak) break
                hasReadName = true
                continue
            } else if (!hasReadEquals) {
                if (value !== '=' || value === '>') {
                    break
                }
                hasReadEquals = true
            } else {
                if (type === 'value') {
                    out.value = value
                    this.next()
                    break
                } else if (!foundValue) {
                    let opened = false
                    let val = ''
                    let opener = ''
                    let i = 0

                    let [{value}] = this.readUntil(({type, value}) => {
                        let doNotAdd = false

                        if (i++ === 0) {

                            // attribute=${...} with inner spacing and quotes
                            if (this.nextIs('${')) {
                                this.next()

                                val += value + this.readUntilEndingBrace()
                                doNotAdd = true
                            }
                            if (value === '"' || value === "'")
                                opener = value
                            else
                                opener = ' '
                        }

                        if (opener === ' ' && (this.isWhiteSpace(value) || value === '>' || this.nextIs('/>'))) {
                            return true
                        }

                        if (opener !== ' ' && value === opener) {
                            if (opened) {
                                return true
                            }
                            opened = true
                        }
                        if (!doNotAdd)
                            val += value
                    })

                    out.value = opener === ' ' ? value : value.substring(1)
                    break
                }
            }

            this.next()
        }

        out.to = this.index
        return out
    }

    shipComment() {
        if (this.nextIs('<!--')) {
            while (this.hasNext()) {
                if (this.nextIs('-->')) {
                    this.next(3)
                    break;
                }
                this.next()
            }
            return true
        }
        return false
    }

    readContent(ignoreTags = false, tag: ParserTag|false = false): ParserOutput[] {
        const contents: ParserOutput[] = []
        let currentString = ''
        this.skipEmpty()
        while (this.hasNext()) {
            const { type, value } = this.get()

            if (type === 'char') {
                if (value === '<' && !this.isWhiteSpace(this.get(this.index + 1)?.value)) {
                    const currentIndex = this.index
                    if (tag !== false && this.isClosingTag(tag, 0)) {
                        break
                    } else {
                        this.index = currentIndex
                        if (ignoreTags) {
                            currentString += '<'
                            this.next()
                            continue
                        }
                    }

                    if (currentString !== '') {
                        contents.push({type: 'text', value: currentString})
                        currentString = ''
                    }

                    if (this.shipComment()) continue

                    const newTag = this.readTag()
                    if (newTag !== null)
                        contents.push(newTag)
                    this.skipEmpty()
                    continue
                }

            } else {
                if (currentString !== '') {
                    contents.push({type: 'text', value: currentString})
                    currentString = ''
                }
                contents.push({type, value})
                this.next()
                continue
            }
            currentString += value

            this.next()
        }

        if (currentString !== '') {
            contents.push({type: 'text', value: currentString})
        }

        return contents
    }
}