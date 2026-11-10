import { describe, it, expect, jest } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useHourTick } from "../use-clock";
import { setTimeOverride } from "../date-utils";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("useHourTick", () => {
  it("fires when the hour or day changes, not every minute", () => {
    jest.useFakeTimers();
    setTimeOverride({ month: 12, day: 7, hour: 19, minute: 58 });
    const onChange = jest.fn();
    function Probe() {
      useHourTick(onChange);
      return null;
    }
    act(() => createRoot(document.createElement("div")).render(<Probe />));

    act(() => jest.advanceTimersByTime(60_000));
    expect(onChange).not.toHaveBeenCalled();

    setTimeOverride({ month: 12, day: 7, hour: 20, minute: 0 });
    act(() => jest.advanceTimersByTime(60_000));
    expect(onChange).toHaveBeenCalledTimes(1);

    setTimeOverride({ month: 12, day: 8, hour: 0, minute: 0 });
    act(() => jest.advanceTimersByTime(60_000));
    expect(onChange).toHaveBeenCalledTimes(2);

    setTimeOverride(null);
    jest.useRealTimers();
  });
});
