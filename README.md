# Cubing Club
The website for the SPMS Cubing Club. Includes 3 modules currently:

### Homepage
Located: index.html

Content: Front page
### Timer
Located: timer.html

Content: timer webapp - styles, timings, averages, scrambling, etc
### Scrambler API (v1, deprecated)
Located: scrambled_browser.js

Content: semi functional scrambler for 3x3, 2x2, pyra, and skewb

```js
// This example needs scrambled_browser.js and an h1 in your HTML.
// Usage: upd("pyra" || Number ex. 3 or 4 || "skewb")
function update(size) {
    var x = (!isNaN(size) ? scramble(size < 3 ? 10 : 20, size) : scramble(12, size));
    document.querySelector('h1').textContent = x;
}
```

### Scrambler (v2, deprecated/gone to time)
Located: scramble.html
Content: ~~UI for scrambler V2. Now uses cubing.js and twizzle for scrambles, supporting many options.~~
Lost to time, accidentally exported a old build of the timer as scrambler.html. Scrambling is now integrated into Timer.
