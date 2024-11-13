const threebythree = ["U", "F", "L", "B", "R", "D"];
const twobytwo = ["U", "R", "F"];
function getMoves(size) {
    if(size == 2) {
        return twobytwo;
    }else {
        return threebythree;
    }
}
function genScramble(amount, size) {
    let shkr = [];
    var lastMove = "";
    for (var x = 0; x < amount; x++) {
        function genMove() {
            var move = getMoves(size)[Math.floor(getMoves(size).length * Math.random())];
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
