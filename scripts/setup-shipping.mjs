// Sets up weight-based (per kg) courier rates for India in the Shopify General shipping profile.
//
//   node --env-file=.env scripts/setup-shipping.mjs           -> dry run: shows current zones + the plan
//   node --env-file=.env scripts/setup-shipping.mjs --apply   -> replaces all India zones with the ones below
//
// Needs the Admin API scopes read_shipping + write_shipping on the custom app.
// Safe to re-run: every run deletes the India zones and recreates them from RATES.

const RATE_PER_KG = {
  // zone name: [rate per kg, state codes]
  "Delhi": [80, ["DL"]],
  "Uttar Pradesh": [80, ["UP"]],
  "Haryana": [150, ["HR"]], // PROVISIONAL: Gurgaon is ₹80, Panipat/Sonipat/Barhi ₹150 — confirm with client
  "Gujarat & Rajasthan": [150, ["GJ", "RJ"]],
  "Punjab, Tamil Nadu, Karnataka & Maharashtra": [180, ["PB", "TN", "KA", "MH"]],
};
const REST_OF_INDIA = { name: "Rest of India", rate: 180 }; // PROVISIONAL — confirm with client
const MAX_KG = 50; // 1 kg steps up to this; heavier orders pay MAX_KG × rate

// Fallback when the store has no India zone yet to read state codes from.
const INDIA_STATES = [
  "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DN", "DD", "DL", "GA", "GJ", "HR", "HP", "JK", "JH", "KA", "KL",
  "LA", "LD", "MP", "MH", "MN", "ML", "MZ", "NL", "OR", "PY", "PB", "RJ", "SK", "TN", "TS", "TR", "UP", "UK", "WB",
];

const APPLY = process.argv.includes("--apply");
const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = await getAdminToken();

// Dev Dashboard app (same organization as the store): exchange client id/secret for a 24h token.
async function getAdminToken() {
  const { SHOPIFY_ADMIN_CLIENT_ID: clientId, SHOPIFY_ADMIN_CLIENT_SECRET: clientSecret } = process.env;
  if (!clientId || !clientSecret) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  const res = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
  });
  if (!res.ok) throw new Error(`Could not get admin token (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).access_token;
}

async function admin(query, variables = {}) {
  const res = await fetch(`https://${SHOP}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

function methodDefinitions(ratePerKg) {
  const methods = [];
  for (let kg = 1; kg <= MAX_KG; kg++) {
    methods.push({
      name: "Standard Courier",
      active: true,
      rateDefinition: { price: { amount: String(ratePerKg * kg), currencyCode: "INR" } },
      weightConditionsToCreate: [
        { operator: "GREATER_THAN_OR_EQUAL_TO", criteria: { value: kg === 1 ? 0 : kg - 1 + 0.001, unit: "KILOGRAMS" } },
        { operator: "LESS_THAN_OR_EQUAL_TO", criteria: { value: kg, unit: "KILOGRAMS" } },
      ],
    });
  }
  methods.push({
    name: "Standard Courier",
    active: true,
    rateDefinition: { price: { amount: String(ratePerKg * MAX_KG), currencyCode: "INR" } },
    weightConditionsToCreate: [
      { operator: "GREATER_THAN_OR_EQUAL_TO", criteria: { value: MAX_KG + 0.001, unit: "KILOGRAMS" } },
    ],
  });
  return methods;
}

const data = await admin(`{
  deliveryProfiles(first: 10) {
    nodes {
      id name default
      profileLocationGroups {
        locationGroup { id }
        locationGroupZones(first: 50) {
          nodes {
            zone { id name countries { code { countryCode } provinces { code } } }
            methodDefinitions(first: 3) { nodes { name } }
          }
        }
      }
    }
  }
}`);

const profile = data.deliveryProfiles.nodes.find(p => p.default);
if (!profile) throw new Error("No default (General) shipping profile found");
const group = profile.profileLocationGroups[0];

console.log(`Profile: ${profile.name}`);
console.log("Current zones:");
const indiaZones = [];
const knownStates = new Set();
for (const { zone, methodDefinitions } of group.locationGroupZones.nodes) {
  const india = zone.countries.find(c => c.code.countryCode === "IN");
  if (india) {
    indiaZones.push(zone.id);
    india.provinces.forEach(p => knownStates.add(p.code));
  }
  console.log(`  - ${zone.name}: ${zone.countries.map(c => c.code.countryCode).join(", ")} (${methodDefinitions.nodes.map(m => m.name).join(", ")})`);
}

const allStates = knownStates.size > 0 ? [...knownStates] : INDIA_STATES;
const assigned = new Set(Object.values(RATE_PER_KG).flatMap(([, codes]) => codes));
const unknown = [...assigned].filter(code => !allStates.includes(code));
if (unknown.length) throw new Error(`State codes not found in store: ${unknown.join(", ")}`);

const zones = [
  ...Object.entries(RATE_PER_KG).map(([name, [rate, codes]]) => ({ name, rate, codes })),
  { name: REST_OF_INDIA.name, rate: REST_OF_INDIA.rate, codes: allStates.filter(code => !assigned.has(code)) },
];

console.log("\nPlan (replaces all India zones):");
for (const z of zones) console.log(`  - ${z.name}: ₹${z.rate}/kg → ${z.codes.join(", ")}`);

if (!APPLY) {
  console.log("\nDry run only. Re-run with --apply to make the changes.");
  process.exit(0);
}

const UPDATE = `mutation($id: ID!, $profile: DeliveryProfileInput!) {
  deliveryProfileUpdate(id: $id, profile: $profile) { userErrors { field message } }
}`;

async function update(profileInput, label) {
  const result = await admin(UPDATE, { id: profile.id, profile: profileInput });
  const errors = result.deliveryProfileUpdate.userErrors;
  if (errors.length) throw new Error(`${label}: ${JSON.stringify(errors)}`);
  console.log(`  ✓ ${label}`);
}

if (indiaZones.length) await update({ zonesToDelete: indiaZones }, `Removed ${indiaZones.length} old India zone(s)`);

for (const z of zones) {
  await update(
    {
      locationGroupsToUpdate: [{
        id: group.locationGroup.id,
        zonesToCreate: [{
          name: z.name,
          countries: [{ code: "IN", provinces: z.codes.map(code => ({ code })) }],
          methodDefinitionsToCreate: methodDefinitions(z.rate),
        }],
      }],
    },
    `${z.name} (₹${z.rate}/kg)`
  );
}

console.log("\nDone. Check Settings → Shipping and delivery → General shipping rates.");
