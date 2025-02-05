require('dotenv').config();

const express = require('express');
const {prisma} = require('./prismaClient.js');
const ai = require('./aiCharacter.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken.js');

const app = express();
app.use(express.json());

const userRouter = require('./routes/users.js');
const postRouter = require('./routes/posts.js');
const likeRouter = require('./routes/like.js');
const msgRouter = require('./routes/messages.js');

app.use('/users',userRouter);
app.use('/posts',postRouter);
app.use('/likes',likeRouter);
app.use('/messages',msgRouter);

app.post('/log-in',async (req,res)=>{
    const user = await prisma.user.findFirst({
        where:{
            username: req.body.username
        }
    });
    let match;
    if (user.password) {
        match = await bcrypt.compare(req.body.password,user.password);
    }
    if (match) {
        jwt.sign({...user,password:undefined},process.env.SECRET_KEY,{expiresIn:'2h'},(err,token)=>{
            res.json({
                token
            });
        });
    }
});

app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}!`));