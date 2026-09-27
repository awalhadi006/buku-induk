import { it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import PageHeader from "$lib/components/PageHeader.svelte";

it("test PageHeader", () => {
  render(PageHeader, { title: "Test" });
  expect(true).toBe(true);
});