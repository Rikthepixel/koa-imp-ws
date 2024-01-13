Simple, easy to use, composable middleware for websocket handling in Koa

_Note:_
This is a fork of [koa-easy-ws](https://github.com/b3nsn0w/koa-easy-ws), but rewritten in TypeScript. The middleware has been simplified to always expose the server on `ctx.wsServer` and the socket on `ctx.ws()`.

This is _NOT_ a drop-in replacement for `koa-easy-ws`. Make sure to read is README well, since it has been adjusted for rewrite. The internals of this library are still the same and effectively functions in the same way, however some of the functions have been changed.

# Requirements

- koa >= 2
- ws >= 8

# Usage

```javascript
const Koa = require("koa");
const websocket = require("koa-easy-ws");

const app = new Koa();

app.use(websocket());
app.use(async (ctx, next) => {
  const socket = await ctx.ws(); // Retrieve socket

  // Check if the connection upgrade was successful
  if (socket) {
    // now you have a ws instance, you can use it as you see fit
    return ws.send("hello there");
  }

  // we're back to regular old http here
  ctx.body = "general kenobi";
});
```

**Note: you will also need to install the `ws` package** (`npm install --save ws` or `yarn add ws`), **it is linked only as a peer dependency.**

First, you need to pass the koa-easy-ws middleware before the one handling your request. Remember to call it as a function, `app.use(websocket())`, not `app.use(websocket)`. This sets up on-demand websocket handling for the rest of the middleware chain.

The middleware adds the `ctx.ws()` function whenever it detects an upgrade request, calling which handles the websocket and returns a [ws][ws] instance. If not called, regular Koa flow continues, likely resulting in a client-side error.

# Features

- No magic. This is a middleware, it doesn't turn your Koa app into a KoaMagicWebSocketServer. It knows its place.
- Integrates [ws][ws], one of the fastest and most popular websocket libraries.
- Full composability. Since this is just a middleware, it's not picky on what other libraries you use.
- Two dependencies only, and it's the ws library and [debug][debug] (because apparently logs are not a bad idea). No need for more clutter in your node_modules.

# Examples and advanced configuration

You can easily compose koa-easy-ws with a routing library:

```javascript
const Koa = require("koa");
const Router = require("koa-router");
const websocket = require("koa-easy-ws");

const app = new Koa();
const router = new Router();

app.use(websocket()).use(router.routes()).use(router.allowedMethods());

// App websocket
router.get("Obiwan", "/obiwan", async (ctx, next) => {
  const socket = await ctx.ws();
  if (socket) {
    socket.send("chancellor palpatine is evil");
  }
});

router.get("Anakin", "/anakin", async (ctx, next) => {
  const socket = await ctx.ws();
  if (socket) {
    socket.send("the jedi are evil");
    socket.send("404");
  }
});

// Route specific websocket
router.get(
  "Jar Jar is evil",
  "/jar-jar",
  authorize(), // Route specific middleware will take effect
  websocket(), // Will override the `ctx.ws` and `ctx.wsServer` set at the toplevel middleware
  async (ctx, next) => {
    const socket = await ctx.ws();
    if (socket) {
      socket.send("Me-sa was mastermind all-along");
    }
  },
);
```

You can pass options to the underlying websocket server as part of the options object:

```javascript
app.use(
  websocket({
    wsOptions: {
      clientTracking: false,
      maxPayload: 69420,
    },
  }),
);
```

The `wsOptions` object will be forwarded to `WebSocket.Server` unchanged, you can check [its documentation][ws] for the available options.

If needed, you can use the websocket server exposed on `ctx.wsServer`

```javascript
const Koa = require("koa");
const websocket = require("koa-easy-ws");

const app = new Koa();

app.use(websocket());

app.use(async (ctx, next) => {
  const socket = await ctx.ws();
  if (socket) {
    console.log("found the server", ctx.wsServer);
  }
});
```

From here, the sky is the limit, unless you work for SpaceX.

# Special usage for Node 9 or earlier

Node's HTTP server doesn't send upgrade requests through the normal callback (and thus your Koa middleware chain) prior to version 10, preventing koa-easy-ws from handling them. Because of this, if you target Node 9 or earlier, you must pass your HTTP server to the middleware which handles the workaround:

```javascript
const server = http.createServer(app.callback());

app.use(websocket(server));

// alternatively, you can pass it as part of the options object:
app.use(websocket({ server: server }));

server.listen(process.env.PORT); // use this function instead of your app.listen() call
```

koa-easy-ws then automatically feeds any upgrade request into your regular middleware chain. If you wish to opt out and do this yourself, use the `noServerWorkaround` option:

```javascript
app.use(
  websocket({
    noServerWorkaround: true,
  }),
);
```

# Contributing

Pull requests are welcome. As always, be respectful towards each other. Currently the tests from the original repository have been removed. In future updates this library I will be fully testing it.

koa-imp-ws uses the MIT license, just like koa-easy-ws.

[ws]: https://github.com/websockets/ws
[debug]: https://github.com/visionmedia/debug
