(function(global) {
    const turnMoves = ['R', 'U', 'L', 'D', 'F', 'B'];

    function seedrandom(seed) {
        let m = 0x100000000; // 2^32
        let a = 0x5DEECE66D; // 2^48
        let c = 0xB; // 2^24
        let state = (seed + c) % m;

        return function() {
            state = (state * a + c) % m;
            return (state >>> 16) / m;
        };
    }

    function generateScrambleSync(count, size = 3, hash) {
        hash = hash || (new Date().getTime()).toString();
        const random = seedrandom(hash);

        let hasDone = [];
        let scramble = [];

        for (let i = 0; i < count * 3; i += 3) {
            let move = turnMoves[Math.floor(random() * turnMoves.length)];
            let attempts = 0;

            while (hasDone.includes(move)) {
                attempts++;
                move = turnMoves[Math.floor(random() * turnMoves.length)];
                if (attempts > 100) break; // Prevent infinite loop
            }

            // Prevent opposite moves
            if (['U', 'D'].includes(move)) {
                hasDone = hasDone.filter(m => !['R', 'L'].includes(m));
            } else if (['R', 'L'].includes(move)) {
                hasDone = hasDone.filter(m => !['U', 'D', 'F'].includes(m));
            }

            if (!hasDone.includes(move)) {
                hasDone.push(move);
            }

            if (Math.floor(random() * 2)) move += '\''; // Add a prime
            if (Math.floor(random() * 2)) move += '2'; // Add a double

            if (size > 3) {
                const isSlice = Math.floor(random() * (size - 2 + 1));
                if (isSlice > 1) move = isSlice.toString() + move;
            }

            scramble.push(move);
        }

        return {
            scrambleMoves: scramble,
            scramble: scramble.join(' '),
            token: hash,
            size: count
        };
    }

    function verifyScrambleSync(token, scramble, count, size = 3) {
        const toVerifyWith = generateScrambleSync(count, size, token);
        return toVerifyWith.scramble === scramble;
    }

    // Expose the functions to the global object
    global.generateScramble = generateScrambleSync;
    global.verifyScramble = verifyScrambleSync;

})(window);