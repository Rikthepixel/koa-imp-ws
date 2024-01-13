// src/index.ts
import http from "http";
import process from "process";
import WebSocket from "ws";
import makeDebug from "debug";
var debug = makeDebug("koa-imp-ws");
var serversPatched = /* @__PURE__ */ new WeakSet();
function websocket(optionsOrHttpServer) {
  const options = optionsOrHttpServer instanceof http.Server ? { server: optionsOrHttpServer } : optionsOrHttpServer ?? {};
  if (parseInt(process.versions.node) < 10 && !options.noServerWorkaround) {
    const server = options.server;
    if (!server) {
      throw new TypeError(
        `If you target Node 9 or earlier you must provide the HTTP server either as an option or as the second parameter.
See the readme for more instructions: https://github.com/b3nsn0w/koa-easy-ws#special-usage-for-node-9-or-earlier`
      );
    }
    if (!serversPatched.has(server)) {
      serversPatched.add(server);
      server.on(
        "upgrade",
        (req) => server.emit("request", req, new http.ServerResponse(req))
      );
      debug("added workaround to a server");
    }
  }
  debug(`websocket middleware created with property name 'wsServer`);
  const wsServer = new WebSocket.Server({
    ...options.wsOptions,
    noServer: true
  });
  return async function(ctx, next) {
    debug(`websocket middleware called on route ${ctx.path}`);
    const shouldUpgradeWs = (ctx.request.headers.upgrade || "").split(",").map((s) => s.trim().toLowerCase()).indexOf("websocket") !== -1;
    if (!shouldUpgradeWs) {
      ctx.ws = () => Promise.resolve(null);
      ctx.wsServer = void 0;
      return await next();
    }
    debug(`websocket middleware in use on route ${ctx.path}`);
    ctx.ws = async function() {
      return new Promise(function(resolve) {
        wsServer.handleUpgrade(
          ctx.req,
          ctx.request.socket,
          Buffer.alloc(0),
          (ws) => {
            wsServer.emit("connection", ws, ctx.req);
            resolve(ws);
          }
        );
        ctx.respond = false;
      });
    };
    ctx.wsServer = wsServer;
    await next();
  };
}
var src_default = websocket;
export {
  src_default as default
};
//# sourceMappingURL=index.mjs.map