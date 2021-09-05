export default function parseNamespacedId(
  namespacedId: string,
  options?: { assertNamespace?: string }
) {
  const [namespace, innerId, more] = namespacedId.split(":");

  if (more || !innerId) {
    throw new Error(`Invalid id structure: "${namespacedId}"`);
  }

  if (options?.assertNamespace && namespace !== options?.assertNamespace) {
    throw new Error(
      `Incorrect namespace on id "${namespacedId}", expecting ${options?.assertNamespace}`
    );
  }

  return {
    namespace,
    externalId: innerId,
  };
}

export function buildNamespacedId({
  namespace,
  externalId,
}: {
  namespace: string;
  externalId: string;
}) {
  return `${namespace}:${externalId}`;
}
