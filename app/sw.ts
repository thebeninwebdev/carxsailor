/// <reference lib="esnext" />
/// <reference lib="webworker" />

import {defaultCache} from "@serwist/next/worker";
import type {PrecacheEntry, SerwistGlobalConfig} from "serwist";
import {NetworkOnly, Serwist} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Serwist's default cache already makes /api/auth/* NetworkOnly. These
  // document routes also read the Better Auth session, so never restore an
  // old page after a sign-in or sign-out.
  runtimeCaching: [
    {
      matcher: ({request, url}) => request.mode === "navigate" && /^(?:\/login|\/register|\/dashboard|\/vendor|\/admin|\/auth\/complete|\/verify-email)(?:\/|$)/.test(url.pathname),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher({request}) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
