const API_URLS = {
  auth: 'https://functions.poehali.dev/57ef9a99-d7b8-47d1-a78d-63817f7631b0',
  pins: 'https://functions.poehali.dev/86198ea7-19c9-492a-8123-7b9f028a05ea',
  comments: 'https://functions.poehali.dev/8c569984-fe6d-4e67-a93c-6915c6a65da9',
  favorites: 'https://functions.poehali.dev/b5cd66e9-2c19-4758-8335-141f08630ec9'
};

export const api = {
  async register(username: string, password: string) {
    const res = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', username, password })
    });
    return res.json();
  },

  async login(username: string, password: string) {
    const res = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });
    return res.json();
  },

  async getPins(search = '', sort = 'newest') {
    const params = new URLSearchParams({ search, sort });
    const res = await fetch(`${API_URLS.pins}?${params}`);
    return res.json();
  },

  async createPin(title: string, content: string, authorId: number) {
    const res = await fetch(API_URLS.pins, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, author_id: authorId })
    });
    return res.json();
  },

  async updatePinViews(pinId: number) {
    const res = await fetch(API_URLS.pins, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin_id: pinId })
    });
    return res.json();
  },

  async getComments(pinId: number) {
    const params = new URLSearchParams({ pin_id: pinId.toString() });
    const res = await fetch(`${API_URLS.comments}?${params}`);
    return res.json();
  },

  async createComment(pinId: number, authorId: number, content: string) {
    const res = await fetch(API_URLS.comments, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin_id: pinId, author_id: authorId, content })
    });
    return res.json();
  },

  async getFavorites(userId: number) {
    const params = new URLSearchParams({ user_id: userId.toString() });
    const res = await fetch(`${API_URLS.favorites}?${params}`);
    return res.json();
  },

  async addFavorite(userId: number, pinId: number) {
    const res = await fetch(API_URLS.favorites, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, pin_id: pinId })
    });
    return res.json();
  },

  async removeFavorite(userId: number, pinId: number) {
    const res = await fetch(API_URLS.favorites, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, pin_id: pinId })
    });
    return res.json();
  }
};
