import { Field, InputType, ObjectType } from "type-graphql";

@InputType("ImageInput")
@ObjectType()
export default class Image {
  @Field()
  url: string;
  @Field((type) => Number, { nullable: true })
  width: number | null;
  @Field((type) => Number, { nullable: true })
  height: number | null;
}
