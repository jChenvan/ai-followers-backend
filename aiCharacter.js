require('dotenv').config()

const {prisma} = require('./prismaClient');
const {OpenAI} = require('openai');
const openai = new OpenAI({apiKey:process.env.OPENAI_KEY});

async function replyPost(postId,characterId) {
    const posts = [await prisma.post.findUnique({where:{id:postId}})];
    const char = await prisma.character.findUnique({where:{id:characterId}});

    while (typeof posts[0].parentId === 'number') {
        const parent = await prisma.post.findUnique({where:{id:posts[0].parentId}});
        posts.unshift(parent);
    }

    const history = [{role:'system',content:char.prompt.concat('\nYou are a social media user replying to a social media post. Limit your response to no more than 2 sentences.')}]

    for (const post of posts) {
        history.push({
            role: post.humanAuthorId ? 'user' : 'assistant',
            content: post.content
        });
    }

    const reply = await openai.chat.completions.create({
        model:'gpt-4o-mini',
        messages:history
    });

    return await prisma.post.create({
        data:{
            aiAuthorId:characterId,
            parentId:postId,
            content:reply.choices[0].message
        }
    });
}

async function replyMessage(userId,characterId) {
    const messages = await prisma.message.findMany({where:{humanId:userId,aiId:characterId},orderBy:{timestamp:'asc'}});
    const char = await prisma.character.findUnique({where:{id:characterId}});
    const history = [{
        role:'system',
        content:char.prompt.concat('\nYou are DMing a user on a social media platform. Limit responses to no more than 2 sentences.')
    }];

    for (const msg of messages) {
        history.push({
            role: msg.humanSent ? 'user' : 'assistant',
            content: msg.content
        });
    }

    //TODO: openAi API

    const reply = await openai.chat.completions.create({
        model:'gpt-4o-mini',
        messages:history,
    });

    return await prisma.message.create({
        data: {
            humanSent:false,
            humanId:userId,
            aiId:characterId,
            content:reply.choices[0].message
        }
    });
}

module.exports = {replyPost,replyMessage}