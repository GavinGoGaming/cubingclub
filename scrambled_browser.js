(function(global) {
    const turnMoves = ['R', 'U', 'L', 'D', 'F', 'B'];
    global.generateScramble=(amount, cube)=>{
        let moves = [];
        var lastMove = "";

        for(var x = 0; x < amount; x++){
            var redoMove = ()=>{
                var move = (turnMoves[Math.floor(Math.random()*turnMoves.length)]+`${Math.random()>0.5?'\'':''}`);
                if(move.includes(lastMove.replaceAll('\'',''))) {
                    return redoMove();
                }
                return move;
            }

            lastMove = redoMove();
        }

        var scramble = "";
        moves.forEach(move => {scramble+=move+" "});

        return {moves, scramble};
    }
})(window);
