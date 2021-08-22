import Autocomplete from "@material-ui/lab/Autocomplete";
import { useEffect, useMemo, useState } from "react";
import {
  useInput,
  useDataProvider,
  useNotify,
  useResourceContext,
} from "react-admin";
import TextField from "@material-ui/core/TextField";
import { Grid, Typography } from "@material-ui/core";
import throttle from "lodash.throttle";

const THROTTLE_MS = 100;

interface Option {
  readonly id: string;
  readonly title: string;
}

export default function SearchExternalInput<TOption extends Option>({
  source,
  option: OptionComponent = DefaultOptionDisplay,
}: {
  source: string;
  option?: React.ComponentType<TOption>;
}) {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const resource = useResourceContext();
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<TOption[]>([]);
  const {
    input: { name, onChange },
    meta: { touched, error },
  } = useInput({ source });

  const throttledFetch = useMemo(
    () =>
      throttle((term, callbacks) => {
        dataProvider.searchExternal(resource, { term }, callbacks);
      }, THROTTLE_MS),
    [dataProvider, resource]
  );

  useEffect(() => {
    if (!inputValue || inputValue.length < 3) {
      setOptions([]);
      return;
    }
    const term = inputValue;
    throttledFetch(term, {
      onSuccess: ({ data }) => {
        if (term === inputValue) {
          setOptions(data);
        }
      },
      onFailure: () => {
        if (term === inputValue) {
          setOptions([]);
          notify("An issue occurred while searching.", "error");
        }
      },
    });
  }, [inputValue, notify, throttledFetch]);

  return (
    <Autocomplete<TOption>
      options={options}
      autoComplete
      filterSelectedOptions
      onChange={(_, value) => {
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

const DefaultOptionDisplay = ({
  title,
  subtitle,
  imageUrl,
}: {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
}) => (
  <Grid container alignItems="center" spacing={2}>
    <Grid item xs={4}>
      {imageUrl ? (
        <img
          src={imageUrl!}
          alt={title}
          style={{ maxWidth: "75px", width: "100%;" }}
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
