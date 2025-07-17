# Argon Clinical Trials Search

This is a Next.js app for searching clinical trial data (powered by [ClinicalTrials.gov](https://clinicaltrials.gov)). Users can search across title, sponsor, status, and date fields.

The app only operates on a 1,000 row dataset ingested from data/ctg-studies.json. It features a global text search that supports multiple search terms (comma separated) and the ability to configure search options. Search options include whether to turn on synonym matching (e.g., "NSCLC" matches "non-small cell lung cancer" [only implemented for NSCLC for demo]) and an AND match (if multiple terms are provided with AND match toggled on, both terms will need to be matched in a single entry to be returned). Global search considers 

## 📁 Project Structure

```
argon-search/
├── components/
│   └── SearchResults.tsx         # Table view with sorting, pagination, and filters
├── data/
│   └── ctg-studies.json          # Static dataset from ClinicalTrials.gov
├── lib/
│   ├── loadClinicalTrialsData.ts # Data loading helper
│   ├── statuses.ts               # Valid trial statuses
│   ├── synonyms.ts               # Synonym map
│   └── synonymUtils.ts           # Synonym expansion logic
├── pages/
│   ├── api/
│   │   ├── search.ts             # Main search endpoint
│   ├── _app.tsx                  # App wrapper
│   ├── _document.tsx             # HTML document customization
│   ├── index.tsx                 # Landing page redirect
│   └── search.tsx                # Main UI page for clinical trial search
├── types/
│   └── ClinicalTrial.ts          # TypeScript definitions for trial data
├── public/                       # Static assets
└── README.md                     # You're here!
```

## Getting Started

### Prerequisites

- Node.js 18+

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

Open [http://localhost:3000/search](http://localhost:3000/search) in your browser.

### Build for production

```bash
npm run build
npm start
```

## Test Cases

You can try the following in the global search bar:

| Input                              | Expected Matches |
|-----------------------------------|------------------|
| `nsclc`                           | Trials with “NSCLC” or “non-small cell lung cancer” in title/sponsor (if synonyms enabled) |
| `non-small cell lung cancer`      | Same as above (even without synonyms) |
| `nsclc, immunotherapy`            | Trials matching **both terms** if AND Match is enabled, or either if not |

Text column filters use a case-insensitive, simple keyword match.

## Discussion

##### a. If Sarah wanted to filter trials by additional criteria (e.g., trial phase, sponsor), how would you extend the functionality?

This functionality already exists for sponsor and status (as a proxy for trial phase). To support additional filters, we’d map new fields from the ingested dataset into the ClinicalTrial type and expose them in the UI using reusable components like dropdowns or multi-selects. Since the frontend filtering logic is modular, this is a straightforward extension. Similarly, the global search logic can easily be extended to search across additional text fields.

##### b. What compromises did you make in your solution, and why were those compromises necessary?

I made deliberate trade-offs to stay within the scope of the assignment. For example, I skipped fuzzy matching and LLM-based synonym expansion in favor of a small manual synonym map to demonstrate the feature accurately. I also didn’t include features like browser history integration (being able to navigate through past searches), filter persistence, caching, or polished UX elements like search term tagging and clearable filters. I prioritized correctness, complete search/filter functionality, and extensibility over full production-readiness or visual polish. One of the biggest compromises was bypassing a database setup (more in the question below). (I would have also spent more time commenting & documenting the code!)

##### c. How would you identify opportunities to improve the user experience of this application, and what would you prioritize first?

The most impactful opportunity here is shifting from generic keyword search to a goal-oriented, action-driven UX. (I added a bunch of tooltips to make intent and functionality clear, and that is a sign in and of itself that we can definitely reduce cognitive load on the user). Instead of assuming Sarah knows exactly what to type or which filters to use, we could guide her through structured workflows based on common research needs. To support this, we’d first identify and generalize core workflows across different user types, (not just Sarah), like the goal to “find new trials,” “track competitors,” or “investigate failed trials.” To do so, we'd want to conduct some kind of discovery with qualitative user interviews or scraping any data we could find on clinical trial searches. We could then build tailored flows and filter presets around these identified common use-cases, and eventually introduce an LLM wrapper to interpret freeform input, infer intent, and build complex queries. This would reduce friction and make the tool more accessible. Beyond that, we’d add polish improvements like refined defaults (e.g. exclude withdrawn trials), improved multi-term UX beyond comma separation, and others. Making search intent-driven would deliver the most impact (though it's necessary to draw learnings from the discovery process and make decisions around what we're doing with this tool beyond Sarah's usage -- are we selling it!?).

##### d. NSCLC has many different representations in the dataset. For example, it could be “non small cell lung cancer”, “non small cell lung carcinoma”, “NSCLC”, “carcinoma of the lungs, non small cell”, etc. How do we capture all the relevant clinical trials for searches on any disease?

A scalable solution here is to use a synonym mapping system based on medical ontologies (e.g., I've used SNOMED CT in academic projects). These provide standardized vocabularies that cluster entities like disease names under a common concept. We could pre-process the dataset by mapping each trial’s text to these canonical concepts, and expand user queries accordingly. For even greater coverage, we could use NLP-based techniques like embedding similarity to detect terms that are semantically related, even if not explicitly listed in the ontology. This allows us to catch edge cases or less common phrasing that a static mapping might miss. In this prototype, I implemented a super simplified, hardcoded synonym map (which in the real world would be stored and cached) just to demonstrate the type of data output we'd take advantage of.


##### e. How do we allow her to search for NSCLC trials -AND- immunotherapy related drugs?

We support comma-separated search terms for composite queries. The “AND Match” toggle here specifies whether all terms need to present (or just some/any). In a production system, we might adopt a tag-based input model for clarity and expand support for more operators (AND, OR, NOT) and query builders.

##### f. How would you deploy your software?

To deploy this app, we’d start by building the production-optimized Next.js frontend (e.g. using `next build`). For hosting, a platform like Vercel works well for quick deployment. It handles build pipelines, autoscaling, and CDN support out of the box, which makes it ideal for early-stage projects (AFAIK we’re not scaling this thing crazily just yet). The /api/search endpoint can live in the same app or be split into a separate backend service later if we want to scale independently or expose the API elsewhere.

Regardless of hosting platform, we’d provision a production database (e.g., Postgres) to support structured querying, filtering, and indexing for better performance at scale. As usage grows, we might containerize the app and migrate to a cloud provider like AWS or GCP for more control over infrastructure.

We’d also add basic observability (e.g., logging, error tracking), and optionally use a CDN to cache static assets and repeated search results closer to users. 

##### g. What are the alternatives to loading the dataset into memory, and why would you want to use those alternatives?

Loading the dataset into memory works for small datasets and fast prototyping, but it breaks down with larger volumes of data — it’s not persistent, doesn’t scale well, and forces us to reprocess everything on every deploy which is inefficient. In this case, we knew we were only ever processing at most 1,0000 rows of data, which is tiny.

A better long-term alternative is loading the data into a relational database like PostgreSQL. It supports structured queries, indexing on specific search fields (like trial status, start date, or sponsor) for quick retrieval, and fast filtering and sorting — all of which align closely with how users explore clinical trials. With a database, we also gain persistence, support for concurrent access, much more flexibility with modeling the entities we care about for the base of the product (e.g., locations, interventions). 

Some other alternatives might include document stores like MongoDB (flexible for unstructured or semi-structured data, but harder to optimize for complex filtering and search - not my recommendation); data warehouses like BigQuery: good for analytics and aggregation across massive datasets, but overkill for transactional or search-heavy use; flat files or static APIs (e.g., loading JSON from GCS): simple but not searchable or filterable at scale.

##### h. How do we evaluate completeness of results?

To evaluate whether our search is complete (that is, returns all relevant trials), we’d start by establishing a source of truth using the raw dataset to create ground-truth query sets with known correct matches. For each query (e.g., “NSCLC + immunotherapy”), we’d manually label which trials should be returned. AI could assist in semi-automating this labeling, but ultimately it’s a supervised task.

We’d then run those queries through our app and calculate recall: the percentage of relevant trials that are successfully returned. Any missing results (false negatives) would be analyzed to understand why they were missed — for example, a synonym wasn’t captured, a typo wasn’t handled, or filtering logic excluded it.
