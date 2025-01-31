require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
function verifyToken(req,res,next) {
    const bearerHeader = req.headers.authorization;

    if (bearerHeader !== undefined) {
        const bearerToken = bearerHeader.split(' ').at(-1);
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}

const express = require('express');
const app = express();
app.use(express.urlencoded({extended:false}));

app.post('/log-in',async (req,res)=>{
    const user = await prisma.user.findFirst({
        where:{
            username: req.body.username
        }
    });
    const match = await bcrypt.compare(req.user.password,user.password);

    if (match) {
        jwt.sign({user},process.env.SECRET_KEY,{expiresIn:'2h'},(err,token)=>{
            res.json({
                token
            });
        });
    }
});

app.post('/users',async (req,res)=>{
    const hashedPassword = await bcrypt.hash(req.body.password,10);
    const user = await prisma.user.create({
        data: {
            username:req.body.username,
            password:hashedPassword
        }
    });
    res.json(user);
});

app.post('/posts');

app.post('/characters');

app.post('/messages')

app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}!`));