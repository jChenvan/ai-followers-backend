require('dotenv').config();
const {Router} = require('express');
const bcrypt = require('bcryptjs');
const {prisma} = require('../prismaClient.js');
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken.js');

const router = Router();

router.post('/',async (req,res)=>{
    const {username,password} = req.body;

    const aiIds = (await prisma.aiProfile.findMany({select:{userId:true}})).map(val=>val.userId);
    const usernames = (await prisma.user.findMany({where:{id:{notIn:aiIds}},select:{username:true}})).map(val=>val.username);
    if (usernames.includes(username)) {
        res.status(409).json({message:"Username taken"});
        return
    }

    const hashedPassword = await bcrypt.hash(password,10);
    const user = await prisma.user.create({
        data: {
            username,
            password:hashedPassword,
            hueRotation:Math.floor(Math.random()*360)
        }
    });
    res.json({user:{username:user.username}});
});

router.get('/',verifyToken, async (req,res)=>{
    const {username,hueRotation} = await prisma.user.findUnique({where:{id:req.userId}});
    res.json({username,hueRotation});
});

router.put('/',verifyToken, async (req,res)=>{
    const {username} = await prisma.user.update({where:{id:req.userId},data:{username:req.body.username}});
    res.json({username});
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

router.delete('/',verifyToken, async (req,res)=>{
    await deleteAllPosts(req.userId);
    await deleteAllMessages(req.userId);
    await deleteAllCharacters(req.userId);
    const {username} = await prisma.user.delete({where:{id:req.userId}});

    res.json({username});
});

module.exports = router;