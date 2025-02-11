import {html, state} from "pulsjs";

export function Counter() {
  const count = state<number>(0);

  return html`
    <button @click=${() => count.value++}>
      counter is ${count}
    </button>
  `
}
