export function upperFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export type StringKey<X extends object> = Exclude<keyof X, number | symbol>;
