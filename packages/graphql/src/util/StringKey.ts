type StringKey<X extends object> = Exclude<keyof X, number | symbol>;
export default StringKey;
