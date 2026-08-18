"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatFlexibleMoneyInput,
  parseFlexibleMoneyInput,
} from "@/lib/validation";

const FORMAT_DELAY_MS = 500;

export function useSmartMoneyInput(initialValue = "") {
  const [value, setValueState] = useState(initialValue);
  const [shifted, setShifted] = useState(false);
  const [explicitDecimal, setExplicitDecimal] = useState(
    initialValue.includes("."),
  );
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
      setShifted(false);
      setExplicitDecimal(nextValue.includes("."));

      const digitCount = nextValue.replace(/[-.]/g, "").length;
      if (!nextValue.includes(".") && digitCount >= 4) {
        formatTimer.current = setTimeout(() => {
          setValueState(formatFlexibleMoneyInput(nextValue));
          setShifted(true);
          formatTimer.current = null;
        }, FORMAT_DELAY_MS);
      }
    },
    [clearTimer],
  );

  const formatOnBlur = useCallback(() => {
    clearTimer();
    setValueState((currentValue) => {
      const digitCount = currentValue.replace(/[-.]/g, "").length;
      if (!currentValue.includes(".") && digitCount >= 4) {
        setShifted(true);
      }
      return formatFlexibleMoneyInput(currentValue);
    });
  }, [clearTimer]);

  const shiftDecimal = useCallback(() => {
    if (shifted || explicitDecimal || !value.trim()) return;

    clearTimer();
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return;

    setValueState((numericValue / 100).toFixed(2));
    setShifted(true);
  }, [clearTimer, explicitDecimal, shifted, value]);

  return {
    value,
    setValue,
    formatOnBlur,
    shiftDecimal,
    canShift: Boolean(value.trim()) && !shifted && !explicitDecimal,
    parsedValue: parseFlexibleMoneyInput(value),
  };
}
