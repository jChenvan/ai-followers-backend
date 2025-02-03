require('dotenv').config();
const {Router} = require('express');
const {prisma} = require('../prismaClient.js');
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken.js');

const router = Router();

router.post('/',verifyToken,(req,res)=>{
    jwt.verify(req.token,process.env.SECRET_KEY, async (err,authData)=>{
        const user = JSON.parse(authData);
        const chars = await prisma.character.findMany({where:{creatorId:user.id}});
        const charIds = chars.map(val=>val.id);
        if (req.body.charId === undefined || charIds.includes(req.body.charId)) {
            await prisma.post.create({
                data: {
                    content:req.body.content,
                    parentId:req.body.parent,
                    humanAuthorId:req.body.charId ? null : user.id,
                    aiAuthorId:req.body.charId
                }
            });
        }
        res.end();
    });
});

router.get('/',verifyToken, (req,res)=>{
    jwt.verify(req.token,process.env.SECRET_KEY, (err,authData) => {
        const {id,username} = authData;
        res.json({id,username});
    });
});

router.delete('/:postId',verifyToken, (req,res)=>{
    jwt.verify(req.token,process.env.SECRET_KEY,async (err,authData) => {
        const user = JSON.parse(authData);
        let deleteUser;
        if (req.params.userId === user.id) {
            deleteUser = await prisma.user.delete({where:{id:user.id}});
        }
        req.json(deleteUser);
    });
});

module.exports = router;