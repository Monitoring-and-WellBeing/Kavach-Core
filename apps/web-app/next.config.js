const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  reactStrictMode: true,
  transpilePackages: [
    "@kavach/shared-types",
    "@kavach/shared-constants",
    "@kavach/shared-utils",
  ],
});
