require('dotenv').config();
const {Router} = require('express');
const {prisma} = require('../prismaClient.js');
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken.js');
const ai = require('../aiCharacter.js');

const router = Router();

router.post('/:userId',verifyToken,async(req,res)=>{
    if (req.validIds.includes(req.params.userId)) {
        const post = await prisma.post.create({
            data: {
                content:req.body.content,
                parentId:req.body.parent,
                authorId:req.params.userId
            }
        });
        const replies = [];
        for (let i = 0; i < req.validIds.length - 1; i++) {
            const reply = await ai.replyPost(post.id,req.validIds[i],req.validIds.at(-1));
            replies.push(reply);
        }
        res.json({post,replies});
    }
    res.end();
});

async function findChildren(node, nodes) {
    const children = [];
    let i = 0;
    while (i < nodes.length) {
        if (nodes[i].parentId == node.id) {
            const curr = nodes.splice(i,1)[0];
            children.push(findChildren(curr,nodes));
        } else {
            i++
        }
    }
    return {...node, children}
}

router.get('/',verifyToken, async(req,res)=>{
    const allPosts = await prisma.post.findMany({where:{authorId:{in:req.validIds}}});
    const topLevelPosts = allPosts.filter(val=>val.parentId===null);
    const posttree = topLevelPosts.map(val=>findChildren(val,allPosts));
    res.json(posttree);
});

function getDeleteIds(currId,nodes) {
    const res = [currId];
    let i = 0;
    while (i < nodes.length) {
        if (nodes[i].parentId == currId) {
            const next = nodes.splice(i,1)[0];
            res.push(...getDeleteIds(next.id));
        }
    }
    return res;
}

router.delete('/:postId',verifyToken, async(req,res)=>{
    const allPosts = await prisma.post.findMany({where:{authorId:{in:req.validIds}}});
    const toDel = getDeleteIds(req.params.postId,allPosts);
    const deleted = await prisma.post.deleteMany({where:{id:{in:toDel},authorId:{in:req.validIds}}});
    res.end(deleted);
});

module.exports = router;