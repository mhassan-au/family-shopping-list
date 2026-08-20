"use client";

import { useCallback, useState } from "react";
import {
  formatFlexibleMoneyInput,
  parseFlexibleMoneyInput,
} from "@/lib/validation";

export function useSmartMoneyInput(initialValue = "") {
  const [value, setValueState] = useState(initialValue);
  const [shiftedRight, setShiftedRight] = useState(false);

  const setValue = useCallback(
    (nextValue: string) => {
      setValueState(nextValue);
      setShiftedRight(false);
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
  }, [shiftedRight, value]);

  return {
    value,
    setValue,
    formatOnBlur,
    shiftDecimal,
    canShift: Boolean(value.trim()) && !shiftedRight,
    parsedValue: parseFlexibleMoneyInput(value),
  };
}
