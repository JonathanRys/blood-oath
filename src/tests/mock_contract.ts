import { Contract } from "@/types";

export const contract: Contract = {
  meta: {
    statement: "when a call to the OpenLibrary API is made",
    description: "A book with ISBN 0201558025 exists",
    action: "a request for a book",
  },
  request: {
    host: "https://openlibrary.org",
    port: 443,
    path: "/api/books",
    method: "GET",
    headers: { "Content-Type": "application/json" },
    params: { bibkeys: "ISBN:0201558025,LCCN:93005405", format: "json" },
  },
  response: {
    ok: true,
    type: "cors",
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: {
      "ISBN:0201558025": {
        bib_key: "ISBN:0201558025",
        info_url:
          "https://openlibrary.org/books/OL1429049M/Concrete_mathematics",
        preview: "full",
        preview_url: "https://archive.org/details/concretemathemat00grah_444",
        thumbnail_url: "https://covers.openlibrary.org/b/id/135182-S.jpg",
      },
      "LCCN:93005405": {
        bib_key: "LCCN:93005405",
        info_url: "https://openlibrary.org/books/OL1397864M/Zen_speaks",
        preview: "borrow",
        preview_url: "https://archive.org/details/zenspeaksshoutso0000caiz",
        thumbnail_url: "https://covers.openlibrary.org/b/id/240726-S.jpg",
      },
    },
  },
};

export const contracts: Contract[] = [contract];
