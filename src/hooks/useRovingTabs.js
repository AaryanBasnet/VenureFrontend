import { useCallback } from "react";

// WAI-ARIA tabs pattern for a list of buttons with role="tab":
// only the selected tab is in the Tab order; Left/Right (Up/Down), Home and End move focus and selection.
//
//   const tabs = useRovingTabs({ ids: ["a", "b"], selected, onSelect: setSelected, idFor: (id) => `tab-${id}` });
//   <div role="tablist" {...tabs.listProps}> <button role="tab" {...tabs.tabProps("a")}>...
//
// idFor gives each tab button's DOM id, so focus can follow the selection.
export function useRovingTabs({ ids, selected, onSelect, idFor, orientation = "horizontal" }) {
  const onKeyDown = useCallback(
    (event) => {
      // Move from the tab that has focus (it can differ from the selected one, e.g. after a click elsewhere).
      const focused = event.target.closest?.('[role="tab"]');
      let index = focused ? ids.findIndex((id) => idFor(id) === focused.id) : -1;
      if (index === -1) index = ids.indexOf(selected);
      if (index === -1) return;
      const prevKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
      const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
      let next = null;
      if (event.key === nextKey) next = (index + 1) % ids.length;
      else if (event.key === prevKey) next = (index - 1 + ids.length) % ids.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = ids.length - 1;
      if (next === null) return;
      event.preventDefault();
      onSelect(ids[next]);
      document.getElementById(idFor(ids[next]))?.focus();
    },
    [ids, selected, onSelect, idFor, orientation],
  );

  return {
    listProps: { onKeyDown, "aria-orientation": orientation },
    tabProps: (id) => ({
      id: idFor(id),
      role: "tab",
      type: "button",
      "aria-selected": selected === id,
      tabIndex: selected === id ? 0 : -1,
      onClick: () => onSelect(id),
    }),
  };
}
