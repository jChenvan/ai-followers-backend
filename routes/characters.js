require('dotenv').config();
const {Router} = require('express');
const {prisma} = require('../prismaClient.js');
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken.js');

const router = Router();

router.post('/',verifyToken,(req,res)=>{
    jwt.verify(req.token,process.env.SECRET_KEY,async (err,authData)=>{
        const {id} = authData;
        await prisma.character.create({data:{
            name: req.body.name,
            prompt: req.body.desc,
            creatorId: id
        }});
        res.end();
    });
});

router.get('/',verifyToken, (req,res)=>{
    jwt.verify(req.token,process.env.SECRET_KEY, async (err,authData) => {
        const {id} = authData;
        const chars = await prisma.character.findMany({where:{creatorId:id}});
        res.json(chars);
    });
});

router.put('/:charId',verifyToken, (req,res)=>{
    jwt.verify(req.token,process.env.SECRET_KEY, async (err,authData) => {
        const {id} = authData;
        const char = await prisma.character.findUnique({where:{id:req.params.charId}});
        if (char.creatorId === id) {
            await prisma.character.update({where:{id:req.params.charId},data:{prompt:req.body.desc,name:req.body.name}});
        }
        res.end();
    });
});

router.delete('/:charId',verifyToken, (req,res)=>{
    jwt.verify(req.token,process.env.SECRET_KEY,async (err,authData) => {
        const {id} = authData;
        const char = await prisma.character.findUnique({where:{id:req.params.charId}});
        if (char.creatorId === id) {
            await prisma.character.delete({where:{id:req.params.charId,creatorId:id}});
        }
        res.end();
    });
});

module.exports = router;