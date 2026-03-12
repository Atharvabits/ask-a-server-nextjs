export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

export const TOKEN_KEY = "askaserver_token";

export const CAT_ICONS: Record<string, string> = {
  "Personal Service": "📄",
  "Substituted Service": "📬",
  "Service by Publication": "📰",
  "Who May Serve": "👤",
  "Registration": "📋",
  "Licensing": "📋",
  "Subpoena": "📜",
  "Family Law": "👪",
  "Small Claims": "⚖️",
  "Proof of Service": "📝",
  "Affidavit": "📝",
  "Criminal Protections": "🛡️",
  "Property Access": "🏠",
  "Unique Provisions": "⭐",
};

export function getIconForLaw(title: string): string {
  for (const [key, icon] of Object.entries(CAT_ICONS)) {
    if (title.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "⚖️";
}
