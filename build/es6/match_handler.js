const moduleName = "tic-tac-toe_js";
const tickRate = 5;
const maxEmptySec = 30;
const delaybetweenGamesSec = 5;
const turnTimeFastSec = 10;
const turnTimeNormalSec = 20;
const winningPositions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];
const matchInit = function (ctx, logger, nk, params) {
    logger.debug('Lobby match created');
    return {
        state: { Debug: true },
        tickRate: 10,
        label: ""
    };
};
let matchJoinAttempt = function (ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
    if (presence.userId in state.presences) {
        if (state.presences[presence.userId] === null) {
            state.joinsInProgress++;
            return {
                state: state,
                accept: false,
            };
        }
        else {
            return {
                state: state,
                accept: false,
                rejectMessage: 'already joined',
            };
        }
    }
    if (connectedPlayers(state) + state.joinsInProgress >= 2) {
        return {
            state: state,
            accept: false,
            rejectMessage: 'match full',
        };
    }
    state.joinsInProgress++;
    return {
        state,
        accept: true,
    };
};
const matchJoin = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    presences.forEach(function (presence) {
        state.presences[presence.userId] = presence;
        logger.debug('%q joined Lobby match', presence.userId);
    });
    return {
        state
    };
};
let matchLeave = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    for (let presence of presences) {
        logger.info("Player: %s left match: %s.", presence.userId, ctx.matchId);
        state.presences[presence.userId] = null;
    }
    return { state };
};
let matchLoop = function (ctx, logger, nk, dispatcher, tick, state, messages) {
    var _a;
    logger.debug('Running match loop. Tick: %d', tick);
    if (connectedPlayers(state) + state.joinsInProgress === 0) {
        state.emptyTicks++;
        if (state.emptyTicks >= maxEmptySec * tickRate) {
            logger.info('closing idle match');
            return null;
        }
    }
    let t = msecToSec(Date.now());
    if (!state.playing) {
        for (let userID in state.presences) {
            if (state.presences[userID] === null) {
                delete state.presences[userID];
            }
        }
        if (Object.keys(state.presences).length < 2 && state.label.open != 1) {
            state.label.open = 1;
            let labelJSON = JSON.stringify(state.label);
            dispatcher.matchLabelUpdate(labelJSON);
        }
        if (Object.keys(state.presences).length < 2) {
            return { state };
        }
        if (state.nextGameRemainingTicks > 0) {
            state.nextGameRemainingTicks--;
            return { state };
        }
        state.playing = true;
        state.board = new Array(9);
        state.marks = {};
        let marks = [Mark.X, Mark.O];
        Object.keys(state.presences).forEach(userId => {
            var _a;
            state.marks[userId] = (_a = marks.shift()) !== null && _a !== void 0 ? _a : null;
        });
        state.mark = Mark.X;
        state.winner = null;
        state.winnerPositions = null;
        state.deadlineRemainingTicks = calculateDeadlineTicks(state.label);
        state.nextGameRemainingTicks = 0;
        let msg = {
            board: state.board,
            marks: state.marks,
            mark: state.mark,
            deadline: t + Math.floor(state.deadlineRemainingTicks / tickRate),
        };
        dispatcher.broadcastMessage(OpCode.START, JSON.stringify(msg));
        return { state };
    }
    for (const message of messages) {
        switch (message.opCode) {
            case OpCode.MOVE:
                logger.debug('Received move message from user: %v', state.marks);
                let mark = (_a = state.marks[message.sender.userId]) !== null && _a !== void 0 ? _a : null;
                if (mark === null || state.mark != mark) {
                    dispatcher.broadcastMessage(OpCode.REJECTED, null, [message.sender]);
                    continue;
                }
                let msg = {};
                try {
                    msg = JSON.parse(nk.binaryToString(message.data));
                }
                catch (error) {
                    dispatcher.broadcastMessage(OpCode.REJECTED, null, [message.sender]);
                    logger.debug('Bad data received: %v', error);
                    continue;
                }
                if (state.board[msg.position]) {
                    dispatcher.broadcastMessage(OpCode.REJECTED, null, [message.sender]);
                    continue;
                }
                state.board[msg.position] = mark;
                state.mark = mark === Mark.O ? Mark.X : Mark.O;
                state.deadlineRemainingTicks = calculateDeadlineTicks(state.label);
                const [winner, winningPos] = winCheck(state.board, mark);
                if (winner) {
                    state.winner = mark;
                    state.winnerPositions = winningPos;
                    state.playing = false;
                    state.deadlineRemainingTicks = 0;
                    state.nextGameRemainingTicks = delaybetweenGamesSec * tickRate;
                }
                let tie = state.board.every(v => v !== null);
                if (tie) {
                    state.playing = false;
                    state.deadlineRemainingTicks = 0;
                    state.nextGameRemainingTicks = delaybetweenGamesSec * tickRate;
                }
                let opCode;
                let outgoingMsg;
                if (state.playing) {
                    opCode = OpCode.UPDATE;
                    let msg = {
                        board: state.board,
                        mark: state.mark,
                        deadline: t + Math.floor(state.deadlineRemainingTicks / tickRate),
                    };
                    outgoingMsg = msg;
                }
                else {
                    opCode = OpCode.DONE;
                    let msg = {
                        board: state.board,
                        winner: state.winner,
                        winnerPositions: state.winnerPositions,
                        nextGameStart: t + Math.floor(state.nextGameRemainingTicks / tickRate),
                    };
                    outgoingMsg = msg;
                }
                dispatcher.broadcastMessage(opCode, JSON.stringify(outgoingMsg));
                break;
            default:
                dispatcher.broadcastMessage(OpCode.REJECTED, null, [message.sender]);
                logger.error('Unexpected opcode received: %d', message.opCode);
        }
    }
    if (state.playing) {
        state.deadlineRemainingTicks--;
        if (state.deadlineRemainingTicks <= 0) {
            state.playing = false;
            state.winner = state.mark === Mark.O ? Mark.X : Mark.O;
            state.deadlineRemainingTicks = 0;
            state.nextGameRemainingTicks = delaybetweenGamesSec * tickRate;
            let msg = {
                board: state.board,
                winner: state.winner,
                nextGameStart: t + Math.floor(state.nextGameRemainingTicks / tickRate),
                winnerPositions: null,
            };
            dispatcher.broadcastMessage(OpCode.DONE, JSON.stringify(msg));
        }
    }
    return { state };
};
let matchTerminate = function (ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
    return { state };
};
let matchSignal = function (ctx, logger, nk, dispatcher, tick, state) {
    return { state };
};
function calculateDeadlineTicks(l) {
    if (l.fast === 1) {
        return turnTimeFastSec * tickRate;
    }
    else {
        return turnTimeNormalSec * tickRate;
    }
}
function winCheck(board, mark) {
    for (let wp of winningPositions) {
        if (board[wp[0]] === mark &&
            board[wp[1]] === mark &&
            board[wp[2]] === mark) {
            return [true, wp];
        }
    }
    return [false, null];
}
function connectedPlayers(s) {
    let count = 0;
    for (const p of Object.keys(s.presences)) {
        if (p !== null) {
            count++;
        }
    }
    return count;
}
