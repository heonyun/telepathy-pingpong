import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side instance (used in API routes)
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'ap3',
  useTLS: true,
});

// Client-side instance
const globalPusher = global.pusherClient;

export const pusherClient = globalPusher || new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY || 'bda36c1e6fba72d944b2', 
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap3',
    authEndpoint: '/api/pusher/auth',
  }
);

if (process.env.NODE_ENV === 'development') global.pusherClient = pusherClient;
