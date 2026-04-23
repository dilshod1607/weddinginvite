import os
import json
import requests
import telebot
from flask import Flask, request, jsonify
from telebot import TeleBot, types
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
app = Flask(__name__)

# Config
BOT_TOKEN = os.environ.get('BOT_TOKEN')
CHAT_ID = os.environ.get('CHAT_ID')
# SQLite file in /tmp for Vercel (Note: not persistent across redeploys/restarts)

bot = TeleBot(BOT_TOKEN, threaded=False)

client = MongoClient(os.environ.get("MONGO_URI"))
db = client["wedding"]

rsvp_collection = db["rsvps"]
visitor_collection = db["visitors"]
def get_location(ip):
    try:
        if not ip or ip == '127.0.0.1':
            return "Localhost"
        response = requests.get(f'http://ip-api.com/json/{ip}?fields=status,message,country,city,isp', timeout=5)
        data = response.json()
        if data.get('status') == 'success':
            return f"{data.get('country')}, {data.get('city')} ({data.get('isp')})"
        return "Noma'lum joylashuv"
    except:
        return "Aniqlab bo'lmadi"

@app.route('/save_rsvp', methods=['POST'])
def save_rsvp():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        if data.get('isBot'):
            return jsonify({'success': True})

        name = data.get('name', '').strip()
        guest_count = data.get('guestCount', 1)
        attendance = data.get('attendance', 'yes')
        comment = data.get('comment', '').strip()
        
        tashkent_tz = timezone(timedelta(hours=5))
        timestamp = data.get('timestamp') or datetime.now(tashkent_tz).strftime('%d.%m.%Y, %H:%M:%S')

        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if user_ip and ',' in user_ip:
            user_ip = user_ip.split(',')[0].strip()
        location = get_location(user_ip)

        # Save to MongoDB
        rsvp_collection.insert_one({
            "name": name,
            "guestCount": guest_count,
            "attendance": attendance,
            "comment": comment,
            "timestamp": timestamp,
            "ip": user_ip,
            "location": location,
            "created_at": datetime.now()
        })
        # Send to Telegram
        attendance_text = "Ha" if attendance == "yes" else "Yo'q"
        message = (
            f"🎊 Yangi mehmon!\n\n"
            f"👤 Ism: {name}\n"
            f"👥 Mehmonlar soni: {guest_count}\n"
            f"✅ Ishtirok: {attendance_text}\n"
            f"💬 Izoh: {comment if comment else 'Yo‘q'}\n"
            f"📅 Vaqt: {timestamp}\n"
            f"📍 IP: {user_ip}\n"
            f"🌍 Joylashuv: {location}\n\n"
            f"🌐 Sayt: http://kamoltoy.vercel.app/"
        )

        if bot and CHAT_ID:
            try:
                bot.send_message(chat_id=CHAT_ID, text=message)
            except:
                pass

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/get_guests', methods=['GET'])
def get_guests():
    try:
        guests = list(rsvp_collection.find().sort("_id", -1))
        for g in guests:
            g["_id"] = str(g["_id"])
        return jsonify({'success': True, 'guests': guests})
    except:
        return jsonify({'success': False, 'guests': []})

@app.route('/track_visit', methods=['POST'])
def track_visit():
    try:
        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if user_ip and ',' in user_ip:
            user_ip = user_ip.split(',')[0].strip()

        user_agent = request.headers.get('User-Agent', "Noma'lum")
        fingerprint = f"{user_ip}_{user_agent}"

        existing = visitor_collection.find_one({"fingerprint": fingerprint})

        if not existing:
            visitor_collection.insert_one({
                "fingerprint": fingerprint,
                "first_visit": datetime.now()
            })

            total_count = visitor_collection.count_documents({})

            location = get_location(user_ip)
            referer = request.headers.get('Referer', "To'g'ridan-to'g'ri")
            tashkent_tz = timezone(timedelta(hours=5))
            now = datetime.now(tashkent_tz).strftime('%d.%m.%Y, %H:%M:%S')

            message = (
                f"🆕 Yangi tashrif buyuruvchi! (#{total_count})\n\n"
                f"📍 IP: {user_ip}\n"
                f"🌍 Joylashuv: {location}\n"
                f"📱 Qurilma: {user_agent}\n"
                f"🔗 Manba: {referer}\n"
                f"📅 Vaqt: {now}"
            )

            if bot and CHAT_ID:
                try:
                    bot.send_message(chat_id=CHAT_ID, text=message)
                except:
                    pass
        else:
            total_count = visitor_collection.count_documents({})

        return jsonify({'success': True, 'total_unique': total_count})

    except Exception as e:
        print(e)
        return jsonify({'success': False}), 500

# Telegram Webhook Handler
@app.route('/bot_webhook', methods=['POST', 'GET'])
def bot_webhook():
    if request.method == 'GET':
        return "Webhook is active. Send a POST request from Telegram."
    
    if request.headers.get('content-type') == 'application/json':
        try:
            json_string = request.get_data().decode('utf-8')
            print(f"Received update: {json_string}")
            update = types.Update.de_json(json_string)
            bot.process_new_updates([update])
            return 'OK', 200
        except Exception as e:
            print(f"Webhook Error: {e}")
            return str(e), 500
    else:
        return 'Invalid content-type', 403

@app.route('/set_webhook', methods=['GET'])
def set_webhook():
    try:
        webhook_url = f"https://{request.host}/bot_webhook"
        bot.remove_webhook()
        bot.set_webhook(url=webhook_url)
        return f"Webhook set to: {webhook_url}"
    except Exception as e:
        return str(e)

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    bot.reply_to(message, "Assalomu alaykum! Men to'y taklifnomasi botiman.\n\nBuyruqlar:\n/stats - Umumiy statistika\n/guests - Mehmonlar ro'yxati\n/ping - Botni tekshirish")

@bot.message_handler(commands=['ping'])
def send_ping(message):
    bot.reply_to(message, "Pong! Bot ishlayapti ✅")

@bot.message_handler(commands=['stats'])
def send_stats(message):
    try:
        v_count = visitor_collection.count_documents({})
        r_confirmed = rsvp_collection.count_documents({"attendance": "yes"})
        r_declined = rsvp_collection.count_documents({"attendance": "no"})

        confirmed = list(rsvp_collection.find({"attendance": "yes"}))
        total_guests = sum([g.get("guestCount", 1) for g in confirmed])

        res = (
            f"📊 Statistika:\n\n"
            f"👁 Unikal tashriflar: {v_count}\n"
            f"✅ Tasdiqlaganlar: {r_confirmed} ta ariza ({total_guests} kishi)\n"
            f"❌ Kela olmaydiganlar: {r_declined} ta"
        )

        bot.reply_to(message, res)

    except Exception as e:
        bot.reply_to(message, f"Xatolik: {str(e)}")
@bot.message_handler(commands=['guests'])
def send_guests(message):
    try:
        guests = list(rsvp_collection.find().sort("_id", -1).limit(20))

        if not guests:
            bot.reply_to(message, "Hozircha mehmonlar yo'q.")
            return

        res = "📋 Oxirgi 20 ta mehmon:\n\n"

        for g in guests:
            status = "✅" if g.get("attendance") == 'yes' else "❌"
            res += f"{status} {g.get('name')} ({g.get('guestCount', 1)} kishi)\n"

        bot.reply_to(message, res)

    except Exception as e:
        bot.reply_to(message, f"Xatolik: {str(e)}")
# Required for Vercel
def handler(request):
    return app(request)
