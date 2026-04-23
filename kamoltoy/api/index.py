import os
import json
import requests
from flask import Flask, request, jsonify
from telebot import TeleBot

app = Flask(__name__)

BOT_TOKEN = os.environ.get('BOT_TOKEN')
bot = TeleBot(BOT_TOKEN) if BOT_TOKEN else None

# Vercel is read-only, use /tmp for temporary storage if needed
RSVP_FILE = '/tmp/rsvp_data.json'

def get_location(ip):
    try:
        if not ip or ip == '127.0.0.1':
            return "Localhost"
        response = requests.get(f'http://ip-api.com/json/{ip}?fields=status,message,country,city,isp', timeout=5)
        data = response.json()
        if data.get('status') == 'success':
            return f"{data.get('country')}, {data.get('city')} ({data.get('isp')})"
        return "Noma'lum joylashuv"
    except Exception as e:
        print(f"Location error: {e}")
        return "Aniqlab bo'lmadi"

def load_rsvp_data():
    if os.path.exists(RSVP_FILE):
        try:
            with open(RSVP_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []

def save_rsvp_data(data):
    try:
        with open(RSVP_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except:
        pass

@app.route('/save_rsvp', methods=['POST'])
def save_rsvp():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        # Spam protection: check honeypot
        if data.get('isBot'):
            return jsonify({'success': True}) # Pretend success to bots

        name = data.get('name', '').strip()
        guest_count = data.get('guestCount', 1)
        attendance = data.get('attendance', 'yes')
        comment = data.get('comment', '').strip()
        
        # Get timestamp from request or generate current one (Tashkent time)
        timestamp = data.get('timestamp')
        if not timestamp:
            from datetime import datetime, timedelta, timezone
            # Tashkent is UTC+5
            tashkent_tz = timezone(timedelta(hours=5))
            timestamp = datetime.now(tashkent_tz).strftime('%d.%m.%Y, %H:%M:%S')

        # Get user IP and Location
        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if user_ip and ',' in user_ip:
            user_ip = user_ip.split(',')[0].strip()
        location = get_location(user_ip)

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

        chat_id = os.environ.get('CHAT_ID', '')
        if bot and chat_id:
            try:
                bot.send_message(chat_id=chat_id, text=message)
            except Exception as e:
                print(f"Telegram bot error: {e}")

        # Also save to /tmp (temporary)
        guests = load_rsvp_data()
        guests.append({
            'name': name,
            'guestCount': guest_count,
            'attendance': attendance,
            'comment': comment,
            'timestamp': timestamp,
            'ip': user_ip,
            'location': location
        })
        save_rsvp_data(guests)

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/get_guests', methods=['GET'])
def get_guests():
    guests = load_rsvp_data()
    return jsonify({
        'success': True, 
        'guests': guests
    })

@app.route('/track_visit', methods=['POST'])
def track_visit():
    try:
        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if user_ip and ',' in user_ip:
            user_ip = user_ip.split(',')[0].strip()
        
        location = get_location(user_ip)
        user_agent = request.headers.get('User-Agent', 'Noma\'lum')
        referer = request.headers.get('Referer', 'To\'g\'ridan-to\'g\'ri')
        
        from datetime import datetime, timedelta, timezone
        tashkent_tz = timezone(timedelta(hours=5))
        now = datetime.now(tashkent_tz).strftime('%d.%m.%Y, %H:%M:%S')

        message = (
            f"👀 Saytga kirish!\n\n"
            f"📍 IP: {user_ip}\n"
            f"🌍 Joylashuv: {location}\n"
            f"📱 Qurilma: {user_agent}\n"
            f"🔗 Manba: {referer}\n"
            f"📅 Vaqt: {now}"
        )

        chat_id = os.environ.get('CHAT_ID', '')
        if bot and chat_id:
            try:
                bot.send_message(chat_id=chat_id, text=message)
            except:
                pass

        return jsonify({'success': True})
    except:
        return jsonify({'success': False}), 500

# Required for Vercel
def handler(request):
    return app(request)
