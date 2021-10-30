import { useState } from "react";
import { useInput } from "react-admin";
import Autocomplete, { Option } from "../shared/Autocomplete";
import useSearchExternal from "../shared/useSearchExternal";

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
  const { options: seriesOptions, setSearchTerm } =
    useSearchExternal<SeriesOption>({
      resource: SERIES_RESOURCE,
    });

  const [selectedSeries, setSelectedSeries] = useState<SeriesOption | null>(
    null
  );
  const seasonIdInput = useInput({ source: "id" });

  const seasonOptions: Array<Option> =
    selectedSeries?.seasons.map(
      ({ id, seasonTitle, seasonNumber, imageUrl }) => ({
        id,
        title: `Season ${seasonNumber}`,
        subtitle: seasonTitle,
        imageUrl,
      })
    ) ?? [];

  return (
    <>
      <Autocomplete<SeriesOption>
        options={seriesOptions}
        filterByTitle={false}
        onSelection={(option) => {
          setSelectedSeries(option);
        }}
        onInputChange={(value: string) => {
          setSearchTerm(value);
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
