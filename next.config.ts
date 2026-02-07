import type { NextConfig } from "next";
import path from "path";

const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    disable: false,
    register: true,
    skipWaiting: true,
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
                cacheName: "google-fonts-webfonts",
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 31536000,
                },
            },
        },
        {
            urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
                cacheName: "google-fonts-stylesheets",
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 604800,
                },
            },
        },
        {
            urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
            handler: "StaleWhileRevalidate",
            options: {
                cacheName: "static-font-assets",
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 604800,
                },
            },
        },
        {
            urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
            handler: "StaleWhileRevalidate",
            options: {
                cacheName: "static-image-assets",
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 86400,
                },
            },
        },
        {
            urlPattern: /\/_next\/image\?url=.+$/i,
            handler: "StaleWhileRevalidate",
            options: {
                cacheName: "next-image",
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 86400,
                },
            },
        },
        {
            urlPattern: /\/api\/prices/i,
            handler: "NetworkFirst",
            options: {
                cacheName: "api-prices",
                expiration: {
                    maxEntries: 16,
                    maxAgeSeconds: 300, // 5 minutes only
                },
                networkTimeoutSeconds: 5, // Fail faster
            },
        },
        {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
                cacheName: "apis",
                expiration: {
                    maxEntries: 16,
                    maxAgeSeconds: 86400,
                },
                networkTimeoutSeconds: 10,
            },
        },
        {
            urlPattern: /\.(?:json|xml|csv)$/i,
            handler: "NetworkFirst",
            options: {
                cacheName: "static-data-assets",
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 86400,
                },
            },
        },
        {
            urlPattern: ({ url }: any) => {
                const isSameOrigin = self.origin === url.origin;
                if (!isSameOrigin) return false;
                const pathname = url.pathname;
                if (pathname.startsWith("/api/")) return false;
                return true;
            },
            handler: "NetworkFirst",
            options: {
                cacheName: "others",
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 86400,
                },
                networkTimeoutSeconds: 10,
            },
        },
    ],
});

const nextConfig: NextConfig = {
    outputFileTracingRoot: path.join(process.cwd()),
};

export default withPWA(nextConfig);
