import type { TextareaHTMLAttributes } from "react";

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function FormTextarea({ label, id, rows = 3, ...textareaProps }: FormTextareaProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base focus:border-primary focus:outline-none"
        {...textareaProps}
      />
    </div>
  );
}
