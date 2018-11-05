// Require modules
const util = require('util');
const fs = require('fs');
const path = require('path');

const unified = require('unified');
const markdown = require('remark-parse');
const slugify = require('slugify');


// Parse
const tree = unified()
  .use(markdown)
  .parse(fs.readFileSync('README.md'));

// Extract data
const data = tree.children;
const transformed = [];
for (let i = 0; i < data.length-1; i += 2) {
  let heading = data[i].children[0].value;
  let name = slugify(heading).toLowerCase();
  if (name.endsWith('.')) { // remove last dot
    name = name.substring(0, name.length - 1);
  }
  let entries = data[i+1].children.map(item => {
    let parts = item.children[0].children;
    return {
      name: parts[0].children[0].value,
      url: parts[0].url,
      description: parts[2].children[0].value
    }
  });
  transformed.push({
    name,
    data: {
      heading, entries
    }
  });
}

// Write
transformed.forEach(entry => {
  fs.writeFileSync(
    path.resolve('data', entry.name + '.json'),
    JSON.stringify(entry.data, null, 2)
  );
});
