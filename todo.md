fs.watch(postsDir, (eventType, filename) => {
        gen();
});

- fs.watch triggers many times on a single write, figure out a way to avoid generating more than once


Major Features:
- File watch and rebuild (with logic to minimise full rebuilds, only build the minimal set of files as implied by the change)
- Better folder handling, the current flat folder mess kinda sucks
- Auto reload server to aid in dev
