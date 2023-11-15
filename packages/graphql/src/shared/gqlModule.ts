import { gql } from "apollo-server-lambda";
import { DocumentNode } from "graphql";
import merge from "lodash.merge";
import { PartialResolvers } from "./types";

export default class GqlModule {
  constructor(
    readonly config: {
      mutationTypeDefs?: DocumentNode;
      mutationResolvers?: PartialResolvers["Mutation"];
      typeDefs?: DocumentNode;
      resolvers?: PartialResolvers;
    }
  ) {}

  public schema(includeMutations: boolean = true) {
    const {
      mutationTypeDefs,
      mutationResolvers = {},
      typeDefs,
      resolvers = {},
    } = this.config;
    return {
      typeDefs: gql`
        ${typeDefs ?? ""}
        ${includeMutations ? mutationTypeDefs ?? "" : ""}
      `,
      resolvers: {
        ...resolvers,
        ...(includeMutations && mutationResolvers
          ? { Mutation: mutationResolvers }
          : {}),
      },
    };
  }
}

export function combineModules(...modules: GqlModule[]): GqlModule {
  const [firstModule, ...rest] = modules;
  if (!firstModule) {
    throw new Error("No modules provided");
  }
  return new GqlModule(
    rest.reduce(
      (acc, module) => ({
        typeDefs: combineTypeDefs(acc.typeDefs, module.config.typeDefs),
        resolvers: merge(acc.resolvers, module.config.resolvers),
        mutationTypeDefs: combineTypeDefs(
          acc.mutationTypeDefs,
          module.config.mutationTypeDefs
        ),
        mutationResolvers: merge(
          acc.mutationResolvers,
          module.config.mutationResolvers ?? {}
        ),
      }),
      firstModule.config
    )
  );
}

function combineTypeDefs(
  one: DocumentNode | undefined,
  two: DocumentNode | undefined
): DocumentNode | undefined {
  if (!one) {
    return two;
  }
  if (!two) {
    return one;
  }
  return gql`
    ${one}
    ${two}
  `;
}
