// 1. Конфиг Firebase (ТВОИ ДАННЫЕ)
const firebaseConfig = {
    apiKey: "AIzaSyCIBcwNQGMSM3uMu0DaKLGG-rWumfbAj0E",
    authDomain: "kirmelk-dbd0e.firebaseapp.com",
    databaseURL: "https://kirmelk-dbd0e-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "kirmelk-dbd0e"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentRoom = null;
let encryptionKey = "";

// 2. АВТОРИЗАЦИЯ
function handleAuth(type) {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    
    if (type === 'register') {
        auth.createUserWithEmailAndPassword(email, pass).catch(e => alert(e.message));
    } else {
        auth.signInWithEmailAndPassword(email, pass).catch(e => alert(e.message));
    }
}

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('chat-screen').classList.remove('hidden');
        document.getElementById('user-display').innerText = user.email;
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('chat-screen').classList.add('hidden');
    }
});

function logout() { auth.signOut(); }

// 3. РАБОТА С ЧАТОМ И ШИФРОВАНИЕМ
function joinRoom() {
    currentRoom = document.getElementById('room-id').value;
    encryptionKey = document.getElementById('secret-key').value;
    
    if (!currentRoom || !encryptionKey) return alert("Введите ID комнаты и Ключ шифрования!");

    // Слушаем сообщения в комнате
    db.ref('rooms/' + currentRoom).on('value', (snap) => {
        const msgDiv = document.getElementById('messages');
        msgDiv.innerHTML = "";
        snap.forEach(child => {
            const data = child.val();
            
            // РАСШИФРОВКА
            try {
                const bytes = CryptoJS.AES.decrypt(data.text, encryptionKey);
                const decryptedText = bytes.toString(CryptoJS.enc.Utf8) || "[Ошибка ключа]";
                
                const isMy = data.user === auth.currentUser.email;
                msgDiv.innerHTML += `<div class="msg ${isMy ? 'my-msg' : ''}">
                    <small>${data.user}</small><br>${decryptedText}
                </div>`;
            } catch(e) { console.log("Ошибка дешифровки"); }
        });
        msgDiv.scrollTop = msgDiv.scrollHeight;
    });
}

function sendMessage() {
    const input = document.getElementById('msg-input');
    if (!input.value || !currentRoom) return;

    // ШИФРОВАНИЕ ПЕРЕД ОТПРАВКОЙ
    const encryptedText = CryptoJS.AES.encrypt(input.value, encryptionKey).toString();

    db.ref('rooms/' + currentRoom).push({
        user: auth.currentUser.email,
        text: encryptedText,
        time: Date.now()
    });
    input.value = "";
}
