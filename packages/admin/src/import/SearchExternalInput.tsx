import Autocomplete from "@material-ui/lab/Autocomplete";
import { useCallback, useEffect, useState } from "react";
import {
  useInput,
  useDataProvider,
  useNotify,
  useResourceContext,
} from "react-admin";
import TextField from "@material-ui/core/TextField";
import { Grid, Typography } from "@material-ui/core";

interface Option {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly imageUrl: string | null;
}

export default function SearchExternalInput({ source }: { source: string }) {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const resource = useResourceContext();

  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
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
          setOptions(selectedOption ? [selectedOption, ...data] : data);
        }
      })
      .catch((err) => {
        notify("An issue occurred while searching.", "error");
      });
    return () => {
      active = false;
    };
  }, [inputValue, selectedOption, notify, performSearch]);

  return (
    <Autocomplete<Option>
      options={options}
      autoComplete
      filterSelectedOptions={false}
      filterOptions={(x) => x}
      onChange={(_, value) => {
        setSelectedOption(value);
        setOptions(value ? [value, ...options] : options);
        onChange(value?.id ?? null);
      }}
      onInputChange={(_: any, newInputValue: string) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search"
          variant="filled"
          name={name}
          error={!!(touched && error)}
        />
      )}
      getOptionLabel={(option) => option.title}
      renderOption={(option) => <OptionComponent {...option} />}
    />
  );
}

const OptionComponent = ({ title, subtitle, imageUrl }: Option) => {
  return (
    <Grid container alignItems="center" spacing={2}>
      <Grid item xs={4}>
        {imageUrl ? (
          <img
            src={imageUrl!}
            alt={title}
            style={{ maxWidth: "75px", width: "100%" }}
          />
        ) : (
          <div />
        )}
      </Grid>
      <Grid item xs={8} container direction="column" spacing={2}>
        <Grid item>{title}</Grid>
        {subtitle ? (
          <Grid item>
            <Typography variant="body2">{subtitle}</Typography>
          </Grid>
        ) : null}
      </Grid>
    </Grid>
  );
};
