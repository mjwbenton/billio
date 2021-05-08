import { GraphQLError, GraphQLScalarType, Kind } from "graphql";

const parseValue = (value: unknown) => {
  if (
    typeof value === "number" &&
    Math.floor(value) === value &&
    value >= 1 &&
    value <= 10
  ) {
    return value;
  }
  throw new GraphQLError(`Invalid rating: ${value}`);
};

const Rating = new GraphQLScalarType({
  name: "Rating",
  description: "Rating out of 10",
  serialize: (value: unknown) => value,
  parseValue,
  parseLiteral: (ast) => {
    if (ast.kind !== Kind.INT) {
      throw new Error(`Rating can only parse Int values`);
    }
    return parseValue(parseInt(ast.value, 10));
  },
});

export default Rating;
