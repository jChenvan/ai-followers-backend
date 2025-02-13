require('dotenv').config();
const {Router} = require('express');
const {prisma} = require('../prismaClient.js');
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken.js');
const ai = require('../aiCharacter.js');

const router = Router();

router.post('/',verifyToken,async(req,res)=>{
    const {parentId, charId} = req.body;
    const content =  charId? (await ai.replyPost(parentId,charId,req.userId)) : req.body.content;
    const post = await prisma.post.create({
        data: {
            content,
            parentId,
            authorId:charId || req.userId
        }
    });
    res.json(post);
});

router.get('/',verifyToken, async(req,res)=>{
    const allPosts = await prisma.post.findMany({
        select:{
            id:true,
            timestamp:true,
            content:true,
            parentId:true,
            author:{
                select:{
                    id:true,
                    username:true,
                    hueRotation:true,
                }
            }
        },
        where:{OR:[
            {authorId:req.userId},
            {authorId:{in:req.validIds}}
        ]}
    });
    res.json(allPosts);
});

function getDeleteIds(currId,nodes) {
    const res = [parseInt(currId)];
    let i = 0;
    while (i < nodes.length) {
        if (nodes[i].parentId == currId) {
            const next = nodes.splice(i,1)[0];
            res.push(...getDeleteIds(next.id,nodes));
        } else {
            i++;
        }
    }
    return res;
}

router.delete('/:postId',verifyToken, async(req,res)=>{
    const allPosts = await prisma.post.findMany({where:{OR:[{authorId:req.userId},{authorId:{in:req.validIds}}]}});
    const toDel = getDeleteIds(req.params.postId,allPosts);
    const deleted = await prisma.post.deleteMany({where:{id:{in:toDel},OR:[{authorId:req.userId},{authorId:{in:req.validIds}}]}});
    res.json(deleted);
});

module.exports = router;