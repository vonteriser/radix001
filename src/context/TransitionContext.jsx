import { createContext, useContext } from "react";

// Shares the "radial expansion" navigation transition and the intro reveal flag.
//   revealed -> true once the intro tunnel has exited (Home wheel scales up)
//   burstTo(x, y, color, path) -> radial expansion overlay, then navigates
export const TransitionContext = createContext({
  revealed: true,
  burstTo: () => {},
});

export function useTransitionCtx() {
  return useContext(TransitionContext);
}
