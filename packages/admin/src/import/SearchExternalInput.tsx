import { useInput } from "react-admin";
import Autocomplete from "../shared/Autocomplete";
import useSearchExternal from "../shared/useSearchExternal";
import { Box } from "@material-ui/core";

export default function SearchExternalInput({ source }: { source: string }) {
  const { options, setSearchTerm } = useSearchExternal();

  const {
    input: { name, onChange },
    meta: { touched, error },
  } = useInput({ source });

  return (
    <Box sx={{ mb: 3 }}>
      <Autocomplete
        options={options}
        filterByTitle={false}
        onSelection={(option) => {
          onChange(option?.id);
        }}
        onInputChange={(value) => {
          setSearchTerm(value);
        }}
        label="search"
        name={name}
        error={!!(touched && error)}
      />
    </Box>
  );
}
