import React, {FC} from "react";
import {Codec, makeAddress, RoutedView, slash, useNav, createRouter, Portal, RouteTree, RouteTreeElementProps} from "dir-300";
import {buildPathString} from "dir-300/dist/dsl";

const number: Codec<number> = {
  fromString(t: string): number {
    return Number(t)
  },

  toString(t: number): string {
    return t.toString()
  }
}

function stubView(n: string): RoutedView<any> {
  return {
    T: "view",
    name: n,
    view: p => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const nav = useNav();
      return <>{n}: {JSON.stringify(p)} (<a onClick={() => nav.go(window.location.hash.substr(1) + "/123" as never)}>link to ~/123</a>)</>
    }
  };
}

const r = slash({}, { id: number }, "/users", r => ({
  users: r("users", stubView("users"), r => ({
    byId: r(":userId[id]", stubView("userById"), r => ({
      posts: r("posts", stubView("posts"), r => ({
        byId: r(":postId[id]", stubView("postById"))
      }))
    }))
  })),
  feed: r("feed", stubView("feed"))
}));

const a = makeAddress(r);
const router = createRouter(r)

const IndentedList: FC = x => {
  return <div style={{ paddingLeft: 15 }}>
    {x.children}
  </div>
}

function SomewhatSidebarElement(x: RouteTreeElementProps) {
  console.log(x.route);
  return <a onClick={() => x.nav.go(buildPathString(x.route, x.curProps) as never)}>
    {x.route.defn.name?.toString()}
  </a>
}

function SomewhatSidebar() {
  const nav = useNav();

  const routes = { users: a.users.$unsafeRoute, feed: a.feed.$unsafeRoute };

  return <div style={{ border: "3px solid red", textAlign: "left" }}>
    <RouteTree routes={routes} nav={nav} element={SomewhatSidebarElement} innerLayout={IndentedList} />
  </div>
}

function App() {
  return (
    <div className="App">
      <router.Viewport>
        <SomewhatSidebar/>
        <Portal />
      </router.Viewport>
    </div>
  );
}

export default App;
