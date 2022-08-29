let InitModule = function (ctx, logger, nk, initializer) {
    initializer.registerRpc("ChannelMessageSend", serverRpc);
    initializer.registerRpc("turnMessageSend", rtBeturnMessageSend);
    initializer.registerMatch(moduleName, {
        matchInit,
        matchJoinAttempt,
        matchJoin,
        matchLeave,
        matchLoop,
        matchTerminate,
        matchSignal,
    });
};
