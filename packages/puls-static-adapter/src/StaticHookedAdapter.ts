import {StaticAdapter} from "./StaticAdapter";
import {Hook} from "pulsjs-state";
import {ParserOutput} from "pulsjs-template";

export class StaticHookedAdapter extends StaticAdapter {
    newInstance(p: ParserOutput[]) {
        return new StaticHookedAdapter(p)
    }

    getValue(val: any) {
        if (val instanceof Hook) {
            return super.getValue(val.value)
        }
        return super.getValue(val)
    }
}