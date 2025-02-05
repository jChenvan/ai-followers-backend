require('dotenv').config();
const {Router} = require('express');
const {prisma} = require('../prismaClient.js');
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken.js');

const router = Router();

router.post('/',verifyToken,async(req,res)=>{
    const post = req.body.postId;
    const liker = req.body.userId;

    if (req.validIds.includes(liker)) {
        await prisma.like.create({data:{
            userId:liker,
            postId:post,
        }});
    }
    res.end();
});

router.delete('/',verifyToken, async (req,res)=>{
    const post = req.body.postId;
    const liker = req.body.userId;

    if (req.validIds.includes(liker)) {
        await prisma.like.delete({where:{
            userId:liker,
            postId:post,
        }});
    }
    res.end();
});

module.exports = router;