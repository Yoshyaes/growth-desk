/** @type {import('next').NextConfig} */
const nextConfig = {
  // the shared core lives one level up in lib/, outside this app directory.
  // it is plain JS on purpose so `node --test` can keep running the 64 tests
  // that prove the gate without a build step.
  experimental: { externalDir: true },

  // the config files are read from the deployment bundle, never from the API,
  // so they have to be traced into the serverless function.
  outputFileTracingRoot: new URL("..", import.meta.url).pathname,
  outputFileTracingIncludes: {
    "/**": ["../products/*/icp.md", "../products/*/voice.md", "../products/*/offers.md",
            "../products/*/proof.md", "../products/*/ethics.md", "../products/*/learnings.md",
            "../products/*/channels.yml", "../shared/*.md"]
  },

  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "x-frame-options", value: "DENY" },
        { key: "referrer-policy", value: "no-referrer" },
        { key: "x-content-type-options", value: "nosniff" }
      ]
    }];
  }
};
export default nextConfig;
