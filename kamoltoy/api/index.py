import os
import json
import requests
import sqlite3
from flask import Flask, request, jsonify
from telebot import TeleBot
from datetime import datetime, timedelta, timezone

app = Flask(__name__)

# Config
BOT_TOKEN = os.environ.get('BOT_TOKEN')
CHAT_ID = os.environ.get('CHAT_ID')
# SQLite file in /tmp for Vercel (Note: not persistent across redeploys/restarts)
DB_PATH = '/tmp/wedding.db'


bot = TeleBot(BOT_TOKEN, threaded=False)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rsvps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            guestCount INTEGER,
            attendance TEXT,
            comment TEXT,
            timestamp TEXT,
            ip TEXT,
            location TEXT,
            created_at DATETIME
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fingerprint TEXT UNIQUE,
            first_visit DATETIME
        )
    ''')
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

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

        # Save to SQLite
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO rsvps (name, guestCount, attendance, comment, timestamp, ip, location, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (name, guest_count, attendance, comment, timestamp, user_ip, location, datetime.now()))
        conn.commit()
        conn.close()

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
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM rsvps ORDER BY id DESC')
        rows = cursor.fetchall()
        guests = [dict(row) for row in rows]
        conn.close()
        return jsonify({'success': True, 'guests': guests})
    except:
        return jsonify({'success': False, 'guests': []})

@app.route('/track_visit', methods=['POST'])
def track_visit():
    try:
        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if user_ip and ',' in user_ip:
            user_ip = user_ip.split(',')[0].strip()
        user_agent = request.headers.get('User-Agent', 'Noma\'lum')
        fingerprint = f"{user_ip}_{user_agent}"

        conn = get_db()
        cursor = conn.cursor()
        
        # Check uniqueness
        cursor.execute('SELECT id FROM visitors WHERE fingerprint = ?', (fingerprint,))
        row = cursor.fetchone()
        
        if not row:
            cursor.execute('INSERT INTO visitors (fingerprint, first_visit) VALUES (?, ?)', (fingerprint, datetime.now()))
            conn.commit()
            
            # Get total count
            cursor.execute('SELECT COUNT(*) FROM visitors')
            total_count = cursor.fetchone()[0]
            
            location = get_location(user_ip)
            referer = request.headers.get('Referer', 'To\'g\'ridan-to\'g\'ri')
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
            cursor.execute('SELECT COUNT(*) FROM visitors')
            total_count = cursor.fetchone()[0]

        conn.close()
        return jsonify({'success': True, 'total_unique': total_count})
    except:
        return jsonify({'success': False}), 500

# Telegram Webhook Handler
@app.route('/bot_webhook', methods=['POST', 'GET'])
def bot_webhook():
    if request.method == 'GET':
        return "Webhook is active. Send a POST request from Telegram."
    
    if request.headers.get('content-type') == 'application/json':
        try:
            json_string = request.get_data().decode('utf-8')
            update = telebot.types.Update.de_json(json_string)
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
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM visitors')
        v_count = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM rsvps WHERE attendance = "yes"')
        r_confirmed = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM rsvps WHERE attendance = "no"')
        r_declined = cursor.fetchone()[0]
        cursor.execute('SELECT SUM(guestCount) FROM rsvps WHERE attendance = "yes"')
        total_guests = cursor.fetchone()[0] or 0
        conn.close()

        res = (
            f"📊 Statistika:\n\n"
            f"👁 Unikal tashriflar: {v_count}\n"
            f"✅ Tasdiqlaganlar: {r_confirmed} ta ariza ({total_guests} kishi)\n"
            f"❌ Kela olmaydiganlar: {r_declined} ta"
        )
        bot.reply_to(message, res)
    except Exception as e:
        bot.reply_to(message, f"Xatolik yuz berdi: {str(e)}")

@bot.message_handler(commands=['guests'])
def send_guests(message):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT name, guestCount, attendance FROM rsvps ORDER BY id DESC LIMIT 20')
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            bot.reply_to(message, "Hozircha mehmonlar yo'q.")
            return

        res = "📋 Oxirgi 20 ta mehmon:\n\n"
        for row in rows:
            status = "✅" if row['attendance'] == 'yes' else "❌"
            res += f"{status} {row['name']} ({row['guestCount']} kishi)\n"
        
        bot.reply_to(message, res)
    except Exception as e:
        bot.reply_to(message, f"Xatolik yuz berdi: {str(e)}")

# Required for Vercel
def handler(request):
    return app(request)
