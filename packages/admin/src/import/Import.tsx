import {
  ReactElement,
  useCallback,
  useMemo,
  useState,
  cloneElement,
  Children,
} from "react";
import {
  SaveButton,
  SaveContextProvider,
  Toolbar,
  useDataProvider,
  useNotify,
  useRedirect,
  useResourceContext,
} from "react-admin";
import Icon from "@material-ui/icons/Input";

const ImportToolbar = (props: any) => (
  <Toolbar {...props}>
    <SaveButton label="Import" icon={<Icon />} />
  </Toolbar>
);

export default function Import({ children }: { children: ReactElement }) {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();
  const resource = useResourceContext();
  const basePath = `/${resource}`;
  const [saving, setSaving] = useState<boolean>(false);
  const handleSave = useCallback(
    (values) => {
      setSaving(true);
      dataProvider.import(resource, values, {
        onSuccess: ({ data }) => {
          setSaving(false);
          notify(`Imported ${data.title}`, "info");
          redirect("edit", basePath, data.id, data);
        },
        onFailure: () => {
          setSaving(false);
          notify("An issue occurred while importing.", "error");
        },
      });
      setSaving(false);
    },
    [dataProvider, notify, basePath, redirect, resource]
  );
  const saveContext = useMemo(
    () => ({
      save: handleSave,
      setOnFailure: () => {
        throw new Error("UNSUPPORTED setOnFailure");
      },
      saving,
    }),
    [saving, handleSave]
  );

  return (
    <SaveContextProvider value={saveContext}>
      {cloneElement(Children.only(children), {
        toolbar: <ImportToolbar />,
        save: handleSave,
        redirect: "show",
        mutationMode: "pessimistic",
      })}
    </SaveContextProvider>
  );
}
