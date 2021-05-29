import {
  CreateButton,
  sanitizeListRestProps,
  TopToolbar,
} from "react-admin";
import ImportButton from "../import/ImportButton";

export default function ListActions(props) {
  const { className, exporter, filters, maxResults, ...rest } = props;
  return (
    <TopToolbar className={className} {...sanitizeListRestProps(rest)}>
      <CreateButton />
      <ImportButton />
    </TopToolbar>
  );
}
