import { buildExportFilename, downloadCsvFile, exportToCSV, toCsvString } from "@/utils/exportToCSV";

describe("exportToCSV coverage", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-05-12T10:00:00.000Z"));
    URL.createObjectURL = jest.fn(() => "blob:csv");
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  it("converts rows to CSV using inferred and explicit columns", () => {
    expect(toCsvString([])).toBe("");

    expect(
      toCsvString([
        { name: "Kago", note: "plain", active: true },
        { name: "Naledi, Jr.", note: 'Said "hello"\nagain', active: false },
      ]),
    ).toBe('name,note,active\nKago,plain,true\n"Naledi, Jr.","Said ""hello""\nagain",false');

    expect(
      toCsvString(
        [{ first: "A", second: 2, ignored: "x" }],
        [
          { key: "second", label: "Second Value" },
          { key: "missing", label: "Missing" },
          { key: "first", label: "First Value" },
        ],
      ),
    ).toBe("Second Value,Missing,First Value\n2,,A");
  });

  it("downloads generated CSV files and skips empty exports", () => {
    const appendSpy = jest.spyOn(document.body, "appendChild");
    const removeSpy = jest.spyOn(document.body, "removeChild");
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    downloadCsvFile("name\nKago", "users.csv");

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(appendSpy).toHaveBeenCalledWith(expect.any(HTMLAnchorElement));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith(expect.any(HTMLAnchorElement));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:csv");

    jest.clearAllMocks();
    exportToCSV([], "empty.csv");
    expect(URL.createObjectURL).not.toHaveBeenCalled();

    exportToCSV([{ id: 1, name: "Kago" }], "users.csv", [{ key: "name", label: "Name" }]);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("builds timestamped export filenames", () => {
    expect(buildExportFilename("users")).toBe("users_export_2026-05-12.csv");
  });
});
