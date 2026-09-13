require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

// Express Server Setup for Render.com
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Telegram OTP Bot is Running Live!');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Telegram Bot Setup
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const VOLTX_BASE_URL = 'https://api.2oo9.cloud/MXS47FLFX0U/tnevs/@public/api';

// সব ধরনের কাজের সার্ভিস ও অ্যাপ আইকন ম্যাচিং ফাংশন
function getAppIcon(serviceName) {
    if (!serviceName) return '📱 অ্যাপ:';
    
    const name = serviceName.toLowerCase();

    // Messaging Apps
    if (name.includes('telegram') || name.includes('tg')) return '✈️ Telegram';
    if (name.includes('whatsapp') || name.includes('wa')) return '💬 WhatsApp';
    if (name.includes('imo')) return '🔹 IMO';
    if (name.includes('messenger')) return '💙 Messenger';
    if (name.includes('viber')) return '💜 Viber';
    if (name.includes('line')) return '🟢 Line';
    if (name.includes('wechat')) return '🟩 WeChat';
    if (name.includes('signal')) return '🔒 Signal';

    // Social Media
    if (name.includes('facebook') || name.includes('fb')) return '📘 Facebook';
    if (name.includes('instagram') || name.includes('ig')) return '📸 Instagram';
    if (name.includes('tik') || name.includes('tok')) return '🎵 TikTok';
    if (name.includes('twitter') || name.includes('x')) return '🐦 Twitter/X';
    if (name.includes('snap') || name.includes('chat')) return '👻 Snapchat';
    if (name.includes('reddit')) return '🤖 Reddit';

    // Google & Microsoft
    if (name.includes('google') || name.includes('gmail')) return '🔴 Google';
    if (name.includes('youtube')) return '▶️ YouTube';
    if (name.includes('outlook') || name.includes('hotmail')) return '📧 Outlook';

    // Crypto & Wallet
    if (name.includes('binance')) return '🟡 Binance';
    if (name.includes('bybit')) return '🖤 Bybit';
    if (name.includes('kucoin')) return '🟢 KuCoin';
    if (name.includes('trust')) return '🛡️ Trust Wallet';

    // Entertainment & Utility
    if (name.includes('discord')) return '👾 Discord';
    if (name.includes('netflix')) return '🍿 Netflix';
    if (name.includes('paypal')) return '💳 PayPal';
    if (name.includes('amazon')) return '📦 Amazon';
    if (name.includes('uber')) return '🚗 Uber';
    
    // অন্য যেকোনো কাজের জন্য ডিফল্ট আইকন
    return `📱 ${serviceName.toUpperCase()}`;
}

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