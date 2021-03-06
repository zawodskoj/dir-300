import {useEffect, useState} from "react";

type Reducer<S, P = undefined> = P extends undefined ? (state: S, param?: P) => S : (state: S, param: P) => S;
type Watcher<S> = (state: S) => void;
type Unsubscribe = () => void;

export interface ReadOnlyStore<S> {
    get(): S
    watch(watcher: Watcher<S>): Unsubscribe
    use(): S
}

type MapReducers<S, R> = {
    [key in keyof R]: R[key] extends Reducer<S, infer P>
        ? P extends undefined
            ? (param?: P) => void
            : (param: P) => void
        : never
}

export interface Store<S, R> extends ReadOnlyStore<S> {
    actions: MapReducers<S, R>
}

export const Store = <S, R>(initialState: S, reducers: R): Store<S, R> => {
    const watchers = new Set<Watcher<S>>();
    const notify = (s: S) => {
        for (const watcher of watchers) {
            watcher(s);
        }
    };

    let state = initialState;

    return {
        get() { return state; },
        watch(watcher) {
            watchers.add(watcher);

            return () => watchers.delete(watcher);
        },
        use(): S {
            const [current, setState] = useState(state);
            useEffect(() => this.watch(setState), [this]);
            return current;
        },
        actions: Object.fromEntries(
            Object.entries(reducers)
                .map(([name, reducer]) => {
                    return [name, (param: never) => {
                        notify(state = reducer(state, param));
                    }] as const;
                })
        ) as MapReducers<S, R>
    };
};