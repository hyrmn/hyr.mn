const fs = require('fs')
const path = require('path')
const postcss = require('postcss')

module.exports = class {
  async data() {
    const filepath = path.join(__dirname, 'main.css')
    return {
      permalink: "/css/site.css",
      rawCss: await fs.readFileSync(filepath, 'utf8'),
      eleventyExcludeFromCollections: true,      
    };
  }

  async render({ rawCss }) { 
    const filepath = path.join(__dirname, 'main.css')
    return await postcss([
      require('@tailwindcss/postcss'),
    ])
    .process(rawCss, { from: filepath })
    .then((result) => result.css)
  }
}