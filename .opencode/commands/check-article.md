Checks this blog article for common issues.

- **Open Graph metadata**
  - og:type is set to "article"
  - og:url matches the expected URL format
  - og:title matches the page title
  - og:site_name is present
  - og:locale is present
  - article:published_time is present and valid
  - article:author is present
  - article:section is present

- **Twitter Card metadata**
  - twitter:card is set
  - twitter:url matches og:url
  - twitter:title matches og:title
  - twitter:site is present
  - twitter:creator is present

- **Image validation**
  - All <img> src files exist
  - All image links in the document are valid
  - Checks for .jpg, .png, .svg files referenced

- **File structure**
  - favicon.svg exists
  - styles.css exists
  - Canonical URL meta tag is present

- **HTML structure**
  - <header> with <h1> exists
  - <time datetime="YYYY-MM-DD"> exists
  - lang attribute on <html>
  - charset meta tag present
  - viewport meta tag present

- **Consistency checks**
  - og:title matches <title> tag
  - twitter:title matches og:title
  - Author metadata consistent across tags
