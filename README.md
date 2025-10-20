# Social Bucket List

A social platform for sharing and tracking your bucket list goals with friends.

## Features

- Create and manage your personal bucket list
- Share completed items with photos and captions
- Follow other users and see their achievements
- Like and interact with posts
- Public/private profile settings
- Real-time updates
- Category organization
- Grid/List view options

## Setup

1. Clone the repository:
```bash
git clone https://github.com/hmrjtfhutt/list.git
cd list
```

2. Open `index.html` in a web browser or serve with a local server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve
```

3. Firebase Configuration:
   - The app uses Firebase for authentication and data storage
   - Firebase config is already included
   - Supports both Google and email/password authentication

## Tech Stack

- Vanilla JavaScript
- Firebase Authentication
- Cloud Firestore
- Firebase Storage (for images)
- CSS Grid/Flexbox

## Data Structure

```
/users/{userId}/
  - email
  - username
  - displayName
  - bio
  - photoURL
  - settings
    - isPublic
    - showCompletedItems
    - allowComments
    - emailNotifications
  - stats
    - followers
    - following
    - completedItems
    - totalPosts

/users/{userId}/items/{itemId}
  - text
  - checked
  - category
  - isPublic
  - createdAt
  - checkedAt
  - likes

/posts/{postId}
  - userId
  - itemId
  - itemText
  - caption
  - photoUrl
  - createdAt
  - likes
  - comments

/follows/{followerId}_{followingId}
  - followerId
  - followingId
  - createdAt

/likes/{userId}_{postId}
  - userId
  - postId
  - createdAt
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/NewFeature`
3. Commit your changes: `git commit -am 'Add NewFeature'`
4. Push to the branch: `git push origin feature/NewFeature`
5. Submit a pull request

## License

MIT License - See LICENSE file for details