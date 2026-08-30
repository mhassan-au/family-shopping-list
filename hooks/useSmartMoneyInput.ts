"use client";

import { useCallback, useState } from "react";
import {
  formatFlexibleMoneyInput,
  parseFlexibleMoneyInput,
} from "@/lib/validation";

export function useSmartMoneyInput(initialValue = "") {
  const [value, setValueState] = useState(initialValue);
  const [shiftedRight, setShiftedRight] = useState(false);
  const [wholeNumberDigits, setWholeNumberDigits] = useState<string | null>(
    /^\d+$/.test(initialValue) ? initialValue : null,
  );

  const setValue = useCallback(
    (nextValue: string) => {
      setValueState(nextValue);
      setShiftedRight(false);
      setWholeNumberDigits(/^\d+$/.test(nextValue) ? nextValue : null);
    },
    [],
  );

  const formatOnBlur = useCallback(() => {
    setValueState((currentValue) => formatFlexibleMoneyInput(currentValue));
  }, []);

  const shiftDecimal = useCallback(() => {
    if (shiftedRight || !value.trim()) return;

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return;

    setValueState(
      value.includes(".")
        ? (numericValue * 100).toFixed(2)
        : numericValue.toFixed(2),
    );
    setShiftedRight(true);
    setWholeNumberDigits(null);
  }, [shiftedRight, value]);

  const wholeNumberValue = wholeNumberDigits ? Number(wholeNumberDigits) : 0;
  const ambiguousValues = wholeNumberValue > 0
    ? { whole: wholeNumberValue, cents: wholeNumberValue / 100 }
    : null;

  return {
    value,
    setValue,
    formatOnBlur,
    shiftDecimal,
    canShift: Boolean(value.trim()) && !shiftedRight,
    parsedValue: parseFlexibleMoneyInput(value),
    ambiguousValues,
  };
}
