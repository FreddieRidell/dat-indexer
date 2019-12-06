I have found a link from `source` to `sink`
parse the sink link into hostname, hash, and path
do we have an archive for that hash? if not create one

## Glosary

### Links

have a `source` and a `sink`, both of which are full urls. the `source` can be `null`:

```json
{
	"source": "https://freddieridell.com/about",
	"sink": "dat://beakerbrowser.com/about"
}
```

### Url

the full string identififying a resource, can be `parse`d into it's `protocol`, `hostname`, and `pathname`

### Hash

identifies a DatArchive, can be found by DNS resolving the `hostname`

### Archive

A Dat website, don't call them websites, call them archives
