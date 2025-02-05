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
    if (req.body.isAi) {
        await prisma.aiProfile.create({
            data:{
                userId:user.id,
                prompt: req.body.prompt,
                creatorId: req.body.creator
            }
        });
    }
    res.json(user);
});

router.get('/',verifyToken, (req,res)=>{
    jwt.verify(req.token,process.env.SECRET_KEY, (err,authData) => {
        const {id,username} = authData;
        res.json({id,username});
    });
});

router.put('/:userId',verifyToken, async (req,res)=>{
    if (req.validIds.includes(req.params.userId) = req.validIds.at(-1)) {
        await prisma.user.update({where:{id:req.params.userId},data:{username:req.body.username}});
    } else if (validIds.includes(req.params.userId)) {
        await prisma.user.update({where:{id:req.params.userId},data:{username:req.body.username}});
        await prisma.aiProfile.update({where:{userId:req.params.userId},data:{prompt:req.body.prompt}});
    }
    res.end();
});

router.delete('/:userId',verifyToken, async (req,res)=>{
    if (req.params.userId = req.validIds.at(-1)) {
        await prisma.user.delete({where:{id:req.params.userId}});
    } else if (validIds.includes(req.params.userId)) {
        await prisma.user.delete({where:{id:req.params.userId}});
        await prisma.aiProfile.delete({where:{userId:req.params.userId}});
    }
    res.end();
});

module.exports = router;