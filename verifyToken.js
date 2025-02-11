require('dotenv').config();
const jwt = require('jsonwebtoken');
const {prisma} = require('./prismaClient.js');

function verifyToken(req,res,next) {
    const token = req.headers.authorization?.split(' ').at(-1);

    if (!token) {
        return res.status(401).json({message:"Access denied: No token provided"});
    }

    jwt.verify(token,process.env.SECRET_KEY, async (err,authData) => {
        if (err) {
            return res.status(403).json({message:"Invalid token"});
        }

        try {
            const characters = await prisma.aiProfile.findMany({where:{creatorId:authData.id}});
            const validIds = characters.map(val=>val.userId);

            req.validIds = validIds;
            req.userId = authData.id;

            if (!req.validIds) {
                return res.status(404).json({message:"User not found"});
            }

            next();
        } catch (error) {
            return res.status(500).json({message:"Internal Server Error", error});
        }
    });
}

module.exports = verifyToken;