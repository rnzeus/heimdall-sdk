const path = require("node:path");

const PACKAGE = "@rnzeus/heimdall-sdk";

const NOOP_FILES = {
  [PACKAGE]: path.resolve(__dirname, "../dist/noop/index.js"),
  [`${PACKAGE}/zustand`]: path.resolve(__dirname, "../dist/noop/zustand.js"),
};

const NOOP_ENTRIES = new Set([`${PACKAGE}/noop`, `${PACKAGE}/noop/zustand`]);

const isSdkImport = (moduleName) =>
  moduleName === PACKAGE || moduleName.startsWith(`${PACKAGE}/`);

const unsupportedImportError = ({ moduleName, originModulePath }) => {
  const origin = originModulePath
    ? path.relative(process.cwd(), originModulePath)
    : "<unknown file>";

  return new Error(
    [
      `[heimdall] Unsupported import of the Heimdall SDK in a build that excludes it.`,
      ``,
      `  File:   ${origin}`,
      `  Import: "${moduleName}"`,
      ``,
      `withHeimdall(config, { include: false }) in metro.config.js replaces the SDK with no-ops,`,
      `so none of its code, its native modules or its dependencies end up in this bundle.`,
      `Only these imports can be replaced:`,
      ``,
      `  "${PACKAGE}"          -> no-op connect / disconnect / prompt`,
      `  "${PACKAGE}/zustand"  -> heimdallZustand passes the store creator through`,
      ``,
      `"${moduleName}" is not one of them. Letting it through would put the real SDK into this bundle,`,
      `and if react-native-tcp-socket is unlinked for this build, the app would crash at runtime.`,
      ``,
      `How to fix:`,
      `  - import from "${PACKAGE}" or "${PACKAGE}/zustand" instead;`,
      `  - type-only imports are fine anywhere: use "import type { ... }";`,
      `  - if this build should include Heimdall, pass { include: true } to withHeimdall.`,
    ].join("\n")
  );
};

/**
 * Wraps a Metro config. With `include: false` imports of the SDK resolve to no-op modules,
 * so the SDK is not bundled. With `include: true` the config is returned unchanged.
 *
 * @template T
 * @param {T} config
 * @param {{ include: boolean }} options
 * @returns {T}
 */
function withHeimdall(config, options) {
  if (typeof options?.include !== "boolean") {
    throw new Error(
      `[heimdall] withHeimdall(config, { include }) needs "include" set to true or false explicitly, ` +
        `e.g. { include: process.env.APP_ENV !== "production" }.`
    );
  }

  if (options.include) return config;

  const resolver = config.resolver ?? {};
  const resolveNext = resolver.resolveRequest;

  return {
    ...config,
    resolver: {
      ...resolver,
      resolveRequest: (context, moduleName, platform) => {
        if (isSdkImport(moduleName) && !NOOP_ENTRIES.has(moduleName)) {
          const filePath = NOOP_FILES[moduleName];
          if (!filePath) {
            throw unsupportedImportError({
              moduleName,
              originModulePath: context.originModulePath,
            });
          }
          return { type: "sourceFile", filePath };
        }

        return resolveNext
          ? resolveNext(context, moduleName, platform)
          : context.resolveRequest(context, moduleName, platform);
      },
    },
  };
}

module.exports = { withHeimdall };
