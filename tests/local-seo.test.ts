import assert from "node:assert/strict";
import test from "node:test";
import { openingHoursJsonLd, storeJsonLd, storeSeoTitle } from "../src/lib/local-seo";
import type { DbStore } from "../src/lib/site-data";

const store: DbStore = {
  id: "store-kram",
  slug: "kram",
  name: "Le Kram",
  address: "175 Avenue Habib Bourguiba, 2015 Le Kram",
  mobile: "98 34 93 99",
  landline: "71 27 56 08",
  mapsUrl: "https://maps.google.com/example",
  mapsEmbedQuery: "Le Kram",
  photo: "/images/stores/kram.svg",
  hours: [
    { day: "Lundi – Samedi", hours: "9h30 – 19h30" },
    { day: "Dimanche", hours: "Fermé" },
  ],
  statusOverride: "auto",
  liveStatus: "open",
  statusLabel: "Ouverte",
};

test("le titre local cible naturellement la boutique", () => {
  assert.equal(storeSeoTitle(store), "Opticien au Kram – Lunettes optiques et solaires");
});

test("les horaires français deviennent des horaires Schema.org", () => {
  const rows = openingHoursJsonLd(store.hours);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].opens, "09:30");
  assert.equal(rows[0].closes, "19:30");
  assert.equal(rows[0].dayOfWeek.length, 6);
});

test("la boutique expose un Optician complet pour Google", () => {
  const json = storeJsonLd(store, "https://infrared.tn");
  assert.equal(json["@type"], "Optician");
  assert.equal(json.telephone, "+21698349399");
  assert.equal(json.address.addressLocality, "Le Kram");
  assert.equal(json.address.addressCountry, "TN");
});
