## Architecture

Babel now has async generators, which makes this so much easier. We can write functions that lazily produce values and chain them together with iterators.

The aim is initially just to create a crawler that gets a complete list of pages that are a given number of hops from the starting point. After that we can look at performing analasys on those pages and indexing them by title/keywords/common terms. Finally we can look at a page rank style system that ranks the quality of results, but as this is as purposfully limited data set, I'm not sure how useful that will be.

There should probably be global collections for the various things we want to keep track of, and generators that pull from one and push to another. Collections we want to track:

-   archives
-   pages
