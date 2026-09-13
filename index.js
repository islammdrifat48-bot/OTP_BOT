require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Telegram OTP Bot is Running Live!');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const VOLTX_BASE_URL = 'https://api.2oo9.cloud/MXS47FLFX0U/tnevs/@public/api';

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const mainKeyboard = {
        reply_markup: {
            keyboard: [
                [{ text: '💰 Balance' }, { text: '📩 Invite & Earn' }],
                [{ text: '📲 Get Numbers' }],
                [{ text: '❌ Close Menu' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };

    bot.sendMessage(chatId, "👋 Welcome! Choose an option from the menu below:", mainKeyboard);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '💰 Balance') {
        bot.sendMessage(chatId, "💳 Your Balance: $0.00\n\n(Minimum recharge applies for new users.)");
    } 
    else if (text === '📩 Invite & Earn') {
        bot.sendMessage(chatId, `🎁 Your Referral Link:\nhttps://t.me/${msg.from.username || 'bot'}?start=${chatId}\n\nEarn rewards per successful referral!`);
    } 
    else if (text === '❌ Close Menu') {
        bot.sendMessage(chatId, "Menu closed. Type /start to re-open.", {
            reply_markup: { remove_keyboard: true }
        });
    } 
    else if (text === '📲 Get Numbers' || text === '/getnum') {
        const serviceOptions = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✈️ Telegram', callback_data: 'rid_telegram' },
                        { text: '💬 WhatsApp', callback_data: 'rid_whatsapp' }
                    ],
                    [
                        { text: '🔹 IMO', callback_data: 'rid_imo' },
                        { text: '📘 Facebook', callback_data: 'rid_facebook' }
                    ],
                    [
                        { text: '🔴 Google / Gmail', callback_data: 'rid_google' },
                        { text: '🎵 TikTok', callback_data: 'rid_tiktok' }
                    ]
                ]
            }
        };

        bot.sendMessage(chatId, "📲 Select the app service you need:", serviceOptions);
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    if (!data.startsWith('rid_')) return;

    const serviceName = data.replace('rid_', '');
    let rangeId = "26134"; 

    bot.answerCallbackQuery(query.id, { text: `Processing ${serviceName.toUpperCase()} number...` });
    
    bot.editMessageText(`⏳ Fetching number for ${serviceName.toUpperCase()}, please wait...`, {
        chat_id: chatId,
        message_id: messageId
    });

    try {
        const response = await axios.post(
            `${VOLTX_BASE_URL}/getnum`,
            { rid: rangeId },
            {
                headers: {
                    'mauthapi': process.env.VOLTX_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        const resData = response.data;

        if (resData && (resData.meta?.code === 200 || resData.meta?.status === 'ok')) {
            const phoneNumber = resData.data?.full_number || resData.data?.national_number || 'N/A';
            const country = resData.data?.country || 'N/A';

            const resultText = 
`📱 **Your Numbers — 🇩🇿 ${country}**\n\n` +
`📞 \`+${phoneNumber}\`\n\n` +
`⏳ **Waiting for OTP...**\n` +
`*Tap a number to copy it!*\n` +
`_You'll be notified here when OTP arrives._`;

            const actionButtons = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🔄 Change Number', callback_data: 'rid_' + serviceName },
                            { text: '🌍 Change Country', callback_data: 'change_country' }
                        ]
                    ]
                },
                parse_mode: 'Markdown'
            };

            bot.editMessageText(resultText, {
                chat_id: chatId,
                message_id: messageId,
                ...actionButtons
            });
        } else {
            bot.editMessageText(
                `⚠️ Number unavailable!\nMessage: ${resData.message || 'Out of stock or balance low.'}`, 
                { chat_id: chatId, message_id: messageId }
            );
        }
    } catch (error) {
        console.error("API Error:", error.message);
        bot.editMessageText(
            `❌ API Connection Error! Check your API key or stock.`, 
            { chat_id: chatId, message_id: messageId }
        );
    }
});}

// Command: /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
        chatId,
        `👋 **স্বাগতম!**\n\nগ্রুপে VoltX SMS থেকে ভার্চুয়াল নম্বর পেতে \`/getnum\` কমান্ড ব্যবহার করুন।`,
        { parse_mode: 'Markdown' }
    );
});

// Command: /getnum or /number
bot.onText(/\/(getnum|number)/, async (msg) => {
    const chatId = msg.chat.id;

    const waitMsg = await bot.sendMessage(chatId, "⏳ VoltX SMS থেকে নম্বর আনা হচ্ছে, অপেক্ষা করুন...");

    try {
        const response = await axios.post(
            `${VOLTX_BASE_URL}/getnum`,
            {},
            {
                headers: {
                    'mauthapi': process.env.VOLTX_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = response.data;

        if (data && (data.code === 200 || data.status === 'success')) {
            const phoneNumber = data.data?.number || data.data?.phone || data.number || 'N/A';
            const rangeId = data.rid || data.data?.rid || 'N/A';
            const rawService = data.data?.service || data.service || data.data?.name || '';
            
            const appDisplay = getAppIcon(rawService);

            const messageText = 
`📲 **সার্ভিস:** ${appDisplay}\n` +
`📞 **নম্বর:** \`${phoneNumber}\`\n` +
`🆔 **RID:** \`${rangeId}\`\n\n` +
`*কোড (OTP) আসার জন্য অপেক্ষা করুন...*`;

            bot.editMessageText(
                messageText, 
                { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' }
            );
        } else {
            bot.editMessageText(
                `⚠️ নম্বর পাওয়া যায়নি!\nমেসেজ: ${data.message || 'ব্যালেন্স শেষ অথবা সার্ভিস সাময়িক বন্ধ।'}`, 
                { chat_id: chatId, message_id: waitMsg.message_id }
            );
        }
    } catch (error) {
        console.error("API Error:", error.message);
        bot.editMessageText(
            `❌ API সংযোগে সমস্যা হয়েছে!\nError: ${error.response ? JSON.stringify(error.response.data) : error.message}`, 
            { chat_id: chatId, message_id: waitMsg.message_id }
        );
    }
});
