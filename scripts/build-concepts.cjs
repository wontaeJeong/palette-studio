const fs = require("node:fs");
const path = require("node:path");
const concepts = require("../data/design-concepts.js");
fs.writeFileSync(
  path.resolve(__dirname, "../css/concepts.css"),
  concepts.concepts.map((c) => concepts.css(c.id)).join("\n"),
);
console.log("Built css/concepts.css from nine shared concept contracts");
