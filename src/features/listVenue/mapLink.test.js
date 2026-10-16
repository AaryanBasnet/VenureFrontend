import { describe, expect, it } from "vitest";
import { coordsFromLink, isMapsLink } from "./mapLink";

describe("coordsFromLink", () => {
  it("reads the pin from the three shapes Google uses", () => {
    expect(coordsFromLink("https://www.google.com/maps/place/Bhaktapur/@27.6710,85.4298,15z")).toEqual({ lat: 27.671, lng: 85.4298 });
    expect(coordsFromLink("https://www.google.com/maps/place/X/data=!3d27.6915!4d85.3206")).toEqual({ lat: 27.6915, lng: 85.3206 });
    expect(coordsFromLink("https://www.google.com/maps?q=27.7172,85.324")).toEqual({ lat: 27.7172, lng: 85.324 });
    expect(coordsFromLink("https://www.google.com/maps?q=27.7172%2C85.324")).toEqual({ lat: 27.7172, lng: 85.324 });
  });

  it("keeps a negative sign", () => {
    expect(coordsFromLink("https://www.google.com/maps/@-33.8688,151.2093,12z")).toEqual({ lat: -33.8688, lng: 151.2093 });
  });

  it("returns null when there is no pin in the link, such as a short link", () => {
    expect(coordsFromLink("https://maps.app.goo.gl/AbCdEf123")).toBeNull();
    expect(coordsFromLink("")).toBeNull();
    expect(coordsFromLink()).toBeNull();
  });
});

describe("isMapsLink", () => {
  it("accepts Google Maps addresses", () => {
    for (const url of ["https://www.google.com/maps/place/x", "https://google.com/maps?q=1,2", "https://maps.google.com/?q=x", "https://maps.app.goo.gl/AbC", "http://goo.gl/maps/xyz", "  https://maps.app.goo.gl/AbC  "]) {
      expect(isMapsLink(url)).toBe(true);
    }
  });

  it("refuses everything else", () => {
    for (const url of ["", "maps.google.com", "https://evil.example/maps", "https://www.google.com/search?q=maps", "javascript:alert(1)", "https://maps.google.com.evil.example/x"]) {
      expect(isMapsLink(url)).toBe(false);
    }
  });
});
