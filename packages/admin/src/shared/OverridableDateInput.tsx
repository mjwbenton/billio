import { DateTimeInput } from "react-admin";
import { useFormState } from "react-final-form";

const OverridableDateInput = (props: any) => {
  const { values } = useFormState();
  const disabled = !(values?._overrideDates ?? false);
  return <DateTimeInput disabled={disabled} {...props} />;
};

export default OverridableDateInput;
