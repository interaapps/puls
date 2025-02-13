import { ParserOutput, ParserTag, ParserText, ParserValue } from "pulsjs-template";
import {
    currentLifecycleHooks,
    OnMount,
    OnMounted,
    OnUnmount,
    OnUnmounted,
    PulsAdapter,
    resetLifecycleHooks,
    currentLifecycleDefines
} from "pulsjs-adapter";

export type ValueTransformer<T> = {
    type: string,
    test: (value: any) => boolean,
    create: (value: any) => T[],
    set?: (el: [T], value: any) => void
}

export class PulsDOMAdapter extends PulsAdapter<Node[]>{
    controlFlows: boolean[][] = []
    currentControlFlow: number = 0

    documentOverride: Document|null = null

    inSVG = false

    get document(): Document {
        return this.documentOverride ?? window.document
    }

    setLifecycleDefines(tag: any, attributes: Record<string, any>, slot: any) {
        currentLifecycleDefines.exports = {}
        currentLifecycleDefines.props = attributes
        currentLifecycleDefines.slot = slot
        currentLifecycleDefines.emitsFunction = (name: string, ...args: any) => {
            const fn = attributes[`@${name}`]
            if (fn) {
                return fn(...args)
            }
        }
    }

    clearLifecycleDefines() {
        currentLifecycleDefines.emitsFunction = undefined
        currentLifecycleDefines.props = {}
        currentLifecycleDefines.emitsFunction = undefined
        currentLifecycleDefines.slot = undefined
    }

    partTransformers: Record<string, (part: ParserOutput) => any> = {
        'text': (part) => [this.document.createTextNode((part as ParserText).value)],
        'element': (part) => {
            const conf = part as ParserTag
            if (typeof conf.tag === 'function') {
                resetLifecycleHooks()

                let out: Node[]|undefined = []
                if ('prototype' in conf.tag && conf.tag.prototype instanceof HTMLElement) {
                    out = this.createFromValue(this.createElement(conf))
                } else {
                    // Function Components Implementation

                    for (const [key, value] of conf.attributes) {
                        if (key === ':if' || key === ':else-if' || key === ':else') {
                            return this.setConditionFlowAttribute(key, value, conf)
                        }
                    }

                    const attributes: Record<string, any> = conf.attributes.reduce((acc, [key, value]) => ({
                        ...acc,
                        [key]: value
                    }), {})

                    const slot = (conf.body.length > 0 ? (new (this.constructor as new (b: ParserOutput[]) => PulsDOMAdapter)(conf.body)).render() : undefined)

                    this.setLifecycleDefines(conf.tag, attributes, slot)

                    // Call function component
                    out = this.createFromValue((conf.tag as (values: any) => any)({
                        ...attributes,
                        $slot: slot
                    }))

                    this.clearLifecycleDefines()

                    if (':ref' in attributes) {
                        attributes[':ref'](...(out || []), currentLifecycleDefines.exports)
                    }
                }

                let lifeCycleComment: undefined|Comment= undefined
                const lifeCycleHooks = currentLifecycleHooks

                if (lifeCycleHooks.setAny) {
                    lifeCycleComment = this.document.createComment('lifecycle')

                    lifeCycleHooks.onMount.forEach((fn: OnMount) => fn())

                    if (lifeCycleHooks.onUnmount.length > 0 || lifeCycleHooks.onUnmounted.length > 0) {
                        const observer = new MutationObserver(mutations => {
                            mutations.forEach(mutation => {
                                mutation.addedNodes.forEach(node => {
                                    if (node === lifeCycleComment) {
                                        queueMicrotask(() => lifeCycleHooks.onMounted.forEach((fn: OnMounted) => fn()));
                                    }
                                });

                                mutation.removedNodes.forEach(node => {
                                    if (node === lifeCycleComment) {
                                        lifeCycleHooks.onUnmount.forEach((fn: OnUnmount) => fn())
                                        queueMicrotask(() => lifeCycleHooks.onUnmounted.forEach((fn: OnUnmounted) => fn()));
                                        observer.disconnect()
                                    }
                                });
                            });
                        });

                        observer.observe(this.document.body, {
                            childList: true,
                            subtree: true
                        });
                    }
                }

                return [
                    ...(out || [this.document.createComment('placeholder')]),
                    ...(lifeCycleComment ? [lifeCycleComment] : [])
                ]
            } else if (conf.tag.includes('-') && window?.customElements) {
                const customElement = window.customElements.get(conf.tag)
                if (customElement) {
                    return this.createElement({
                        ...conf,
                        tag: customElement
                    })
                }
            }

            const a = this.createElement(part as ParserTag)
            return a === undefined ? [this.document.createComment('')] : [a]
        },
        'value': (part) => this.createFromValue((part as ParserValue).value)
    }

