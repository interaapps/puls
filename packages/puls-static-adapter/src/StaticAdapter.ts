import {PulsAdapter} from "pulsjs-adapter";
import {ParserValue, ParserOutput, ParserTag, ParserText} from "pulsjs-template";

export class HTMLValue {
    constructor(public html: any) {}

    toString() {
        return this.html
    }
}

export class StaticAdapter extends PulsAdapter<HTMLValue>{
    getValue(val: any): any {
        if (val instanceof HTMLValue) {
            return val.html
        }

        if (typeof val === 'object' && Array.isArray(val)) {
            return val.map(v => this.getValue(v)).join('')
        }

        if (typeof val === 'string' || typeof val === 'number') {
            return this.escapeHtml(String(val))
        }
    }

    newInstance(p: ParserOutput[]) {
        return new StaticAdapter(p)
    }

    createElement(conf: ParserTag): string|null {
        let el = '';

        if (typeof conf.tag === 'function') {
            return conf.tag(conf.attributes.reduce((acc, [key, value]) => ({...acc, [key]: value}), {}))
        }

        if (typeof conf.tag !== 'string') {
            return null
        }

        if (conf.tag.toLowerCase() === '!doctype')
            return null

        el += `<${conf.tag}`

        Object.entries(conf.attributes).forEach(([_, [key, value]]) => {
            if (key.startsWith('@')) {
                key = `on${key.substring(1)}`
            } else if (key === ':if') {
                if (!this.getValue(value)) return null
            } else if (key === ':bind') {
                value = this.getValue(value)
            }

            el += ` ${this.escapeHtml(key)}="${this.escapeHtml(String(this.getValue(value)))}"`
        })

        el += '>'

        el += this.newInstance(conf.body).render()

        el += `</${conf.tag}>`

        return el
    }

    escapeHtml(unsafe: string) {
        return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
    }

    createText(value: ParserText) {
        return this.escapeHtml(value.value)
    }

    createFromValue(value: ParserValue) {
        return this.getValue(value.value)
    }

    getEvaluatedElement(element: ParserOutput): string[] {
        const elements = []
        if (element.type === 'text') {
            elements.push(this.createText(element))
        } else if (element.type === 'element') {
            elements.push(this.createElement(element))
        } else if (element.type === 'value') {
            let valElements: string|string[] = this.createFromValue(element)

            if (!Array.isArray(valElements))
                valElements = [valElements]

            for (let valElement of valElements) {
                elements.push(valElement)
            }
        }
        return elements.filter(c => c !== null)
    }

    render(): HTMLValue {
        let el = ''

        for (let element of this.parsed) {
            this.getEvaluatedElement(element).forEach(e => {
                if (Array.isArray(e)) {
                    e.forEach(ce => el += ce)
                } else {
                    el += e
                }
            })
        }

        return new HTMLValue(el)
    }
}