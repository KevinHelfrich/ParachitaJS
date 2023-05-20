fs.watch(postsDir, (eventType, filename) => {
        gen();
});

- fs.watch triggers many times on a single write, figure out a way to avoid generating more than once
