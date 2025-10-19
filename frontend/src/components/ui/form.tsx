import React, { forwardRef, useId } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Icons } from "./icons";

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  fullWidth?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  helpText?: string;
}

export interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  error?: string;
  required?: boolean;
  className?: string;
}

// ============================================================================
// FORM FIELD COMPONENT
// ============================================================================

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  helpText,
  children,
  className,
}) => {
  const fieldId = useId();
  const errorId = useId();
  const helpId = useId();

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {React.isValidElement(children)
          ? React.cloneElement(children, {
              id: fieldId,
              "aria-describedby": cn(error && errorId, helpText && helpId),
              "aria-invalid": !!error,
            })
          : children}
      </div>

      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="flex items-center text-sm text-red-600"
        >
          <Icons.alertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      error = false,
      leftIcon,
      rightIcon,
      fullWidth = true,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50";
    const errorClasses = error
      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
      : "";
    const widthClasses = fullWidth ? "w-full" : "";
    const iconClasses = leftIcon ? "pl-10" : rightIcon ? "pr-10" : "";

    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}

        <input
          type={type}
          className={cn(
            baseClasses,
            errorClasses,
            widthClasses,
            iconClasses,
            className
          )}
          ref={ref}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, fullWidth = true, ...props }, ref) => {
    const baseClasses =
      "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50";
    const errorClasses = error
      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
      : "";
    const widthClasses = fullWidth ? "w-full" : "";

    return (
      <textarea
        className={cn(baseClasses, errorClasses, widthClasses, className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

// ============================================================================
// SELECT COMPONENT
// ============================================================================

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      error = false,
      fullWidth = true,
      options,
      placeholder,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50";
    const errorClasses = error
      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
      : "";
    const widthClasses = fullWidth ? "w-full" : "";

    return (
      <select
        className={cn(baseClasses, errorClasses, widthClasses, className)}
        ref={ref}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = "Select";

// ============================================================================
// CHECKBOX COMPONENT
// ============================================================================

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error = false, helpText, ...props }, ref) => {
    const checkboxId = useId();
    const helpId = useId();

    return (
      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id={checkboxId}
            className={cn(
              "h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2",
              error && "border-red-500 focus:ring-red-500",
              className
            )}
            ref={ref}
            {...props}
          />
          <div className="flex-1">
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              {label}
            </label>
            {helpText && (
              <p id={helpId} className="text-sm text-gray-500 mt-1">
                {helpText}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

// ============================================================================
// RADIO GROUP COMPONENT
// ============================================================================

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  className,
}) => {
  const groupId = useId();
  const errorId = useId();

  return (
    <div className={cn("space-y-3", className)}>
      <fieldset>
        <legend className="sr-only">
          {name} {required && <span className="text-red-500">*</span>}
        </legend>

        <div
          role="radiogroup"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
        >
          {options.map((option) => {
            const optionId = `${groupId}-${option.value}`;
            return (
              <div key={option.value} className="flex items-center space-x-3">
                <input
                  type="radio"
                  id={optionId}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    "h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2",
                    error && "border-red-500 focus:ring-red-500"
                  )}
                />
                <label
                  htmlFor={optionId}
                  className={cn(
                    "text-sm font-medium cursor-pointer",
                    option.disabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700"
                  )}
                >
                  {option.label}
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="flex items-center text-sm text-red-600"
        >
          <Icons.alertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// FORM COMPONENT
// ============================================================================

export interface FormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  showActions?: boolean;
}

export const Form: React.FC<FormProps> = ({
  children,
  onSubmit,
  loading = false,
  submitText = "Submit",
  cancelText = "Cancel",
  onCancel,
  showActions = true,
  className,
  ...props
}) => {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(event);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-6", className)}
      noValidate
      {...props}
    >
      {children}

      {showActions && (
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
          )}
          <Button type="submit" loading={loading} disabled={loading}>
            {submitText}
          </Button>
        </div>
      )}
    </form>
  );
};
