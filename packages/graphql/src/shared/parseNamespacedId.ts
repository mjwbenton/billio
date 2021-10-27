export default function parseNamespacedId(
  namespacedId: string,
  {
    assertNamespace,
    idSections = 2,
  }: { assertNamespace?: string; idSections?: number } = {}
) {
  const [namespace, innerId, ...more] = namespacedId.split(":");

  if (!innerId) {
    throw new Error(`Invalid id structure: "${namespacedId}"`);
  }

  if (assertNamespace && namespace !== assertNamespace) {
    throw new Error(
      `Incorrect namespace on id "${namespacedId}", expecting ${assertNamespace}`
    );
  }

  if (more.length != idSections - 2) {
    throw new Error(
      `Invalid number of sections ${more.length + 2}, expecting ${idSections}`
    );
  }

  return {
    namespace,
    externalId: innerId,
    additionalSections: more,
  };
}

export function buildNamespacedId({
  namespace,
  externalId,
  additionalSections = [],
}: {
  namespace: string;
  externalId: string;
  additionalSections?: Array<string>;
}) {
  return [namespace, externalId, ...additionalSections].join(":");
}
