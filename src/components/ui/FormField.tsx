import type { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function FormField({ label, id, ...inputProps }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base focus:border-primary focus:outline-none"
        {...inputProps}
      />
    </div>
  );
}
