export * from './jsx-runtime';


declare global {
    namespace JSX {
        export type Element = Node[]
        export interface ElementClass {
            $props: {}
        }
        export interface ElementAttributesProperty {
            $props: {}
        }
        export interface IntrinsicElements {
            [name: string]: any
        }
        export interface IntrinsicAttributes {}
    }
}