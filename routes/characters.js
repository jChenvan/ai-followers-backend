require('dotenv').config();
const {Router} = require('express');
const bcrypt = require('bcryptjs');
const {prisma} = require('../prismaClient.js');
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken.js');

const router = Router();

router.post('/',verifyToken,async (req,res)=>{
    const {username,prompt} = req.body;

    const aiIds = (await prisma.aiProfile.findMany({where:{creatorId:req.userId},select:{userId:true}})).map(val=>val.userId);
    const usernames = (await prisma.user.findMany({where:{id:{in:aiIds}},select:{username:true}})).map(val=>val.username);
    if (usernames.includes(username)) {
        res.status(409).json({message:"Username taken"});
        return
    }
    
    const user = await prisma.user.create({
        data: {
            username,
            profile:{
                create:{
                    prompt,
                    creatorId:req.userId
                }
            },
            hueRotation:Math.floor(Math.random()*360)
        }
    });

    res.json({user});
});

router.get('/', verifyToken, async (req,res)=>{
    const chars = await prisma.aiProfile.findMany({select:{prompt:true,user:{select:{id:true,username:true,hueRotation:true}}}, where:{userId:{in:req.validIds}}});
    res.json(chars);
});

router.get('/:userId',verifyToken, async (req,res)=>{
    if (!req.validIds.includes(req.params.userId)) {
        res.status(500).json({message:'Invalid characterId'});
        return;
    }
    const char = await prisma.user.findUnique({where:{id:req.params.userId}});
    const aiProfile = await prisma.aiProfile.findUnique({where:{userId:req.params.userId}});

    res.json({username:char.username,prompt: aiProfile.prompt});
});

router.put('/:userId',verifyToken, async (req,res)=>{
    const {username, prompt} = req.body;
    if (!req.validIds.includes(req.params.userId)) {
        res.status(500).json({message:'Invalid characterId'});
        return;
    }
    const user = await prisma.user.update({where:{id:req.params.userId},data:{username}});
    const aiProfile = await prisma.aiProfile.update({where:{userId:req.params.userId},data:{prompt}});
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

router.delete('/:userId',verifyToken, async (req,res)=>{
    id = parseInt(req.params.userId);
    if (!req.validIds.includes(id)) {
        res.status(500).json({message:'Invalid characterId'});
        return;
    }
    await deleteAllPosts(id);
    await deleteAllMessages(id);
    await prisma.aiProfile.delete({where:{userId:id}});
    const user = await prisma.user.delete({where:{id}});

    res.json({user});
});

module.exports = router;