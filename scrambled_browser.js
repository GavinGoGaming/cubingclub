const threebythree = ["U", "F", "L", "B", "R", "D"];
const twobytwo = ["U", "R", "F"];
const pyra = ["R", "U", "L", "B", "r", "u", "l", "b"];
/*
 * Get moveset for NxN or pyra. Used internally
*/
function getMoves(size) {
    if(size == 2) {
        return twobytwo;
    } else if(size == 'pyra' || size == 'skewb') {
        return pyra;
    } else {
        return threebythree;
    }
}
/*
 * Generate a scramble array of strings (moves). Supports NxN and 'pyra'.
*/
function genScramble(amount, size) {
    var pyraTips = [];
    let shkr = [];
    var lastMove = "";
    for (var x = 0; x < amount; x++) {
        function genMove() {
            var move = getMoves(size)[Math.floor(getMoves(size).length * Math.random())];
            if(move == lastMove) return genMove();
            if(size == "skewb") move = move.toUpperCase();
            if(size == "pyra") {
                if (move == move.toLowerCase()) {
                    if (pyraTips.length > 3) return genMove();
                    var genPyraTip = () => {
                        var tp = ['\'', ''];
                        if(move == pyraTips[pyraTips.length - 1]) return genPyraTip();
                        var mv = (move + tp[Math.floor(Math.random() * tp.length)]);
                        return mv;
                    }
                    pyraTips.push(genPyraTip());
                    return genMove();
                }
            }
            lastMove = move;
            var possibles = ["'", ""];
            if(size != "pyra") {
                possibles.push("2");
            }
            var add = possibles[Math.floor(possibles.length * Math.random())];
            return (`${move}${add}`);
        }
        shkr.push(genMove());
    }
    if(size == "pyra") {
        shkr = shkr.concat(pyraTips);
    }
    return shkr;
}
function scramble(amount, size) {
    return genScramble(amount, size).join(" ");
}
