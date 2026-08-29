export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !specifier.endsWith(".js") && !specifier.endsWith(".json")) {
    try {
      return await nextResolve(`${specifier}.js`, context);
    } catch {
      try {
        return await nextResolve(`${specifier}/index.js`, context);
      } catch {
        return nextResolve(specifier, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
