function verifyToken(req,res,next) {
    const bearerHeader = req.headers.authorization;

    if (bearerHeader !== undefined) {
        const bearerToken = bearerHeader.split(' ').at(-1);
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}

module.exports = verifyToken;