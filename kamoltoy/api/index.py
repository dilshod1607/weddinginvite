import os
import json
from flask import Flask, request, jsonify
from telebot import TeleBot

app = Flask(__name__)

BOT_TOKEN = os.environ.get('BOT_TOKEN', '8796483611:AAEQcSghEiGWyVCbMclplAtpKQpyWENAh5w')
bot = TeleBot(BOT_TOKEN)

# Vercel is read-only, use /tmp for temporary storage if needed
RSVP_FILE = '/tmp/rsvp_data.json'

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

        name = data.get('name', '').strip()
        guest_count = data.get('guestCount', 1)
        attendance = data.get('attendance', 'yes')
        comment = data.get('comment', '').strip()
        timestamp = data.get('timestamp', '')

        attendance_text = "Ha" if attendance == "yes" else "Yo'q"
        message = (
            f"🎊 Yangi mehmon!\n\n"
            f"👤 Ism: {name}\n"
            f"👥 Mehmonlar soni: {guest_count}\n"
            f"✅ Ishtirok: {attendance_text}\n"
            f"💬 Izoh: {comment if comment else 'Yo‘q'}\n"
            f"📅 Vaqt: {timestamp}\n\n"
            f"🌐 Sayt: http://kamoltoy.vercel.app/"
        )

        chat_id = os.environ.get('CHAT_ID', '5391341271')
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
            'timestamp': timestamp
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

# Required for Vercel
def handler(request):
    return app(request)
