import { useCallback, useEffect, useState } from "react";
import {
  useInput,
  useDataProvider,
  useNotify,
  useResourceContext,
} from "react-admin";
import Autocomplete, { Option } from "../shared/Autocomplete";

export default function SearchExternalInput({ source }: { source: string }) {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const resource = useResourceContext();

  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<Option[]>([]);

  const {
    input: { name, onChange },
    meta: { touched, error },
  } = useInput({ source });

  const performSearch = useCallback(
    (term) => {
      if (!term || term.length < 3) {
        return Promise.resolve({ data: [] });
      }
      return dataProvider.searchExternal(resource, { term });
    },
    [dataProvider, resource]
  );

  useEffect(() => {
    let active = true;
    performSearch(inputValue)
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
  }, [inputValue, notify, performSearch]);

  return (
    <Autocomplete
      options={options}
      filterByTitle={false}
      onSelection={(option) => {
        onChange(option?.id);
      }}
      onInputChange={(value) => {
        setInputValue(value);
      }}
      label="search"
      name={name}
      error={!!(touched && error)}
    />
  );
}
