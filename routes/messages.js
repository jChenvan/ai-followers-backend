require('dotenv').config();
const {Router} = require('express');
const {prisma} = require('../prismaClient.js');
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken.js');
const ai = require('../aiCharacter.js');

const router = Router();

router.post('/',verifyToken,async(req,res)=>{
    const {recipientId,content,charId} = req.body;

    let msg;

    if (req.validIds.includes(recipientId)) {
        msg = await prisma.message.create({
            data: {
                senderId:req.userId,
                recipientId,
                content
            }
        });
    } else if (!recipientId && charId) {
        const text = await ai.replyMessage(req.userId,charId);
        msg = await prisma.message.create({
            data: {
                senderId:charId,
                recipientId:req.userId,
                content:text
            }
        });
    }
    res.json(msg);
});

router.get('/:charId',verifyToken, async (req,res)=>{
    if (req.validIds.includes(parseInt(req.params.charId))) {
        const chatters = [req.userId, parseInt(req.params.charId)];
        const allPosts = await prisma.message.findMany({where:{senderId:{in:chatters},recipientId:{in:chatters}},orderBy:{timestamp:'asc'}});
        res.json(allPosts);
    }
});

router.delete('/:messageId',verifyToken, async (req,res)=>{
    const {senderId,recipientId} = await prisma.message.findUnique({where:{id:req.params.messageId}});

    if (senderId === req.userId || recipientId === req.userId) {
        const deleted = await prisma.message.delete({where:{id:req.params.messageId}});
        res.json(deleted);
    }

    res.end();
});

module.exports = router;