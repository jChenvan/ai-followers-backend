require('dotenv').config();
const {Router} = require('express');
const {prisma} = require('../prismaClient.js');
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken.js');
const ai = require('../aiCharacter.js');

const router = Router();

router.post('/',verifyToken,async(req,res)=>{
    const {content, parentId} = req.body;
    const post = await prisma.post.create({
        data: {
            content,
            parentId,
            authorId:req.userId
        }
    });
    const replies = [];
    const toReply = [];
    if (!parentId) {
        let replyCount = Math.min(3,req.validIds.length);
        const indices = req.validIds.map((val,index)=>index);
        while (replyCount) { 
            const randIndex = Math.floor(Math.random()*indices.length);
            toReply.push(req.validIds[indices.splice(randIndex,1)[0]]);
            replyCount--;
        }
    } else {
        const robot = await prisma.post.findUnique({select:{authorId:true},where:{id:parentId}});
        toReply.push(robot.authorId);
    }

    for (const i of toReply) {
        const reply = await ai.replyPost(post.id,i,req.userId);
        replies.push(reply);
    }
    res.json({post,replies});
    res.end();
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