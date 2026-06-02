import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildExportFilename, writeToGameFolder } from "./overwolfFs";

describe("buildExportFilename", () => {
  it("strips ~ from both name parts and joins with ~ and .build", () => {
    expect(buildExportFilename("My~Build", "Level~30")).toBe("MyBuild~Level30.build");
  });

  it("leaves names without ~ unchanged", () => {
    expect(buildExportFilename("Shield Wall", "Early Game")).toBe("Shield Wall~Early Game.build");
  });

  it("strips multiple tildes from both parts", () => {
    expect(buildExportFilename("A~B~C", "D~E")).toBe("ABC~DE.build");
  });
});

describe("writeToGameFolder", () => {
  const mockWriteFileContents = vi.fn();

  beforeEach(() => {
    (globalThis as any).overwolf = {
      io: {
        writeFileContents: mockWriteFileContents,
        paths: { documents: "C:\\Users\\Test\\Documents" },
        enums: { eEncoding: { UTF8: "UTF8" } },
      },
    };
  });

  afterEach(() => {
    delete (globalThis as any).overwolf;
    vi.resetAllMocks();
  });

  it("resolves when Overwolf reports success", async () => {
    mockWriteFileContents.mockImplementation((_path: string, _content: string, _enc: string, _uac: boolean, cb: (r: { success: boolean }) => void) => {
      cb({ success: true });
    });

    await expect(writeToGameFolder("test.build", '{"name":"test"}')).resolves.toBeUndefined();
  });

  it("rejects when Overwolf reports failure", async () => {
    mockWriteFileContents.mockImplementation((_path: string, _content: string, _enc: string, _uac: boolean, cb: (r: { success: boolean; error?: string }) => void) => {
      cb({ success: false, error: "Permission denied" });
    });

    await expect(writeToGameFolder("test.build", '{"name":"test"}')).rejects.toThrow("Permission denied");
  });

  it("rejects with Overwolf API unavailable when overwolf global is absent", async () => {
    delete (globalThis as any).overwolf;

    await expect(writeToGameFolder("test.build", '{"name":"test"}')).rejects.toThrow("Overwolf API unavailable");
  });

  it("passes the correct full path to writeFileContents", async () => {
    mockWriteFileContents.mockImplementation((_path: string, _content: string, _enc: string, _uac: boolean, cb: (r: { success: boolean }) => void) => {
      cb({ success: true });
    });

    await writeToGameFolder("MyBuild~Level30.build", '{"name":"test"}');

    expect(mockWriteFileContents).toHaveBeenCalledWith(
      "C:\\Users\\Test\\Documents\\My Games\\Path of Exile 2\\BuildPlanner\\MyBuild~Level30.build",
      '{"name":"test"}',
      "UTF8",
      false,
      expect.any(Function),
    );
  });
});
