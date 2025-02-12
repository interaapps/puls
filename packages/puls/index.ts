import {createPuls} from "./src/puls";
import {PulsHookedDOMAdapter} from "pulsjs-dom-adapter";

export * from "pulsjs-state";
export * from "pulsjs-adapter"
export * from "./src/puls";
export * from "./src/custom-elements";
export * from "./src/PulsComponent";

export const pulsInstance = createPuls<Node[]>({
    adapter: typeof window === 'undefined' ? null : PulsHookedDOMAdapter
})

export function appendTo(element: Node, content: Node[]) {
    content.forEach(e => element.appendChild(e));
}

// @language=html
export const html = pulsInstance.html