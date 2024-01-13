import http from 'http';
import WebSocket, { ServerOptions } from 'ws';
import Koa, { Middleware } from 'koa';

type WebSocketContext = {
    ws(): Promise<WebSocket | null>;
    wsServer?: WebSocket.Server;
};
type WebSocketMiddleware = Middleware<object, WebSocketContext>;
type WebSocketMiddlwareOptions = {
    server?: http.Server;
    wsOptions?: ServerOptions;
    noServerWorkaround?: boolean;
};
declare function websocket(optionsOrHttpServer?: WebSocketMiddlwareOptions | http.Server): (context: Koa.ParameterizedContext<object, WebSocketContext>, next: Koa.Next) => any;

export { type WebSocketContext, type WebSocketMiddleware, type WebSocketMiddlwareOptions, websocket as default };
