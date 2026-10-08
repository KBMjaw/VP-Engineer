/*
 * VP Engineer — Projects & Experience
 *
 * HOW TO ADD A PROJECT
 * 1. Put the photo in /assets/projects/ (WebP or JPG, ~1600px wide is plenty).
 * 2. Add an entry to VP_PROJECTS below, for example:
 *
 *    {
 *      title: 'Residence at Perundurai',
 *      category: 'residential',      // residential | commercial | industrial | structural | renovation
 *      location: 'Erode, Tamil Nadu',
 *      year: '2024',
 *      summary: 'G+1 residence — structural design and full construction.',
 *      image: '/assets/projects/perundurai-residence.webp'
 *    },
 *
 * Only add real, verified projects. While the list is empty, the section shows
 * one tile per category with a "photos coming soon" state.
 */
window.VP_PROJECTS = [
];

window.VP_PROJECT_CATEGORIES = [
  { key: 'residential', label: 'Residential', text: 'Homes, villas and residential buildings.' },
  { key: 'commercial', label: 'Commercial', text: 'Shops, offices and commercial spaces.' },
  { key: 'industrial', label: 'Industrial', text: 'Sheds, warehouses and factory structures.' },
  { key: 'structural', label: 'Structural', text: 'Foundations, frames, beams and slabs.' },
  { key: 'renovation', label: 'Renovation', text: 'Repairs, strengthening and renovation.' }
];
