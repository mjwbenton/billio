import Autocomplete from "@material-ui/lab/Autocomplete";
import { useCallback, useEffect, useState } from "react";
import { useInput, useDataProvider, useNotify } from "react-admin";
import TextField from "@material-ui/core/TextField";
import { Grid, Typography } from "@material-ui/core";

interface Option {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly imageUrl: string | null;
}

type SeriesOption = Option & {
  readonly seasons: Array<{
    readonly id: string;
    readonly seasonTitle: string | null;
    readonly seasonNumber: number;
    readonly imageUrl: string | null;
  }>;
};

const SERIES_RESOURCE = "TvSeries";

export default function SearchExternalInput() {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const [selectedSeries, setSelectedSeries] = useState<SeriesOption | null>(
    null
  );
  const [seriesInputValue, setSeriesInputValue] = useState("");
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);

  const seasonIdInput = useInput({ source: "id" });

  const performSearch = useCallback(
    (term) => {
      if (!term || term.length < 3) {
        return Promise.resolve({ data: [] });
      }
      return dataProvider.searchExternal(SERIES_RESOURCE, { term });
    },
    [dataProvider]
  );

  const seasonOptions: Array<Option> =
    selectedSeries?.seasons.map(
      ({ id, seasonTitle, seasonNumber, imageUrl }) => ({
        id,
        title: `Season ${seasonNumber}`,
        subtitle: seasonTitle,
        imageUrl,
      })
    ) ?? [];

  useEffect(() => {
    let active = true;
    performSearch(seriesInputValue)
      ?.then(({ data }) => {
        if (active) {
          setSeriesOptions(selectedSeries ? [selectedSeries, ...data] : data);
        }
      })
      .catch((err) => {
        notify("An issue occurred while searching.", "error");
      });
    return () => {
      active = false;
    };
  }, [seriesInputValue, selectedSeries, notify, performSearch]);

  return (
    <>
      <Autocomplete<SeriesOption>
        options={seriesOptions}
        autoComplete
        filterSelectedOptions={false}
        filterOptions={(x) => x}
        onChange={(_, value) => {
          setSelectedSeries(value);
          setSeriesOptions(value ? [value, ...seriesOptions] : seriesOptions);
        }}
        onInputChange={(_: any, newInputValue: string) => {
          setSeriesInputValue(newInputValue);
        }}
        renderInput={(params) => (
          <TextField {...params} label="Search Series" variant="filled" />
        )}
        getOptionLabel={(option) => option.title}
        renderOption={(option) => <OptionComponent {...option} />}
      />
      <Autocomplete<Option>
        options={seasonOptions}
        autoComplete
        filterSelectedOptions={false}
        //filterOptions={(x) => x}
        onChange={(_, value) => {
          seasonIdInput.input.onChange(value?.id ?? null);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Season"
            variant="filled"
            name={seasonIdInput.input.name}
            error={!!(seasonIdInput.meta.touched && seasonIdInput.meta.error)}
          />
        )}
        getOptionSelected={(option, value) => option.id === value.id}
        getOptionLabel={(option) => option.title}
        renderOption={(option) => <OptionComponent {...option} />}
        disabled={seasonOptions.length === 0}
      />
    </>
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
