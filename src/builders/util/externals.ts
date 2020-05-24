const NODE_BUILD_IN_MODULES = [
  "assert",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "repl",
  "stream",
  "string_decoder",
  "timers",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "zlib"
];



export const getExternals = (pkgDependencies) => {
  const externalDependencies = ['electron', ...Object.keys(pkgDependencies), ...NODE_BUILD_IN_MODULES];
  let externals: any = [
    (function () {
      return function (context, request, callback) {
        if (externalDependencies.indexOf(request) >= 0) {
          if (externalDependencies.hasOwnProperty(request)) {
            // const modulePath = join(rootNodeModules, request);
            return callback(null, "require('" + request + "')");
          }
          return callback(null, "require('" + request + "')");
        }
        return callback();
      };
    })()
  ];
  return externals;
}
