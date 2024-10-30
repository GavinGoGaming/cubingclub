(function(global) {
    const turnMoves = ['R', 'U', 'L', 'D', 'F', 'B'];
    global.generateScramble=(amount, cube)=>{
        let moves = [];

        for(var x = 0; x < amount; x++){
            moves.push(turnMoves[Math.floor(Math.random()*turnMoves.length)]+`${Math.random()>0.5?'\'':''}`);
        }

        var scramble = "";
        moves.forEach(move => {scramble+=move+" "});

        return {moves, scramble};
    }
})(window);
