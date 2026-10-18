import {handleRooms} from './rooms.mjs';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/rooms' || url.pathname.startsWith('/api/rooms/')) {
      return handleRooms(request, env.DB);
    }
    if (['/', '/play', '/play/'].includes(url.pathname)) {
      url.pathname = '/play/index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  }
};