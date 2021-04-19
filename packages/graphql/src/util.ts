export function lowerFirst(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export type StringKey<X extends object> = Exclude<keyof X, number | symbol>;
