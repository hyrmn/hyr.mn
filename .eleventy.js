const { DateTime }  = require('luxon');
module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter('postDate', dateObj => {
    return DateTime.fromJSDate(dateObj, {
      zone: 'utc'
    }).toFormat('LLLL d, y');
  });

  // npm watch doesn't seem to like updating dist when src/_includes/css/base.css changes
  // so I'm setting postcss to publish to /src/css/base.css and then copying through to dist 
  eleventyConfig.addPassthroughCopy("./src/css");

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
    },
    passthroughFileCopy: true,
    templateFormats: ['njk', 'md'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  }
}
