export type ParserAttribute = [string, any]
export type ParserTag = {
    type: 'element',
    tag: any,
    attributes: ParserAttribute[],
    body: ParserOutput[],
    from: number,
    to: number
}

export type ParserText = {
    type: 'text',
    value: string
}

export type ParserValue = {
    type: 'value',
    value: any
}

export type ParserOutput = ParserTag | ParserText | ParserValue

export type ParserElement = {
    type: 'char',
    value: string
} | {
    type: 'value',
    value: any
}
