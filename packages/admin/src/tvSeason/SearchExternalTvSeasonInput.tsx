import { useCallback, useEffect, useState } from "react";
import { useInput, useDataProvider, useNotify } from "react-admin";
import Autocomplete, { Option } from "../shared/Autocomplete";

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
      <Autocomplete
        options={seriesOptions}
        filterByTitle={false}
        onSelection={(option) => {
          // TODO: Clean up cast
          setSelectedSeries(option as SeriesOption);
        }}
        onInputChange={(value: string) => {
          setSeriesInputValue(value);
        }}
        label="Search Series"
      />
      <Autocomplete
        options={seasonOptions}
        filterByTitle={true}
        onSelection={(option) => {
          seasonIdInput.input.onChange(option?.id ?? null);
        }}
        error={!!(seasonIdInput.meta.touched && seasonIdInput.meta.error)}
        name={seasonIdInput.input.name}
        label="Season"
        disabled={seasonOptions.length === 0}
      />
    </>
  );
}
