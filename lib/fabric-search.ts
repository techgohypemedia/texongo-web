// Shared fabric search used by the navbar search overlay and the /fabrics catalog.

type SearchableFabric = {
  name?: string;
  description?: string;
  sku?: string;
  knit_style?: string;
  composition?: string;
  shade?: string;
  usage?: string;
  type?: string;
};

// Trade shorthand -> full term. These are treated as *alternatives*: a product matches
// if it matches the words the user typed OR the expanded words.
const SHORTCUTS: { keys: string[]; value: string }[] = [
  { keys: ["s/j", "sj", "single jersy"], value: "single jersey" },
  { keys: ["d/j"], value: "double jersey interlock" },
  { keys: ["pk"], value: "pique" },
  { keys: ["1x1 rib", "2x2 rib"], value: "rib" },
  { keys: ["flc", "fl"], value: "fleece" },
  { keys: ["f/t", "f. terry", "f.terry"], value: "french terry" },
  { keys: ["d/n", "d.n"], value: "drop needle" },
  { keys: ["jqd knit", "jqd"], value: "jacquard" },
  { keys: ["h/comb", "hny"], value: "honeycomb" },
  { keys: ["d/net", "msh"], value: "mesh" },
  { keys: ["spx"], value: "spandex" },
  { keys: ["ilk"], value: "interlock" },
  { keys: ["thrm"], value: "thermal" },
  { keys: ["rib-spx", "rib-lycra"], value: "rib spandex" },
  { keys: ["p/r"], value: "ponte roma" },
  { keys: ["vlr"], value: "velour" },
  { keys: ["jqd-flc"], value: "jacquard fleece" },
  { keys: ["slub jy", "s/j slub"], value: "slub jersey" },
  { keys: ["t/k"], value: "terry" },
  { keys: ["a/s jy"], value: "auto stripe jersey" },
  { keys: ["mlj", "mél jy", "mel jy", "m. s/j", "m.s/j"], value: "melange jersey" },
  { keys: ["coton spandex", "cotton lycra"], value: "cotton spandex" },
  { keys: ["f/b rib"], value: "flat back rib" },
  { keys: ["rice.k rib"], value: "rice knit" },
];

const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

function expandQuery(searchStr: string): string {
  let expanded = ` ${searchStr} `;
  for (const { keys, value } of SHORTCUTS) {
    for (const key of keys) {
      expanded = expanded.replace(new RegExp(`(?<=\\s)${escapeRegex(key)}(?=\\s)`, "g"), ` ${value} `);
    }
  }
  return expanded.trim().replace(/\s+/g, " ");
}

const has = (v: string | undefined, word: string) =>
  !!v && v !== "N/A" && v.toLowerCase().includes(word);

function wordMatches(f: SearchableFabric, word: string) {
  return (
    has(f.name, word) ||
    has(f.description, word) ||
    has(f.sku, word) ||
    has(f.knit_style, word) ||
    has(f.composition, word) ||
    has(f.shade, word) ||
    has(f.usage, word) ||
    has(f.type, word)
  );
}

/** Returns a predicate that tells whether a fabric matches the search query. */
export function createFabricSearchMatcher(query: string) {
  const searchStr = query.toLowerCase().trim();
  if (!searchStr) return () => true;

  const cleanSearchStr = searchStr.replace(/[^a-z0-9]/g, "");
  const originalWords = searchStr.split(/\s+/).filter(Boolean);
  const expandedWords = expandQuery(searchStr).split(/\s+/).filter(Boolean);
  const variants = [originalWords];
  if (expandedWords.join(" ") !== originalWords.join(" ")) variants.push(expandedWords);

  return (f: SearchableFabric) => {
    // 1. Forgiving SKU match
    if (f.sku && f.sku !== "N/A") {
      const cleanSku = f.sku.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanSku) {
        if (cleanSku === cleanSearchStr || cleanSearchStr.includes(cleanSku) || cleanSku.includes(cleanSearchStr)) {
          return true;
        }
        if (variants.some(ws => ws.some(w => cleanSku === w.replace(/[^a-z0-9]/g, "")))) return true;
      }
    }
    // 2. Every word matches (typed words, or their expanded form)
    return variants.some(ws => ws.every(w => wordMatches(f, w)));
  };
}
