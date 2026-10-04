"use client";

import { useId, type ChangeEvent, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./styles.module.scss";

const DEFAULT_ROWS = 3;
/** Visual required marker; screen readers get `required` on the control instead. */
const REQUIRED_MARK = " *";

type TextFieldProps = {
  label: string;
  /** "pill" is the compact rounded input used in composers (e.g. the chatbot). */
  variant?: "outlined" | "pill";
  /** Keeps the label for screen readers but hides it visually. */
  hideLabel?: boolean;
  placeholder?: string;
  /** Rendered inside the field box after the input (e.g. a send button). */
  endAdornment?: ReactNode;
  name: string;
  /** Omit both for an uncontrolled field (e.g. a plain form posting to a Server Action). */
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: "text" | "email" | "password";
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  spellCheck?: boolean;
  multiline?: boolean;
  minRows?: number;
  maxLength?: number;
  error?: boolean;
  helperText?: string;
  className?: string;
};

type ControlProps = Pick<
  TextFieldProps,
  "name" | "value" | "onChange" | "required" | "disabled" | "maxLength" | "placeholder" | "multiline" | "minRows" | "type" | "autoComplete" | "spellCheck"
> & { id: string; describedBy?: string; invalid: boolean };

/** The <input> or <textarea> itself. */
function FieldControl({ id, describedBy, invalid, multiline, minRows = DEFAULT_ROWS, type = "text", autoComplete, spellCheck, ...rest }: Readonly<ControlProps>) {
  const shared = {
    ...rest,
    id,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    className: styles["field__control"],
  };
  return multiline ? (
    <textarea {...shared} rows={minRows} />
  ) : (
    <input {...shared} type={type} autoComplete={autoComplete} spellCheck={spellCheck} />
  );
}

/** Labelled input / textarea with helper and error text, wired for screen readers. */
export default function TextField({
  label,
  variant = "outlined",
  hideLabel = false,
  endAdornment,
  required = false,
  error = false,
  helperText,
  className,
  ...control
}: Readonly<TextFieldProps>) {
  const id = useId();
  const helperId = `${id}-helper`;

  return (
    <div className={clsx(styles.field, variant === "pill" && styles["field--pill"], error && styles["field--error"], className)}>
      <label htmlFor={id} className={clsx(styles["field__label"], hideLabel && styles["field__label--hidden"])}>
        {label}
        {required && <span aria-hidden="true">{REQUIRED_MARK}</span>}
      </label>
      <div className={styles["field__box"]}>
        <FieldControl
          {...control}
          id={id}
          required={required}
          invalid={error}
          describedBy={helperText ? helperId : undefined}
        />
        {endAdornment}
      </div>
      {helperText && (
        <p id={helperId} className={styles["field__helper"]} role={error ? "alert" : undefined}>
          {helperText}
        </p>
      )}
    </div>
  );
}
