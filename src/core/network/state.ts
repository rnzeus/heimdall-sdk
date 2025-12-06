import { NetworkFilters } from "./types";

let patched = false;
let filters: NetworkFilters = {};

export function getFilters(): NetworkFilters {
  return filters;
}

export function setFilters(value: NetworkFilters) {
  filters = value;
}

export function isPatched(): boolean {
  return patched;
}

export function setPatched(value: boolean) {
  patched = value;
}
