/**
 * ZYLOS - ANTI-GRAVITY SOCIAL MEDIA
 * Core Logic 3.3 (Unified & Complete Profile Features)
 */

/* --- SEED DATA --- */
const SEED_USERS = [
    { id: 'u1', username: 'zylos_official', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', bio: 'The Future.', password: 'password', email: 'admin@zylos.com', followers: 1200, following: 5, followingIds: [] },
    { id: 'u2', username: 'travel_lover', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', bio: 'Wanderlust ✨', password: 'password', email: 'travel@test.com', followers: 890, following: 120, followingIds: [] },
    { id: 'u3', username: 'creative_mind', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80', bio: 'Art is Life 🎨', password: 'password', email: 'art@test.com', followers: 450, following: 300, followingIds: [] },
    { id: 'u4', username: 'photo_king', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80', bio: 'Captured moments daily.', password: 'pass', email: 'photo@test.com', followers: 2300, following: 40, followingIds: [] },
    { id: 'u5', username: 'tech_guru', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80', bio: 'Coding the future.', password: 'pass', email: 'tech@test.com', followers: 1500, following: 200, followingIds: [] }
];

const SEED_POSTS = [
    { id: 'p1', userId: 'u1', type: 'image', content: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', caption: 'Anti-gravity vibes. #future', likes: 145, comments: [], timestamp: Date.now() },
    { id: 'p2', userId: 'u2', type: 'image', content: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80', caption: 'Take me back to the mountains 🏔️', likes: 89, comments: [], timestamp: Date.now() - 3600000 },
    { id: 'p3', userId: 'u3', type: 'video', content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', caption: 'City lights at night. 🌃', likes: 300, comments: [], timestamp: Date.now() - 7200000 },
    { id: 'p4', userId: 'u2', type: 'video', content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', caption: 'Dream big. 🐘', likes: 520, comments: [], timestamp: Date.now() - 10000000 }
];

const SEED_CHATS = [
    { id: 'c1', participants: ['u1', 'u2'], messages: [{ senderId: 'u2', text: 'Hey! Love the new app design 🚀', type: 'text', timestamp: Date.now() - 50000 }] }
];

/* --- UTILITIES --- */
const Utils = {
    genId: () => 'id_' + Math.random().toString(36).substr(2, 9),
    storage: {
        get: (key, def) => { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : def; } catch (e) { return def; } },
        set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
    },
    timeAgo: (ms) => {
        const s = Math.floor((Date.now() - ms) / 1000);
        if (s < 60) return 'Just now';
        const m = Math.floor(s / 60);
        if (m < 60) return m + 'm';
        const h = Math.floor(m / 60);
        if (h < 24) return h + 'h';
        return Math.floor(h / 24) + 'd';
    }
};

/* --- AUTH --- */
const Auth = {
    currentUser: null,
    users: [],
    init() {
        this.users = Utils.storage.get('zylos_users', SEED_USERS);
        if (this.users.length === 0) { this.users = SEED_USERS; Utils.storage.set('zylos_users', this.users); }

        this.currentUser = Utils.storage.get('zylos_current_user', null);

        if (this.currentUser && !this.currentUser.followingIds) {
            this.currentUser.followingIds = [];
            this.updateUser({});
        }

        const path = window.location.pathname;
        const isPublic = path.endsWith('login.html') || path.endsWith('signup.html') || path.endsWith('index.html') || path === '/';

        if (!this.currentUser && !isPublic) window.location.href = 'login.html';
        if (this.currentUser && isPublic && !path.endsWith('index.html')) window.location.href = 'home.html';
    },

    login(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (user) {
            if (!user.followingIds) user.followingIds = [];
            this.currentUser = user;
            Utils.storage.set('zylos_current_user', user);
            return { success: true };
        }
        return { success: false, message: 'Invalid credentials' };
    },

    signup(username, email, password) {
        if (this.users.find(u => u.email === email)) return { success: false, message: 'Email taken' };
        const user = { id: Utils.genId(), username, email, password, avatar: `https://ui-avatars.com/api/?name=${username}&background=random`, bio: 'New User', followers: 0, following: 0, followingIds: [] };
        this.users.push(user);
        this.currentUser = user;
        Utils.storage.set('zylos_users', this.users);
        Utils.storage.set('zylos_current_user', user);
        return { success: true };
    },

    logout() {
        localStorage.removeItem('zylos_current_user');
        window.location.href = 'index.html';
    },

    updateUser(data) {
        Object.assign(this.currentUser, data);
        const idx = this.users.findIndex(u => u.id === this.currentUser.id);
        if (idx !== -1) this.users[idx] = this.currentUser;
        Utils.storage.set('zylos_users', this.users);
        Utils.storage.set('zylos_current_user', this.currentUser);
    }
};

/* --- FEED & PERSISTENCE --- */
const Feed = {
    posts: [],
    init() {
        let storedPosts = Utils.storage.get('zylos_posts', []);
        if (!storedPosts || storedPosts.length === 0) {
            this.posts = [...SEED_POSTS];
            Utils.storage.set('zylos_posts', this.posts);
        } else {
            this.posts = storedPosts;
        }
        this.posts.sort((a, b) => b.timestamp - a.timestamp);
        if (document.getElementById('feed-container')) this.render();
    },

    createPost(type, content, caption) {
        if (!Auth.currentUser) return;
        this.posts = Utils.storage.get('zylos_posts', this.posts); // Refresh
        const newPost = {
            id: Utils.genId(), userId: Auth.currentUser.id, type, content, caption,
            likes: 0, comments: [], likedBy: [], timestamp: Date.now()
        };
        this.posts.unshift(newPost);
        Utils.storage.set('zylos_posts', this.posts);
    },

    toggleLike(id, iconElement) {
        const post = this.posts.find(p => p.id === id);
        if (!post) return;
        if (!post.likedBy) post.likedBy = [];
        const uid = Auth.currentUser.id;

        if (post.likedBy.includes(uid)) {
            post.likedBy = post.likedBy.filter(u => u !== uid);
            post.likes--;
            if (iconElement) { iconElement.classList.remove('liked', 'heart-pop-active'); }
        } else {
            post.likedBy.push(uid);
            post.likes++;
            if (iconElement) {
                iconElement.classList.add('liked');
                iconElement.classList.remove('heart-pop-active');
                void iconElement.offsetWidth;
                iconElement.classList.add('heart-pop-active');
            }
        }
        const countEl = document.getElementById(`likes-count-${id}`);
        if (countEl) countEl.innerText = `${post.likes} likes`;
        Utils.storage.set('zylos_posts', this.posts);
    },

    addComment(id, text) {
        const post = this.posts.find(p => p.id === id);
        if (post && text) {
            post.comments.push({ user: Auth.currentUser.username, text });
            Utils.storage.set('zylos_posts', this.posts);
            // If we were on Feed page, re-rendering just comments div would be better, but complete re-render is safe
            const div = document.getElementById(`comments-${id}`);
            if (div) {
                div.innerHTML = post.comments.map(c => `<div><strong>${c.user}</strong> ${c.text}</div>`).join('');
                div.classList.remove('hidden');
            }
        }
    },

    render() {
        const container = document.getElementById('feed-container');
        if (!container) return;
        container.innerHTML = '';

        this.posts.forEach(post => {
            const user = Auth.users.find(u => u.id === post.userId) || { username: 'User', avatar: '' };
            const isLiked = post.likedBy && post.likedBy.includes(Auth.currentUser?.id);

            const el = document.createElement('article');
            el.className = 'post-card glass-panel fade-in floating';

            el.innerHTML = `
        <div class="post-header">
          <img src="${user.avatar}" class="user-avatar-sm">
          <span style="font-weight:600">${user.username}</span>
          <span style="margin-left:auto; font-size:0.8rem; color:#888;">${Utils.timeAgo(post.timestamp)}</span>
        </div>
        ${post.type === 'video' ? `<video src="${post.content}" class="post-media" controls loop></video>` : `<img src="${post.content}" class="post-media">`}
        <div class="post-actions">
           <i class="fas fa-heart action-icon ${isLiked ? 'liked' : ''}" onclick="Feed.toggleLike('${post.id}', this)"></i>
           <i class="fas fa-comment action-icon" onclick="document.getElementById('comments-${post.id}').classList.toggle('hidden')"></i>
        </div>
        <div class="post-info">
           <strong id="likes-count-${post.id}">${post.likes} likes</strong>
           <p style="margin-top:5px;"><strong>${user.username}</strong> ${post.caption}</p>
           
           <div id="comments-${post.id}" class="hidden" style="margin-top:10px; max-height:100px; overflow-y:auto;">
              ${(post.comments || []).map(c => `<div><strong>${c.user}</strong> ${c.text}</div>`).join('')}
           </div>
           
           <div class="flex-center" style="margin-top:10px;">
              <input type="text" placeholder="Add a comment..." class="auth-input" style="padding:8px; border:none; background:transparent;" onkeydown="if(event.key==='Enter'){ Feed.addComment('${post.id}', this.value); this.value=''; }">
           </div>
        </div>
      `;
            container.appendChild(el);
        });
    }
};

/* --- PROFILE MODULE (Followers, Following, Grid Modal) --- */
const Profile = {
    init() {
        if (document.getElementById('p-username') && Auth.currentUser) {
            const u = Auth.currentUser;
            document.getElementById('p-username').innerText = u.username;
            document.getElementById('p-bio').innerHTML = u.bio;
            document.getElementById('p-avatar').src = u.avatar;
            document.getElementById('p-followers').innerText = u.followers;
            document.getElementById('p-following').innerText = u.followingIds ? u.followingIds.length : u.following;

            this.renderGrid(u.id);
        }
    },

    renderGrid(uid) {
        const grid = document.getElementById('profile-grid');
        if (!grid) return;

        const myPosts = Feed.posts.filter(p => p.userId === uid);
        document.getElementById('p-posts-count').innerText = myPosts.length;

        if (myPosts.length === 0) {
            document.getElementById('empty-state').classList.remove('hidden');
        } else {
            document.getElementById('empty-state').classList.add('hidden');
            grid.innerHTML = myPosts.map((p, index) => `
                <div class="grid-item" style="animation-delay: ${index * 0.05}s" onclick="Profile.openPost('${p.id}')">
                   ${p.type === 'video'
                    ? `<video src="${p.content}" class="img-cover"></video><div class="video-icon-overlay"><i class="fas fa-play"></i></div>`
                    : `<img src="${p.content}" class="img-cover">`
                }
                </div>
            `).join('');
        }
    },

    saveProfile() {
        const name = document.getElementById('edit-username').value;
        const bio = document.getElementById('edit-bio').value;
        if (name) Auth.currentUser.username = name;
        if (bio) Auth.currentUser.bio = bio;

        const file = document.getElementById('edit-avatar-input').files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                Auth.currentUser.avatar = e.target.result;
                Auth.updateUser({});
                window.location.reload();
            };
            reader.readAsDataURL(file);
        } else {
            Auth.updateUser({});
            window.location.reload();
        }
    },

    /* --- Post Preview Modal --- */
    openPost(postId) {
        const post = Feed.posts.find(p => p.id === postId);
        if (!post) return;

        const modal = document.getElementById('view-post-modal');
        const user = Auth.currentUser;

        document.getElementById('vp-username').innerText = user.username;
        document.getElementById('vp-avatar').src = user.avatar;
        document.getElementById('vp-caption').innerText = post.caption;
        document.getElementById('vp-date').innerText = Utils.timeAgo(post.timestamp);

        const container = document.getElementById('vp-media-container');
        if (post.type === 'video') {
            container.innerHTML = `<video src="${post.content}" controls autoplay loop style="max-height:60vh; max-width:100%; object-fit:contain;"></video>`;
        } else {
            container.innerHTML = `<img src="${post.content}" style="max-height:60vh; max-width:100%; object-fit:contain;">`;
        }

        modal.classList.add('active');
        modal.style.display = 'flex';
    },

    closePostModal() {
        const modal = document.getElementById('view-post-modal');
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.getElementById('vp-media-container').innerHTML = ''; // Stop video playback
    },

    /* --- Followers / Following Modal --- */
    openFollowers() {
        // Mock: Show random users + anyone who follows (if backend existed)
        document.getElementById('users-modal-title').innerText = "Followers";
        const list = Auth.users.filter(u => u.id !== Auth.currentUser.id).slice(0, 5); // Just show 5 random "followers"
        this.renderUserList(list);

        const m = document.getElementById('users-list-modal');
        m.classList.add('active'); m.style.display = 'flex';
    },

    openFollowing() {
        document.getElementById('users-modal-title').innerText = "Following";
        const myFollowingIds = Auth.currentUser.followingIds || [];
        const list = Auth.users.filter(u => myFollowingIds.includes(u.id));

        this.renderUserList(list);

        const m = document.getElementById('users-list-modal');
        m.classList.add('active'); m.style.display = 'flex';
    },

    renderUserList(users) {
        const container = document.getElementById('users-list-container');
        if (users.length === 0) {
            container.innerHTML = "<div style='padding:20px; text-align:center; color:#777;'>You're not following anyone yet.</div>";
            return;
        }

        container.innerHTML = users.map(u => {
            const isFollowing = Auth.currentUser.followingIds && Auth.currentUser.followingIds.includes(u.id);
            return `
            <div class="user-list-item">
                <img src="${u.avatar}" class="user-list-avatar">
                <div class="user-list-info user-info-rows">
                    <div style="font-weight:600; font-size:0.95rem;">${u.username}</div>
                    <div style="font-size:0.8rem; color:#aaa;">${u.bio.substring(0, 30)}</div>
                </div>
                <button class="${isFollowing ? 'btn-following' : 'btn-follow'}" onclick="Profile.toggleFollow('${u.id}', this)" ${isFollowing ? 'style="border:1px solid #777;"' : ''}>
                    ${isFollowing ? 'Following' : 'Follow'}
                </button>
            </div>`;
        }).join('');
    },

    toggleFollow(uid, btn) {
        if (!Auth.currentUser.followingIds) Auth.currentUser.followingIds = [];
        const idx = Auth.currentUser.followingIds.indexOf(uid);

        if (idx === -1) {
            // Follow
            Auth.currentUser.followingIds.push(uid);
            btn.className = 'btn-following';
            btn.innerText = 'Following';
            btn.style.border = '1px solid #777';
            btn.style.background = 'transparent';
            btn.style.color = '#fff';
        } else {
            // Unfollow
            Auth.currentUser.followingIds.splice(idx, 1);
            btn.className = 'btn-follow';
            btn.innerText = 'Follow';
            btn.style.border = 'none';
            btn.style.background = 'var(--accent-color)';
            btn.style.color = '#000';
        }

        Auth.updateUser({}); // Save To LocalStorage

        // Update Count if we are on Profile page
        if (document.getElementById('p-following')) {
            document.getElementById('p-following').innerText = Auth.currentUser.followingIds.length;
        }
    },

    renderExplore() {
        const grid = document.getElementById('explore-grid');
        if (grid) {
            const display = [...Feed.posts].sort(() => 0.5 - Math.random());
            grid.innerHTML = display.map((p, i) => `
                <div class="grid-item floating" style="animation-delay:${i * 0.1}s">
                   ${p.type === 'video' ? `<video src="${p.content}" class="img-cover"></video>` : `<img src="${p.content}" class="img-cover">`}
                </div>
             `).join('');
        }
    }
};

/* --- REELS & CHAT --- */
const Reels = {
    init() {
        if (document.getElementById('reels-container')) {
            let videos = Feed.posts.filter(p => p.type === 'video');
            if (videos.length === 0) {
                document.getElementById('reels-container').innerHTML = `<h3 style="text-align:center; margin-top:50vh;">No Reels Yet</h3>`;
                return;
            }
            document.getElementById('reels-container').innerHTML = videos.map(v =>
                `<div class="reel-full glass-panel" style="border:none;"><video src="${v.content}" class="img-cover reel-video" loop muted onclick="this.muted=!this.muted; this.play()"></video></div>`
            ).join('');
            // Simple Observer
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    const v = e.target.querySelector('video');
                    if (e.isIntersecting) v.play(); else v.pause();
                });
            }, { threshold: 0.6 });
            document.querySelectorAll('.reel-full').forEach(el => observer.observe(el));
        }
    }
};

const Chat = {
    init() {
        if (document.getElementById('chat-list')) {
            const chats = Utils.storage.get('zylos_chats', SEED_CHATS);
            document.getElementById('chat-list').innerHTML = chats.map(c => `<div class="glass-panel" style="padding:15px; margin-bottom:10px;">Chat with User</div>`).join('');
        }
    }
};

/* --- INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    Feed.init();

    const path = window.location.pathname;
    if (path.includes('profile')) Profile.init();
    if (path.includes('explore')) Profile.renderExplore();
    if (path.includes('reels')) Reels.init();
    if (path.includes('messages')) Chat.init();
});

/* --- GLOBAL HANDLERS --- */
window.handlePostPreview = function (input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            window.tempContent = e.target.result;
            window.tempType = file.type.startsWith('video') ? 'video' : 'image';
            document.getElementById('upload-zone').style.display = 'none';
            document.getElementById('preview-area').innerHTML = `
               ${window.tempType === 'video' ? `<video src="${e.target.result}" style="max-height:400px; width:100%; border-radius:10px;" controls></video>` : `<img src="${e.target.result}" style="max-height:400px; width:100%; object-fit:contain; border-radius:10px;">`}
               <div style="text-align:center; padding:10px; color:var(--accent-color); cursor:pointer;" onclick="window.location.reload()">Remove</div>
            `;
        };
        reader.readAsDataURL(file);
    }
};

window.doPost = function () {
    if (window.tempContent) {
        const cap = document.getElementById('caption-input').value;
        Feed.createPost(window.tempType, window.tempContent, cap);
        window.location.href = 'home.html';
    } else {
        alert("Please select a file");
    }
};
