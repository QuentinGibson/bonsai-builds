const GAME_FOLDER = "My Games\\Path of Exile 2\\BuildPlanner";

export function buildExportFilename(buildSetName: string, breakpointName: string): string {
  return `${buildSetName.replace(/~/g, "")}~${breakpointName.replace(/~/g, "")}.build`;
}

export function writeToGameFolder(filename: string, payload: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof overwolf === "undefined") {
      reject(new Error("Overwolf API unavailable"));
      return;
    }
    const basePath = overwolf.io.paths.documents;
    const fullPath = `${basePath}\\${GAME_FOLDER}\\${filename}`;
    overwolf.io.writeFileContents(
      fullPath,
      payload,
      overwolf.io.enums.eEncoding.UTF8,
      false,
      (result) => {
        if (result.success) {
          resolve();
        } else {
          reject(new Error((result as any).error ?? "Export to game failed"));
        }
      },
    );
  });
}
