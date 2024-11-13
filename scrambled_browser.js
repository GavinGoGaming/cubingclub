// made for cubingclub site, free to use. genScrable# returns string[], scramble# returns string
const moves = ["U", "F", "L", "B", "R", "D"];
function genScramble(amount, size) {
    let shkr = [];
    var lastMove = "";
    for (var x = 0; x < amount; x++) {
        function genMove() {
            var move = moves[Math.floor(moves.length * Math.random())];
            if(move == lastMove) return genMove();
            lastMove = move;
            var possibles = ["2", "'", ""];
            var add = possibles[Math.floor(possibles.length * Math.random())];
            return (`${move}${add}`);
        }
        shkr.push(genMove());
    }
    return shkr;
}
function scramble(amount, size) {
    return genScramble(amount, size).join(" ");
}
