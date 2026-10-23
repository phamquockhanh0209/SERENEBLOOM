/**
 * SereneBloom - Data & Authentication Service
 * Seamlessly interfaces with Cloud Firestore & Firebase Auth when configured,
 * with persistent local storage fallback for immediate offline/demo exploration.
 */

import { getFirebaseInstances, isFirebaseConfigured } from './firebase-config.js';

// Local Mock Storage Key
const LOCAL_STORAGE_KEY = 'serenebloom_local_data';
const CURRENT_USER_KEY = 'serenebloom_current_user';

// Helper to get local data
function getLocalData() {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    const initial = {
      users: {
        'demo-user-123': {
          uid: 'demo-user-123',
          displayName: 'Ngọc Hân',
          email: 'ngochan@thpt.edu.vn',
          avatarInitial: 'H',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      checkins: {
        'demo-user-123': [
          {
            checkinId: 'chk-1',
            mood: 'good',
            content: 'Hôm nay làm xong bài kiểm tra Toán cảm thấy nhẹ nhõm hẳn. Đã tự thưởng một ly trà sữa ít đường!',
            dateKey: new Date().toISOString().split('T')[0],
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
          }
        ]
      },
      chatSessions: {
        'demo-user-123': [
          {
            sessionId: 'sess-1',
            title: 'Lắng nghe cảm xúc trước kỳ thi',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      },
      messages: {
        'sess-1': [
          {
            messageId: 'msg-1',
            role: 'ai',
            content: 'Chào bạn, mình là SereneBloom AI. Mình ở đây để lắng nghe bất cứ điều gì bạn đang trải qua hôm nay.',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      },
      preferences: {
        'demo-user-123': {
          dailyReminderEnabled: true,
          reminderTime: '21:00',
          updatedAt: new Date().toISOString()
        }
      }
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(raw);
}

function saveLocalData(data) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export const DataService = {
  // ==========================================
  // AUTHENTICATION
  // ==========================================
  async getCurrentUser() {
    const { auth, configured } = await getFirebaseInstances();
    if (configured && auth) {
      if (typeof auth.authStateReady === 'function') {
        await auth.authStateReady();
      } else {
        await new Promise(resolve => {
          const unsub = auth.onAuthStateChanged(u => {
            if (unsub) unsub();
            resolve(u);
          });
        });
      }

      if (auth.currentUser) {
        let profile = null;
        try {
          profile = await this.getUserProfile(auth.currentUser.uid);
        } catch (e) {}

        const displayName = profile?.displayName || auth.currentUser.displayName || auth.currentUser.email.split('@')[0];
        return {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName,
          avatarInitial: (displayName || 'U')[0].toUpperCase()
        };
      }
    }

    // Local fallback user if explicitly logged in
    const localUserStr = localStorage.getItem(CURRENT_USER_KEY);
    if (localUserStr) {
      return JSON.parse(localUserStr);
    }

    // Unauthenticated: return null so login page is displayed
    return null;
  },

  async registerUser(email, password, displayName) {
    const { auth, db, configured } = await getFirebaseInstances();
    if (configured && auth && db) {
      const { createUserWithEmailAndPassword, updateProfile } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      
      const avatarInitial = (displayName || email)[0].toUpperCase();
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        displayName,
        email,
        avatarInitial,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { uid: cred.user.uid, email, displayName, avatarInitial };
    }

    // Local registration
    const data = getLocalData();
    const uid = 'user_' + Date.now();
    const avatarInitial = (displayName || email)[0].toUpperCase();
    const newUser = {
      uid,
      displayName,
      email,
      avatarInitial,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.users[uid] = newUser;
    data.checkins[uid] = [];
    data.chatSessions[uid] = [];
    data.preferences[uid] = { dailyReminderEnabled: true, reminderTime: '21:00' };
    saveLocalData(data);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  async loginUser(email, password) {
    const { auth, configured } = await getFirebaseInstances();
    if (configured && auth) {
      const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await this.getUserProfile(cred.user.uid);
      const user = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: profile?.displayName || cred.user.displayName || email.split('@')[0],
        avatarInitial: (profile?.displayName || cred.user.displayName || email)[0].toUpperCase()
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }

    // Local login verification
    const data = getLocalData();
    let found = Object.values(data.users).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      // Create user if testing locally
      const uid = 'user_' + Date.now();
      const displayName = email.split('@')[0];
      found = {
        uid,
        displayName,
        email,
        avatarInitial: displayName[0].toUpperCase(),
        createdAt: new Date().toISOString()
      };
      data.users[uid] = found;
      saveLocalData(data);
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(found));
    return found;
  },

  async logoutUser() {
    const { auth, configured } = await getFirebaseInstances();
    if (configured && auth) {
      const { signOut } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
      await signOut(auth);
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    return true;
  },

  async resetPassword(email) {
    const { auth, configured } = await getFirebaseInstances();
    if (configured && auth) {
      const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
      await sendPasswordResetEmail(auth, email);
      return true;
    }
    // Local simulated reset
    return true;
  },

  async updateUserProfile(uid, { displayName }) {
    const { auth, db, configured } = await getFirebaseInstances();
    const avatarInitial = displayName ? displayName[0].toUpperCase() : 'U';

    if (configured && auth && db) {
      const { updateProfile } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
      const { doc, updateDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
      }
      await updateDoc(doc(db, "users", uid), {
        displayName,
        avatarInitial,
        updatedAt: serverTimestamp()
      });
    }

    // Update local cache
    const current = await this.getCurrentUser();
    current.displayName = displayName;
    current.avatarInitial = avatarInitial;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(current));

    const data = getLocalData();
    if (data.users[uid]) {
      data.users[uid].displayName = displayName;
      data.users[uid].avatarInitial = avatarInitial;
      data.users[uid].updatedAt = new Date().toISOString();
      saveLocalData(data);
    }
    return current;
  },

  async getUserProfile(uid) {
    const { db, configured } = await getFirebaseInstances();
    if (configured && db) {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) return snap.data();
    }
    const data = getLocalData();
    return data.users[uid] || null;
  },

  // ==========================================
  // CHECK-INS & MOOD JOURNAL
  // ==========================================
  async addCheckin(uid, { mood, content, dateKey }) {
    if (!mood && (!content || !content.trim())) {
      throw new Error("Vui lòng chọn tâm trạng hoặc viết cảm xúc.");
    }

    const todayStr = dateKey || new Date().toISOString().split('T')[0];
    const checkinId = 'chk_' + Date.now();
    const newCheckin = {
      checkinId,
      mood: mood || 'good',
      content: content ? content.trim() : '',
      dateKey: todayStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { db, configured } = await getFirebaseInstances();
    if (configured && db) {
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      // Ensure parent document users/{uid} exists so Firestore doesn't show it in italics
      await setDoc(doc(db, "users", uid), {
        uid,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await setDoc(doc(db, "users", uid, "checkins", checkinId), {
        ...newCheckin,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return newCheckin;
    }

    // Local storage
    const data = getLocalData();
    if (!data.checkins[uid]) data.checkins[uid] = [];
    data.checkins[uid].unshift(newCheckin);
    saveLocalData(data);
    return newCheckin;
  },

  async getCheckins(uid) {
    const { db, configured } = await getFirebaseInstances();
    if (configured && db) {
      const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      try {
        const q = query(collection(db, "users", uid, "checkins"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(d => list.push({ ...d.data(), checkinId: d.id }));
        return list;
      } catch (err) {
        console.warn("Firestore checkins fetch fallback:", err);
      }
    }

    const data = getLocalData();
    return (data.checkins[uid] || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async updateCheckin(uid, checkinId, { mood, content, dateKey }) {
    const { db, configured } = await getFirebaseInstances();
    if (configured && db) {
      const { doc, updateDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      await updateDoc(doc(db, "users", uid, "checkins", checkinId), {
        mood,
        content,
        dateKey,
        updatedAt: serverTimestamp()
      });
    }

    const data = getLocalData();
    if (data.checkins[uid]) {
      const idx = data.checkins[uid].findIndex(c => c.checkinId === checkinId);
      if (idx !== -1) {
        data.checkins[uid][idx].mood = mood;
        data.checkins[uid][idx].content = content;
        if (dateKey) data.checkins[uid][idx].dateKey = dateKey;
        data.checkins[uid][idx].updatedAt = new Date().toISOString();
        saveLocalData(data);
      }
    }
    return true;
  },

  async deleteCheckin(uid, checkinId) {
    const { db, configured } = await getFirebaseInstances();
    if (configured && db) {
      const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      await deleteDoc(doc(db, "users", uid, "checkins", checkinId));
    }

    const data = getLocalData();
    if (data.checkins[uid]) {
      data.checkins[uid] = data.checkins[uid].filter(c => c.checkinId !== checkinId);
      saveLocalData(data);
    }
    return true;
  },

  // Calculate Streak & Mood Statistics accurately from real records
  calculateStats(checkins) {
    const total = checkins.length;
    const moodCounts = {
      joy: 0,
      good: 0,
      neutral: 0,
      sad: 0,
      anxious: 0,
      tired: 0
    };

    checkins.forEach(c => {
      if (moodCounts[c.mood] !== undefined) {
        moodCounts[c.mood]++;
      }
    });

    // Calculate streak based on unique local dates (YYYY-MM-DD)
    const uniqueDates = Array.from(new Set(checkins.map(c => c.dateKey || (c.createdAt ? c.createdAt.split('T')[0] : ''))))
      .filter(Boolean)
      .sort()
      .reverse();

    let streak = 0;
    if (uniqueDates.length > 0) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Streak is active if user checked in today or yesterday
      let expectedDate = new Date(uniqueDates[0]);
      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i]);
          const diffDays = Math.round((expectedDate - prevDate) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            streak++;
            expectedDate = prevDate;
          } else {
            break;
          }
        }
      }
    }

    return {
      total,
      streak,
      moodCounts
    };
  },

  // ==========================================
  // AI CHAT SESSIONS & MESSAGES
  // ==========================================
  async getChatSessions(uid) {
    const { db, configured } = await getFirebaseInstances();
    if (configured && db) {
      const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      try {
        const q = query(collection(db, "users", uid, "chatSessions"), orderBy("updatedAt", "desc"));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(d => list.push({ ...d.data(), sessionId: d.id }));
        return list;
      } catch (err) {
        console.warn("Firestore chatSessions error:", err);
      }
    }

    const data = getLocalData();
    return (data.chatSessions[uid] || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  async createChatSession(uid, title = "Cuộc trò chuyện mới") {
    const sessionId = 'sess_' + Date.now();
    const newSession = {
      sessionId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { db, configured } = await getFirebaseInstances();
    if (configured && db) {
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      await setDoc(doc(db, "users", uid, "chatSessions", sessionId), {
        title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    const data = getLocalData();
    if (!data.chatSessions[uid]) data.chatSessions[uid] = [];
    data.chatSessions[uid].unshift(newSession);
    data.messages[sessionId] = [];
    saveLocalData(data);
    return newSession;
  },

  async deleteChatSession(uid, sessionId) {
    const { db, configured } = await getFirebaseInstances();
    if (configured && db) {
      const { doc, deleteDoc, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      // Clean up subcollection messages first (Firestore requirement)
      try {
        const msgsSnap = await getDocs(collection(db, "users", uid, "chatSessions", sessionId, "messages"));
        const batchDeletes = msgsSnap.docs.map(mDoc => deleteDoc(mDoc.ref));
        await Promise.all(batchDeletes);
        await deleteDoc(doc(db, "users", uid, "chatSessions", sessionId));
      } catch (e) {
        console.warn("Delete session firestore subcollection error:", e);
      }
    }

    const data = getLocalData();
    if (data.chatSessions[uid]) {
      data.chatSessions[uid] = data.chatSessions[uid].filter(s => s.sessionId !== sessionId);
      delete data.messages[sessionId];
      saveLocalData(data);
    }
    return true;
  },

  async getSessionMessages(uid, sessionId) {
    const { db, configured } = await getFirebaseInstances();
    if (configured && db) {
      const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      try {
        const q = query(collection(db, "users", uid, "chatSessions", sessionId, "messages"), orderBy("createdAt", "asc"));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(d => list.push({ ...d.data(), messageId: d.id }));
        return list;
      } catch (err) {
        console.warn("Firestore messages fetch error:", err);
      }
    }

    const data = getLocalData();
    return data.messages[sessionId] || [];
  },

  async addChatMessage(uid, sessionId, role, content) {
    const messageId = 'msg_' + Date.now();
    const newMsg = {
      messageId,
      role,
      content,
      createdAt: new Date().toISOString()
    };

    const { db, configured } = await getFirebaseInstances();
    if (configured && db) {
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      // Save message in subcollection
      await setDoc(doc(db, "users", uid, "chatSessions", sessionId, "messages", messageId), {
        role,
        content,
        createdAt: serverTimestamp()
      });
      // Update session timestamp and title
      const sessionUpdate = {
        updatedAt: serverTimestamp()
      };
      if (role === 'user') {
        sessionUpdate.title = content.slice(0, 32) + (content.length > 32 ? '...' : '');
      }
      await setDoc(doc(db, "users", uid, "chatSessions", sessionId), sessionUpdate, { merge: true });
    }

    const data = getLocalData();
    if (!data.messages[sessionId]) data.messages[sessionId] = [];
    data.messages[sessionId].push(newMsg);
    // Update session updatedAt and title if first user prompt
    if (data.chatSessions[uid]) {
      const sess = data.chatSessions[uid].find(s => s.sessionId === sessionId);
      if (sess) {
        sess.updatedAt = new Date().toISOString();
        if (role === 'user' && (sess.title === 'Cuộc trò chuyện mới' || !sess.title)) {
          sess.title = content.slice(0, 32) + (content.length > 32 ? '...' : '');
        }
      }
    }
    saveLocalData(data);
    return newMsg;
  },

  // ==========================================
  // PREFERENCES & NOTIFICATION SETTINGS
  // ==========================================
  async getPreferences(uid) {
    const { db, configured } = await getFirebaseInstances();
    if (configured && db) {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      const snap = await getDoc(doc(db, "users", uid, "settings", "preferences"));
      if (snap.exists()) return snap.data();
    }
    const data = getLocalData();
    return data.preferences[uid] || { dailyReminderEnabled: true, reminderTime: '21:00' };
  },

  async savePreferences(uid, preferences) {
    const payload = {
      ...preferences,
      updatedAt: new Date().toISOString()
    };

    const { db, configured } = await getFirebaseInstances();
    if (configured && db) {
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
      await setDoc(doc(db, "users", uid, "settings", "preferences"), {
        ...preferences,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    const data = getLocalData();
    data.preferences[uid] = payload;
    saveLocalData(data);
    return payload;
  }
};
