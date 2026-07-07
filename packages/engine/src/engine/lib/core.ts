export { version } from '../../../package.json';

export const appName = 'Lexsim';

/** Creates a typed mutable config holder with a stable configure() setter. */
export function makeConfig<T>(defaults: T): {
  get: () => T;
  configure: (v: T) => void;
} {
  let value = defaults;
  return {
    get: () => value,
    configure: (v: T) => {
      value = v;
    },
  };
}
