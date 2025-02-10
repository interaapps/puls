import { ParserOutput, ParserTag, ParserText, ParserValue } from "pulsjs-template";
import {PulsAdapter} from "pulsjs-adapter";

export type ValueTransformer<T> = {
    type: string,
    test: (value: any) => boolean,
    create: (value: any) => T[],
    set?: (el: [T], value: any) => void
}

export class PulsDOMAdapter extends PulsAdapter<Node[]>{
    documentOverride: Document|null = null

    inSVG = false

    get document(): Document {
        return this.documentOverride ?? window.document
    }

    partTransformers: Record<string, (part: ParserOutput) => any> = {
        'text': (part) => [this.document.createTextNode((part as ParserText).value)],
        'element': (part) => {
            const conf = part as ParserTag
            if (typeof conf.tag === 'function') {
                if ('prototype' in conf.tag && conf.tag.prototype instanceof HTMLElement) {
                    return this.createFromValue(new (conf.tag as CustomElementConstructor)())
                }

                return this.createFromValue((conf.tag as (values: any) => any)({
                    ...conf.attributes
                }))
            } else if (conf.tag.includes('-') && window?.customElements) {
                const customElement = window.customElements.get(conf.tag)
                if (customElement) {
                    return this.createFromValue(new customElement())
                }
            }

            return [this.createElement(part as ParserTag)]
        },
        'value': (part) => this.createFromValue((part as ParserValue).value)
    }

    valueTransformers: ValueTransformer<any>[] = [
        {
            type: 'text',
            test: (value: any) => typeof value === 'string' || typeof value === 'number',
            create: (value: any) => [this.document.createTextNode(value)],
            set: (el, value: any) => el.forEach(e => e.textContent = value)
        } as ValueTransformer<Text>,
        {
            type: 'element',
            test: (value: any) => value instanceof HTMLElement,
            create: (value: any) => [value],
            set: (el, value: any) => el.forEach(e => this.replaceElement(e, value))
        } as ValueTransformer<ChildNode>,
        {
            type: 'array',
            test: (value: any) => Array.isArray(value),
            create: (value: any) => value.map((e: any) => this.createFromValue(e)).flat(),
            set: ((el, value: any) => {
                // @ts-ignore
                el = el.map(e => this.createFromValue(e)).filter(e => e !== undefined).flat()
                value = value.map((e: any) => this.createFromValue(e)).flat()

                value.forEach((e: ChildNode) => {
                    this.beforeElement(el[0] as HTMLElement, e)
                })
                el.forEach(e => this.removeElement(e))

                return value
                /*el = el.map(e => this.createFromValue(e)).filter(e => e !== undefined)
                value = value.map((e: any) => this.createFromValue(e))

                const existingKeys = new Set(el.filter(e => e instanceof HTMLElement).map(e => e.getAttribute('key')));
                const newElements = value.map((e: Node) => {
                    const key = e instanceof HTMLElement ? e.getAttribute('key') || null : null;
                    if (key && existingKeys.has(key)) {
                        const existingElement = el.find(existing => existing instanceof HTMLElement ? existing.getAttribute('key') === key : false);
                        existingElement?.replaceWith(e);
                        return existingElement;
                    }

                    el[0].before(e);
                    return e;
                });
                el.forEach(e => {
                    if (!newElements.includes(e)) {
                        e.remove();
                    }
                });
                return newElements;*/
            })
        } as ValueTransformer<ChildNode>
    ]


    setElementStyle(el: Element, key: string, value: any) {
        // @ts-ignore
        el.style[key] = value
    }

    setElementClass(el: Element, key: string, condition: any) {
        if (condition) {
            el.classList.add(key)
        } else {
            el.classList.remove(key)
        }

    }

    setAttribute(el: Element, key: string, value: any) {
        if (key.startsWith('@')) {
            const eventParts = key.substring(1).split('.')
            const eventName = eventParts.shift()!

            el.addEventListener(eventName, function (e) {
                const target = e.target as HTMLElement
                const path = e.composedPath()

                for (const part of eventParts) {
                    if (part === 'stop') {
                        e.stopPropagation()
                    } else if (part === 'prevent') {
                        e.preventDefault()
                    }
                }

                return value(e)
            })
            return;
        }

        if (key === 'style' && typeof value === 'object') {
            for (const [k, v] of Object.entries(value)) {
                this.setElementStyle(el, k, v)
            }
            return;
        } else if (key === 'class' && typeof value === 'object') {
            for (const [k, v] of Object.entries(value)) {
                this.setElementClass(el, k, v)
            }
            return
        }

        el.setAttribute(key, value)
    }

    createElement(value: ParserTag): Node {
        let el: Element = this.document.createElement(value.tag as string)

        if (value.tag === 'svg' || this.inSVG) {
            el = this.document.createElementNS('http://www.w3.org/2000/svg', value.tag as string)
            this.inSVG = true
        }

        for (const [key, val] of value.attributes) {
            this.setAttribute(el, key, val)
        }

        for (const bodyElement of value.body) {
            this.addPart(bodyElement)
                .forEach(e => this.appendChild(el, e))
        }

        if (value.tag === 'svg') {
            this.inSVG = false
        }

        return el
    }

    createFromValue(value: any): Node[]|undefined {
        return this.valueTransformers
            .find(transformer => transformer.test(value))
            ?.create(value) || value
    }

    addPart(part: ParserOutput): Node[] {
        return part.type in this.partTransformers
            ? this.partTransformers[part.type](part as any)
            : null;
    }

    replaceElement(el1: ChildNode, el2: ChildNode) {
        el1.dispatchEvent(new CustomEvent(':detach', {detail: {el: el1}}))
        el2.dispatchEvent(new CustomEvent(':attach', {detail: {el: el2}}))
        el1.replaceWith(el2);
        el1.dispatchEvent(new CustomEvent(':detached', {detail: {el: el1}}))
        el2.dispatchEvent(new CustomEvent(':attached', {detail: {el: el2}}))
    }

    removeElement(el: ChildNode) {
        el.dispatchEvent(new CustomEvent(':detach', {detail: {el}}))
        el.remove()
        el.dispatchEvent(new CustomEvent(':detached', {detail: {el}}))
    }

    beforeElement(parent: ChildNode, el: Node) {
        el.dispatchEvent(new CustomEvent(':attach', {detail: {el}}))
        parent.before(el)
        el.dispatchEvent(new CustomEvent(':attached', {detail: {el}}))
    }
    afterElement(parent: ChildNode, el: Node) {
        el.dispatchEvent(new CustomEvent(':attach', {detail: {el}}))
        parent.after(el)
        el.dispatchEvent(new CustomEvent(':attached', {detail: {el}}))
    }

    appendChild(parent: ChildNode, el: Node) {
        el.dispatchEvent(new CustomEvent(':attach', {detail: {el}}))
        parent.appendChild(el)
        el.dispatchEvent(new CustomEvent(':attached', {detail: {el}}))
    }

    render(): Node[] {
        return this.parsed.map(p => this.addPart(p)).flat().filter(c => c)
    }
}