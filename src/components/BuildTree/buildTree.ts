import type { BuildSet } from "../../services/buildStorage";

export function sortedBuildsForTree(builds: BuildSet[]): BuildSet[] {
  return builds
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((build) => ({
      ...build,
      breakpoints: build.breakpoints.slice().sort((a, b) => a.order - b.order),
    }));
}
