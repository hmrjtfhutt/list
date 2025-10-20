// Feed Management
let currentFeedType = 'following';
let currentView = 'my-list';
let lastPost = null;
const POSTS_PER_PAGE = 10;

// Navigation
document.querySelectorAll('.nav-item').forEach(nav => {
  nav.addEventListener('click', (e) => {
    e.preventDefault();
    const view = nav.dataset.view;
    switchView(view);
  });
});

function switchView(view) {
  // Hide all views
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.add('hidden');
  });
  
  // Show selected view
  document.querySelector(`#${view}-view`).classList.remove('hidden');
  
  // Update navigation
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.classList.toggle('active', nav.dataset.view === view);
  });
  
  currentView = view;
  
  // Load view content
  switch(view) {
    case 'feed':
      loadFeed();
      break;
    case 'explore':
      loadExplore();
      break;
    case 'profile':
      loadProfile(currentUser.uid);
      break;
  }
}

// Feed Loading
async function loadFeed(type = currentFeedType) {
  const feedContainer = document.getElementById('feed-container');
  feedContainer.innerHTML = '<div class="loading">Loading posts...</div>';
  
  try {
    let query;
    
    if (type === 'following') {
      // Get users we follow
      const followingSnapshot = await followsRef
        .where('followerId', '==', currentUser.uid)
        .get();
      
      const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);
      
      if (followingIds.length === 0) {
        feedContainer.innerHTML = '<div class="empty-state">Follow some users to see their posts here!</div>';
        return;
      }
      
      query = postsRef
        .where('userId', 'in', followingIds)
        .orderBy('createdAt', 'desc')
        .limit(POSTS_PER_PAGE);
    } else {
      // Popular posts
      query = postsRef
        .orderBy('likes', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(POSTS_PER_PAGE);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      feedContainer.innerHTML = '<div class="empty-state">No posts yet</div>';
      return;
    }
    
    feedContainer.innerHTML = '';
    snapshot.forEach(doc => {
      renderPost(doc, feedContainer);
    });
    
    // Store last post for pagination
    lastPost = snapshot.docs[snapshot.docs.length - 1];
    
  } catch (e) {
    console.error('Error loading feed:', e);
    feedContainer.innerHTML = '<div class="error-state">Error loading posts. Please try again.</div>';
  }
}

// Post Rendering
async function renderPost(doc, container) {
  const data = doc.data();
  const userDoc = await usersRef.doc(data.userId).get();
  const userData = userDoc.data();
  
  const post = document.createElement('div');
  post.className = 'post-card';
  post.dataset.id = doc.id;
  
  const isLiked = await checkIfLiked(doc.id);
  
  post.innerHTML = `
    <div class="post-header">
      <img src="${userData.photoURL || 'default-avatar.png'}" alt="" class="avatar">
      <div class="post-meta">
        <a href="#" class="user-link" data-uid="${data.userId}">${userData.displayName || userData.username}</a>
        <span class="timestamp">${formatTimestamp(data.createdAt)}</span>
      </div>
    </div>
    <div class="post-content">
      <p class="achievement">✨ Completed: ${data.itemText}</p>
      ${data.caption ? `<p class="caption">${data.caption}</p>` : ''}
      ${data.photoUrl ? `<img src="${data.photoUrl}" alt="Achievement photo" class="post-image">` : ''}
    </div>
    <div class="post-actions">
      <button class="like-btn ${isLiked ? 'liked' : ''}" data-post-id="${doc.id}">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span class="like-count">${data.likes}</span>
      </button>
    </div>
  `;
  
  // Event Listeners
  post.querySelector('.user-link').addEventListener('click', (e) => {
    e.preventDefault();
    loadProfile(data.userId);
  });
  
  post.querySelector('.like-btn').addEventListener('click', async () => {
    await toggleLike(doc.id);
    // Update UI without reloading
    const likeBtn = post.querySelector('.like-btn');
    const likeCount = post.querySelector('.like-count');
    const currentLikes = parseInt(likeCount.textContent);
    
    if (likeBtn.classList.toggle('liked')) {
      likeCount.textContent = currentLikes + 1;
    } else {
      likeCount.textContent = currentLikes - 1;
    }
  });
  
  container.appendChild(post);
}

// Profile Loading
async function loadProfile(userId) {
  const profileView = document.getElementById('profile-view');
  const isOwnProfile = userId === currentUser?.uid;
  
  try {
    const userDoc = await usersRef.doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      showError(document.body, 'User not found');
      return;
    }
    
    // Update profile header
    document.getElementById('profile-avatar').src = userData.photoURL || 'default-avatar.png';
    document.getElementById('profile-name').textContent = userData.displayName || userData.username;
    document.getElementById('profile-bio').textContent = userData.bio || '';
    
    // Update stats
    document.getElementById('stat-items').textContent = await getItemCount(userId);
    document.getElementById('stat-completed').textContent = userData.stats.completedItems;
    document.getElementById('stat-followers').textContent = userData.stats.followers;
    document.getElementById('stat-following').textContent = userData.stats.following;
    
    // Show/hide follow button
    const followBtn = document.getElementById('follow-btn');
    if (isOwnProfile) {
      followBtn.classList.add('hidden');
    } else {
      followBtn.classList.remove('hidden');
      const isFollowing = await checkIfFollowing(userId);
      followBtn.textContent = isFollowing ? 'Unfollow' : 'Follow';
      followBtn.classList.toggle('following', isFollowing);
      
      followBtn.onclick = async () => {
        if (followBtn.classList.contains('following')) {
          await unfollowUser(userId);
          followBtn.textContent = 'Follow';
        } else {
          await followUser(userId);
          followBtn.textContent = 'Unfollow';
        }
        followBtn.classList.toggle('following');
      };
    }
    
    // Load initial tab
    loadProfileItems(userId);
    
    // Show profile view
    switchView('profile');
    
  } catch (e) {
    console.error('Error loading profile:', e);
    showError(document.body, 'Error loading profile');
  }
}

// Utility Functions
async function checkIfLiked(postId) {
  if (!currentUser) return false;
  const likeDoc = await likesRef.doc(`${currentUser.uid}_${postId}`).get();
  return likeDoc.exists;
}

async function checkIfFollowing(userId) {
  if (!currentUser) return false;
  const followDoc = await followsRef.doc(`${currentUser.uid}_${userId}`).get();
  return followDoc.exists;
}

async function getItemCount(userId) {
  const snapshot = await usersRef.doc(userId).collection('items').count().get();
  return snapshot.data().count;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return date.toLocaleDateString();
}

// Settings Management
document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const updates = {
    displayName: document.getElementById('settings-name').value,
    bio: document.getElementById('settings-bio').value,
    'settings.isPublic': document.getElementById('settings-public').checked,
    'settings.showCompletedItems': document.getElementById('settings-show-completed').checked,
    'settings.emailNotifications': document.getElementById('settings-email-notifications').checked
  };
  
  try {
    await usersRef.doc(currentUser.uid).update(updates);
    showError(document.body, 'Settings saved successfully!');
  } catch (e) {
    showError(document.body, 'Error saving settings');
  }
});