import http from "http";
import process from "process";
import WebSocket, { ServerOptions } from "ws";
import Koa, { Middleware } from "koa";

import makeDebug from "debug";
const debug = makeDebug("koa-imp-ws");

export type WebSocketContext = {
  ws?: () => Promise<WebSocket>;
  wsServer?: WebSocket.Server;
};

export type WebSocketMiddleware = Middleware<object, WebSocketContext>;

export type WebSocketMiddlwareOptions = {
  server?: http.Server;
  wsOptions?: ServerOptions;
  noServerWorkaround?: boolean;
};

const serversPatched = new WeakSet();

function websocket(
  optionsOrHttpServer?: WebSocketMiddlwareOptions | http.Server,
): (
  context: Koa.ParameterizedContext<object, WebSocketContext>,
  next: Koa.Next,
) => any {
  const options: WebSocketMiddlwareOptions =
    optionsOrHttpServer instanceof http.Server
      ? { server: optionsOrHttpServer }
      : optionsOrHttpServer ?? {};

  if (parseInt(process.versions.node) < 10 && !options.noServerWorkaround) {
    const server = options.server;
    // node 9 or earlier needs a workaround for upgrade requests
    if (!server) {
      throw new TypeError(
        `If you target Node 9 or earlier you must provide the HTTP server either as an option or as the second parameter.\n` +
          `See the readme for more instructions: https://github.com/b3nsn0w/koa-easy-ws#special-usage-for-node-9-or-earlier`,
      );
    }

    if (!serversPatched.has(server)) {
      serversPatched.add(server);
      server.on("upgrade", (req) =>
        server.emit("request", req, new http.ServerResponse(req)),
      );
      debug("added workaround to a server");
    }
  }

  debug(`websocket middleware created with property name 'wsServer`);

  const wsServer = new WebSocket.Server({
    ...options.wsOptions,
    noServer: true,
  });

  return async function (ctx, next) {
    debug(`websocket middleware called on route ${ctx.path}`);
    const shouldUpgradeWs =
      (ctx.request.headers.upgrade || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .indexOf("websocket") !== -1;

    if (!shouldUpgradeWs) {
      return await next();
    }

    debug(`websocket middleware in use on route ${ctx.path}`);

    ctx.ws = async function () {
      return new Promise<WebSocket>(function (resolve) {
        wsServer.handleUpgrade(
          ctx.req,
          ctx.request.socket,
          Buffer.alloc(0),
          (ws) => {
            wsServer.emit("connection", ws, ctx.req);
            resolve(ws);
          },
        );
        ctx.respond = false;
      });
    };

    ctx.wsServer = wsServer;

    await next();
  };
}

export default websocket;
