var Mark;
(function (Mark) {
    Mark[Mark["X"] = 0] = "X";
    Mark[Mark["O"] = 1] = "O";
    Mark[Mark["UNDEFINED"] = 2] = "UNDEFINED";
})(Mark || (Mark = {}));
var OpCode;
(function (OpCode) {
    OpCode[OpCode["START"] = 1] = "START";
    OpCode[OpCode["UPDATE"] = 2] = "UPDATE";
    OpCode[OpCode["DONE"] = 3] = "DONE";
    OpCode[OpCode["MOVE"] = 4] = "MOVE";
    OpCode[OpCode["REJECTED"] = 5] = "REJECTED";
})(OpCode || (OpCode = {}));
