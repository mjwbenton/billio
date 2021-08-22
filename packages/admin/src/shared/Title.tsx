export default function Title({ record }: { record?: { title: string } }) {
  return <span>{record?.title ?? ""}</span>;
}
