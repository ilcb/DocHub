const { algoliasearch, instantsearch } = window;

const searchClient = algoliasearch('KH2JHIT03F', '54562e49efc08e4f3da778465e2e1129');

const search = instantsearch({
  indexName: 'ilcb_github_io_kh2jhit03f_pages',
  searchClient,
  future: { preserveSharedStateOnUnmount: true },
  
});


search.addWidgets([
  instantsearch.widgets.searchBox({
    container: '#searchbox',
  }),
  instantsearch.widgets.hits({
    container: '#hits',
    templates: {
      item: (hit, { html, components }) => html`
<article>
  <img src=${ hit.image } alt=${ hit.title } />
  <div>
    <h1>${components.Highlight({hit, attribute: "title"})}</h1>
    <p>${components.Highlight({hit, attribute: "description"})}</p>
    <p>${components.Highlight({hit, attribute: "keywords"})}</p>
  </div>
</article>
`,
    },
  }),
  instantsearch.widgets.configure({
    hitsPerPage: 8,
  }),
  instantsearch.widgets.pagination({
    container: '#pagination',
  }),
]);

search.start();

