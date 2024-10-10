export class Router {
  constructor() {
    this.routes = new Map();
  }

  register(path, callback) {
    this.routes.set(path, callback);
  }

  handle(pathname = location.pathname) {
    for (const [path, callback] of this.routes) {
      if (typeof path === 'string' && pathname === path) {
        callback();
        return;
      }
      if (path instanceof RegExp && path.test(pathname)) {
        callback();
        return;
      }
    }

    console.warn(`No route found for ${pathname}`);
  }
}

export const router = new Router();
