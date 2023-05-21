fs.watch(postsDir, (eventType, filename) => {
        gen();
});

- fs.watch triggers many times on a single write, figure out a way to avoid generating more than once


Major Features:
- improve file watch and rebuild to use file readers and pipeline configuration to avoid total rebuilds
- Better folder handling, the current flat folder mess kinda sucks
- Adopt Typescript, this code is starting to get confusing