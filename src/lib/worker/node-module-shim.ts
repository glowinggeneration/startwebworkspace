// The Worker runtime leaves `import.meta.url` undefined, so Rolldown's
// CommonJS interop shim (`createRequire(import.meta.url)`) throws at module
// scope and every request fails before the app renders. Nothing in the bundle
// actually resolves modules at runtime — the shim is only constructed — so a
// stand-in `createRequire` keeps module init working and only fails if some
// code genuinely tries to require something.
export function createRequire(_from?: unknown) {
  const require = (id: string) => {
    throw new Error(`Runtime require("${id}") is not supported in this server runtime.`);
  };
  return Object.assign(require, {
    resolve: Object.assign(
      (id: string) => {
        throw new Error(`require.resolve("${id}") is not supported in this server runtime.`);
      },
      { paths: () => null },
    ),
    cache: Object.create(null) as Record<string, unknown>,
    extensions: Object.create(null) as Record<string, unknown>,
    main: undefined,
  });
}

export default { createRequire };
