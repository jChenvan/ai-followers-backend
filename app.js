require('dotenv').config();

const express = require('express');
const {prisma} = require('./prismaClient.js');
const ai = require('./aiCharacter.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken.js');
const cors = require('cors');

const origin = (origin,callback) => {
    if (!origin || [process.env.FRONTEND,'http://localhost:5173','http://localhost:5173/',process.env.FRONTEND.concat('/')].includes(origin)) {
        callback(null,true);
    } else {
        callback(new Error('Not allowed by CORS'));
    }
}

const app = express();
app.options('*',cors({
    origin,
    optionsSuccessStatus: 200
}));
app.use(cors({
    origin,
    optionsSuccessStatus: 200
}));
app.use(express.json());

const userRouter = require('./routes/users.js');
const postRouter = require('./routes/posts.js');
const likeRouter = require('./routes/like.js');
const msgRouter = require('./routes/messages.js');
const charRouter = require('./routes/characters.js');

app.use('/users',userRouter);
app.use('/posts',postRouter);
app.use('/likes',likeRouter);
app.use('/messages',msgRouter);
app.use('/characters',charRouter);

app.post('/log-in',async (req,res)=>{
    const user = await prisma.user.findFirst({
        where:{
            username: req.body.username
        }
    });
    if (!user) {
        res.status(500).json({message:"User does not exist"});
        return;
    }
    match = user.password ? await bcrypt.compare(req.body.password,user.password) : false;
    if (match) {
        jwt.sign({id:user.id, username:user.username},process.env.SECRET_KEY,{expiresIn:'30min'},(err,token)=>{
            res.json({
                token,
                hueRotation: user.hueRotation
            });
        });
    }
});

app.listen(process.env.PORT || 3000, () => console.log(`Listening on port ${process.env.PORT}!`));