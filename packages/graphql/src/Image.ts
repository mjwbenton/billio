import { Field, InputType, ObjectType } from "type-graphql";

@InputType("ImageSourceInput")
@ObjectType()
export class ImageSource {
  @Field()
  url: string;
  @Field()
  width: number;
  @Field()
  height: number;
}

@InputType("ImageInput")
@ObjectType()
export default class Image {
  @Field((type) => ImageSource)
  mainSource: ImageSource;
  @Field((type) => [ImageSource])
  sources: ImageSource[];
}
