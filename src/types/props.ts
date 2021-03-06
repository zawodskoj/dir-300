import { QuerySeg, PropSeg } from "./parsing";
import { ValidPath } from "./routes";

type CollectPropsFromPath<Path> =
    Path extends [infer Head, ...infer Tail]
        ? Head extends PropSeg<infer K, infer V>
            ? { [key in K]: V } & CollectPropsFromPath<Tail>
            : CollectPropsFromPath<Tail>
        : { };
type CollectPropsFromQuery<Query> =
    Query extends [infer Head, ...infer Tail]
        ? Head extends QuerySeg<infer K, infer V, infer N>
            ? (N extends true ? { [key in K]?: V } : { [key in K]: V }) & CollectPropsFromQuery<Tail>
            : CollectPropsFromQuery<Tail>
        : { };

export type CollectProps<Path extends ValidPath> =
    Path extends { path: infer P; query: infer Q } ? CollectPropsFromPath<P> & CollectPropsFromQuery<Q> : never;