## Architecture

Uses actors for each part of the crawling and indexing process.

## TODO

messages should probably only contain serialisable values and addresses, no passing `Archive`s around. I should maybe create an archive actor that can be used to query the archive, and then just let the other actors contain the logic for calling it.
