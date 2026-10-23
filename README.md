# District 225 PR Template Library

A static HTML/CSS/JavaScript website. It has no package installation, build step, database, or secret keys.

## Add a Canva template

1. In Canva, open the finished design. Choose **Share → Template link → Create template link → Copy**. Do not share an editable link to the original design.
2. Export a preview image and place it in `assets/` (for example `assets/best-timer-01.webp`). A square preview works well; the site crops it to a square.
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

Replace the example URL with an actual `https://www.canva.com/...` or `https://canva.link/...` template link. The site displays only entries with valid Canva domains and a valid category ID. Preview images are optional, but strongly recommended.

Use a unique `id` for every design. Set `role` and descriptive `tags` for specific posters, such as Timer, Grammarian, Ah-Counter, or Contest Official. The main search indexes the design's title, role, tags, format, and collection. The same design also appears inside its collection.

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
| Club Contest | `club-contest` |
| Testimonials | `testimonials` |

## Preview locally

Open `index.html` in a browser. For a local server, run `python -m http.server 8000` in this folder and visit `http://localhost:8000/`.

## Deploy from GitHub to Vercel

1. Create a new GitHub repository and upload the files in this folder to its root. Keep `index.html`, `catalog.js`, `styles.css`, and `script.js` together. Put preview images inside `assets/`.
2. In Vercel, create a new project and import that GitHub repository.
3. Select **Framework Preset: Other**. Leave the **Build Command** blank. Set **Output Directory** to `.` if Vercel asks for one. Deploy.
4. Edit `catalog.js` or add preview images in GitHub and commit. Vercel will deploy changes from the production branch automatically.

The current private Sites deployment is separate from this export. Changes in GitHub will update the Vercel copy, not the Sites copy.

Before public distribution as a District website, review the current Toastmasters Brand Manual and seek website approval through the Brand Team at `brand@toastmasters.org`. Use only official, unmodified logo or wordmark assets from the Brand Portal in finished designs.
