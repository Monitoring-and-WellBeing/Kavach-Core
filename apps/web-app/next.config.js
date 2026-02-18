// Temporarily disable PWA to avoid Babel plugin issues
// const withPWA = require("next-pwa")({
//   dest: "public",
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === "development",
// });

module.exports = {
  reactStrictMode: true,
  transpilePackages: [
    "@kavach/shared-types",
    "@kavach/shared-constants",
    "@kavach/shared-utils",
  ],
};
