(function(global) {
    const turnMoves = ['R', 'U', 'L', 'D', 'F', 'B'];
    const oppositeMoves = {
        'R': 'L', 'L': 'R',
        'U': 'D', 'D': 'U',
        'F': 'B', 'B': 'F'
    };

    function seedrandom(seed) {
        let m = 0x100000000; // 2^32
        let a = 0x5DEECE66D; // 2^48
        let c = 0xB; // 2^24
        let state = (seed.charCodeAt(0) || 0) + c;

        return function() {
            state = (state * a + c) % m;
            return (state >>> 16) / m;
        };
    }

    function generateScrambleSync(count, size = 3, hash) {
        hash = hash || (new Date().getTime()).toString();
        const random = seedrandom(hash);

        let scramble = [];

        for (let i = 0; i < count; i++) {
            let move;
            let isValidMove = false;

            // Generate a valid move
            while (!isValidMove) {
                move = turnMoves[Math.floor(random() * turnMoves.length)];

                // Check if the move is opposite to the last move
                if (scramble.length === 0 || move !== oppositeMoves[scramble[scramble.length - 1]]) {
                    isValidMove = true;
                }
            }

            // Add modifiers: prime or double
            if (Math.floor(random() * 2)) move += '\''; // Add a prime
            if (Math.floor(random() * 2)) move += '2'; // Add a double

            // Handle larger cubes with slice moves
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
