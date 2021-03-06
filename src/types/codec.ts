export interface Codec<T> {
    toString(t: T): string
    fromString(t: string): T
}

export type CodecMap = Record<string, Codec<unknown>>;