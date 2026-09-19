"use client";

import type { ButtonHTMLAttributes } from "react";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  type = "submit",
  ...buttonProps
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type={type}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...buttonProps}
    />
  );
}
