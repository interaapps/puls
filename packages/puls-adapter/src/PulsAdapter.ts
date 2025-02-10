import {ParserOutput} from "pulsjs-template";

export abstract class PulsAdapter<T> {
    constructor(public parsed: ParserOutput[]) {}

    abstract render(): T;
}