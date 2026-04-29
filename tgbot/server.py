# import os
# import json
# from flask import Flask, request, jsonify, send_from_directory, send_file
# from telebot import TeleBot

# app = Flask(__name__, static_folder='.')

# BOT_TOKEN = os.environ.get('BOT_TOKEN')
# bot = TeleBot(BOT_TOKEN)

# RSVP_FILE = 'rsvp_data.json'

# def load_rsvp_data():
#     if os.path.exists(RSVP_FILE):
#         with open(RSVP_FILE, 'r', encoding='utf-8') as f:
#             return json.load(f)
#     return []

# def save_rsvp_data(data):
#     with open(RSVP_FILE, 'w', encoding='utf-8') as f:
#         json.dump(data, f, ensure_ascii=False, indent=2)

# def get_guests():
#     return load_rsvp_data()

# @app.route('/')
# def index():
#     return send_file('index.html')

# @app.route('/<path:filename>')
# def serve_static(filename):
#     return send_from_directory('.', filename)

# @app.route('/save_rsvp', methods=['POST'])
# def save_rsvp():
#     try:
#         data = request.get_json()

#         if not data:
#             return jsonify({'success': False, 'error': 'No data provided'}), 400

#         name = data.get('name', '').strip()
#         if not name:
#             return jsonify({'success': False, 'error': 'Name is required'}), 400

#         guest_count = data.get('guestCount', 1)
#         attendance = data.get('attendance', 'yes')
#         comment = data.get('comment', '').strip()

#         rsvp_entry = {
#             'name': name,
#             'guestCount': guest_count,
#             'attendance': attendance,
#             'comment': comment,
#             'timestamp': data.get('timestamp', '')
#         }

#         guests = load_rsvp_data()
#         guests.append(rsvp_entry)
#         save_rsvp_data(guests)

#         attendance_text = "Ha" if attendance == "yes" else "Yo'q"
#         message = (
#             f"🎊 Yangi mehmon!\n\n"
#             f"👤 Ism: {name}\n"
#             f"👥 Mehmonlar soni: {guest_count}\n"
#             f"✅ Ishtirok: {attendance_text}\n"
#             f"💬 Izoh: {comment if comment else 'Yo‘q'}\n"
#             f"📅 Vaqt: {rsvp_entry['timestamp']}\n\n"
#             f"🌐 Sayt: http://kamoltoy.vercel.app/"
#         )

#         try:
#             bot.send_message(chat_id=os.environ.get('CHAT_ID', ''), text=message)
#         except Exception as e:
#             print(f"Telegram bot error: {e}")

#         return jsonify({'success': True})

#     except Exception as e:
#         print(f"Error saving RSVP: {e}")
#         return jsonify({'success': False, 'error': str(e)}), 500

# @app.route('/get_guests', methods=['GET'])
# def get_guests_route():
#     try:
#         guests = get_guests()
#         confirmed = [g for g in guests if g.get('attendance') == 'yes']
#         declined = [g for g in guests if g.get('attendance') == 'no']

#         return jsonify({
#             'success': True,
#             'guests': guests,
#             'stats': {
#                 'total': len(guests),
#                 'confirmed': len(confirmed),
#                 'declined': len(declined)
#             }
#         })
#     except Exception as e:
#         print(f"Error getting guests: {e}")
#         return jsonify({'success': False, 'error': str(e)}), 500

# if __name__ == '__main__':
#     port = int(os.environ.get('PORT', 3000))
#     app.run(host='0.0.0.0', port=port, debug=True)
