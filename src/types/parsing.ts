import { Codec } from "./codec";

export type StrSeg<S> = { T: "str", seg: S }
export type PropSeg<K extends string, V> = { T: "prop", key: K, codec: Codec<V> }
export type PathSeg = StrSeg<unknown> | PropSeg<string, unknown>

export type QuerySeg<K extends string, V, Nullable extends boolean> = { key: K, codec: Codec<V>, nullable: Nullable }

type ParsePathSegment<S, PMap, TMap> =
    S extends ""
    ? { ok: false, err: "Empty segment in path" }
    : S extends `:${infer K}`
      ? K extends `${infer K}[${infer VK}]`
        ? TMap extends { [key in VK]: Codec<infer V> }
          ? { ok: true, seg: PropSeg<K, V> }
          : { ok: false, err: `PropType "${VK}" was not found in TypeMap` }
        : PMap extends  { [key in K]: Codec<infer V> }
          ? { ok: true, seg: PropSeg<K, V> }
          : { ok: false, err: `PropName "${K}" was not found in PropMap` }
      : { ok: true, seg: StrSeg<S> }

type ParseQuerySegmentN<S extends string, PMap, TMap, Nullable extends boolean> =
    S extends `${infer K}[${infer VK}]`
    ? TMap extends { [key in VK]: Codec<infer V> }
      ? { ok: true, seg: QuerySeg<K, V, Nullable> }
      : { ok: false, err: `PropName "${VK}" was not found in PropMap` }
    : PMap extends  { [key in S]: Codec<infer V> }
      ? { ok: true, seg: QuerySeg<S, V, Nullable> }
      : { ok: false, err: `PropName "${S}" was not found in PropMap` }

type ParseQuerySegment<S extends string, PMap, TMap> =
    S extends `${infer S}?`
    ? ParseQuerySegmentN<S, PMap, TMap, true>
    : ParseQuerySegmentN<S, PMap, TMap, false>

type ParseQuery<Q extends string, PMap, TMap> =
    Q extends `${infer Head}&${infer Tail}`
    ? ParseQuerySegment<Head, PMap, TMap> extends { ok: true, seg: infer Seg }
      ? SafeCons<Seg, ParseQuery<Tail, PMap, TMap>>
      : undefined
    : ParseQuerySegment<Q, PMap, TMap> extends { ok: true, seg: infer Seg }
      ? [Seg]
      : undefined

type SafeCons<A, B extends any[] | undefined> =
    B extends undefined ? undefined : B extends any[] ? [A, ...B] : never

type ParsePathWithoutQuery<S, PMap, TMap> =
    S extends `${infer Head}/${infer Tail}`
    ? ParsePathSegment<Head, PMap, TMap> extends { ok: true, seg: infer Seg }
      ? SafeCons<Seg, ParsePathWithoutQuery<Tail, PMap, TMap>>
      : ParsePathSegment<Head, PMap, TMap> extends { ok: false, err: infer Err }
        ? undefined | Err
        : undefined
    : ParsePathSegment<S, PMap, TMap> extends { ok: true, seg: infer Seg }
      ? [Seg]
      : ParsePathSegment<S, PMap, TMap> extends { ok: false, err: infer Err }
        ? undefined | Err
        : undefined

export type ParsePathIntoSegments<S, PMap, TMap> =
    S extends `${infer S}/#${infer Q}`
    ? { path: ParsePathWithoutQuery<S, PMap, TMap>, query: ParseQuery<Q, PMap, TMap> }
    : S extends `${infer S}#${infer Q}`
      ? { path: ParsePathWithoutQuery<S, PMap, TMap>, query: ParseQuery<Q, PMap, TMap> }
      : { path: ParsePathWithoutQuery<S, PMap, TMap>, query: [] }