require('dotenv').config();
const {Router} = require('express');
const bcrypt = require('bcryptjs');
const {prisma} = require('../prismaClient.js');
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken.js');

const router = Router();

router.post('/',async (req,res)=>{
    let hashedPassword
    if (!req.body.isAi) {
        hashedPassword = await bcrypt.hash(req.body.password,10);
    }
    const user = await prisma.user.create({
        data: {
            username:req.body.username,
            password:hashedPassword
        }
    });
    let aiProfile;
    if (req.body.isAi) {
        aiProfile = await prisma.aiProfile.create({
            data:{
                userId:user.id,
                prompt: req.body.prompt,
                creatorId: req.body.creator
            }
        });
    }
    res.json({user,aiProfile});
});

router.get('/:userId',verifyToken, async (req,res)=>{
    const user = await prisma.user.findUnique({where:{id:req.params.userId}});
    if (req.params.userId === req.validIds.at(-1)) {
        const charIds = req.validIds.slice(0,-1);
        res.json({user,charIds});
    } else if (req.validIds.includes(req.params.userId)) {
        const aiProfile = await prisma.aiProfile.findFirst({where:{userId:req.params.userId}});
        res.json({user,aiProfile});
    }
});

router.put('/:userId',verifyToken, async (req,res)=>{
    let user;
    let aiProfile;
    if (req.validIds.includes(req.params.userId) = req.validIds.at(-1)) {
        user = await prisma.user.update({where:{id:req.params.userId},data:{username:req.body.username}});
    } else if (validIds.includes(req.params.userId)) {
        user = await prisma.user.update({where:{id:req.params.userId},data:{username:req.body.username}});
        aiProfile = await prisma.aiProfile.update({where:{userId:req.params.userId},data:{prompt:req.body.prompt}});
    }
    res.json({user,aiProfile});
});

async function deleteAllPosts(userId) {
    const toDelete = (await prisma.post.findMany({where:{authorId:userId}})).map(val=>val.id);
    let start = 0;
    let end = toDelete.length;

    while (true) {
        for (let i = start; i < end; i++) {
            const children = (await prisma.post.findMany({where:{parentId:toDelete[i]}})).map(val=>val.id);
            toDelete.push(...children);
        }
        if (toDelete.length === end) {
            break
        }
        start = end;
        end = toDelete.length;
    }

    return await prisma.post.deleteMany({where:{id:{in:toDelete}}});
}

async function deleteAllMessages(userId) {
    return await prisma.message.deleteMany({
        where:{
            OR:[
                {senderId:userId},
                {recipientId:userId}
            ]
        }
    });
}

async function deleteAllCharacters(userId) {
    const charToDelete = (await prisma.aiProfile.findMany({
        where: {creatorId:userId}
    })).map(val=>val.userId);
    for (cid of charToDelete) {
        await prisma.aiProfile.delete({where:{userId:cid}});
        await prisma.user.delete({where:{id:cid}});
    }
}

router.delete('/:userId',verifyToken, async (req,res)=>{
    let user;
    let aiProfile;
    if (req.params.userId = req.validIds.at(-1)) {
        await deleteAllPosts(req.params.userId);
        await deleteAllMessages(req.params.userId);
        await deleteAllCharacters(req.params.userId);
        user = await prisma.user.delete({where:{id:req.params.userId}});
    } else if (validIds.includes(req.params.userId)) {
        await deleteAllPosts(req.params.userId);
        await deleteAllMessages(req.params.userId);
        aiProfile = await prisma.aiProfile.delete({where:{userId:req.params.userId}});
        user = await prisma.user.delete({where:{id:req.params.userId}});
    }
    res.json({user,aiProfile});
});

module.exports = router;