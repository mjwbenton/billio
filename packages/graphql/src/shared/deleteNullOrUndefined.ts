export default function deleteNullOrUndefined<
  TInput extends Record<string, unknown>
>(input: TInput): WithoutNulls<TInput> {
  const result: any = {};
  Object.entries(input).forEach(([key, value]) => {
    if (value != null) {
      result[key] = value;
    }
  });
  return result;
}

type NullOrUndefinedKeysOf<T> = Exclude<
  {
    [Key in keyof T]: null extends T[Key]
      ? Key
      : undefined extends T[Key]
      ? Key
      : never;
  }[keyof T],
  undefined
>;
type NonNullableKeysOf<T> = keyof Omit<T, NullOrUndefinedKeysOf<T>>;

type WithoutNulls<T extends Record<string, unknown>> = {
  [Key in NullOrUndefinedKeysOf<T>]?: Exclude<T[Key], null>;
} & {
  [Key in NonNullableKeysOf<T>]: T[Key];
};
