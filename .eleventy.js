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

  eleventyConfig.addWatchTarget('./src/css')
  eleventyConfig.addWatchTarget('./tailwind.config.js')

  eleventyConfig.addPassthroughCopy("./src/img");
  eleventyConfig.addPassthroughCopy("./src/css/prism.css");
  eleventyConfig.addPassthroughCopy("./src/favicon.ico");
  eleventyConfig.addPassthroughCopy("./src/robots.txt");
  eleventyConfig.addPassthroughCopy("./src/_redirects");

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
