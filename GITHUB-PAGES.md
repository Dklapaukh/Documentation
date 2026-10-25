# Publish on GitHub Pages

No installation, build command, API key or server is required.

## First upload

1. Download and unzip the GitHub source ZIP.
2. On GitHub, create a repository (or open the repository you want to use).
3. Select **Add file → Upload files**. Drag the extracted files into the upload area, then select **Commit changes**. Upload the extracted contents, not the ZIP or an enclosing folder. Keep the `tour` and `cpg-drugs` subfolders intact beside `index.html`. `index.html`, `styles.css`, `app.js`, `config.js`, `tour.js`, `clinical-data.js`, `care.js`, `ink.js`, `arrest.js`, `arrest-entry.js`, `arrest-checklists.js`, `drug-guidance.js`, `drug-guidance-data.js`, `drug-guidance-content.js`, `ink-model.bin`, the model attribution files and all PDF files must sit together at the top level of the repository. Include `.nojekyll` if visible; this plain HTML app also works without it.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select your upload branch (usually **main**) and **/(root)**. Select **Save**.
7. Wait for the Pages deployment to finish. Return to **Settings → Pages** and use the displayed site link.

The root-file layout and relative asset paths support both a repository project page and a custom domain. No paths need changing for a repository name.

GitHub Free supports Pages from public repositories. Other plans can support private source repositories. Standard Pages hosting is a public website; a private source repository does not by itself make the published site private. The package contains app code and teaching/reference material only, with no patient records. Drafts stay in the visitor’s tab unless copied or exported.

## Update later

Use **Add file → Upload files**, upload changed files with the same names, and commit. GitHub republishes the selected branch automatically. If an old version remains visible, refresh the page after deployment has finished. Copy any current draft before refreshing.

## Local configuration

Edit `config.js` for local checkbox options, referral tags, pathway options and CPG references. Edit `styles.css` for visual design. See `README.md` for the application behaviour and code map.

## If the page is blank or unstyled

- Confirm `index.html` is in the selected publishing folder.
- Confirm `styles.css`, `app.js`, `config.js` and the PDF are beside `index.html`, with identical spelling and case.
- Upload the contents of the ZIP, rather than the ZIP itself.
- Check the repository’s **Actions** tab for the Pages deployment status.

GitHub reference: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site


## Optional verification

With Node.js installed, run `node tests/clinical-guidance.cjs` and `node tests/pe-reminder.cjs`, plus `node tests/care.cjs` and `node tests/poc.cjs`, then `node tests/drug-guidance.cjs` and `node tests/simplified-ui.cjs`, plus `node tests/drug-entry.cjs` and `node tests/arrest-workflow.cjs` from the extracted folder. It requires no dependencies and uses only synthetic state. Keep the `tests` folder for future local configuration checks; it is not required to run the website.

The handwriting model is fetched from the same static site. Upload the binary unchanged; no external handwriting service, build step or Python installation is needed. Python is only optional for retraining the model using the included tools script.
