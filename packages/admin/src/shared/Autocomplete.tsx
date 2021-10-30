import { Grid, TextField, Typography } from "@material-ui/core";
import MaterialAutocomplete from "@material-ui/lab/Autocomplete";
import { useState } from "react";

export interface Option {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly imageUrl: string | null;
}

interface Props {
  readonly options: Array<Option>;
  readonly filterByTitle: boolean;
  readonly label: string;
  readonly onSelection?: (option: Option | null) => void;
  readonly onInputChange?: (value: string) => void;
  readonly name?: string;
  readonly error?: boolean;
  readonly disabled?: boolean;
}

export default function Autocomplete({
  options,
  filterByTitle,
  onSelection,
  onInputChange,
  label,
  name,
  error,
  disabled,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  return (
    <MaterialAutocomplete<Option>
      options={selectedOption ? [selectedOption, ...options] : options}
      autoComplete
      filterSelectedOptions={false}
      {...(!filterByTitle ? { filterOptions: (x) => x } : {})}
      onChange={(_, value) => {
        setSelectedOption(value);
        onSelection?.(value);
      }}
      onInputChange={(_, value) => {
        onInputChange?.(value);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="filled"
          label={label}
          name={name}
          error={error}
          disabled={disabled}
        />
      )}
      getOptionLabel={(option) => option.title}
      getOptionSelected={(option, value) => option.id === value.id}
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
