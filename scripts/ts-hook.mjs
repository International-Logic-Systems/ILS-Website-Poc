/**
 * Lets a plain .mjs script import the site's `lib/*.ts` modules directly.
 *
 * Node 22 strips TypeScript types on its own, but its ESM resolver still
 * demands file extensions, and `lib/` is written for the bundler resolver
 * (`from './site'`). This hook supplies the `.ts` the resolver wants, so the
 * knowledge builder reads the same typed data the site renders from — no
 * parallel copy to drift, no transpile step, no dependency.
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      /* fall through to the real specifier so the original error surfaces */
    }
  }
  return nextResolve(specifier, context);
}
