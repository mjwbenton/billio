import "reflect-metadata";

import {
  Arg,
  buildSchema,
  Field,
  FieldResolver,
  ID,
  Int,
  ObjectType,
  Query,
  registerEnumType,
  Resolver,
  ResolverInterface,
  Root,
} from "type-graphql";
import {
  ItemDocument,
  ItemType,
  Query as DataQuery,
} from "@mattb.tech/billio-data";

registerEnumType(ItemType, {
  name: "ItemType",
});

const TYPE_NAME_MAP: { [key in ItemType]: string } = {
  book: "Books",
  videogame: "Video Games",
};

@ObjectType()
class Item {
  @Field((type) => ID)
  id: string;
  @Field((type) => Type)
  type: Pick<Type, "id">;
  @Field((type) => Shelf)
  shelf: Pick<Shelf, "id" | "type">;
  @Field()
  title: string;
  @Field()
  updatedAt: Date;
}

@ObjectType()
class ItemPage {
  @Field((type) => Int)
  total: number;
  @Field((type) => [Item])
  items: Array<Item>;
  @Field()
  hasNextPage: boolean;
  @Field((type) => ID, { nullable: true })
  nextPageCursor?: string;
}

@ObjectType()
class Shelf {
  @Field((type) => ID)
  id: string;
  @Field()
  name: string;
  @Field((type) => Type)
  type: Pick<Type, "id">;
  @Field((type) => ItemPage)
  items: ItemPage;
}

@ObjectType()
class Type {
  @Field((type) => ItemType)
  id: ItemType;
  @Field()
  name: string;
  @Field((type) => ItemPage)
  items: ItemPage;
}

@Resolver(Item)
class ItemResolver {
  @Query((returns) => Item, { nullable: true })
  async item(
    @Arg("type", (type) => ItemType) type: ItemType,
    @Arg("id") id: string
  ): Promise<Item | null> {
    const data = await DataQuery.withId(type, id);
    return transformItem(data);
  }
}

@Resolver(Shelf)
class ShelfResolver implements ResolverInterface<Shelf> {
  @Query((returns) => Shelf, { nullable: true })
  async shelf(
    @Arg("type", (type) => ItemType) type: ItemType,
    @Arg("id") id: string
  ): Promise<Pick<Shelf, "id" | "type"> | null> {
    const data = await DataQuery.onShelf(type, id, { first: 0 });
    if (data.length) {
      return {
        id,
        type: {
          id: type,
        },
      };
    }
    return null;
  }

  @FieldResolver()
  name(@Root() { id }: Pick<Shelf, "id">) {
    return id;
  }

  @FieldResolver()
  async items(
    @Root() { type, id }: Pick<Shelf, "type" | "id">,
    @Arg("first") first: number,
    @Arg("after", { nullable: true }) after?: string
  ): Promise<ItemPage> {
    const data = await DataQuery.onShelf(type.id, id, { first, after });
    return {
      total: await DataQuery.countOnShelf(type.id, id),
      hasNextPage: !!data.lastKey,
      nextPageCursor: data.lastKey,
      items: data.map(transformItem),
    };
  }
}

@Resolver(Type)
class TypeResolver {
  @Query((returns) => Type)
  async type(
    @Arg("id", (type) => ItemType) id: ItemType
  ): Promise<Pick<Type, "id">> {
    return {
      id,
    };
  }

  @FieldResolver()
  name(@Root() root: Pick<Type, "id">) {
    return TYPE_NAME_MAP[root.id];
  }

  @FieldResolver()
  async items(
    @Root() { id }: Pick<Type, "id">,
    @Arg("first") first: number,
    @Arg("after", { nullable: true }) after?: string
  ): Promise<ItemPage> {
    const data = await DataQuery.ofType(id, { first, after });
    return {
      total: await DataQuery.countOfType(id),
      hasNextPage: !!data.lastKey,
      nextPageCursor: data.lastKey,
      items: data.map(transformItem),
    };
  }
}

function transformItem(input: ItemDocument): Item {
  return {
    ...input,
    type: {
      id: input.type,
    },
    shelf: {
      id: input.shelf,
      type: {
        id: input.type,
      },
    },
  };
}

export default buildSchema({
  resolvers: [ItemResolver, ShelfResolver, TypeResolver],
});
