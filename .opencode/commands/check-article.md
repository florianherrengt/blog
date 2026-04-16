Checks this blog article for common issues.

- **Open Graph metadata**
  - og:type is set to "article"
  - og:url matches the expected URL format
  - og:title matches the page title
  - og:description is present and accurately summarizes the article
  - If og:image is present, it uses a valid image URL and points to a real file
  - If og:image is present, og:image:alt is present and relevant
  - og:site_name is present
  - og:locale is present
  - article:published_time is present and valid
  - article:author is present
  - article:section is present

- **Twitter Card metadata**
  - twitter:card is set
  - twitter:card is aligned with available assets (for example summary_large_image requires an image)
  - twitter:url matches og:url
  - twitter:title matches og:title
  - twitter:description is present and accurately summarizes the article
  - twitter:image is present when using image cards and matches og:image when possible
  - twitter:image:alt is present and relevant when twitter:image is set
  - twitter:site is present
  - twitter:creator is present

- **Image validation**
  - All <img> src files exist
  - All image links in the document are valid
  - Checks for .jpg, .png, .svg files referenced
  - Open Graph and Twitter image files exist and are reachable when image tags are used

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
  - og:description and twitter:description are both relevant and consistent with article content
  - Author metadata consistent across tags
