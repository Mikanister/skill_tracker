import React, { useCallback, useMemo, useState } from 'react';

type Validators<T extends Record<string, unknown>> = Partial<{
  [K in keyof T]: (value: T[K], state: T) => string | null;
}>;

type Errors<T extends Record<string, unknown>> = Partial<Record<keyof T, string>>;

type RegisterFieldReturn<TValue> = {
  value: TValue;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | TValue) => void;
  onBlur: () => void;
};

function isInputEvent<TValue>(value: unknown): value is React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> {
  return Boolean(value) && typeof value === 'object' && 'target' in (value as Record<string, unknown>);
}

export function useFormState<T extends Record<string, unknown>>(initialValues: T, validators: Validators<T> = {}) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Errors<T>>({});

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues(prev => {
        const next = { ...prev, [field]: value };
        const validator = validators[field];
        if (validator) {
          const message = validator(next[field], next);
          setErrors(prevErrors => {
            if (!message) {
              if (!(field in prevErrors)) return prevErrors;
              const nextErrors: Errors<T> = { ...prevErrors };
              delete nextErrors[field];
              return nextErrors;
            }
            return { ...prevErrors, [field]: message };
          });
        } else {
          setErrors(prevErrors => {
            if (!(field in prevErrors)) return prevErrors;
            const nextErrors: Errors<T> = { ...prevErrors };
            delete nextErrors[field];
            return nextErrors;
          });
        }
        return next;
      });
    },
    [validators]
  );

  const setValuesBatch = useCallback((nextValues: Partial<T>) => {
    setValues(prev => {
      const next = { ...prev, ...nextValues };
      return next;
    });
    setErrors(prevErrors => {
      if (!Object.keys(prevErrors).length) return prevErrors;
      const copy: Errors<T> = { ...prevErrors };
      const merged = { ...values, ...nextValues } as T;
      for (const key of Object.keys(nextValues) as Array<keyof T>) {
        const validator = validators[key];
        if (!validator) {
          delete copy[key];
          continue;
        }
        const message = validator(merged[key], merged);
        if (message) copy[key] = message;
        else delete copy[key];
      }
      return copy;
    });
  }, [validators, values]);

  const reset = useCallback((nextValues?: Partial<T>) => {
    setValues({ ...initialValues, ...nextValues } as T);
    setErrors({});
  }, [initialValues]);

  const validate = useCallback(() => {
    if (!validators || Object.keys(validators).length === 0) {
      return true;
    }
    const nextErrors: Errors<T> = {};
    for (const key of Object.keys(validators) as Array<keyof T>) {
      const validator = validators[key];
      if (!validator) continue;
      const message = validator(values[key], values);
      if (message) {
        nextErrors[key] = message;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [validators, values]);

  const registerField = useCallback(
    <K extends keyof T>(field: K): RegisterFieldReturn<T[K]> => ({
      value: values[field],
      onChange: event => {
        const nextValue = isInputEvent<T[K]>(event)
          ? (event.target as HTMLInputElement | HTMLTextAreaElement).value
          : event;
        setValue(field, nextValue as T[K]);
      },
      onBlur: () => {
        const validator = validators[field];
        if (!validator) return;
        const message = validator(values[field], values);
        setErrors(prevErrors => {
          if (!message) {
            if (!(field in prevErrors)) return prevErrors;
            const nextErrors: Errors<T> = { ...prevErrors };
            delete nextErrors[field];
            return nextErrors;
          }
          return { ...prevErrors, [field]: message };
        });
      }
    }),
    [setValue, validators, values]
  );

  const touchedErrors = useMemo(() => errors, [errors]);

  const clearErrors = useCallback(() => setErrors({}), []);

  return {
    values,
    errors: touchedErrors,
    setValue,
    setValues: setValuesBatch,
    reset,
    validate,
    registerField,
    clearErrors
  };
}
