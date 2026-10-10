# CodeHS Solution Helper — GitHub Pages frontend

Files:
- `index.html`
- `styles.css`
- `script.js`

## Configure the API
In `script.js`, replace `https://YOUR-VERCEL-PROJECT.vercel.app` with your deployed Vercel project URL.

Publish these files to GitHub Pages. The wizard submits the share URL once to `POST /api/solution`; Vercel fetches the CodeHS share page, extracts `itemID`, requests and decodes the solution, then returns the code.

The API also checks for `codeUserID` and `codeUserFirstNameLastInitial`. The frontend does not display their values. If the API owner configures a server-side destination, the API can forward the fields there. Tell users what data is collected and why, and only enable forwarding when you have an appropriate reason and authorization.

The share link must be public. Newly created links may take a little time to become available.
