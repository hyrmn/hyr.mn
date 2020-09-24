const fs = require('fs')
const path = require('path')
const postcss = require('postcss')

module.exports = class {
  async data() {
    const filepath = path.join(__dirname, 'main.css')
    return {
      permalink: "/css/site.css",
      content: await fs.readFileSync(filepath),
      eleventyExcludeFromCollections: true,      
    };
  }

  async render({ content }) { 
    return await postcss([
      require('tailwindcss')('./tailwind.config.js'),
      require('autoprefixer')
    ])
    .process(content)
    .then((result) => result.css)
  }
}