import "@testing-library/jest-dom";

// jsdom doesn't ship PointerEvent; Base UI's Checkbox dispatches it internally
if (typeof global.PointerEvent === "undefined") {
  global.PointerEvent = MouseEvent as typeof PointerEvent;
}
