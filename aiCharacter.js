require('dotenv').config()

const {prisma} = require('./prismaClient');
const {OpenAI} = require('openai');
const openai = new OpenAI({apiKey:process.env.OPENAI_KEY});

async function replyPost(postId,characterId,humanId) {
    const posts = [await prisma.post.findUnique({where:{id:postId}})];
    const char = await prisma.aiProfile.findUnique({where:{userId:characterId}});

    while (typeof posts[0].parentId === 'number') {
        const parent = await prisma.post.findUnique({where:{id:posts[0].parentId}});
        posts.unshift(parent);
    }

    const history = [{role:'system',content:char.prompt.concat('\nYou are a social media user replying to a social media post. Limit your response to no more than 2 sentences.')}]

    for (const post of posts) {
        history.push({
            role: (post.authorId === humanId) ? 'user' : 'assistant',
            content: post.content
        });
    }

    const reply = await openai.chat.completions.create({
        model:'gpt-4o-mini',
        messages:history
    });

    return await prisma.post.create({
        data:{
            authorId:characterId,
            parentId:postId,
            content:reply.choices[0].message.content
        }
    });
}

async function replyMessage(userId,characterId) {
    const chatters = [userId,characterId];

    const messages = await prisma.message.findMany({
        where:{
            senderId:{in:chatters},
            recipientId:{in:chatters}
        },
        orderBy: {
            timestamp: 'asc'
        }
    });
    const char = await prisma.aiProfile.findUnique({where:{userId:characterId}});
    const history = [{
        role:'system',
        content:char.prompt.concat('\nYou are DMing a user on a social media platform. Limit responses to no more than 2 sentences.')
    }];

    for (const msg of messages) {
        history.push({
            role: (msg.senderId === userId) ? 'user' : 'assistant',
            content: msg.content
        });
    }

    const reply = await openai.chat.completions.create({
        model:'gpt-4o-mini',
        messages:history,
    });

    return await prisma.message.create({
        data: {
            senderId:characterId,
            recipientId:userId,
            content:reply.choices[0].message.content
        }
    });
}

module.exports = {replyPost,replyMessage}