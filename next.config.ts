import type { NextConfig } from "next";
import path from "path";

const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    disable: false,
    register: true,
    skipWaiting: true,
});

const nextConfig: NextConfig = {
    outputFileTracingRoot: path.join(process.cwd()),
};

export default withPWA(nextConfig);
