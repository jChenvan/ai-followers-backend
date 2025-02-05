require('dotenv').config();
const {Router} = require('express');
const {prisma} = require('../prismaClient.js');
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken.js');
const ai = require('../aiCharacter.js');

const router = Router();

router.post('/',verifyToken,async(req,res)=>{
    const {senderId,recipientId,content} = req.body;

    if (req.validIds.includes(senderId) && req.validIds.includes(recipientId)) {
        const msg = await prisma.message.create({
            data: {
                senderId,
                recipientId,
                content
            }
        });
        const replies = [];
        for (let i = 0; i < req.validIds.length - 1; i++) {
            const reply = await ai.replyMessage(msg.id,req.validIds[i]);
            replies.push(reply);
        }
        res.json({msg,replies})
    }
    res.end();
});

router.get('/:charId',verifyToken, async (req,res)=>{
    if (req.validIds.includes(req.params.charId) && req.params.charId !== req.validIds.at(-1)) {
        const chatters = [req.validIds.at(-1), req.params.charId];
        const allPosts = await prisma.message.findMany({where:{senderId:{in:chatters},recipientId:{in:chatters}},orderBy:{timestamp:'asc'}});
        res.json(allPosts);
    }
});

router.delete('/:messageId',verifyToken, async (req,res)=>{
    const {senderId,recipientId} = await prisma.message.findUnique({where:{id:req.params.messageId}});

    if (req.verifyToken.includes(senderId) && req.verifyToken.includes(recipientId)) {
        const deleted = await prisma.message.delete({where:{id:req.params.messageId}});
        res.json(deleted);
    }

    res.end();
});

module.exports = router;