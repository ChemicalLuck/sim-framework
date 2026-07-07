import {
  type DefaultValues,
  type UseFormReturn,
  useForm,
} from 'react-hook-form';

export function useAddForm<T extends Record<string, unknown>>(
  defaultValues: T,
  onAdd: (values: T) => void,
): { form: UseFormReturn<T>; submit: () => void } {
  const form = useForm<T>({ defaultValues: defaultValues as DefaultValues<T> });

  function submit() {
    void form.handleSubmit((values) => {
      onAdd(values);
      form.reset();
    })();
  }

  return { form, submit };
}
