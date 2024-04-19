import { parseYrc } from "../utils";

class Lrc {
    lrcVal: string = ''
    constructor() {
    }
    _updateLrc(lrc: string) {
        this.lrcVal = parseYrc(lrc)
        console.log('this.lrcVal', this.lrcVal)
    }
}

export default Lrc