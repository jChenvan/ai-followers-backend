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

router.get('/me',verifyToken, async (req,res) => {
    const user = await prisma.user.findUnique({
        where:{
            id:req.validIds.at(-1)
        }
    });

    const charIds = req.validIds.slice(0,-1);

    res.json({user,charIds});
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

router.delete('/:userId',verifyToken, async (req,res)=>{
    let user;
    let aiProfile;
    if (req.params.userId = req.validIds.at(-1)) {
        user = await prisma.user.delete({where:{id:req.params.userId}});
    } else if (validIds.includes(req.params.userId)) {
        user = await prisma.user.delete({where:{id:req.params.userId}});
        aiProfile = await prisma.aiProfile.delete({where:{userId:req.params.userId}});
    }
    res.json({user,aiProfile});
});

module.exports = router;