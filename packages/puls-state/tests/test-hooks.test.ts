import {computed, state, watch} from "../src/hooks";

test("test-value", () => {
    const hook = state(0)
    expect(hook.value).toBe(0)
    hook.value++
    expect(hook.value).toBe(1)
})

test("test-watcher", (done) => {
    const hook = state(0)

    watch([hook], () => {
        expect(hook.value).toBe(1)
        done()
    })

    hook.value++
})

test("test-computed", (done) => {
    const hook = state(0)
    const computedHook = computed(() => hook.value + 1, [hook])

    expect(computedHook.value).toBe(1)

    watch([computedHook], () => {
        expect(computedHook.value).toBe(2)
        done()
    })

    hook.value++
})
test("test-auto-computed", (done) => {
    const hook = state(0)
    const computedHook = computed(() => hook.value + 1)

    expect(computedHook.value).toBe(1)

    watch([computedHook], () => {
        expect(computedHook.value).toBe(2)
        done()
    })

    hook.value++
})