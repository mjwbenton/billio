export default function stripTypename<T>(obj: T): T {
  if (obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return (obj.map((el) => stripTypename(el)) as unknown) as T;
  } else if (typeof obj === "object") {
    return Object.keys(obj)
      .filter((key) => key !== "__typename")
      .reduce((acc, key) => {
        acc[key] = stripTypename(obj[key]);
        return acc;
      }, {} as T);
  } else {
    return obj;
  }
}
