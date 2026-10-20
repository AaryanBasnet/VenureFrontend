import { describe, expect, it } from "vitest";
import { activeChips, readFilters, toApiFilters } from "./venueFilters";

const read = (query) => readFilters(new URLSearchParams(query));

describe("venue type and space type filters", () => {
  it("reads a venue type and a kind of space separately", () => {
    expect(read("category=hotel-resort&spaceType=garden-estates")).toMatchObject({ category: "hotel-resort", spaceType: "garden-estates" });
  });

  it("drops values the API would refuse", () => {
    expect(read("category=castle&spaceType=castle")).toMatchObject({ category: "", spaceType: "" });
    expect(read("category=toString&spaceType=constructor")).toMatchObject({ category: "", spaceType: "" });
    expect(read("spaceType=hotel-resort")).toMatchObject({ spaceType: "" }); // a venue type is no kind of space
  });

  it("reads an older link such as ?category=garden-estates as the kind of space it is now", () => {
    expect(read("category=garden-estates")).toMatchObject({ category: "", spaceType: "garden-estates" });
    expect(read("category=garden-estates&spaceType=intimate-halls")).toMatchObject({ category: "", spaceType: "intimate-halls" });
  });

  it("sends both to the API, and shows a removable chip for each", () => {
    const filters = read("category=banquet-party-palace&spaceType=rooftop-terraces");
    expect(toApiFilters(filters)).toMatchObject({ category: "banquet-party-palace", spaceType: "rooftop-terraces" });
    expect(activeChips(filters).map((c) => [c.key, c.label])).toEqual([
      ["category", "Banquet hall and party palace"],
      ["spaceType", "Rooftop terrace"],
    ]);
    expect(activeChips(filters).find((c) => c.key === "spaceType").clear).toEqual({ spaceType: "" });
    expect(toApiFilters(read(""))).toMatchObject({ category: undefined, spaceType: undefined });
  });
});
