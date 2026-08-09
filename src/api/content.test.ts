import { getContentPage, searchContent } from "./content";

describe("searchContent", () => {
  beforeEach(() => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        data: [
          { id: "1", slug: "dolma", name: "Dolma", excerpt: "Kurdish cuisine" },
        ],
      }),
    })) as jest.Mock;
  });

  it("uses server-side search filters for every catalogue type", async () => {
    const results = await searchContent("dolma", "en");
    expect(global.fetch).toHaveBeenCalledTimes(5);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      "/destinations?lang=en&limit=12&search=dolma",
    );
    expect(results).toHaveLength(5);
    expect(results[0]).toMatchObject({
      type: "destination",
      slug: "dolma",
      title: "Dolma",
    });
  });

  it("does not call the network for an empty search", async () => {
    await expect(searchContent("   ", "en")).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("keeps pagination on the server", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: "2", slug: "erbil", name: "Erbil" }],
        meta: { pageCount: 3 },
      }),
    });
    const page = await getContentPage("destination", "en", 2, 20);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      "/destinations?lang=en&limit=20&page=2",
    );
    expect(page).toMatchObject({ page: 2, hasNextPage: true });
  });
});
