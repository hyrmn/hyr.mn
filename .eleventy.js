const { DateTime }  = require('luxon');

const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");

const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { rssPlugin: pluginRss } = require("@11ty/eleventy-plugin-rss");

module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter('entryDate', dateObj => {
    return DateTime.fromJSDate(dateObj, {
      zone: 'utc'
    }).toFormat('LLLL d, y');
  });

  eleventyConfig.addPairedShortcode('pullquote', (content, attribution) => {
    const attributionHtml = attribution
      ? `<figcaption class="mt-3 text-sm font-medium text-stone-400 dark:text-stone-500">— ${attribution}</figcaption>`
      : '';
    return `<figure class="my-8 pl-6"><blockquote class="text-xl font-medium text-stone-800 dark:text-stone-200 not-italic leading-relaxed">${content}</blockquote>${attributionHtml}</figure>`;
  });

  // Customize Markdown library and settings:
  let markdownLibrary = markdownIt({
    html: true,
    breaks: false,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      placement: "after",
      class: "visually-hidden",
      symbol: "#"
    }),
    level: [1,2,3,4],
    slugify: eleventyConfig.getFilter("slugify")
  });

  eleventyConfig.setLibrary("md", markdownLibrary);

  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addWatchTarget('./src/site/css')
  eleventyConfig.addWatchTarget('./tailwind.config.js')

  eleventyConfig.addTemplateFormats('11ty.js')

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