    valueTransformers: ValueTransformer<any>[] = [
        {
            type: 'text',
            test: (value: any) => typeof value === 'string' || typeof value === 'number',
            // Setting to ' ' because empty text nodes are removed by the browser (???)
            create: (value: any) => [this.document.createTextNode(value === '' ? ' ' : value)],
            set: (el, value: any) => el.forEach(e => {
                e.textContent = value === '' ? ' ' : value
            })
        } as ValueTransformer<Text|Comment>,
        {
            type: 'element',
            test: (value: any) => value instanceof Node,
            create: (value: any) => [value],
            set: (el, value: any) => el.forEach(e => this.replaceElement(e, value))
        } as ValueTransformer<ChildNode>,
        {
            type: 'array',
            test: (value: any) => Array.isArray(value),
            create: (value: any) => value.map((e: any) => this.createFromValue(e.length === 0 ? [this.document.createComment('array')] : e)).flat(),
            set: ((el, value: any) => {
                // @ts-ignore
                el = el.map(e => this.createFromValue(e)).filter(e => e !== undefined).flat()
                value = value.map((e: any) => this.createFromValue(e)).flat()

                if (value.length === 0) value.push(this.document.createComment('array'))

                value.forEach((e: ChildNode) => {
                    this.beforeElement(el[0] as HTMLElement, e)
                })
                el.forEach(e => this.removeElement(e))

                return value
            })
        } as ValueTransformer<ChildNode>,
        {
            type: 'placeholder',
            test: (value: any) => value === null || value === undefined,
            create: (value: any) => {
                return [this.document.createComment('placeholder')]
            },
            set: (el, value: any) => {}
        } as ValueTransformer<ChildNode>,
        {
            type: 'promise',
            test: (value: any) => typeof value === 'object' && value instanceof Promise,
            create: (value: any) => {
                const promisePlaceholder = this.document.createComment('promise')

                value.then((v: any) => {
                    const fromValue = this.createFromValue(v)
                    if (fromValue?.[0]) {
                        this.replaceElement(promisePlaceholder, fromValue[0] as ChildNode)
                    }
                })

                return [promisePlaceholder]
            },
            set: (el, value: any) => {}
        } as ValueTransformer<ChildNode>,
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

    setConditionFlowAttribute(key: string, value: any, parserTag: ParserTag) {
        if (key === ':if') {
            this.currentControlFlow = this.controlFlows.push([value]) - 1
            if (!value) {
                return this.document.createComment('if')
            }
        }
        if (key === ':else-if') {
            if (typeof this.controlFlows[this.currentControlFlow] === 'undefined') {
                throw new Error('else-if without if')
            }

            let isElse = !this.controlFlows[this.currentControlFlow].includes(true)
            this.controlFlows[this.currentControlFlow].push(value)

            if (!(isElse && value)) {
                return this.document.createComment('if')
            }
        }
        if (key === ':else') {
            if (typeof this.controlFlows[this.currentControlFlow] === 'undefined') {
                throw new Error('else without if before')
            }

            let isElse = !this.controlFlows[this.currentControlFlow].includes(true)

            if (!isElse) {
                return this.document.createComment('if')
            }
        }
        return this.createElement({
            ...parserTag,
            attributes: parserTag.attributes.filter(([k]) => k !== key)
        })
    }

    setAttribute(el: Element|undefined, key: string, value: any, parserTag: ParserTag): Node|undefined {
        if (key === ':if' || key === ':else-if' || key === ':else') {
            return this.setConditionFlowAttribute(key, value, parserTag)
        }

        if (el === undefined) return;

        if (key === ':ref') {
            if (typeof value === 'function') {
                value(el)
                return;
            }
        }

        if (key === 'style' && typeof value === 'object') {
            for (const [k, v] of Object.entries(value)) {
                this.setElementStyle(el, k, v)
            }
            return;
        } else if (key === 'class' && typeof value === 'object') {
            if (Array.isArray(value)) {
                for (const v of value.flat()) {
                    this.setElementClass(el, v, true)
                }
                return
            }
            for (const [k, v] of Object.entries(value)) {
                this.setElementClass(el, k, v)
            }
            return
        }

        if (key.startsWith('@')) {
            const eventParts = key.substring(1).split('.')
            const eventName = eventParts.shift()!

            el.addEventListener(eventName, function (e) {
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

        el.setAttribute(key, value)

        return
    }

    createElement(value: ParserTag): Node|undefined {
        let el: Node|undefined = undefined

        const attributes: [string, any][] = []
        const controlFlows: [string, any][] = []

        for (const attr of value.attributes) {
            if ([':if', ':else-if', ':else'].includes(attr[0])) {
                controlFlows.push(attr)
            } else {
                attributes.push(attr)
            }
        }

        for (const [key, val] of controlFlows) {
            return this.setAttribute(undefined, key, val, value)
        }

        if (typeof value.tag === 'string') {
            el = this.document.createElement(value.tag as string)
        } else if ('prototype' in value.tag && value.tag.prototype instanceof HTMLElement) {
            el = new (value.tag as CustomElementConstructor)()
        }

        if (value.tag === 'svg' || this.inSVG) {
            el = this.document.createElementNS('http://www.w3.org/2000/svg', value.tag as string)
            this.inSVG = true
        }

        if (el instanceof Element) {
            for (const [key, val] of attributes) {
                const overrideEl = this.setAttribute(el, key, val, value)
                if (overrideEl) {
                    el = overrideEl

                    if (value.tag === 'svg') {
                        this.inSVG = false
                    }

                    return el
                }
            }
        }

        if (el instanceof Element) {
            for (const bodyElement of value.body) {
                this.addPart(bodyElement)
                    ?.forEach(e => this.appendChild(el, e))
            }
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
            ? this.partTransformers[part.type].bind(this)(part as any)
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