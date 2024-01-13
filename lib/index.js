"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_http = __toESM(require("http"));
var import_process = __toESM(require("process"));
var import_ws = __toESM(require("ws"));
var import_debug = __toESM(require("debug"));
var debug = (0, import_debug.default)("koa-imp-ws");
var serversPatched = /* @__PURE__ */ new WeakSet();
function websocket(optionsOrHttpServer) {
  const options = optionsOrHttpServer instanceof import_http.default.Server ? { server: optionsOrHttpServer } : optionsOrHttpServer ?? {};
  if (parseInt(import_process.default.versions.node) < 10 && !options.noServerWorkaround) {
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
        (req) => server.emit("request", req, new import_http.default.ServerResponse(req))
      );
      debug("added workaround to a server");
    }
  }
  debug(`websocket middleware created with property name 'wsServer`);
  const wsServer = new import_ws.default.Server({
    ...options.wsOptions,
    noServer: true
  });
  return async function(ctx, next) {
    debug(`websocket middleware called on route ${ctx.path}`);
    const shouldUpgradeWs = (ctx.request.headers.upgrade || "").split(",").map((s) => s.trim().toLowerCase()).indexOf("websocket") !== -1;
    if (!shouldUpgradeWs) {
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
//# sourceMappingURL=index.js.map