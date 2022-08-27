var rpcIdTurn = 'TurnManager_js';
var rpcId = 'main_js';
function InitModule(ctx, logger, nk, initializer) {
    
    initializer.registerRpc(rpcId , InitModule);
    logger.info('JavaScript logic loaded.');
}