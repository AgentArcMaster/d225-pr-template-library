# District 225 PR Template Library

A static HTML/CSS/JavaScript website. It has no package installation, build step, database, or secret keys.

## Add a Canva template

1. In Canva, open the finished design. Choose **Share → Template link → Create template link → Copy**. Do not share an editable link to the original design.
2. Export a preview image and place it in `assets/` (for example `assets/best-timer-01.webp`). Square, portrait, story, and document previews are shown in full without cropping. Use a clear, reasonably compressed PNG, JPEG, or WebP.
3. Open `catalog.js`. Add an object inside the `templates: [ ... ]` array. Separate entries with commas.

```js
{
  id: 'best-timer-01',
  category: 'role-player-winners',
  title: 'Best Timer — Classic',
  role: 'Timer',
  tags: ['individual', 'role player', 'meeting award'],
  format: 'Square',
  image: 'assets/best-timer-01.webp',
  canvaUrl: 'PASTE_YOUR_CANVA_TEMPLATE_LINK_HERE'
}
```

Replace the example URL with an actual `https://www.canva.com/...` or `https://canva.link/...` **template** link. Use a design's template link rather than a link that edits the team's original design. If the preview arrives first, set `canvaUrl: ''`; the tile and full preview will be visible, with a “coming soon” message where the Canva button will appear. An entry needs a valid category ID, title, unique ID, and either a preview image or valid Canva link.

Visitors choose a collection, see its design tiles, click one for a full preview, then select **Edit in Canva** once its template link has been added. Search filters the collections and, when a design matches, shows that design inside its collection.

Use a unique `id` for every design. Set `role` and descriptive `tags` for specific posters, such as Timer, Grammarian, Ah-Counter, or Contest Official. The main search indexes the design's title, role, tags, format, and collection, while all design tiles remain inside their collections.

## Category IDs

| Collection | `category` value |
| --- | --- |
| Level Completion | `level-completion` |
| Pathways Completion | `pathways-completion` |
| Speakers & Evaluators | `speakers-evaluators` |
| TMOD / GE / TTM | `meeting-leaders` |
| Triple Crown | `triple-crown` |
| Club Awards | `club-awards` |
| DTM | `dtm` |
| New Member Added | `new-member` |
| Happy Birthday | `birthday` |
| Winners — Role Players | `role-player-winners` |
| Agenda & MoM | `agenda` |
| Speech Contests (Club, Area, Division, District) | `club-contest` |
| Certificate Templates | `certificates` |

## Add an A4 landscape certificate

The certificate collection is accessed through **More PR Resources → Explore certificates**. Use `category: 'certificates'`, not a new poster category. Name the previews `assets/certificates-01.png`, `assets/certificates-02.png`, and so on. Export them in **A4 landscape** proportions (approximately 1.414:1), and set `format: 'A4 Landscape'` so the collection tiles display the entire horizontal design without cropping. JPEG and WebP previews work too; make the file extension in `image` match what you upload.

Add each design to the `templates` array in `catalog.js`:

```js
{
  id: 'certificates-01',
  category: 'certificates',
  title: 'Certificate — Design 1',
  tags: ['certificate', 'recognition', 'appreciation'],
  format: 'A4 Landscape',
  image: 'assets/certificates-01.png',
  canvaUrl: 'https://canva.link/YOUR_TEMPLATE_LINK'
},
```

Use a unique ID and matching preview number for each certificate. Upload the preview to `assets/` before adding its entry, or leave `canvaUrl: ''` temporarily if the editable template link is not ready. Send the previews and Canva template links in numbered order, and they can be mapped to the certificate collection.

## Caption prompts and PR contact

The **Caption Prompt Library** is defined in `catalog.js` under `captionPrompts`. Each entry includes a prompt and sample caption. `captionPromptRules` contains the common fact-checking and tone instructions appended to copied prompts.

The PR contact button uses the recipient addresses in `prContactEmails` in `catalog.js`. It opens a prefilled email in the visitor's mail application; the website does not send email automatically.

## Preview locally

Open `index.html` in a browser. For a local server, run `python -m http.server 8000` in this folder and visit `http://localhost:8000/`.

## Deploy from GitHub to Vercel

1. Create a new GitHub repository and upload the files in this folder to its root. Keep `index.html`, `catalog.js`, `styles.css`, and `script.js` together. Put preview images inside `assets/`.
2. In Vercel, create a new project and import that GitHub repository.
3. Select **Framework Preset: Other**. Leave the **Build Command** blank. Set **Output Directory** to `.` if Vercel asks for one. Deploy.
4. Edit `catalog.js` or add preview images in GitHub and commit. Vercel will deploy changes from the production branch automatically.

The current private Sites deployment is separate from this export. Changes in GitHub will update the Vercel copy, not the Sites copy.

Before public distribution as a District website, review the current Toastmasters Brand Manual and seek website approval through the Brand Team at `brand@toastmasters.org`. Use only official, unmodified logo or wordmark assets from the Brand Portal in finished designs.
