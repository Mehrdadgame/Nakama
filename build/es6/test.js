const serverRpc = function (ctx, logger, nk, payload) {
    if (ctx.userId != "") {
        logger.error("rpc was called by a user");
        return null;
    }
    return "<JsonResponse>";
};
