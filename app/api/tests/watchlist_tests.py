# Browser console fetch commands to test watchlist routes

## Testing rules

### Watchlist 4 (belonging to user 2) should remain empty for testing

"""
#1 - Fetch GET session user's watchlists test
fetch('/api/watchlists/', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include' // Ensures cookies/session data is sent
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
"""

"""
#2 - Fetch DELETE a session user's watchlist test
fetch('/api/watchlists/2', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
"""

"""
#4 - Fetch ADD a stocks to a session user's watchlist(s)
function getCsrfToken() {
    return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
}

fetch('/api/watchlists/stocks/MDB', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()  // Automatically fetch CSRF token from cookies
    },
    credentials: 'include',  // Ensure session cookies are included
    body: JSON.stringify({ watchlist_ids: [2] })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
"""