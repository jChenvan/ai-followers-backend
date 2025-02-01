require('dotenv').config();
const {Router} = require('express');
const bcrypt = require('bcryptjs');
const {prisma} = require('../prismaClient.js');
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken.js');

const router = Router();

router.post('/',async (req,res)=>{
    const hashedPassword = await bcrypt.hash(req.body.password,10);
    const user = await prisma.user.create({
        data: {
            username:req.body.username,
            password:hashedPassword
        }
    });
    res.json(user);
});

router.get('/',verifyToken, (req,res)=>{
    jwt.verify(req.token,process.env.SECRET_KEY, (err,authData) => {
        const {id,username} = authData;
        res.json({id,username});
    });
});

router.put('/:userId',verifyToken, (req,res)=>{
    jwt.verify(req.token,process.env.SECRET_KEY, async (err,authData) => {
        const user = JSON.parse(authData);
        let updateUser;
        if (req.params.userId === user.id) {
            updateUser = await prisma.user.update({where:{id:user.id},data:{username:req.body.username}});
        }
        res.json({updateUser});
    });
});

router.delete('/:userId',verifyToken, (req,res)=>{
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