import {PulsDOMAdapter} from "./PulsDOMAdapter";
import {computed, Hook, isHook, track} from "pulsjs-state";
import {ParserTag} from "pulsjs-template";

// Adds support for hooks in the PulsDOMAdapter
export class PulsHookedDOMAdapter extends PulsDOMAdapter {

    controlFlowHooks: (Hook<any>|null)[][] = []

    listeners: (() => void)[] = []
    elementListeners: Map<ChildNode, (() => void)[]> = new Map()

    addListener(el: ChildNode, listener: () => void) {
        if (!this.elementListeners.has(el))
            this.elementListeners.set(el, [])

        this.elementListeners.get(el)?.push(listener)
    }

    setAttribute(el: Element|undefined, key: string, value: any, parserTag: ParserTag) {
        if (el && key.startsWith(':bind')) {
            const field = key.split(':')[2] || 'value'

            if (typeof value === 'function')
                value = track(value)

            if (!isHook(value)) throw new Error(`Expected a hook on :bind. Got ${typeof value}`)

            const hook = value as Hook<any>

            let removeListener: any;
            const setListener = () => {
                removeListener = hook.addListener(() => {
                    (el as any)[field] = hook.value
                })
            }
            setListener()

            el.addEventListener(field === 'value' ? 'input' : `input:${field}`, () => {
                removeListener()
                hook.setValue((el as any)[field]);
                setListener()
            })
            ;(el as any)[field] = hook.value
            return
        }

        if ((key === ':if' || key === ':else-if') && typeof value === "function") {
            value = computed(value)
        }

        const createIfListener = (deps: Hook<any>[], index: () => boolean) => {
            let overrideEl: Element|Comment|undefined = undefined
            let shownElement: ChildNode|undefined = undefined
            const comment = this.document.createComment('if element')
            const listener = () => {
                if (index()) {
                    if (overrideEl === comment || overrideEl === undefined) {
                        shownElement = this.createElement({
                            ...parserTag,
                            attributes: parserTag.attributes.filter(([k]) => k !== key)
                        }) as Element

                        if (overrideEl) {
                            this.replaceElement(overrideEl, shownElement)
                        }
                    }
                    overrideEl = shownElement as Element
                } else {
                    if (overrideEl === shownElement || overrideEl === undefined) {
                        if (overrideEl) {
                            this.replaceElement(overrideEl, comment)
                        }
                    }
                    overrideEl = comment
                }
            }

            listener()
            deps.forEach(dep =>  {
                this.addListener(overrideEl!, dep.addListener(listener))
            })
            return overrideEl
        }


        if (key === ':else' && this.controlFlows[this.currentControlFlow]?.length > 0 && this.controlFlowHooks[this.currentControlFlow]) {
            const currentFlowId = this.currentControlFlow
            this.currentControlFlow = -1
            return createIfListener(this.controlFlowHooks[currentFlowId].map((c) => c).filter(c => c !== null), () => {
                for (let c of this.controlFlows[currentFlowId]) {
                    if (c) return false;
                }
                return true
            })
        }

        if (key === ':else-if' && this.controlFlows[this.currentControlFlow]?.length > 0 && this.controlFlowHooks[this.currentControlFlow]) {
            const currentControlFlowId = this.currentControlFlow
            const cond = () => {
                for (let c of this.controlFlows[currentControlFlowId]) {
                    if (c) return false;
                }
                return isHook(value) ? value.value : value
            }

            const ind = this.controlFlows[currentControlFlowId].push(cond()) - 1

            this.controlFlowHooks[this.currentControlFlow][ind] = isHook(value) ? value : null

            if (value && isHook(value)) {
                for (const hk of this.controlFlowHooks[this.currentControlFlow]) {
                    hk?.addListener(() => {
                        this.controlFlows[currentControlFlowId][ind] = cond()
                    })
                }
            }

            return createIfListener(
                [
                    ...this.controlFlowHooks[this.currentControlFlow].map((c) => c).filter(c => c !== null),
                    ...(isHook(value) ? [value] : [])
                ],
                () => this.controlFlows[currentControlFlowId][ind]
            )
        }

        if (key.startsWith('@') || !isHook(value))
            return super.setAttribute(el, key, value, parserTag);

        const hook = value as Hook<any>

        if (key === ':ref') {
            hook.value = el
            return;
        }

        if (key === ':if') {
            const cond = () => !!hook.value
            this.currentControlFlow = this.controlFlows.push([cond()]) - 1

            this.controlFlowHooks[this.currentControlFlow] = [hook]

            const currentControlFlowId = this.currentControlFlow
            hook.addListener(() => {
                this.controlFlows[currentControlFlowId][0] = cond()
            })
            return createIfListener(
                [hook],
                () => this.controlFlows[currentControlFlowId][0]
            )
        }

        if (el && '__puls_inject_hooks_as_value' in el) {
            super.setAttribute(el, key, hook, parserTag)
            return;
        }

        const listener = () => {
            super.setAttribute(el, key, hook.value, parserTag)
        }

        this.addListener(el!, hook.addListener(listener))

        listener()
    }

    createFromValue(value: any) : undefined|Node[] {
        if (!isHook(value))
            return super.createFromValue(value);

        const hook = value as Hook<any>

        let els: Node[] = [this.document.createComment('hook element')];
        let lastType: string|undefined = undefined

        let removeListener = null;

        const listener = () => {
            const type = this.valueTransformers.find(transformer => transformer.test(hook.value))?.type

            let updateListeners = false

            if (type !== lastType) {
                let newElements = this.valueTransformers.find(transformer => transformer.type === type)?.create(hook.value)!

                if (newElements) {
                    this.replaceElements(els as ChildNode[], newElements)
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
                   // el!.addEventListener(':detach', removeListener!)
                }
            }

            lastType = type
        }

        removeListener = hook.addListener(listener)
        this.listeners.push(removeListener)
        listener()
        return els
    }



    setElementStyle(el: Element, key: string, value: any) {
        if (isHook(value)) {
            this.addListener(el, () => {
                super.setElementClass(el, key, value.value)
            })

            super.setElementStyle(el, key, value.value)
        }

        super.setElementStyle(el, key, value)
    }

    removeElement(el: ChildNode) {
        this.elementListeners.get(el)?.forEach(l => l())
        super.removeElement(el);
    }

    setElementClass(el: Element, key: string, condition: any) {
        if (isHook(condition)) {
            this.addListener(el, condition.addListener(() => {
                super.setElementClass(el, key, condition.value)
            }))

            return super.setElementClass(el, key, condition.value)
        }

        super.setElementClass(el, key, condition)
    }

}