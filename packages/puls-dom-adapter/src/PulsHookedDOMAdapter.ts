import {PulsDOMAdapter} from "./PulsDOMAdapter";
import {Hook} from "pulsjs-state";

// Adds support for hooks in the PulsDOMAdapter
export class PulsHookedDOMAdapter extends PulsDOMAdapter {
    listeners: (() => void)[] = []
    elementListeners: Map<ChildNode, (() => void)[]> = new Map()

    addListener(el: ChildNode, listener: () => void) {
        if (!this.elementListeners.has(el))
            this.elementListeners.set(el, [])

        this.elementListeners.get(el)?.push(listener)
    }

    setAttribute(el: HTMLElement, key: string, value: any) {
        if (key.startsWith(':bind')) {
            const field = key.split(':')[2] || 'value'

            const hook = value as Hook<any>

            hook.addListener(() => {
                // @ts-ignore
                el[field] = hook.value
            })

            el.addEventListener(field === 'value' ? 'input' : `input:${field}`, () => {
                // @ts-ignore
                hook.setValue(el[field])
            })
            // @ts-ignore
            hook.setValue(el[field])

            return
        }

        if (key.startsWith('@') || !(value instanceof Hook))
            return super.setAttribute(el, key, value);

        const hook = value as Hook<any>

        const listener = () => {
            super.setAttribute(el, key, hook.value)
        }

        this.addListener(el, hook.addListener(listener))

        listener()
    }

    createFromValue(value: any) : undefined|Node[] {
        if (!(value instanceof Hook))
            return super.createFromValue(value);

        const hook = value as Hook<any>

        let els: Node[] = [document.createComment('hook element')];
        let lastType: string|undefined = undefined

        let removeListener = null;

        const listener = () => {
            const type = this.valueTransformers.find(transformer => transformer.test(hook.value))?.type

            let updateListeners = false
            if (type !== lastType) {
                let newElements = this.valueTransformers.find(transformer => transformer.type === type)?.create(hook.value)!

                if (newElements) {
                    newElements.forEach(e => {
                        this.afterElement(e, els[0])
                    })
                    if (newElements.length === 0) newElements.push(document.createComment('hook element'))
                    els.forEach(e => {
                        e!.removeEventListener(':detach', removeListener!)
                        this.removeElement(e as ChildNode)
                    })

                    els = newElements
                    updateListeners = true
                }
            } else {
                if (type === 'array') {
                    for (let el of els) {
                        el.removeEventListener(':detach', removeListener!)
                    }
                }

                const v = this.valueTransformers
                    .find(transformer => transformer.type === type)
                    ?.set?.(els! as any, hook.value)

                if (v) {
                    updateListeners = true
                    els = v
                }
            }

            if (updateListeners) {
                for (let el of els) {
                    el!.addEventListener(':detach', removeListener!)
                }
            }

            lastType = type
        }

        removeListener = hook.addListener(listener)
        this.listeners.push(removeListener)
        listener()
        return els
    }
}