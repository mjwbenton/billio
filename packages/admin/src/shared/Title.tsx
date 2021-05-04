export default function Title({
  base,
  record,
}: {
  base: string;
  record?: { title: string };
}) {
  if (record) {
    return (
      <span>
        {base}: {record.title}
      </span>
    );
  }
  return <span>{base}</span>;
}
