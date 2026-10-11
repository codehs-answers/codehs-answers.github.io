CodeHS Solution Helper SEO landing pages
=========================================

Contains one /lessons/<exercise-slug>/index.html page for every unique line
in the supplied exercise_titles.txt (8,722 pages), plus sitemap.xml.

Deployment:
1. Copy the contents of this folder into the root of your GitHub Pages repository.
2. Commit and push.
3. Submit https://codehs-answers.github.io/sitemap.xml in Google Search Console
   and Bing Webmaster Tools.

Important SEO caveat:
These pages contain a brief exercise-specific title and link, then redirect to
the homepage after 4 seconds. Search engines may treat large sets of near-empty
redirect pages as doorway pages or soft 404s, and may choose not to index them.
For a stronger long-term SEO approach, make each page genuinely useful and link
to the relevant exercise/answer experience instead of automatically redirecting.
