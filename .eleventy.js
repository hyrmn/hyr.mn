const { DateTime }  = require('luxon');
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter('entryDate', dateObj => {
    return DateTime.fromJSDate(dateObj, {
      zone: 'utc'
    }).toFormat('LLLL d, y');
  });

  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addWatchTarget('./src/site/css')
  eleventyConfig.addWatchTarget('./tailwind.config.js')

  eleventyConfig.addPassthroughCopy("./src/site/img");
  eleventyConfig.addPassthroughCopy("./src/site/css/prism.css");
  eleventyConfig.addPassthroughCopy("./src/site/favicon.ico");
  eleventyConfig.addPassthroughCopy("./src/site/robots.txt");

  return {
    dir: {
      input: 'src/site',
      output: 'dist'
    },
    passthroughFileCopy: true,
    templateFormats: ['njk', 'md', 'js'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  }
}
