import { useCallback, useEffect, useState } from "react";
import { useDataProvider, useNotify, useResourceContext } from "react-admin";
import { Option } from "./Autocomplete";

export default function useSearchExternal<TOption extends Option = Option>({
  resource: resourceFromProp,
  defaultSearchTerm = "",
}: {
  resource?: string;
  defaultSearchTerm?: string;
} = {}) {
  const resourceFromContext = useResourceContext();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const [searchTerm, setSearchTerm] = useState(defaultSearchTerm);
  const [options, setOptions] = useState<TOption[]>([]);

  const resource = resourceFromProp ?? resourceFromContext;

  const performSearch = useCallback(
    (term) => {
      if (!term || term.length < 3) {
        return Promise.resolve({ data: [] });
      }
      return dataProvider.searchExternal(resource, {
        term,
      });
    },
    [dataProvider, resource]
  );

  useEffect(() => {
    let active = true;
    performSearch(searchTerm)
      ?.then(({ data }) => {
        if (active) {
          setOptions(data);
        }
      })
      .catch((err) => {
        notify("An issue occurred while searching.", "error");
      });
    return () => {
      active = false;
    };
  }, [searchTerm, notify, performSearch]);

  return {
    options,
    setSearchTerm,
  };
}
