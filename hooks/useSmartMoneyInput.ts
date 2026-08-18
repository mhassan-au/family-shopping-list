"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatFlexibleMoneyInput,
  parseFlexibleMoneyInput,
} from "@/lib/validation";

const FORMAT_DELAY_MS = 500;

export function useSmartMoneyInput(initialValue = "") {
  const [value, setValueState] = useState(initialValue);
  const [shiftedRight, setShiftedRight] = useState(false);
  const formatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (formatTimer.current) {
      clearTimeout(formatTimer.current);
      formatTimer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const setValue = useCallback(
    (nextValue: string) => {
      clearTimer();
      setValueState(nextValue);
      setShiftedRight(false);

      const digitCount = nextValue.replace(/[-.]/g, "").length;
      if (!nextValue.includes(".") && digitCount > 0) {
        formatTimer.current = setTimeout(() => {
          setValueState(formatFlexibleMoneyInput(nextValue));
          formatTimer.current = null;
        }, FORMAT_DELAY_MS);
      }
    },
    [clearTimer],
  );

  const formatOnBlur = useCallback(() => {
    clearTimer();
    setValueState((currentValue) => formatFlexibleMoneyInput(currentValue));
  }, [clearTimer]);

  const shiftDecimal = useCallback(() => {
    if (shiftedRight || !value.trim()) return;

    clearTimer();
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return;

    setValueState(
      value.includes(".")
        ? (numericValue * 100).toFixed(2)
        : numericValue.toFixed(2),
    );
    setShiftedRight(true);
  }, [clearTimer, shiftedRight, value]);

  return {
    value,
    setValue,
    formatOnBlur,
    shiftDecimal,
    canShift: Boolean(value.trim()) && !shiftedRight,
    parsedValue: parseFlexibleMoneyInput(value),
  };
}
